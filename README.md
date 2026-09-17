# Freash Chiken — Full-Stack Fresh Chicken Store

A production-oriented fresh chicken e-commerce application built with Next.js App Router, TypeScript, PostgreSQL and Prisma. The codebase is designed for a real customer journey and a role-protected admin console.

## Included

- Premium responsive storefront and original Freash Chiken branding
- Home, shop, search, filters, product detail and related products
- Weight/cut variants, inventory-aware cart and wishlist
- Profile, saved addresses, coupons and notifications
- Four-step checkout with pincode serviceability and delivery slots
- Server-authoritative pricing and coupon validation
- Orders, order history, tracking timeline and reorder-ready architecture
- Customer reviews gated to delivered purchases
- Admin dashboard, products/variants, categories, inventory, orders, coupons, delivery slots and banners
- Revenue/order analytics
- PostgreSQL/Prisma schema with transactional order creation
- Razorpay-ready online payment flow with signature verification and webhook handling
- Mock payment mode for local development
- SEO metadata, sitemap and robots.txt
- Unit tests for pricing and validation logic
- Health endpoint at `/api/health`

## Stack

Next.js 14.2.x · React 18 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Zod · Zustand · React Hook Form · Framer Motion · Vitest

## Local setup (Windows / PowerShell)

```powershell
npm install
Copy-Item .env.example .env
# Edit .env and set your PostgreSQL password in DATABASE_URL
npx prisma db push
npx prisma generate
npm run seed
npm test
npm run build
npm run dev -- -H 0.0.0.0
```

Open `http://localhost:3000` on the laptop. On a phone on the same Wi-Fi, open the laptop IPv4 address with `:3000`.

This Phase 1 package uses `prisma db push` locally because the project had multiple old migration histories. Do not run `prisma migrate reset` on the existing local database.

## Development accounts

The seed creates demo accounts only:

- Admin: `admin@freash-chiken.example` / `Admin@1234`
- Customer: `customer@freash-chiken.example` / `Customer@1234`

Change these credentials and rotate `JWT_SECRET` before deployment.

## Payments

`PAYMENT_MODE=mock` is the safe default for development. For real online payments, set:

- `PAYMENT_MODE=razorpay`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `NEXT_PUBLIC_PAYMENT_MODE=razorpay`

The browser uses Razorpay Checkout; the server creates the Razorpay order and verifies the payment signature. Failed payments release the order inventory and delivery-slot capacity. Configure the Razorpay webhook endpoint as `/api/payments/razorpay/webhook`.

## Production checklist

Before a real launch, replace demo product data, pricing, service areas, imagery, support contacts, legal copy and credentials. Configure managed PostgreSQL, managed image storage/CDN, transactional email for password recovery, HTTPS, backups, HTTPS, backups, monitoring, rate limiting/WAF, and a dedicated CI test database for full API integration tests.

The source package contains the complete application code, but a live payment/database deployment cannot be truthfully considered verified until it is run with your own infrastructure and credentials.

## Business contact & ordering
- Brand: Freash Chiken Centre
- Heritage: Serving Saswad & Pune since 1997
- Phone / order line: +91 87666 52688
- Email: pranavjagtap863@gmail.com
- Customer order confirmation includes a one-tap WhatsApp handoff to the business number with the order summary.
- The WhatsApp handoff uses a click-to-chat link; a WhatsApp Business API account is not required for this workflow.

## Mobile-first UX
The storefront is optimized primarily for phone use with a right-side navigation drawer, overlay, compact header, mobile quick-navigation bar, touch-friendly controls, and responsive checkout/order tracking.

## Authentication

Phase 1 uses password authentication: customers can register with name, email, mobile number and password, then sign in with mobile/email + password. Password recovery creates a secure, expiring reset token. In local development the reset link is shown on the recovery page; a transactional email provider should be connected before production.

There is no SMS OTP dependency in this build.

## Local database setup

After creating `.env` from `.env.example` and setting `DATABASE_URL`, run:

```powershell
npx prisma db push
npx prisma generate
npm run seed
```

Do not use `prisma migrate reset` for this Phase 1 local build.
