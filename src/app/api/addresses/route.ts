import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession } from '@/lib/auth';
import { addressSchema } from '@/lib/validation';

export async function GET() {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const addresses = await db.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ data: addresses });
}

export async function POST(req: NextRequest) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existingCount = await db.address.count({ where: { userId: session.userId } });
  const address = await db.address.create({
    data: { ...parsed.data, userId: session.userId, isDefault: existingCount === 0 },
  });
  return NextResponse.json({ data: address }, { status: 201 });
}
