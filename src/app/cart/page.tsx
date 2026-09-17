'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const GUEST_CART_KEY='freash_guest_cart';
type CartLine = {
  variantId: string;
  cartItemId: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  weightLabel: string;
  cutOption: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setLoadError(null);
    try {
    const res = await fetch('/api/cart', { credentials: 'include', cache: 'no-store' });
    if (res.status === 401) {
      let guest:any[]=[]; try { guest=JSON.parse(localStorage.getItem(GUEST_CART_KEY)||'[]'); if(!Array.isArray(guest)) guest=[]; } catch { guest=[]; }
      if (!guest.length) { setLines([]); setSubtotal(0); setDeliveryFee(0); setLoading(false); return; }
      const gr=await fetch('/api/cart/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:guest.map((x:any)=>({variantId:x.variantId,quantity:x.quantity}))})});
      const gb=await gr.json();
      if(!gr.ok){setLoadError(gb.error||'Could not load your cart.');setLoading(false);return;}
      setLines(gb.data.items);setSubtotal(gb.data.subtotal);setDeliveryFee(gb.data.deliveryFee);setLoading(false);return;
    }
    const text = await res.text(); let body:any=null; try{body=text?JSON.parse(text):null}catch{}
    if (!res.ok) { setLoadError(body?.error ?? `Could not load your cart (${res.status}).`); setLoading(false); return; }
    setLines(body?.data?.items ?? []); setSubtotal(body?.data?.subtotal ?? 0); setDeliveryFee(body?.data?.deliveryFee ?? 0); setLoading(false);
    } catch {
      setLoadError('Please check your connection and try again.');
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateQty(cartItemId: string, quantity: number) {
    if (cartItemId.startsWith('guest:')) {
      let guest:any[]=[]; try { guest=JSON.parse(localStorage.getItem(GUEST_CART_KEY)||'[]'); if(!Array.isArray(guest)) guest=[]; } catch { guest=[]; }
      const variantId=cartItemId.slice(6); const item=guest.find((x:any)=>x.variantId===variantId);
      if(item){ if(quantity<=0) localStorage.setItem(GUEST_CART_KEY,JSON.stringify(guest.filter((x:any)=>x.variantId!==variantId))); else item.quantity=Math.min(20,quantity); }
      load(); window.dispatchEvent(new Event('cart-updated')); return;
    }
    // quantity 0 tells the API to remove the line entirely.
    const res = await fetch(`/api/cart/items/${cartItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity: Math.max(0, quantity) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLoadError(body?.error || 'Could not update your cart.');
    }
    await load();
    window.dispatchEvent(new Event('cart-updated'));
  }

  async function applyCoupon() {
    setCouponError(null);
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: couponInput, ...(lines.some((l) => l.cartItemId.startsWith('guest:')) ? { items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })) } : {}) }),
    });
    const body = await res.json();
    if (!res.ok) {
      setCouponError(body.error);
      setCoupon(null);
      return;
    }
    setCoupon(body.data);
  }

  if (loading) return <main className="max-w-4xl mx-auto px-6 py-16">Loading…</main>;

  if (loadError) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">We could not load your cart</h1>
        <p className="text-sm text-inkSoft mb-5">{loadError}</p>
        <button onClick={load} className="inline-block bg-ink text-white px-6 py-3 rounded-lg font-semibold">Try again</button>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Your cart is empty</h1>
        <Link href="/shop" className="inline-block bg-ink text-white px-6 py-3 rounded-lg font-semibold mt-2">
          Shop Fresh Chicken
        </Link>
      </main>
    );
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - (coupon?.discount ?? 0));

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-8">Your Cart</h1>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          {lines.map((l) => (
            <div key={l.variantId} className="flex gap-4 py-4 border-b border-black/10">
              <div className="w-16 h-16 bg-paper rounded-lg flex-shrink-0 overflow-hidden">{l.imageUrl ? <img src={l.imageUrl} alt={l.productName} className="w-full h-full object-cover" /> : null}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{l.productName}</h3>
                <p className="text-xs text-inkSoft mb-2">{l.weightLabel}{l.cutOption ? ` · ${l.cutOption}` : ''}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center border border-black/15 rounded-lg">
                    <button className="w-8 h-8" onClick={() => updateQty(l.cartItemId, l.quantity - 1)}>−</button>
                    <span className="w-8 text-center text-sm">{l.quantity}</span>
                    <button className="w-8 h-8" onClick={() => updateQty(l.cartItemId, l.quantity + 1)}>+</button>
                  </div>
                  <strong>₹{l.lineTotal}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-black/10 rounded-2xl p-5 h-fit">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          <div className="flex gap-2 mb-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon code"
              className="flex-1 border border-black/15 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={applyCoupon} className="border border-ink rounded-lg px-3 text-sm font-semibold">Apply</button>
          </div>
          {couponError && <p className="text-barn text-xs mb-2">{couponError}</p>}
          {coupon && <p className="text-sageDark text-xs mb-2">{coupon.code} applied — −₹{coupon.discount}</p>}
          <div className="text-sm space-y-1 mt-3">
            <div className="flex justify-between text-inkSoft"><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between text-inkSoft"><span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
            {coupon && <div className="flex justify-between text-inkSoft"><span>Coupon</span><span>−₹{coupon.discount}</span></div>}
            <div className="flex justify-between font-bold text-base border-t border-black/10 pt-2 mt-2"><span>Total</span><span>₹{grandTotal}</span></div>
          </div>
          <Link href="/checkout" className="block text-center bg-ink text-white rounded-lg py-3 font-semibold mt-4">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
