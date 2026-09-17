import { db } from './db';
import type { Coupon } from '@prisma/client';

// All money values in this codebase are whole rupees (no paise/decimal subunit) —
// matches the Phase 1 prototype. Keep this convention consistent everywhere: DB,
// pricing math, and coupon amounts all assume the same unit.
export const FREE_DELIVERY_THRESHOLD = 499;
export const STANDARD_DELIVERY_FEE = 40;

export type PricedLine = {
  variantId: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  weightLabel: string;
  cutOption: string | null;
  quantity: number;
  unitPrice: number;
  unitMrp: number;
  lineTotal: number;
  lineMrpTotal: number;
};

export type PricingResult = {
  lines: PricedLine[];
  subtotal: number;
  mrpSubtotal: number;
  itemDiscount: number;
  deliveryFee: number;
  couponDiscount: number;
  couponCode: string | null;
  couponError: string | null;
  grandTotal: number;
};

/**
 * Recomputes prices for a set of {variantId, quantity} pairs directly from the database.
 * This is the ONLY place order totals should be calculated — never accept a client-supplied
 * price or total for anything that touches money.
 */
export async function priceCartItems(
  items: { variantId: string; quantity: number }[]
): Promise<PricedLine[]> {
  const variantIds = items.map((i) => i.variantId);
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds }, active: true },
    include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
  });

  return items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId);
    if (!variant) throw new Error(`Variant ${item.variantId} not found or inactive`);
    return {
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      imageUrl: variant.product.images[0]?.url ?? null,
      weightLabel: variant.weightLabel,
      cutOption: variant.cutOption,
      quantity: item.quantity,
      unitPrice: variant.price,
      unitMrp: variant.mrp,
      lineTotal: variant.price * item.quantity,
      lineMrpTotal: variant.mrp * item.quantity,
    };
  });
}

export function computeCouponDiscount(coupon: Pick<Coupon, 'type' | 'value' | 'maxDiscount'>, subtotal: number): number {
  const raw = coupon.type === 'PERCENT' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
}

/**
 * Validates a coupon against the current subtotal, per-user usage, and active window.
 * Returns a discount amount and/or an error message — never throws for "invalid coupon",
 * since that's an expected user-facing outcome, not a server error.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
  userId?: string
): Promise<{ coupon: Coupon | null; discount: number; error: string | null }> {
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  const now = new Date();

  if (!coupon || !coupon.active) {
    return { coupon: null, discount: 0, error: "This coupon code isn't valid." };
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    return { coupon: null, discount: 0, error: 'This coupon is not active yet.' };
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return { coupon: null, discount: 0, error: 'This coupon has expired.' };
  }
  if (subtotal < coupon.minOrderAmount) {
    const remaining = coupon.minOrderAmount - subtotal;
    return { coupon: null, discount: 0, error: `Add ₹${remaining} more to use ${coupon.code}.` };
  }
  if (coupon.usageLimit) {
    const totalUses = await db.couponUsage.count({ where: { couponId: coupon.id } });
    if (totalUses >= coupon.usageLimit) {
      return { coupon: null, discount: 0, error: 'This coupon has reached its usage limit.' };
    }
  }
  if (coupon.perUserLimit && userId) {
    const userUses = await db.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (userUses >= coupon.perUserLimit) {
      return { coupon: null, discount: 0, error: "You've already used this coupon." };
    }
  }

  return { coupon, discount: computeCouponDiscount(coupon, subtotal), error: null };
}

/**
 * Full order pricing pipeline: prices every line from the DB, applies delivery fee rules,
 * and — if a coupon code is supplied — validates and applies it. This is what both the
 * cart summary endpoint and order-creation endpoint should call, so the numbers a customer
 * sees in their cart are guaranteed to match what they're actually charged.
 */
export async function priceOrder(
  items: { variantId: string; quantity: number }[],
  userId: string,
  couponCode?: string,
  deliveryFeeOverride?: number
): Promise<PricingResult> {
  const lines = await priceCartItems(items);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const mrpSubtotal = lines.reduce((s, l) => s + l.lineMrpTotal, 0);
  const itemDiscount = mrpSubtotal - subtotal;
  const deliveryFee = deliveryFeeOverride ?? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE);

  let couponDiscount = 0;
  let couponCodeApplied: string | null = null;
  let couponError: string | null = null;

  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal, userId);
    couponDiscount = result.discount;
    couponError = result.error;
    couponCodeApplied = result.coupon?.code ?? null;
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);

  return {
    lines,
    subtotal,
    mrpSubtotal,
    itemDiscount,
    deliveryFee,
    couponDiscount,
    couponCode: couponCodeApplied,
    couponError,
    grandTotal,
  };
}
