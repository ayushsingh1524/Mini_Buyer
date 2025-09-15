import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyers, buyerHistory } from '@/lib/db/schema';
import { updateBuyerSchema } from '@/lib/validations/buyer';
import { requireAuth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;

    const buyer = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, id))
      .limit(1);

    if (!buyer[0]) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    // Get history
    const history = await db
      .select()
      .from(buyerHistory)
      .where(eq(buyerHistory.buyerId, id))
      .orderBy(desc(buyerHistory.changedAt))
      .limit(5);

    return NextResponse.json({
      buyer: buyer[0],
      history,
    });
  } catch (error) {
    console.error('Error fetching buyer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buyer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    
    // Rate limiting
    const rateLimitResult = rateLimit(`update:${user.id}`, 10, 60000); // 10 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const { id } = params;
    const body = await request.json();

    // Check if buyer exists and user owns it
    const existingBuyer = await db
      .select()
      .from(buyers)
      .where(and(eq(buyers.id, id), eq(buyers.ownerId, user.id)))
      .limit(1);

    if (!existingBuyer[0]) {
      return NextResponse.json(
        { error: 'Buyer not found or access denied' },
        { status: 404 }
      );
    }

    // Check for concurrency conflict
    if (body.updatedAt && new Date(body.updatedAt).getTime() !== existingBuyer[0].updatedAt.getTime()) {
      return NextResponse.json(
        { error: 'Record changed, please refresh' },
        { status: 409 }
      );
    }

    const validatedData = updateBuyerSchema.parse({
      ...body,
      id,
      updatedAt: existingBuyer[0].updatedAt,
    });

    // Calculate diff
    const diff: Record<string, { old: any; new: any }> = {};
    Object.keys(validatedData).forEach(key => {
      if (key !== 'id' && key !== 'updatedAt' && key !== 'ownerId') {
        const oldValue = existingBuyer[0][key as keyof typeof existingBuyer[0]];
        const newValue = validatedData[key as keyof typeof validatedData];
        if (oldValue !== newValue) {
          diff[key] = { old: oldValue, new: newValue };
        }
      }
    });

    const updatedBuyer = await db
      .update(buyers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(buyers.id, id))
      .returning();

    // Create history entry if there are changes
    if (Object.keys(diff).length > 0) {
      await db.insert(buyerHistory).values({
        buyerId: id,
        changedBy: user.id,
        diff,
      });
    }

    return NextResponse.json(updatedBuyer[0]);
  } catch (error) {
    console.error('Error updating buyer:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update buyer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;

    // Check if buyer exists and user owns it
    const existingBuyer = await db
      .select()
      .from(buyers)
      .where(and(eq(buyers.id, id), eq(buyers.ownerId, user.id)))
      .limit(1);

    if (!existingBuyer[0]) {
      return NextResponse.json(
        { error: 'Buyer not found or access denied' },
        { status: 404 }
      );
    }

    await db.delete(buyers).where(eq(buyers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    return NextResponse.json(
      { error: 'Failed to delete buyer' },
      { status: 500 }
    );
  }
}
