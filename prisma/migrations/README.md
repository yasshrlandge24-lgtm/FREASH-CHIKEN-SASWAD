# Local database setup

This Phase 1 build intentionally uses `prisma db push` for local setup because the project was previously moved between migration histories. It synchronizes the current Prisma schema without requiring the old migration files to match.

For a clean production database, create a fresh migration history before deployment.
