import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession, getSession } from '@/lib/auth';
import { updateOrderStatusSchema } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: true, variant: true } },
      shippingAddress: true,
      payment: true,
      deliverySlot: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  // Customers may only view their own orders; admins may view any.
  if (order.userId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ data: order });
}

const STATUS_NOTIFICATION_COPY: Record<string, { title: string; body: string }> = {
  CONFIRMED: { title: 'Order confirmed', body: 'Your order has been confirmed and will be prepared shortly.' },
  PREPARING: { title: 'Being prepared', body: 'Your fresh cuts are being prepared right now.' },
  PACKED: { title: 'Order packed', body: 'Your order is packed and ready for delivery.' },
  OUT_FOR_DELIVERY: { title: 'Out for delivery', body: 'Your order is on its way to you.' },
  DELIVERED: { title: 'Delivered', body: 'Your order has been delivered. Enjoy!' },
  CANCELLED: { title: 'Order cancelled', body: 'Your order has been cancelled.' },
};

/** Admin-only: advance or change an order's status. Appends to the audit trail rather than just overwriting. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const order = await db.order.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      statusHistory: { create: { status: parsed.data.status, note: parsed.data.note } },
    },
  });

  // Notify the customer of the status change — skipped for PLACED, since that
  // notification is implicitly the order-confirmation screen the customer just saw.
  const copy = STATUS_NOTIFICATION_COPY[parsed.data.status];
  if (copy) {
    await db.notification.create({
      data: { userId: order.userId, title: copy.title, body: `${copy.body} (Order #${order.orderNumber})` },
    });
  }

  return NextResponse.json({ data: order });
}
