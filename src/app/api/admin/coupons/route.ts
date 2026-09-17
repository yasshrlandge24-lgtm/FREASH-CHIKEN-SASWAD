import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminCouponSchema } from '@/lib/validation';

export async function GET() {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { usages: true } } },
  });
  return NextResponse.json({ data: coupons });
}

export async function POST(req: NextRequest) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = adminCouponSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 });

  const coupon = await db.coupon.create({ data: parsed.data });
  return NextResponse.json({ data: coupon }, { status: 201 });
}
