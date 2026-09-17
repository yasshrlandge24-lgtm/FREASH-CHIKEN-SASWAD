import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { validateCouponSchema } from '@/lib/validation';
import { priceCartItems, validateCoupon } from '@/lib/pricing';

const guestItemsSchema = z.object({ items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).max(50) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateCouponSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const session = getSession();
  let items: { variantId: string; quantity: number }[] = [];
  if (session) {
    const cart = await db.cart.findUnique({ where: { userId: session.userId }, include: { items: true } });
    if (!cart || cart.items.length === 0) return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    items = cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  } else {
    const guest = guestItemsSchema.safeParse(body);
    if (!guest.success || guest.data.items.length === 0) return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    items = guest.data.items;
  }

  const lines = await priceCartItems(items);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const result = await validateCoupon(parsed.data.code, subtotal, session?.userId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ data: { code: result.coupon!.code, discount: result.discount } });
}
