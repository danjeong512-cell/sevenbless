# Seven Bless

Daily, concise encouragement via email/SMS at 07:00 America/Vancouver, based on your Google Calendar.

## Setup

1. Copy `.env` and fill:

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

## Notes
- Stores derived signals only; does not store raw event titles/descriptions by default.
- Retries failed delivery with exponential backoff (max 3 attempts).
- Scheduler runs every minute and respects each user's timezone and sendAt.
