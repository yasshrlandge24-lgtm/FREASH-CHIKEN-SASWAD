import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = String(body.token || '');
  const password = String(body.password || '');
  if (!token || password.length < 8 || password.length > 72) return NextResponse.json({ error: 'Password must be 8–72 characters.' }, { status: 400 });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
