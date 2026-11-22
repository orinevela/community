# קהילה מחוברת · Community Connect

A mobile-first Hebrew (RTL) PWA that maps what members of an existing community (usually a WhatsApp group) can help with, and uses AI search to connect a need with the right person. This is the **Phase 1 MVP** from the PRD.

## What's included (MVP scope from the PRD)

| PRD item | Implementation |
|---|---|
| 3.1 Community + invite link | Admin creates a community and gets a `/join/<code>` link plus a "share to WhatsApp" button. The link can be regenerated. |
| 3.1 Quick sign-in | Phone + one-time code (SMS via Twilio; **dev mode** shows the code on screen). One profile per user, multiple communities, and an optional per-community bio addition. |
| 3.2 Profile in under 2 minutes | Photo (resized in the browser), name, city from a list + neighborhood + radius, category chips → sub-category chips + free text, help type, WhatsApp (default) / phone / LinkedIn / email / Instagram, availability presets. |
| 3.3 AI semantic search | Claude ranks community members against a free-text Hebrew request and returns a **match reason** and a personalized **WhatsApp icebreaker** (editable before sending). Uses structured outputs, effort `low` for latency, prompt caching of the community directory, and server-side refusal fallbacks. Phone numbers are never sent to the model. If there's no API key, or the call fails, it falls back to a Hebrew-aware keyword matcher. |
| 4 Privacy | Profiles are visible only to members of the same community. `noindex` meta, `X-Robots-Tag` header, and `robots.txt` disallow all. The service worker doesn't cache data. |
| 4 PWA / mobile-first | Manifest, icons, offline page, safe-area aware bottom sheet. |
| 5 KPIs | Event log + admin panel: profile activation rate, search→contact rate, MAU, contacts in the last 30 days. |

## Run locally

Requires Node ≥ 22.13 (uses the built-in `node:sqlite`).

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY to enable AI search
npm run seed                 # optional: demo community with 10 members
npm run dev
```

Demo: open `http://localhost:3000/join/demo-community`, or sign in as the demo admin with phone `050-0000001`. The code is shown on screen in dev mode.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · SQLite (`node:sqlite`) · `@anthropic-ai/sdk`.

Code map: `src/lib/search.ts` (AI + fallback search), `src/lib/repo.ts` (data access + KPIs), `src/lib/auth.ts` (OTP + sessions), `src/lib/taxonomy.ts` (categories, cities, phone helpers), `src/app/**` (pages + API routes).

## Not yet done / next steps

- Google / Apple sign-in and WhatsApp-based OTP (needs provider credentials).
- Production hosting: SQLite on a single server works for the MVP. For serverless hosting, move to Postgres (e.g. Neon or Supabase).
- Rate limiting on OTP and search endpoints.
- Phase 2/3 from the PRD: WhatsApp listener bot, endorsements, help-request board, cross-community discovery.
