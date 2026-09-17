import { describe, it, expect } from 'vitest';
import { computeCouponDiscount, FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE } from '../pricing';

describe('computeCouponDiscount', () => {
  it('computes a flat discount regardless of subtotal', () => {
    const coupon = { type: 'FLAT' as const, value: 50, maxDiscount: null };
    expect(computeCouponDiscount(coupon, 1000)).toBe(50);
    expect(computeCouponDiscount(coupon, 60)).toBe(50);
  });

  it('computes a percent discount proportional to subtotal', () => {
    const coupon = { type: 'PERCENT' as const, value: 10, maxDiscount: null };
    expect(computeCouponDiscount(coupon, 1000)).toBe(100);
    expect(computeCouponDiscount(coupon, 299)).toBe(30); // rounds to nearest rupee
  });

  it('caps a percent discount at maxDiscount', () => {
    const coupon = { type: 'PERCENT' as const, value: 15, maxDiscount: 200 };
    expect(computeCouponDiscount(coupon, 2000)).toBe(200); // 15% of 2000 = 300, capped to 200
    expect(computeCouponDiscount(coupon, 500)).toBe(75); // 15% of 500 = 75, under the cap
  });

  it('caps a flat discount at maxDiscount if one is set lower than value', () => {
    const coupon = { type: 'FLAT' as const, value: 100, maxDiscount: 50 };
    expect(computeCouponDiscount(coupon, 1000)).toBe(50);
  });
});

describe('delivery fee constants', () => {
  it('are sane relative to each other', () => {
    expect(STANDARD_DELIVERY_FEE).toBeGreaterThan(0);
    expect(FREE_DELIVERY_THRESHOLD).toBeGreaterThan(STANDARD_DELIVERY_FEE);
  });
});
