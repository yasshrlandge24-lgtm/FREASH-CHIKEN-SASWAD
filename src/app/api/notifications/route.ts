import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession } from '@/lib/auth';

export async function GET() {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  const unreadCount = await db.notification.count({ where: { userId: session.userId, read: false } });

  return NextResponse.json({ data: notifications, unreadCount });
}
