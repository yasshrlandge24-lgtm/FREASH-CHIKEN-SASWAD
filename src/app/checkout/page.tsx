'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type CartLine = {
  cartItemId: string;
  productName: string;
  weightLabel: string;
  cutOption: string | null;
  quantity: number;
  lineTotal: number;
};

type Slot = { id: string; label: string; deliveryFee: number; full: boolean };
declare global { interface Window { Razorpay?: any } }

const ADDRESS_TYPES = ['HOME', 'WORK', 'OTHER'] as const;

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // cart summary
  const [lines, setLines] = useState<CartLine[]>([]);
  const [subtotal, setSubtotal] = useState(0);

  // address
  const [address, setAddress] = useState({
    label: 'HOME' as (typeof ADDRESS_TYPES)[number],
    name: '',
    phone: '',
    line1: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [pincodeStatus, setPincodeStatus] = useState<{ serviceable: boolean; message: string } | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  // delivery slot
  const [slotDay, setSlotDay] = useState<'today' | 'tomorrow'>('today');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // coupon + payment
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'COD'>('UPI');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'mock'|'razorpay'>('mock');
  const [guestMode, setGuestMode] = useState(false);
  const [guestItems, setGuestItems] = useState<{variantId:string;quantity:number}[]>([]);

  useEffect(() => {
    setPaymentMode((process.env.NEXT_PUBLIC_PAYMENT_MODE as 'mock'|'razorpay') || 'mock');
    if ((process.env.NEXT_PUBLIC_PAYMENT_MODE || 'mock') === 'razorpay') { const script=document.createElement('script'); script.src='https://checkout.razorpay.com/v1/checkout.js'; script.async=true; document.body.appendChild(script); }
    (async () => {
      try {
      const res = await fetch('/api/cart', { credentials: 'include', cache: 'no-store' });
      if (res.status === 401) {
        let guest:any[]=[]; try { guest=JSON.parse(localStorage.getItem('freash_guest_cart')||'[]'); if(!Array.isArray(guest)) guest=[]; } catch { guest=[]; }
        if(!guest.length){router.push('/cart');return;}
        const gr=await fetch('/api/cart/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:guest.map((x:any)=>({variantId:x.variantId,quantity:x.quantity}))})});
        const gb=await gr.json(); if(!gr.ok){setPlaceError(gb.error||'Could not load your cart.');setLoading(false);return;}
        setGuestMode(true); setGuestItems(guest.map((x:any)=>({variantId:x.variantId,quantity:x.quantity}))); setLines(gb.data.items); setSubtotal(gb.data.subtotal); setLoading(false); return;
      }
      const body = await res.json();
      if (body.data.items.length === 0) {
        router.push('/cart');
        return;
      }
      setLines(body.data.items);
      setSubtotal(body.data.subtotal);
      setLoading(false);
      } catch {
        setPlaceError('Please check your connection and try again.');
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (step !== 2) return;
    setLoadingSlots(true);
    const date = slotDay === 'today' ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000);
    fetch(`/api/delivery-slots?date=${toDateInput(date)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((body) => {
        setSlots(body.data);
        setLoadingSlots(false);
      });
  }, [step, slotDay]);

  async function checkPincode() {
    if (!/^[0-9]{6}$/.test(address.pincode)) {
      setPincodeStatus({ serviceable: false, message: 'Enter a valid 6-digit pincode.' });
      return;
    }
    setCheckingPincode(true);
    const res = await fetch(`/api/service-areas/check?pincode=${address.pincode}`, { credentials: 'include' });
    const body = await res.json();
    setPincodeStatus(body.data);
    setCheckingPincode(false);
  }

  function continueFromAddress() {
    if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) return;
    if (!pincodeStatus?.serviceable) return;
    setStep(2);
  }

  async function applyCoupon() {
    setCouponError(null);
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: couponCode, ...(guestMode ? { items: guestItems } : {}) }),
    });
    const body = await res.json();
    if (!res.ok) {
      setCouponError(body.error);
      setCouponDiscount(0);
      return;
    }
    setCouponDiscount(body.data.discount);
  }

  const slot = slots.find((s) => s.id === selectedSlot);
  const deliveryFee = slot?.deliveryFee ?? 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);

  async function placeOrder() {
    setPlacing(true);
    setPlaceError(null);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        address,
        deliverySlotId: selectedSlot,
        couponCode: couponCode || undefined,
        paymentMethod,
        guestItems: guestMode ? guestItems : undefined,
      }),
    });
    const body = await res.json();
    setPlacing(false);
    if (!res.ok) { setPlaceError(body.error ?? 'Could not place order'); return; }
    const created = body.data;
    if (guestMode) localStorage.removeItem('freash_guest_cart');
    if (paymentMode === 'razorpay' && paymentMethod !== 'COD') {
      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!key || !created.payment?.providerRef || !window.Razorpay) { setPlaceError('Online payment is not configured. Please choose another payment method.'); return; }
      const rzp = new window.Razorpay({ key, amount: created.payment.amount * 100, currency: 'INR', name: 'Freash Chiken', description: `Order #${created.orderNumber}`, order_id: created.payment.providerRef,
        handler: async (response:any) => {
          const verify = await fetch('/api/payments/razorpay/verify',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({orderId:created.id,razorpayOrderId:response.razorpay_order_id,razorpayPaymentId:response.razorpay_payment_id,razorpaySignature:response.razorpay_signature})});
          if(verify.ok) router.push(`/orders/${created.id}`); else setPlaceError('Payment verification failed. Please contact support with your order number.');
        }, modal:{ondismiss:()=>setPlaceError('Payment was cancelled. Your order remains pending payment; contact support if you need it cancelled.')} });
      rzp.open();
    } else router.push(`/orders/${created.id}`);
  }

  if (loading) return <main className="max-w-2xl mx-auto px-6 py-16">Loading…</main>;

  const stepNames = ['Address', 'Delivery Slot', 'Review', 'Payment'];

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      <div className="flex mb-8">
        {stepNames.map((s, i) => (
          <div
            key={s}
            className={`flex-1 text-center text-sm font-semibold pb-2 border-b-4 ${
              step > i + 1 ? 'text-sageDark border-sageDark' : step === i + 1 ? 'text-ink border-ink' : 'text-inkSoft border-black/10'
            }`}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input placeholder="Full name" className="border border-black/15 rounded-lg px-3 py-2 col-span-2" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
            <input placeholder="Phone number" className="border border-black/15 rounded-lg px-3 py-2 col-span-2" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
            <input placeholder="House / Flat no." className="border border-black/15 rounded-lg px-3 py-2 col-span-2" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
            <input placeholder="Area / Street" className="border border-black/15 rounded-lg px-3 py-2" value={address.area} onChange={(e) => setAddress({ ...address, area: e.target.value })} />
            <input placeholder="Landmark" className="border border-black/15 rounded-lg px-3 py-2" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
            <input placeholder="City" className="border border-black/15 rounded-lg px-3 py-2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            <input placeholder="State" className="border border-black/15 rounded-lg px-3 py-2" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
            <div className="col-span-2">
              <div className="flex gap-2">
                <input
                  placeholder="Pincode"
                  maxLength={6}
                  className="flex-1 border border-black/15 rounded-lg px-3 py-2"
                  value={address.pincode}
                  onChange={(e) => {
                    setAddress({ ...address, pincode: e.target.value });
                    setPincodeStatus(null);
                  }}
                />
                <button onClick={checkPincode} disabled={checkingPincode} className="border border-ink rounded-lg px-4 text-sm font-semibold">
                  {checkingPincode ? 'Checking…' : 'Check'}
                </button>
              </div>
              {pincodeStatus && (
                <p className={`text-sm mt-2 px-3 py-2 rounded-lg ${pincodeStatus.serviceable ? 'bg-[#EAF1E9] text-sageDark' : 'bg-[#F5E7E3] text-barn'}`}>
                  {pincodeStatus.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            {ADDRESS_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setAddress({ ...address, label: t })}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold ${address.label === t ? 'bg-ink text-white border-ink' : 'border-black/15'}`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button onClick={continueFromAddress} className="bg-ink text-white rounded-lg px-6 py-3 font-semibold">
            Continue to Delivery Slot
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => { setSlotDay('today'); setSelectedSlot(null); }} className={`px-4 py-2 rounded-full border text-sm font-semibold ${slotDay === 'today' ? 'bg-ink text-white border-ink' : 'border-black/15'}`}>Today</button>
            <button onClick={() => { setSlotDay('tomorrow'); setSelectedSlot(null); }} className={`px-4 py-2 rounded-full border text-sm font-semibold ${slotDay === 'tomorrow' ? 'bg-ink text-white border-ink' : 'border-black/15'}`}>Tomorrow</button>
          </div>
          {loadingSlots ? (
            <p className="text-inkSoft text-sm">Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-inkSoft text-sm">No delivery slots configured for this date yet — try the other day, or add slots via the seed script / admin.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {slots.map((s) => (
                <button
                  key={s.id}
                  disabled={s.full}
                  onClick={() => setSelectedSlot(s.id)}
                  className={`text-left border rounded-lg px-4 py-3 text-sm font-semibold ${
                    s.full ? 'opacity-40 cursor-not-allowed' : selectedSlot === s.id ? 'border-ink bg-paper' : 'border-black/15'
                  }`}
                >
                  {s.label}
                  <span className="block font-normal text-inkSoft text-xs mt-1">{s.full ? 'Fully booked' : 'Available'}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border border-ink rounded-lg px-6 py-3 font-semibold">Back</button>
            <button disabled={!selectedSlot} onClick={() => setStep(3)} className="bg-ink text-white rounded-lg px-6 py-3 font-semibold disabled:opacity-40">
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="bg-white border border-black/10 rounded-2xl p-5 mb-4">
            <h3 className="font-semibold mb-2">Delivering to</h3>
            <p className="text-sm">{address.name}, {address.phone}<br/>{address.line1}, {address.area}{address.landmark ? `, near ${address.landmark}` : ''}<br/>{address.city}, {address.state} — {address.pincode} ({address.label})</p>
            <p className="text-sm mt-2"><strong>Slot:</strong> {slotDay === 'today' ? 'Today' : 'Tomorrow'}, {slot?.label}</p>
          </div>
          <div className="bg-white border border-black/10 rounded-2xl p-5 mb-4">
            <h3 className="font-semibold mb-2">Items ({lines.length})</h3>
            {lines.map((l) => (
              <div key={l.cartItemId} className="flex justify-between text-sm py-1">
                <span>{l.productName} · {l.weightLabel}{l.cutOption ? ` · ${l.cutOption}` : ''} × {l.quantity}</span>
                <span>₹{l.lineTotal}</span>
              </div>
            ))}
            <div className="flex gap-2 my-3">
              <input placeholder="Coupon code" className="flex-1 border border-black/15 rounded-lg px-3 py-2 text-sm" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <button onClick={applyCoupon} className="border border-ink rounded-lg px-4 text-sm font-semibold">Apply</button>
            </div>
            {couponError && <p className="text-barn text-xs mb-2">{couponError}</p>}
            <div className="flex justify-between text-sm py-1 border-t border-black/10 mt-2 pt-2"><span>Delivery Fee</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
            {couponDiscount > 0 && <div className="flex justify-between text-sm py-1"><span>Coupon ({couponCode.toUpperCase()})</span><span>−₹{couponDiscount}</span></div>}
            <div className="flex justify-between font-bold text-base py-1"><span>Grand Total</span><span>₹{grandTotal}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="border border-ink rounded-lg px-6 py-3 font-semibold">Back</button>
            <button onClick={() => setStep(4)} className="bg-ink text-white rounded-lg px-6 py-3 font-semibold">Continue to Payment</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          {(['UPI', 'CARD', 'NETBANKING', 'COD'] as const).map((m) => (
            <label key={m} className="flex items-center gap-3 border border-black/15 rounded-lg px-4 py-3 mb-2 font-semibold text-sm">
              <input type="radio" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
              {m === 'NETBANKING' ? 'Net Banking' : m === 'COD' ? 'Cash on Delivery' : m}
            </label>
          ))}
          {placeError && <p className="text-barn text-sm mb-3">{placeError}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(3)} className="border border-ink rounded-lg px-6 py-3 font-semibold">Back</button>
            <button disabled={placing} onClick={placeOrder} className="flex-1 bg-ink text-white rounded-lg py-3 font-semibold disabled:opacity-50">
              {placing ? 'Placing order…' : `Pay ₹${grandTotal}`}
            </button>
          </div>
          <p className="text-xs text-inkSoft mt-3">{paymentMode === 'razorpay' && paymentMethod !== 'COD' ? 'Secure payment powered by Razorpay.' : 'Order details are saved securely. After placing the order, use the WhatsApp button on the confirmation page to send the order directly to Freash Chiken Centre.'}</p>
          <div className="checkout-contact-note"><strong>Need quick help?</strong><span>Call +91 87666 52688 · pranavjagtap863@gmail.com</span></div>
        </div>
      )}
    </main>
  );
}
