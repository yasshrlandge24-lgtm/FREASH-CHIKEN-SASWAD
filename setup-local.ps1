$ErrorActionPreference = "Stop"
Write-Host "Freash Chiken - local setup" -ForegroundColor Green
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Created .env from .env.example. Update DATABASE_URL before continuing." -ForegroundColor Yellow
}
npx prisma db push
npx prisma generate
npm run seed
Write-Host "Setup complete. Start with: npm run dev -- -H 0.0.0.0" -ForegroundColor Green
