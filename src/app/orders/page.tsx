'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  items: { id: string }[];
};

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Order Confirmed',
  PREPARING: 'Being Prepared',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/orders', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/login?next=/orders');
        return;
      }
      const body = await res.json();
      setOrders(body.data);
    })();
  }, [router]);

  if (orders === null) return <main className="max-w-3xl mx-auto px-6 py-16">Loading…</main>;

  if (orders.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">No orders yet</h1>
        <Link href="/shop" className="inline-block bg-ink text-white px-6 py-3 rounded-lg font-semibold mt-2">Shop Now</Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-8">My Orders</h1>
      {orders.map((o) => (
        <div key={o.id} className="bg-white border border-black/10 rounded-2xl p-5 mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong>Order #{o.orderNumber}</strong>
            <p className="text-xs text-inkSoft">{o.items.length} items · ₹{o.grandTotal}</p>
          </div>
          <span className="text-xs font-bold bg-paper px-3 py-1 rounded-full">{STATUS_LABELS[o.status] ?? o.status}</span>
          <Link href={`/orders/${o.id}`} className="border border-ink rounded-lg px-4 py-2 text-sm font-semibold">Track Order</Link>
        </div>
      ))}
    </main>
  );
}
