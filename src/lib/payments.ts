import crypto from 'node:crypto';

export type ChargeRequest = { orderId: string; amount: number; method: 'UPI'|'CARD'|'NETBANKING'|'COD' };
export type ChargeResult = { status: 'PAID'|'PENDING'|'FAILED'; providerRef: string|null };
export interface PaymentProvider { charge(req: ChargeRequest): Promise<ChargeResult>; }

export class MockPaymentProvider implements PaymentProvider {
  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (req.method === 'COD') return { status: 'PENDING', providerRef: null };
    return { status: 'PAID', providerRef: `MOCK-${req.orderId}-${Date.now()}` };
  }
}

/** Creates a Razorpay order server-side. The browser completes payment using Razorpay Checkout. */
export class RazorpayPaymentProvider implements PaymentProvider {
  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (req.method === 'COD') return { status: 'PENDING', providerRef: null };
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured');
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(req.amount * 100), currency: 'INR', receipt: req.orderId, notes: { orderId: req.orderId } }),
    });
    if (!response.ok) throw new Error(`Razorpay order creation failed (${response.status})`);
    const data = await response.json() as { id: string };
    return { status: 'PENDING', providerRef: data.id };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENT_MODE ?? 'mock';
  if (mode === 'mock') return new MockPaymentProvider();
  if (mode === 'razorpay') return new RazorpayPaymentProvider();
  throw new Error(`Unknown PAYMENT_MODE: ${mode}`);
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a=Buffer.from(expected), b=Buffer.from(signature);
  return a.length===b.length && crypto.timingSafeEqual(a,b);
}

export function verifyRazorpayWebhook(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a=Buffer.from(expected), b=Buffer.from(signature);
  return a.length===b.length && crypto.timingSafeEqual(a,b);
}
