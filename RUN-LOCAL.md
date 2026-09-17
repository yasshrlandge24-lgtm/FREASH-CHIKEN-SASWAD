# Freash Chiken — Run locally

1. Open PowerShell in this `project` folder.
2. Make sure PostgreSQL is running and `.env` contains the correct `DATABASE_URL`.
3. Run:

```powershell
npm install
npx prisma db push
npx prisma generate
npm run seed
npm run dev -- -H 0.0.0.0
```

For a phone on the same Wi-Fi, open the laptop's IPv4 address with port 3000, for example `http://10.156.252.229:3000`. Do not open `0.0.0.0` on the phone.

Development login seeded by `npm run seed`:
- Admin: `admin@freash-chiken.example` / `Admin@1234`
- Customer: `customer@freash-chiken.example` / `Customer@1234`

Phase 1 authentication is password-based; SMS OTP is not used.
