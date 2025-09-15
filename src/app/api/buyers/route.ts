import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyers } from '@/lib/db/schema';
import { createBuyerSchema } from '@/lib/validations/buyer';
import { requireAuth } from '@/lib/auth';
import { eq, and, desc, asc, like, or } from 'drizzle-orm';
import { buyerHistory } from '@/lib/db/schema';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const propertyType = searchParams.get('propertyType') || '';
    const status = searchParams.get('status') || '';
    const timeline = searchParams.get('timeline') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          like(buyers.fullName, `%${search}%`),
          like(buyers.phone, `%${search}%`),
          like(buyers.email, `%${search}%`)
        )!
      );
    }
    
    if (city) {
      whereConditions.push(eq(buyers.city, city as any));
    }
    
    if (propertyType) {
      whereConditions.push(eq(buyers.propertyType, propertyType as any));
    }
    
    if (status) {
      whereConditions.push(eq(buyers.status, status as any));
    }
    
    if (timeline) {
      whereConditions.push(eq(buyers.timeline, timeline as any));
    }

    // Build order by
    const orderBy = sortOrder === 'asc' 
      ? asc(buyers[sortBy as keyof typeof buyers])
      : desc(buyers[sortBy as keyof typeof buyers]);

    // Get total count
    const totalCount = await db
      .select({ count: buyers.id })
      .from(buyers)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Get buyers
    const buyersList = await db
      .select()
      .from(buyers)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      buyers: buyersList,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buyers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Rate limiting
    const rateLimitResult = rateLimit(`create:${user.id}`, 5, 60000); // 5 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    
    const validatedData = createBuyerSchema.parse(body);
    
    const newBuyer = await db.insert(buyers).values({
      ...validatedData,
      ownerId: user.id,
    }).returning();

    // Create history entry
    await db.insert(buyerHistory).values({
      buyerId: newBuyer[0].id,
      changedBy: user.id,
      diff: {
        created: { old: null, new: 'New buyer created' }
      },
    });

    return NextResponse.json(newBuyer[0], { status: 201 });
  } catch (error) {
    console.error('Error creating buyer:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create buyer' },
      { status: 500 }
    );
  }
}
