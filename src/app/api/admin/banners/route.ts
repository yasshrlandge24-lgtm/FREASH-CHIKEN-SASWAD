import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminBannerSchema } from '@/lib/validation';

export async function GET() {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const banners = await db.banner.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ data: banners });
}

export async function POST(req: NextRequest) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = adminBannerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const banner = await db.banner.create({ data: parsed.data });
  return NextResponse.json({ data: banner }, { status: 201 });
}
