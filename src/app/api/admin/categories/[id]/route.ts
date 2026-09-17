import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminCategorySchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = adminCategorySchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const category = await db.category.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ data: category });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  // Soft-delete: a category with existing products shouldn't vanish from order history.
  const category = await db.category.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ data: category });
}
