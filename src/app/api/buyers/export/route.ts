import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyers } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const propertyType = searchParams.get('propertyType') || '';
    const status = searchParams.get('status') || '';
    const timeline = searchParams.get('timeline') || '';

    // Build where conditions (same as in GET /api/buyers)
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

    // Get all buyers matching filters
    const buyersList = await db
      .select()
      .from(buyers)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(buyers.updatedAt);

    // Convert to CSV
    const headers = [
      'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk',
      'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source',
      'notes', 'tags', 'status'
    ];

    const csvRows = [
      headers.join(','),
      ...buyersList.map(buyer => [
        buyer.fullName,
        buyer.email || '',
        buyer.phone,
        buyer.city,
        buyer.propertyType,
        buyer.bhk || '',
        buyer.purpose,
        buyer.budgetMin || '',
        buyer.budgetMax || '',
        buyer.timeline,
        buyer.source,
        (buyer.notes || '').replace(/"/g, '""'),
        (buyer.tags || []).join(';'),
        buyer.status,
      ].map(field => `"${field}"`).join(','))
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="buyers-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
