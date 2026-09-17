import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession } from '@/lib/auth';
import { addToCartSchema } from '@/lib/validation';
import { priceCartItems, FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE } from '@/lib/pricing';

async function getOrCreateCart(userId: string) {
  return db.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: true },
  });
}

export async function GET() {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const cart = await getOrCreateCart(session.userId);
  const lines = await priceCartItems(cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
  // Attach each priced line's underlying CartItem id, so clients can PATCH/DELETE
  // /api/cart/items/:id directly instead of misusing this POST (which only increments).
  const linesWithItemId = lines.map((line) => ({
    ...line,
    cartItemId: cart.items.find((i) => i.variantId === line.variantId)!.id,
  }));
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;

  return NextResponse.json({
    data: {
      items: linesWithItemId,
      subtotal,
      deliveryFee,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = addToCartSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { variantId, quantity } = parsed.data;

  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { inventory: true } });
  if (!variant || !variant.active) return NextResponse.json({ error: 'Product variant not available' }, { status: 404 });

  const available = (variant.inventory?.availableStock ?? 0) - (variant.inventory?.reservedStock ?? 0);
  if (available < quantity) {
    return NextResponse.json({ error: `Only ${Math.max(available, 0)} left in stock` }, { status: 409 });
  }

  const cart = await getOrCreateCart(session.userId);
  const existing = cart.items.find((i) => i.variantId === variantId);

  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    if (nextQuantity > 20) return NextResponse.json({ error: 'Maximum 20 units per cart item.' }, { status: 400 });
    if (available < nextQuantity) return NextResponse.json({ error: `Only ${Math.max(available, 0)} left in stock` }, { status: 409 });
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
  } else {
    await db.cartItem.create({
      data: { cartId: cart.id, productId: variant.productId, variantId, quantity },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
