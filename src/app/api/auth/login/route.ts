import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, signSession, setSessionCookie } from '@/lib/auth';
export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const identifier = parsed.data.identifier.trim();
  const digits = identifier.replace(/\D/g, '');
  const isPhone = !identifier.includes('@') && (/^\d{10}$/.test(digits) || /^91\d{10}$/.test(digits));
  const normalizedPhone = isPhone ? digits.slice(-10) : null;
  const user = isPhone
    ? await db.user.findUnique({ where: { phone: normalizedPhone! } })
    : await db.user.findUnique({ where: { email: identifier.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: 'Invalid phone/email or password.' }, { status: 401 });
  setSessionCookie(signSession({ userId: user.id, role: user.role }));
  return NextResponse.json({ id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role });
}
