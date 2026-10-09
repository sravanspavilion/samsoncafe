# SAMSONS CAFE

A premium, responsive ordering experience built with Next.js App Router, TypeScript, Tailwind CSS, local images, and a server-side Google Apps Script adapter.

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`. Validate a production build with:

```bash
npm run lint
npm run build
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
ADMIN_PASSWORD=choose-a-strong-admin-password
SESSION_SECRET=a-random-string-at-least-32-characters-long
```

`SESSION_SECRET` must be at least 32 characters (an `iron-session` requirement) — the admin routes fail if it is missing. All three variables are server-only; never prefix them with `NEXT_PUBLIC_`.

## Images

Local placeholders live in `public/images/hero`, `public/images/menu`, and `public/images/logo`. They are sourced from the attached Stitch references so the initial visual treatment remains consistent. Replace them with licensed production photography, retaining the same paths or updating the `IMAGE` values from the sheet. Use local, optimized WebP/AVIF where possible.

## Google Apps Script configuration

Add the deployment endpoint to `.env.local` (never prefix it with `NEXT_PUBLIC_`):

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

The browser only calls `/api/menu` and `/api/orders`. Those routes call `src/lib/google-apps-script.ts` server-side, use fresh (`no-store`) menu reads, and fall back to local data when the endpoint is missing or unavailable.

The expected menu sheet columns are: `ITEM ID`, `ITEM NAME`, `PRICE`, `IMAGE`, `STOCK`, `STATUS`, `CATEGORY`.
The expected order sheet columns are: `ORDER ID`, `TIME`, `ITEM ID`, `NAME`, `QTY`, `PRICE`.

Before connecting production data, confirm the existing Apps Script's exact request method, action names, body format, and response JSON. The marked TODOs in `google-apps-script.ts` are the only intended adaptation points.

## Testing checklist

- Add products, increase/decrease quantities, refresh, and confirm the local cart persists.
- Verify stock caps and unavailable products cannot be added.
- Submit an order with the endpoint unset (a generated order ID still proves the UI flow).
- Add the Apps Script endpoint and verify menu reads and order writes against a test spreadsheet.
- Review desktop, tablet, and mobile layouts; keyboard focus; and empty/error states.

## Deployment

Deploy to Vercel by importing the repository, setting the environment variables below in the project's Environment Variables settings, and using the default build command (`npm run build`):

- `GOOGLE_APPS_SCRIPT_URL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET` (at least 32 characters)

These are server-only; do not prefix them with `NEXT_PUBLIC_`.

## Admin authentication

`/admin` and `/api/admin/*` are protected by a password-based session (`iron-session`) enforced in `src/proxy.ts`. Unauthenticated requests are redirected to `/admin/login`, and the admin entry point is intentionally hidden from the public site navigation.

Set `ADMIN_PASSWORD` and `SESSION_SECRET` to enable it. Before a public launch, replace the shared password with per-user accounts and rotate `SESSION_SECRET`.
