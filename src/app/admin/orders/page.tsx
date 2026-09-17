'use client';

import { useEffect, useState } from 'react';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  items: { id: string }[];
  payment: { method: string; status: string } | null;
};

const STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [updating, setUpdating] = useState<string | null>(null);

  async function load(status: string) {
    const res = await fetch(`/api/admin/orders${status ? `?status=${status}` : ''}`, { credentials: 'include' });
    const body = await res.json();
    setOrders(body.data);
  }

  useEffect(() => { load(filter); }, [filter]);

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    load(filter);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Orders</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === '' ? 'bg-ink text-white border-ink' : 'border-black/15'}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === s ? 'bg-ink text-white border-ink' : 'border-black/15'}`}>
            {s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {!orders ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-inkSoft">No orders match this filter.</p>
      ) : (
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-semibold">#{o.orderNumber}<div className="text-xs text-inkSoft font-normal">{new Date(o.createdAt).toLocaleDateString()}</div></td>
                  <td className="px-4 py-3">{o.user.name}<div className="text-xs text-inkSoft">{o.user.email}</div></td>
                  <td className="px-4 py-3">{o.items.length}</td>
                  <td className="px-4 py-3">₹{o.grandTotal}</td>
                  <td className="px-4 py-3 text-xs">{o.payment?.method}<div className="text-inkSoft">{o.payment?.status}</div></td>
                  <td className="px-4 py-3">
                    <select
                      disabled={updating === o.id}
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="border border-black/15 rounded-lg px-2 py-1 text-xs font-semibold"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
