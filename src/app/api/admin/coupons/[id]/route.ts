import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminCouponSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = adminCouponSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const coupon = await db.coupon.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ data: coupon });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  // "Delete" here disables rather than removing the row, since past orders may reference it.
  const coupon = await db.coupon.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ data: coupon });
}
