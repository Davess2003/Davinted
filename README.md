# Relove — sustainable fashion marketplace

React + Vite frontend with a small Express backend (Stripe + Supabase).

## Data & persistence (Supabase)

The app runs in one of two modes, decided automatically by whether Supabase keys are present:

- **Local/demo mode** (no keys): data lives in `localStorage` + mock seed data. No login. Great for a quick look.
- **Cloud mode** (keys set): real accounts via **Supabase Auth**, and every listing, order, chat, offer, like and profile is persisted in Postgres through the API. Browsing is public; buying, selling, liking and chatting require signing in.

### One-time database setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates all tables, row-level-security policies, the auto-profile trigger, and seeds the demo catalog. (Safe to re-run.)
3. Copy your keys from **Project Settings → API** into the env files below.

Tables: `profiles`, `listings`, `likes`, `orders`, `order_tracking`, `chats`, `messages`.

Listing photos are downscaled in the browser, then uploaded to a public Supabase **Storage** bucket named `listings` (auto-created by the API on first upload) — only the resulting public URL is stored in the `image_url` column, never raw base64.

> Auth note: Supabase enables email confirmation by default. For quick local testing, turn it off under **Authentication → Providers → Email** so signups log in immediately.

> Architecture: the browser uses Supabase only for **auth** (to get a JWT). All data reads/writes go through the Express API, which verifies the JWT and uses the **service-role** key server-side. The anon key is never trusted for data.

## Account details & gating

Buyers and sellers must complete their **Account Details** (name, contact,
shipping address) before they can buy or sell. The form pops up automatically
the first time they try to check out or list an item, and is also editable any
time from **Dashboard → Account Details**.

Money is handled entirely by Stripe — Relove never stores card or bank details:

- **Buyer payments**: Stripe **Payment Element** at checkout.
- **Seller payouts**: Stripe **Connect** (Express accounts) onboarding.

## Setup

1. Install deps: `npm install`
2. Add your keys (the app runs without them — each integration just stays in its fallback state):
   - `cp .env.example .env` →
     - `VITE_STRIPE_PUBLISHABLE_KEY` (`pk_test_…`)
     - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `cp server/.env.example server/.env` →
     - `STRIPE_SECRET_KEY` (`sk_test_…`)
     - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
3. Run both the web app and the API together:
   - `npm run dev:all`  (or run `npm run dev` and `npm run server` in two terminals)

The frontend runs on http://localhost:5173 and the API on http://localhost:4242
(`VITE_API_BASE` in `.env` if you change the port).

### API endpoints (`server/index.js`, `server/dataRoutes.js`)

Stripe:
- `POST /api/create-payment-intent` — buyer checkout PaymentIntent
- `POST /api/connect/create-account` · `POST /api/connect/onboarding-link` · `GET /api/connect/account-status/:id`

Data (Supabase, JWT-authenticated except where noted):
- `GET/PATCH /api/me` — the signed-in profile (account details, role, wallet)
- `GET /api/listings` (public) · `POST /api/listings` · `DELETE /api/listings/:id`
- `GET /api/likes` · `POST/DELETE /api/likes/:listingId`
- `GET/POST /api/orders` · `PATCH /api/orders/:id/track`
- `GET/POST /api/chats` · `POST /api/chats/:id/messages` · `PATCH /api/chats/:id/offer`
- `GET /api/health` — reports whether Stripe / Supabase keys are configured

> Note: payments currently settle to the platform account. To route funds to
> individual sellers, map each listing's seller to their Connect account id and
> pass it as `destinationAccountId` to `create-payment-intent` (already wired in
> the backend).

---

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
