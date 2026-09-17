# Phase 1 — Bug Fixes

- Removed SMS OTP authentication and all OTP UI/API/schema dependencies.
- Password authentication: mobile/email + password.
- Added secure, expiring email-based password recovery; local development shows the reset link on the recovery page.
- Added guest cart and guest checkout.
- Guest coupon preview works; final order validation still enforces usage limits.
- Cart add/update/remove validates product availability and stock.
- Mobile header has a compact order-by-phone icon.
- Removed the top announcement strip and tightened the mobile header/hero viewport.
- Local database setup uses `prisma db push` because the project previously contained mismatched migration histories.
