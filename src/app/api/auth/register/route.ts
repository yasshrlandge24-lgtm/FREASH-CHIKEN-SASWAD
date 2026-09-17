import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validation';
import { hashPassword, signSession, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const parsed = registerSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { name, email, phone, password } = parsed.data;
  const normalizedPhone = phone;
  const normalizedEmail = email.toLowerCase().trim();
  const [phoneUser, emailUser] = await Promise.all([
    db.user.findUnique({ where: { phone: normalizedPhone } }),
    db.user.findUnique({ where: { email: normalizedEmail } }),
  ]);
  if (phoneUser) return NextResponse.json({ error: 'An account with this phone number already exists. Please log in.' }, { status: 409 });
  if (emailUser) return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });

  const user = await db.user.create({
    data: { name, email: normalizedEmail, phone: normalizedPhone, passwordHash: await hashPassword(password), cart: { create: {} }, wishlist: { create: {} } },
  });
  setSessionCookie(signSession({ userId: user.id, role: user.role }));
  return NextResponse.json({ id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }, { status: 201 });
}
