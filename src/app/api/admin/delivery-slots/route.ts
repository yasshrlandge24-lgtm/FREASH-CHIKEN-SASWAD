import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminDeliverySlotSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const dateParam = req.nextUrl.searchParams.get('date');
  const where = dateParam ? { date: new Date(dateParam) } : undefined;

  const slots = await db.deliverySlot.findMany({ where, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] });
  return NextResponse.json({ data: slots });
}

export async function POST(req: NextRequest) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = adminDeliverySlotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slot = await db.deliverySlot.create({ data: { ...parsed.data, bookedCount: 0 } });
  return NextResponse.json({ data: slot }, { status: 201 });
}
