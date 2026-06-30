# Coach Mawra — Free Assessment Call Funnel

A Next.js (App Router) landing-page funnel for **Coach Mawra** (women's fat-loss &
identity transformation). Visitors read the landing page, open a popup lead form
(name, email, phone + 2 qualifying questions), and on submit the lead is saved to
a Google Sheet and the visitor is forwarded to a Calendly booking page; after they
book a slot they land on the thank-you page.

**Flow:** Landing → popup lead form → `/api/lead` (writes to Google Sheet) →
`/book-a-call` (Calendly) → `/thank-you`. UTM / click-id params are captured on
the landing page and carried through every step into the sheet.

---

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- Plain CSS (`public/*.css`) — no UI framework
- `sharp` for image compression (dev only)
- Razorpay SDK is present but **not used** by the current free funnel (kept for a
  possible future paid offer)

---

## Local setup

Requires **Node 18.18+** (developed on Node 22).

```bash
npm install
cp .env.example .env.local   # then fill in values (see below)
npm run dev                  # http://localhost:3000
```

Build / run production locally:

```bash
npm run build
npm start
```

---

## Environment variables

Copy `.env.example` → `.env.local` and fill in. Summary of what's required:

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CALENDLY_URL` | **Yes** | Mawra's Calendly scheduling URL (booking page) |
| `LEAD_WEBHOOK_URL` | **Yes** | Where leads are POSTed → Google Sheet (see below) |
| `NEXT_PUBLIC_GA_ID` | optional | Google Analytics 4 ID (nothing loads if blank) |
| `NEXT_PUBLIC_CLARITY_ID` | optional | Microsoft Clarity ID |
| `META_PIXEL_ID` / `META_CAPI_ACCESS_TOKEN` | optional | Meta Pixel + Conversions API for FB/IG ads |
| `RAZORPAY_*` | optional | Only for a future paid flow; unused now |

> After changing env vars, **restart `npm run dev`** (or redeploy).

---

## Google Sheet (lead capture) — required

The lead form POSTs to `/api/lead`, which forwards each lead to `LEAD_WEBHOOK_URL`.
Use either option; both append one row per lead.

**Option A — Google Apps Script (no extra accounts):**
1. Open the CRM Google Sheet → **Extensions → Apps Script**.
2. Paste the contents of [`apps-script/LeadIntake.gs`](apps-script/LeadIntake.gs).
3. **Deploy → New deployment → Web app**: *Execute as: Me*, *Who has access: Anyone*.
4. Copy the `/exec` URL → set it as `LEAD_WEBHOOK_URL`.

**Option B — Pabbly Connect:** create a "Webhook" trigger that writes to the
sheet, and use its URL as `LEAD_WEBHOOK_URL` (or `PABBLY_WEBHOOK_URL`).

The row includes: name, email, phone, country, the 2 qualifying questions,
weight goal, and all UTM / click-id fields.

---

## Calendly → Thank-you

`/book-a-call` embeds Calendly using `NEXT_PUBLIC_CALENDLY_URL`. When a visitor
finishes booking, Calendly posts an `event_scheduled` message and the page
redirects to `/thank-you`. In Calendly, keep the event's confirmation set to the
**default page (no custom redirect)** so this is the only redirect.

---

## Replacing placeholder images

Real client testimonial images are already in `public/assets/results/` (before/after)
and `public/assets/reviews/` (written), compressed to WebP.

Still placeholders (grey `PLACEHOLDER` graphics) — drop real files in and update
the reference:

| Spot | File referenced | Where in code |
|---|---|---|
| Hero photo | `public/assets/placeholder.svg` | `app/page.tsx` (`IMG`) |
| Story before/after | `public/assets/placeholder-ba.svg` | `app/page.tsx` (`IMG_BA`) |
| 2 story videos | `public/assets/placeholder.svg` | `app/page.tsx` (Story section) |
| Logo / favicon | `public/assets/logo.png`, `favicon.ico` | `app/layout.tsx`, `app/page.tsx` |

To compress new large images: drop them in `public/assets/...` and run
`node scripts/compress-testimonials.js` (adjust paths inside as needed), or use
any image optimizer to keep them < ~200 KB.

A few client result captions still need real **weights / days / goal** and a
**name for result #3** — edit the `CLIENT_RESULTS` array in `app/page.tsx`.

---

## Deploy (recommended: Vercel)

1. Push this repo to GitHub.
2. Import it into **Vercel** (auto-detects Next.js).
3. Add all env vars from `.env.local` in **Vercel → Project → Settings → Environment Variables**.
4. Deploy, then attach the custom domain.

Any Node host works (`npm run build` + `npm start`), but Vercel gives image/CDN
optimization out of the box.

---

## Project structure

```
app/
  page.tsx                 Landing page (all sections)
  layout.tsx               <head>, fonts, analytics, Meta pixel, UTM tracker
  _components/
    LeadModal.tsx          Popup lead form (opens from any [data-lead] CTA)
    UtmTracker.tsx         Captures UTM/click-id params → localStorage + cookie
    LegalShell.tsx, FooterDisclaimer.tsx
  api/
    lead/route.ts          Receives the lead, writes to the Google Sheet webhook
    razorpay/*             Unused paid-flow routes (kept for the future)
  book-a-call/             Calendly booking page (+ embed)
  thank-you/               Post-booking confirmation
  privacy / terms / refund Legal pages
  _lib/                    attribution, country list, analytics, meta-capi, price
public/
  funnel.css               Main stylesheet (versioned via ?v=N in layout.tsx)
  funnel.js                Counters, reveal, sticky CTA, FAQ
  assets/                  Images (results/, reviews/, placeholders, logo)
apps-script/
  LeadIntake.gs            Deployable Google Apps Script for the sheet
```

> **CSS cache busting:** `funnel.css` is linked as `?v=N` in `app/layout.tsx`.
> Bump `N` whenever you edit `funnel.css` so browsers fetch the new version.

---

## Still to do before go-live

See the in-repo checklist in the latest handoff notes. Highest priority:
1. Set `LEAD_WEBHOOK_URL` (else leads aren't saved) and `NEXT_PUBLIC_CALENDLY_URL`.
2. Replace the remaining placeholder images (hero, story, logo, favicon).
3. Fill the blank client-result captions + result #3 name.
4. Update the legal pages (support email, business name) and review the policy copy.
5. Deploy to Vercel + custom domain.
