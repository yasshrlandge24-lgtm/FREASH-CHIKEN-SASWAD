import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(20), // 0 = remove
});

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(40),
});

export const addressSchema = z.object({
  label: z.enum(['HOME', 'WORK', 'OTHER']),
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[0-9]{10}$/),
  line1: z.string().min(2),
  area: z.string().min(2),
  landmark: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^[0-9]{6}$/),
});

export const createOrderSchema = z.object({
  addressId: z.string().min(1).optional(),
  address: addressSchema.optional(), // allow a one-off address if not saving to the book
  deliverySlotId: z.string().min(1),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['UPI', 'CARD', 'NETBANKING', 'COD']),
  guestItems: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).max(50).optional(),
}).refine((data) => data.addressId || data.address, {
  message: 'Either addressId or a full address is required',
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'CONFIRMED', 'PREPARING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  note: z.string().optional(),
});

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(5).max(2000),
});

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['recommended', 'popular', 'price-asc', 'price-desc', 'newest']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export const adminProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().min(5),
  categoryId: z.string().min(1),
  sku: z.string().min(2),
  tags: z.array(z.string()).default([]),
  sourcingInfo: z.string().optional(),
  processingInfo: z.string().optional(),
  hygieneInfo: z.string().optional(),
  storageInfo: z.string().optional(),
  deliveryInfo: z.string().optional(),
  active: z.boolean().default(true),
  variants: z.array(z.object({
    weightLabel: z.string(),
    weightGrams: z.number().int().positive(),
    cutOption: z.string().nullable().optional(),
    price: z.number().int().positive(),
    mrp: z.number().int().positive(),
    sku: z.string(),
    initialStock: z.number().int().min(0).default(0),
  })).min(1),
});

export const adminCouponSchema = z.object({
  code: z.string().min(3).max(40).transform((s) => s.toUpperCase()),
  type: z.enum(['PERCENT', 'FLAT']),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().positive().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  active: z.boolean().default(true),
});

export const adminCategorySchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const adminDeliverySlotSchema = z.object({
  label: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  date: z.coerce.date(),
  capacity: z.number().int().positive().default(50),
  deliveryFee: z.number().int().min(0).default(40),
  active: z.boolean().default(true),
});

export const adminBannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  imageUrl: z.string().url().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  placement: z.enum(['hero', 'promo', 'featured-category']),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
