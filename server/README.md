# BookFlow API (Express + TypeScript)

The real backend for BookFlow. The live demo on GitHub Pages runs fully in the browser; this server shows how the same features work with an API.

```bash
cp .env.example .env   # everything is optional
npm install
npm run dev            # http://localhost:4000
npm test               # 5 tests, no network needed
```

## Endpoints

| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/public/businesses/:slug` | anyone — business info + services |
| GET | `/api/public/businesses/:slug/slots?serviceId=&date=YYYY-MM-DD` | anyone — free slots |
| POST | `/api/public/businesses/:slug/bookings` | anyone — slot is re-checked on the server (409 if taken) |
| GET | `/api/admin/bookings` | owner, staff |
| POST | `/api/admin/bookings/:id/cancel` | owner, staff |
| POST | `/api/admin/services` | owner (402 when the Free plan limit is reached) |
| POST | `/api/webhooks/stripe` | Stripe (signature verified) → updates the plan |

Admin calls need `Authorization: Bearer <token>`. In dev, `dev-owner-token` and `dev-staff-token` are fake demo tokens (see `src/seed.ts`); in production use a real auth provider.

## Multi-tenancy

The `businessId` always comes from the **session**, never from the URL or the body. Every repository method takes a `businessId`, so a business cannot read or cancel another business's bookings (there is a test for it).

## Email (Resend, free plan)

Without `RESEND_API_KEY` emails are only logged (dry run). With a key, the confirmation is sent immediately and, on Pro, a reminder is scheduled 24h before with Resend's `scheduled_at` — no cron job needed.

## Billing (Stripe test mode)

`src/lib/stripe.ts` verifies the webhook signature and maps subscription events to a plan. Use test mode only (free, no real money).

## Database

`prisma/schema.prisma` has the PostgreSQL model (Business, User, Membership with role, Service, Booking). The demo uses an in-memory store with the same interface (`src/lib/store.ts`). To prevent double booking at the database level you can add an exclusion constraint in a SQL migration:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Booking" ADD CONSTRAINT no_overlap
  EXCLUDE USING gist ("businessId" WITH =, tstzrange("start", "end") WITH &&) WHERE (status = 'confirmed');
```

`src/shared/` contains the same slot / time-zone / plan functions as the frontend (`../src/lib`).
