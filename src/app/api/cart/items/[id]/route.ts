import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession } from '@/lib/auth';
import { updateCartItemSchema } from '@/lib/validation';

async function assertOwnership(itemId: string, userId: string) {
  const item = await db.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== userId) return null;
  return item;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = updateCartItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await assertOwnership(params.id, session.userId);
  if (!item) return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });

  if (parsed.data.quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    return NextResponse.json({ ok: true, removed: true });
  }
  const variant = await db.productVariant.findUnique({ where: { id: item.variantId }, include: { inventory: true } });
  const available = Math.max(0, (variant?.inventory?.availableStock ?? 0) - (variant?.inventory?.reservedStock ?? 0));
  if (!variant || !variant.active) return NextResponse.json({ error: 'This product is no longer available.' }, { status: 409 });
  if (parsed.data.quantity > available) return NextResponse.json({ error: `Only ${available} left in stock.` }, { status: 409 });
  await db.cartItem.update({ where: { id: item.id }, data: { quantity: parsed.data.quantity } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const item = await assertOwnership(params.id, session.userId);
  if (!item) return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });

  await db.cartItem.delete({ where: { id: item.id } });
  return NextResponse.json({ ok: true });
}
