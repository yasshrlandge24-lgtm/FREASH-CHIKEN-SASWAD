import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import type { OrderStatus } from '@prisma/client';
import { updateOrderStatusSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const status = req.nextUrl.searchParams.get('status') as OrderStatus | null;

  const orders = await db.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      shippingAddress: true,
      payment: true,
    },
  });

  return NextResponse.json({ data: orders });
}

export async function PATCH(req: NextRequest) {
  const session = requireAdmin();
  if (!isSession(session)) return session;
  const body = await req.json();
  const orderId = body.orderId as string | undefined;
  const parsed = updateOrderStatusSchema.safeParse({ status: body.status, note: body.note });
  if (!orderId || !parsed.success) return NextResponse.json({ error: 'orderId and valid status are required' }, { status: 400 });
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status === parsed.data.status) return NextResponse.json({ data: order });
  const updated = await db.$transaction(async (tx) => {
    const next = await tx.order.update({ where: { id: orderId }, data: { status: parsed.data.status, statusHistory: { create: { status: parsed.data.status, note: parsed.data.note } } } });
    if (parsed.data.status === 'CANCELLED' && order.status !== 'CANCELLED') {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) await tx.inventory.update({ where: { variantId: item.variantId }, data: { availableStock: { increment: item.quantity }, soldQuantity: { decrement: item.quantity } } });
      if (order.deliverySlotId) await tx.deliverySlot.update({ where: { id: order.deliverySlotId }, data: { bookedCount: { decrement: 1 } } });
    }
    return next;
  });
  await db.notification.create({ data: { userId: updated.userId, title: `Order ${parsed.data.status.toLowerCase().replaceAll('_',' ')}`, body: `Your order #${updated.orderNumber} is now ${parsed.data.status.toLowerCase().replaceAll('_',' ')}.` } });
  return NextResponse.json({ data: updated });
}
