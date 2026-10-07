# Bill Baba

Receipt intelligence: snap a receipt, let Gemini extract the merchant, totals, tax and line items, then track spending on a dashboard that flags duplicates and unusually large purchases.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (auth + Postgres with RLS) · Google Gemini · Recharts · Zod

---

## Contents

1. [Quick start](#quick-start)
2. [Environment variables](#environment-variables)
3. [Supabase setup](#supabase-setup-optional)
4. [Demo mode](#demo-mode)
5. [Scripts](#scripts)
6. [Project structure — what each file does](#project-structure--what-each-file-does)
7. [How a scan works](#how-a-scan-works)
8. [Deploying](#deploying)
9. [Troubleshooting](#troubleshooting)
10. [Known limitations](#known-limitations)

---

## Quick start

Requires **Node.js 20+** (developed on 22).

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file and fill in GEMINI_API_KEY
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local

# 3. Start the dev server
npm run dev
```

Open http://localhost:3000>.

The only thing you need to scan receipts is a **Gemini API key** (get one at <https://aistudio.google.com/apikey>). Supabase is optional — without it the app runs in [demo mode](#demo-mode).

## Environment variables

Put these in `.env.local` (never commit it; it is git-ignored).

| Variable | Required | Where it runs | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes, for scanning | Server only | Authenticates calls to Gemini. Without it `/api/analyze` returns `503`. |
| `GEMINI_MODEL` | No | Server only | Override the model (default is set in `lib/gemini.ts`). |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Browser + server | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Browser + server | Supabase anon (public) key. |

Supabase is considered "configured" only when **both** Supabase variables are set (`lib/config.ts`).

## Supabase setup (optional)

Do this to get real accounts and cloud-stored receipts.

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the `receipts` table, row-level-security policies (users can only read/write their own rows) and an index.
3. Copy the project URL and anon key from **Project Settings → API** into `.env.local`.
4. Under **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your production URL's `/auth/callback`) to the redirect URLs. This is used by the email-confirmation link.
5. Restart `npm run dev` so the new variables are picked up.

## Demo mode

If the Supabase variables are empty, the sign-in screen shows **Continue in demo mode**:

- No account or password is needed.
- Receipts are stored in the browser's `localStorage` (this browser only).
- The dashboard is seeded with sample receipts on first load.
- `/api/analyze` skips the sign-in check (it is still rate-limited).
- A "Demo mode" badge appears in the header; **Exit demo** signs out.

## Scripts

```bash
npm run dev        # development server with hot reload
npm run typecheck  # tsc --noEmit
npm run build      # production build (type errors fail the build)
npm run start      # serve the production build
```

---

## Project structure — what each file does

```
.
├── app/                        Next.js App Router (routes + global shell)
│   ├── layout.tsx              Root HTML shell, metadata, viewport, Vercel Analytics (prod only)
│   ├── page.tsx                The single page: shows loader → AuthScreen → Dashboard based on auth state
│   ├── error.tsx               Error boundary with a "Try again" button
│   ├── globals.css             Tailwind 4 import, shadcn theme tokens, base styles
│   ├── api/
│   │   └── analyze/route.ts    POST /api/analyze — the receipt-scanning endpoint (see below)
│   └── auth/
│       └── callback/route.ts   GET /auth/callback — exchanges the Supabase email-link code for a session
│
├── components/
│   ├── logo.tsx                Bill Baba logo mark
│   ├── auth-screen.tsx         Sign in / create account form (or the "demo mode" button when Supabase is off)
│   ├── upload-modal.tsx        Scan dialog: pick/drop/camera → analyze → review extracted data → save.
│   │                           Accessible: focus trap, Esc to close, labelled dialog
│   ├── dashboard/
│   │   ├── dashboard.tsx       Main signed-in UI: sidebar, header, Overview / All receipts views, search, toast
│   │   ├── stat-card.tsx       KPI card (total spend, receipts scanned, flagged)
│   │   ├── charts.tsx          Monthly bar chart and category donut chart (Recharts)
│   │   └── receipts-table.tsx  Receipts table with status badges and optional delete button
│   └── ui/button.tsx           shadcn/ui button primitive
│
├── hooks/
│   ├── use-auth.ts             Auth state + signIn / signUp / signOut / enterDemo (Supabase or demo)
│   └── use-receipts.ts         Loads, adds and deletes receipts (Supabase or localStorage); runs anomaly detection on add
│
├── lib/
│   ├── config.ts               `isSupabaseConfigured` flag — decides real auth vs demo mode
│   ├── gemini.ts               Gemini client, extraction prompt, accepted file types / size limit, `analyzeReceipt()`
│   ├── validations.ts          Zod schemas that validate Gemini's output at runtime
│   ├── anomalies.ts            `detectAnomaly()` — flags possible duplicates and unusually high totals
│   ├── stats.ts                `computeStats()` — turns receipts into dashboard totals and chart data
│   ├── format.ts               Currency / date / greeting formatters
│   ├── rate-limit.ts           In-memory sliding-window rate limiter used by the API
│   ├── utils.ts                `cn()` class-name helper (shadcn)
│   └── supabase/
│       ├── client.ts           Browser Supabase client
│       ├── server.ts           Server Supabase client (cookie-based, for route handlers)
│       └── middleware.ts       Session-refresh logic called by proxy.ts
│
├── types/receipt.ts            Shared TypeScript types: ReceiptAnalysis (Gemini output) and Receipt (DB row)
├── supabase/schema.sql         Database table, RLS policies and index
├── proxy.ts                    Next 16 proxy (formerly middleware): refreshes the Supabase session on each request
├── next.config.mjs             Security headers, hides `X-Powered-By`
├── components.json             shadcn/ui CLI configuration
├── postcss.config.mjs          Tailwind PostCSS plugin
├── tsconfig.json               TypeScript config (`@/*` path alias)
├── .env.example                Template for `.env.local`
├── AGENTS.md / CLAUDE.md       Notes for AI coding agents (Next 16 differs from older versions)
├── public/                     Favicons and static images
└── package.json                Dependencies and scripts
```

> `package-lock.json` and `pnpm-lock.yaml` both exist. Pick one package manager and delete the other lockfile.

## How a scan works

1. The user picks, drops or photographs a receipt in `upload-modal.tsx`. The browser checks the type (JPG/PNG/WebP) and size (≤ 10 MB).
2. The image is POSTed as `multipart/form-data` to `/api/analyze`.
3. `app/api/analyze/route.ts`:
   1. requires a signed-in user (skipped in demo mode),
   2. rate-limits to 10 requests/minute per user,
   3. validates size and the file's real type (magic bytes, not just the declared MIME type),
   4. sends the image to Gemini via `lib/gemini.ts`,
   5. validates the JSON reply with Zod (`lib/validations.ts`) and returns it.
4. The modal shows the extracted data with a confidence badge for review.
5. On **Save receipt**, `use-receipts.ts` runs `detectAnomaly()` against existing receipts and stores the row (Supabase or `localStorage`).
6. `dashboard.tsx` recomputes stats with `computeStats()`; flagged receipts show a badge and a toast.

**Anomaly rules** (`lib/anomalies.ts`): *duplicate* = same merchant, date and total as an existing receipt; *unusually high* = more than 3× the median of at least 4 previous receipts in the same currency.

## Deploying

Works on any Node host; Vercel is the simplest.

1. Push the repo and import it into Vercel.
2. Add the environment variables above in the project settings.
3. Add your production URL + `/auth/callback` to Supabase's redirect URLs.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Receipt analysis is not configured" (503) | Set `GEMINI_API_KEY` in `.env.local` and restart the dev server. |
| "We could not read that receipt" (502) | Check the server log. Often the model name is invalid — set `GEMINI_MODEL` to a model your key can use — or the photo is unclear. |
| "Too many requests" (429) | Wait a minute; the limit is 10 scans per minute. |
| Can't sign in / stuck in demo mode | Both `NEXT_PUBLIC_SUPABASE_*` variables must be set; restart after editing `.env.local`. |
| Sign-up email link fails | Add `<your-url>/auth/callback` to Supabase redirect URLs. |
| "Could not load your receipts" | Run `supabase/schema.sql` — the table or policies are missing. |
| Seeing old demo data | Clear `billbaba:demo-receipts` and `billbaba:demo-session` from the browser's localStorage. |

## Known limitations

- The rate limiter is in-memory and per instance; use a shared store (e.g. Redis) for strict limits on serverless hosts.
- Receipt images aren't stored — only the extracted data (`image_url` is reserved for a future Supabase Storage upload).
- Dashboard totals cover the most common currency only; there is no FX conversion.
- HEIC isn't supported; convert to JPEG/PNG/WebP first.
- The UI is light-theme only.
