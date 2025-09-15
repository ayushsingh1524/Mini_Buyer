import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyers, buyerHistory } from '@/lib/db/schema';
import { csvImportRowSchema } from '@/lib/validations/buyer';
import { requireAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'Empty file' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1);

    if (dataRows.length > 200) {
      return NextResponse.json(
        { error: 'Maximum 200 rows allowed' },
        { status: 400 }
      );
    }

    const errors: Array<{ row: number; message: string }> = [];
    const validRows: any[] = [];

    dataRows.forEach((row, index) => {
      const values = row.split(',').map(v => v.trim());
      const rowData: any = {};
      
      headers.forEach((header, i) => {
        rowData[header] = values[i] || '';
      });

      try {
        const validatedRow = csvImportRowSchema.parse(rowData);
        validRows.push(validatedRow);
      } catch (error) {
        if (error instanceof Error) {
          errors.push({
            row: index + 2, // +2 because we skip header and 0-indexed
            message: error.message,
          });
        }
      }
    });

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Validation errors found',
        errors,
        validRows: validRows.length,
      }, { status: 400 });
    }

    // Insert valid rows in a transaction
    const insertedBuyers = await db.transaction(async (tx) => {
      const results = [];
      
      for (const rowData of validRows) {
        const newBuyer = await tx.insert(buyers).values({
          ...rowData,
          ownerId: user.id,
        }).returning();

        // Create history entry
        await tx.insert(buyerHistory).values({
          buyerId: newBuyer[0].id,
          changedBy: user.id,
          diff: {
            created: { old: null, new: 'Imported from CSV' }
          },
        });

        results.push(newBuyer[0]);
      }
      
      return results;
    });

    return NextResponse.json({
      success: true,
      imported: insertedBuyers.length,
      message: `Successfully imported ${insertedBuyers.length} buyers`,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
