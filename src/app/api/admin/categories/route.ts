import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminCategorySchema } from '@/lib/validation';

export async function GET() {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const categories = await db.category.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ data: categories });
}

export async function POST(req: NextRequest) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = adminCategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const category = await db.category.create({ data: parsed.data });
  return NextResponse.json({ data: category }, { status: 201 });
}
