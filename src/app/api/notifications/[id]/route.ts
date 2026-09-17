import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const existing = await db.notification.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.userId) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  const notification = await db.notification.update({ where: { id: params.id }, data: { read: true } });
  return NextResponse.json({ data: notification });
}
