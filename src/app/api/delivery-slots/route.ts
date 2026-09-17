import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get('date'); // "YYYY-MM-DD"
  if (!dateParam) return NextResponse.json({ error: 'date query param is required' }, { status: 400 });

  const date = new Date(dateParam);
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const slots = await db.deliverySlot.findMany({
    where: { date: { gte: startOfDay, lte: endOfDay }, active: true },
    orderBy: { startTime: 'asc' },
  });

  return NextResponse.json({
    data: slots.map((s) => ({
      id: s.id,
      label: s.label,
      deliveryFee: s.deliveryFee,
      full: s.bookedCount >= s.capacity,
    })),
  });
}
