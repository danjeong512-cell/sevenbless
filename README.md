# Seven Bless

Daily, concise encouragement via email/SMS at 07:00 America/Vancouver, based on your Google Calendar.

## Setup (Local)

1. Fill `.env`:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

2. Prisma

```
npx prisma migrate dev
```

3. Dev

```
npm run dev
```

## Deploy (Vercel)

1. Push to GitHub, then import in Vercel
2. Add Environment Variables (Production):
   - `DATABASE_URL` (use a hosted Postgres/SQLite-compatible DB; consider Neon/Fly/PlanetScale—adjust Prisma provider)
   - `NEXTAUTH_URL` = https://your-domain
   - `NEXTAUTH_SECRET` (random 32+ chars)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `OPENAI_API_KEY`
   - Email: `SENDGRID_API_KEY`, `SENDGRID_FROM`
   - SMS (optional): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
3. Google OAuth
   - Authorized redirect URI: `https://your-domain/api/auth/callback/google`
4. Database migrate
   - Option A: Run migration locally, then deploy with the migrated DB
   - Option B: Use Vercel CLI or a one-off job to run `prisma migrate deploy`
5. Cron (Delivery)
   - Vercel → Settings → Cron Jobs → Add Job
   - Schedule: Every 1 minute
   - Target: `GET /api/cron`
   - This triggers delivery checks (07:00 in each user’s timezone) + retries

Note: The in-process scheduler is disabled on Vercel; `/api/cron` is the trigger.

## Notes
- Stores derived signals only; does not store raw event titles/descriptions by default.
- Retries failed delivery with exponential backoff (max 3 attempts).
- Scheduler runs every minute and respects each user's timezone and sendAt.
