import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminBannerSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = adminBannerSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const banner = await db.banner.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ data: banner });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  await db.banner.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
