import { describe, it, expect } from 'vitest';
import { registerSchema, addressSchema, addToCartSchema, createOrderSchema, adminCouponSchema } from '../validation';

describe('registerSchema', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({ name: 'Jane Doe', email: 'jane@example.com', phone: '9876543210', password: 'longenough123' });
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ name: 'Jane', email: 'jane@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed email', () => {
    const result = registerSchema.safeParse({ name: 'Jane', email: 'not-an-email', password: 'longenough123' });
    expect(result.success).toBe(false);
  });

  it('rejects a phone number that is not exactly 10 digits', () => {
    const result = registerSchema.safeParse({ name: 'Jane', email: 'jane@example.com', password: 'longenough123', phone: '12345' });
    expect(result.success).toBe(false);
  });
});

describe('addressSchema', () => {
  it('rejects a pincode that is not 6 digits', () => {
    const result = addressSchema.safeParse({
      label: 'HOME', name: 'Jane', phone: '9876543210', line1: 'Flat 1', area: 'MG Road',
      city: 'Pune', state: 'MH', pincode: '1234',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed address', () => {
    const result = addressSchema.safeParse({
      label: 'WORK', name: 'Jane', phone: '9876543210', line1: 'Flat 1', area: 'MG Road',
      city: 'Pune', state: 'MH', pincode: '411001',
    });
    expect(result.success).toBe(true);
  });
});

describe('addToCartSchema', () => {
  it('rejects a quantity of 0 (use the remove endpoint instead)', () => {
    expect(addToCartSchema.safeParse({ variantId: 'v1', quantity: 0 }).success).toBe(false);
  });

  it('rejects a quantity above the 20-item cap', () => {
    expect(addToCartSchema.safeParse({ variantId: 'v1', quantity: 21 }).success).toBe(false);
  });

  it('accepts a normal quantity', () => {
    expect(addToCartSchema.safeParse({ variantId: 'v1', quantity: 3 }).success).toBe(true);
  });
});

describe('createOrderSchema', () => {
  const validAddress = {
    label: 'HOME' as const, name: 'Jane', phone: '9876543210', line1: 'Flat 1', area: 'MG Road',
    city: 'Pune', state: 'MH', pincode: '411001',
  };

  it('requires either addressId or a full address', () => {
    const result = createOrderSchema.safeParse({ deliverySlotId: 's1', paymentMethod: 'UPI' });
    expect(result.success).toBe(false);
  });

  it('accepts a payload with a one-off address', () => {
    const result = createOrderSchema.safeParse({ address: validAddress, deliverySlotId: 's1', paymentMethod: 'COD' });
    expect(result.success).toBe(true);
  });

  it('accepts a payload with a saved addressId instead', () => {
    const result = createOrderSchema.safeParse({ addressId: 'addr1', deliverySlotId: 's1', paymentMethod: 'UPI' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid payment method', () => {
    const result = createOrderSchema.safeParse({ address: validAddress, deliverySlotId: 's1', paymentMethod: 'BITCOIN' });
    expect(result.success).toBe(false);
  });
});

describe('adminCouponSchema', () => {
  it('uppercases the coupon code', () => {
    const result = adminCouponSchema.safeParse({ code: 'save10', type: 'PERCENT', value: 10 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe('SAVE10');
  });

  it('rejects a non-positive value', () => {
    const result = adminCouponSchema.safeParse({ code: 'SAVE10', type: 'PERCENT', value: 0 });
    expect(result.success).toBe(false);
  });
});
