import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminProductSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  // Partial update: reuse the same schema but allow any subset of top-level fields.
  const parsed = adminProductSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { variants, ...rest } = parsed.data;

  const product = await db.product.update({
    where: { id: params.id },
    data: rest, // variant edits go through a dedicated variant endpoint in a fuller build — see README
  });

  return NextResponse.json({ data: product });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  // Soft-delete: keep historical order data intact rather than cascading a hard delete.
  const product = await db.product.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ data: product });
}
