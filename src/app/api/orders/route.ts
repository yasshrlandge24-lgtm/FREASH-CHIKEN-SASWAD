import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { requireAuth, isSession, getSession, hashPassword, signSession, setSessionCookie } from '@/lib/auth';
import { createOrderSchema } from '@/lib/validation';
import { priceCartItems, validateCoupon, FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE } from '@/lib/pricing';
import { getPaymentProvider } from '@/lib/payments';

export async function GET(req: NextRequest) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const orders = await db.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true, deliverySlot: true },
  });

  return NextResponse.json({ data: orders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let session = getSession();
  if (!session) {
    const guest = await db.user.create({
      data: {
        name: parsed.data.address?.name || 'Guest Customer',
        phone: null,
        passwordHash: await hashPassword(crypto.randomUUID()),
        cart: { create: {} },
        wishlist: { create: {} },
      },
    });
    session = { userId: guest.id, role: guest.role };
    setSessionCookie(signSession(session));
    if (parsed.data.guestItems?.length) {
      const guestCart = await db.cart.findUnique({ where: { userId: guest.id } });
      const variants = await db.productVariant.findMany({ where: { id: { in: parsed.data.guestItems.map(i => i.variantId) } } });
      if (!guestCart || variants.length !== parsed.data.guestItems.length) return NextResponse.json({ error: 'One or more cart items are no longer available.' }, { status: 400 });
      await db.cartItem.createMany({ data: parsed.data.guestItems.map(i => ({ cartId: guestCart.id, productId: variants.find(v => v.id === i.variantId)!.productId, variantId: i.variantId, quantity: i.quantity })) });
    }
  }

  const { addressId, address, deliverySlotId, couponCode, paymentMethod } = parsed.data;

  // 1. Load the cart fresh from the DB — never trust a cart total the client sends.
  const cart = await db.cart.findUnique({ where: { userId: session.userId }, include: { items: true } });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
  }

  // 2. Resolve the shipping address — either a saved one, or a one-off snapshot.
  let shippingAddress;
  if (addressId) {
    const saved = await db.address.findUnique({ where: { id: addressId } });
    if (!saved || saved.userId !== session.userId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    shippingAddress = saved;
  } else {
    shippingAddress = address!;
  }

  // 3. Confirm the pincode is serviceable.
  const area = await db.serviceArea.findUnique({ where: { pincode: shippingAddress.pincode } });
  if (!area || !area.active) {
    return NextResponse.json({ error: 'Sorry, delivery is currently unavailable in this area.' }, { status: 400 });
  }

  // 4. Confirm the delivery slot exists, is active, and has capacity.
  const slot = await db.deliverySlot.findUnique({ where: { id: deliverySlotId } });
  if (!slot || !slot.active) {
    return NextResponse.json({ error: 'Selected delivery slot is no longer available' }, { status: 400 });
  }
  if (slot.bookedCount >= slot.capacity) {
    return NextResponse.json({ error: 'This delivery slot just filled up — please pick another.' }, { status: 409 });
  }

  // 5. Price every line item from the DB (ignores any price the client might send).
  const lines = await priceCartItems(cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = slot.deliveryFee ?? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE);

  let couponDiscount = 0;
  let couponId: string | null = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal, session.userId);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    couponDiscount = result.discount;
    couponId = result.coupon!.id;
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);

  // 6. Everything below must succeed or fail together: stock check + decrement,
  //    slot capacity increment, order + line items, coupon usage, initial status event.
  let order;
  try {
    order = await db.$transaction(async (tx) => {
    for (const line of lines) {
      const inventory = await tx.inventory.findUnique({ where: { variantId: line.variantId } });
      const available = inventory?.availableStock ?? 0;
      if (available < line.quantity) {
        throw new Error(`OUT_OF_STOCK:${line.productName}`);
      }
      await tx.inventory.update({
        where: { variantId: line.variantId },
        data: { availableStock: { decrement: line.quantity }, soldQuantity: { increment: line.quantity } },
      });
    }

    await tx.deliverySlot.update({ where: { id: slot.id }, data: { bookedCount: { increment: 1 } } });

    const orderNumber = 'FC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: session.userId,
        status: 'PLACED',
        subtotal,
        itemDiscount: lines.reduce((s, l) => s + (l.lineMrpTotal - l.lineTotal), 0),
        deliveryFee,
        couponDiscount,
        couponId,
        grandTotal,
        deliverySlotId: slot.id,
        deliveryDate: slot.date,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
        },
        shippingAddress: {
          create: {
            label: shippingAddress.label,
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            line1: shippingAddress.line1,
            area: shippingAddress.area,
            landmark: shippingAddress.landmark ?? null,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
          },
        },
        statusHistory: { create: { status: 'PLACED' } },
      },
      include: { items: true, shippingAddress: true },
    });

    // Charge via the payment abstraction — never inline a specific gateway's logic here.
    // The order row already exists at this point, so a real gateway's reference id can be
    // tied back to it; COD naturally comes back PENDING until collected on delivery.
    const paymentProvider = getPaymentProvider();
    const chargeResult = await paymentProvider.charge({ orderId: created.id, amount: grandTotal, method: paymentMethod });
    const payment = await tx.payment.create({
      data: {
        orderId: created.id,
        method: paymentMethod,
        status: chargeResult.status,
        amount: grandTotal,
        providerRef: chargeResult.providerRef,
      },
    });

    if (couponId) {
      await tx.couponUsage.create({ data: { couponId, userId: session.userId, orderId: created.id } });
    }

    // Clear the cart now that the order exists.
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return { ...created, payment };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not place order';
    if (message.startsWith('OUT_OF_STOCK:')) {
      return NextResponse.json({ error: `${message.split(':')[1]} just went out of stock — please update your cart.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not place order. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ data: order }, { status: 201 });
}
