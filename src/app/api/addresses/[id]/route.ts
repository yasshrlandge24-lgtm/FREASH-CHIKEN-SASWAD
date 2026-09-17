import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession } from '@/lib/auth';
import { addressSchema } from '@/lib/validation';

async function assertOwnership(id: string, userId: string) {
  const address = await db.address.findUnique({ where: { id } });
  if (!address || address.userId !== userId) return null;
  return address;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const existing = await assertOwnership(params.id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

  const body = await req.json();
  const parsed = addressSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const address = await db.address.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ data: address });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const existing = await assertOwnership(params.id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

  await db.address.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
