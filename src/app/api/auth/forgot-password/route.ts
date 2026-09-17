import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  const user = await db.user.findUnique({ where: { email } });
  // Do not reveal whether an account exists.
  if (!user) return NextResponse.json({ ok: true, message: 'If an account exists, a reset link has been generated.' });
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await db.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
  const origin = req.nextUrl.origin;
  const resetUrl = `${origin}/reset-password?token=${rawToken}`;
  // Development fallback. A production email provider can be wired here without changing the reset flow.
  return NextResponse.json({ ok: true, message: 'If an account exists, a reset link has been generated.', developmentResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined });
}
