'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MessageCircle, Phone, ShoppingBag } from 'lucide-react';

const BUSINESS_PHONE = '+91 87666 52688';
const WHATSAPP_NUMBER = '918766652688';

const STAGES = [
  { key: 'PLACED', label: 'Order Placed', note: "We've received your order." },
  { key: 'CONFIRMED', label: 'Order Confirmed', note: 'Your order has been confirmed.' },
  { key: 'PREPARING', label: 'Being Prepared', note: 'Your cuts are being freshly prepared.' },
  { key: 'PACKED', label: 'Packed', note: 'Sealed and temperature-checked.' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', note: 'On its way to you.' },
  { key: 'DELIVERED', label: 'Delivered', note: 'Delivered — enjoy!' },
];

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  items: { id: string; quantity: number; unitPrice: number; lineTotal: number; product: { name: string }; variant: { weightLabel: string; cutOption: string | null } }[];
  shippingAddress: { name: string; phone: string; line1: string; area?: string; city: string; pincode: string } | null;
  payment: { method: string; status: string } | null;
  statusHistory: { status: string; createdAt: string }[];
};

export default function OrderTrackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/orders/${params.id}`, { credentials: 'include' });
      if (res.status === 401) { router.push(`/login?next=/orders/${params.id}`); return; }
      if (res.status === 404 || res.status === 403) { setNotFound(true); return; }
      const body = await res.json();
      setOrder(body.data);
    })();
  }, [params.id, router]);

  const whatsappUrl = useMemo(() => {
    if (!order) return '#';
    const itemText = order.items.map((i) => `• ${i.product.name} — ${i.variant.weightLabel}${i.variant.cutOption ? ` (${i.variant.cutOption})` : ''} × ${i.quantity} = ₹${i.lineTotal}`).join('\n');
    const address = order.shippingAddress ? `${order.shippingAddress.name}, ${order.shippingAddress.line1}${order.shippingAddress.area ? `, ${order.shippingAddress.area}` : ''}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}` : 'Delivery address on order';
    const text = `Hello Freash Chiken Centre,\nI have placed an order.\n\nOrder: #${order.orderNumber}\n\n${itemText}\n\nTotal: ₹${order.grandTotal}\nDelivery: ${address}\n\nPlease confirm my order. Thank you.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }, [order]);

  if (notFound) return <main className="max-w-2xl mx-auto px-6 py-16 text-center"><h1 className="text-2xl font-semibold mb-2">Order not found</h1><p className="text-inkSoft">It may belong to a different account, or the link may be incorrect.</p></main>;
  if (!order) return <main className="max-w-2xl mx-auto px-6 py-16">Loading…</main>;

  if (order.status === 'CANCELLED') return <main className="max-w-2xl mx-auto px-6 py-12"><h1 className="text-2xl font-semibold mb-4">Order #{order.orderNumber}</h1><div className="bg-white border border-black/10 rounded-2xl p-6"><p className="font-semibold text-barn">This order was cancelled.</p><a className="text-sageDark text-sm font-bold inline-block mt-4" href={`tel:${BUSINESS_PHONE.replace(/\s/g,'')}`}>Contact Freash Chiken</a></div></main>;

  const curIdx = STAGES.findIndex((s) => s.key === order.status);
  return <main className="max-w-2xl mx-auto px-6 py-12">
    <div className="flex items-end justify-between gap-4 mb-6"><div><span className="eyebrow">Freash Chiken · Since 1997</span><h1 className="text-2xl font-semibold mt-2">Track Order</h1></div><Link href="/shop" className="text-sageDark text-xs font-bold flex items-center gap-1"><ShoppingBag size={14}/> Shop more</Link></div>
    <div className="bg-white border border-black/10 rounded-2xl p-6 mb-5">
      <div className="flex justify-between flex-wrap gap-2 mb-4"><div><strong>Order #{order.orderNumber}</strong><p className="text-xs text-inkSoft">{order.items.length} items · ₹{order.grandTotal}</p></div><span className="text-xs font-bold bg-paper px-3 py-1 rounded-full h-fit">{STAGES[curIdx]?.label ?? order.status}</span></div>
      <div>{STAGES.map((s, i) => { const event = order.statusHistory.find((h) => h.status === s.key); const done = i <= curIdx; return <div key={s.key} className="flex gap-4 relative pb-6 last:pb-0">{i < STAGES.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-black/10" />}<div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs ${done ? 'bg-sageDark' : 'bg-black/10'}`}>{done ? '✓' : ''}</div><div><h4 className="font-semibold text-sm">{s.label}</h4><p className="text-xs text-inkSoft">{done ? s.note : 'Pending'}</p>{event && <p className="text-xs text-inkSoft mt-0.5">{new Date(event.createdAt).toLocaleString()}</p>}</div></div> })}</div>
    </div>
    {order.shippingAddress && <div className="bg-white border border-black/10 rounded-2xl p-6 text-sm"><h3 className="font-bold mb-2">Delivery details</h3><p>{order.shippingAddress.name}, {order.shippingAddress.line1}{order.shippingAddress.area ? `, ${order.shippingAddress.area}` : ''}, {order.shippingAddress.city} — {order.shippingAddress.pincode}</p>{order.payment && <p className="mt-2"><strong>Payment:</strong> {order.payment.method} ({order.payment.status})</p>}</div>}
    <section className="order-contact-card"><h3>Send this order directly to Freash Chiken Centre</h3><p>Your website order is saved in the system. For fast store confirmation, send the order summary to our business WhatsApp or call the store directly.</p><div className="order-contact-actions"><a href={whatsappUrl} target="_blank" rel="noreferrer" className="order-wa"><MessageCircle size={15}/> Send on WhatsApp</a><a href={`tel:${BUSINESS_PHONE.replace(/\s/g,'')}`} className="order-call"><Phone size={15}/> Call {BUSINESS_PHONE}</a></div></section>
  </main>;
}
