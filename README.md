# Mawra Ishaque — Paid Diagnostic Call Funnel

A Next.js (App Router) funnel for **Mawra Ishaque** (women's fat-loss & identity
transformation). Visitors read the landing page, pay a ₹97 booking fee on the
checkout page via Razorpay, then pick a slot on Calendly and land on the
thank-you page.

**Flow:** Ads → Landing (`/`) → Checkout (`/checkout`) → Razorpay →
`/api/razorpay/verify` (signature check + Pabbly webhook) → `/book-a-call`
(Calendly) → `/thank-you`.

UTM / click-id params are captured on the landing page and carried through every
step — into the Razorpay order notes, the Pabbly webhook, and the Calendly URL.

Page copy and layout follow `mawra_checkout_spec.pdf`. The Calendly intake
questions from that spec are documented in
[`docs/calendly-intake-questions.md`](docs/calendly-intake-questions.md) — they
are configured inside Calendly, not in this repo.

## The paid checkout

`/checkout` renders in the spec's scroll order: Order Summary (collapsed
accordion) → Pricing → Payment Methods → Your Details → mandatory checkbox →
Pay button. The pay button is blocked until the checkbox is ticked.

After Razorpay reports success the page shows a blocking overlay while
`/api/razorpay/verify` runs, so nobody closes the tab mid-handoff. That route
verifies the HMAC signature, fetches how the payment was made (UPI / card /
netbanking), fires the Pabbly webhook, and only then does the browser navigate
to `/book-a-call` with the customer's name and email prefilled into Calendly.

Prices come from env, not hard-coded copy: `RAZORPAY_AMOUNT_PAISE` is what is
charged and displayed, `RAZORPAY_MRP_PAISE` is the struck-through price.

---

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- Plain CSS (`public/*.css`) — no UI framework
- `sharp` for image compression (dev only)
- **Razorpay** Node SDK for orders, signature verification and payment lookup

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
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Yes** | Razorpay key id, sent to the browser. `rzp_test_*` marks orders as test |
| `RAZORPAY_KEY_SECRET` | **Yes** | Razorpay secret. Server only — never prefix with `NEXT_PUBLIC_` |
| `RAZORPAY_AMOUNT_PAISE` | **Yes** | Amount charged and displayed. `9700` = ₹97 |
| `RAZORPAY_MRP_PAISE` | optional | Struck-through "was" price. `99900` = ₹999 |
| `RAZORPAY_CURRENCY` | optional | Defaults to `INR` |
| `PABBLY_WEBHOOK_URL` | **Yes** | Fired after a verified payment with the full lead + payment + UTM payload |
| `NEXT_PUBLIC_CALENDLY_URL` | **Yes** | Mawra's Calendly scheduling URL (booking page) |
| `NEXT_PUBLIC_GA_ID` | optional | Google Analytics 4 ID (nothing loads if blank) |
| `NEXT_PUBLIC_CLARITY_ID` | optional | Microsoft Clarity ID |
| `META_PIXEL_ID` / `META_CAPI_ACCESS_TOKEN` | optional | Meta Pixel + Conversions API for FB/IG ads |
| `LEAD_WEBHOOK_URL` | optional | Only used by `/api/lead`, the old free lead-modal path |

### Testing a payment locally

1. Put a `rzp_test_*` key pair in `.env.local` and restart `npm run dev`.
2. Open `/checkout`, fill the form, tick the checkbox, press pay.
3. Use Razorpay's test instruments — for UPI, `success@razorpay`; for cards, any
   Razorpay test card. Real money is never moved on a test key.
4. Confirm the browser lands on `/book-a-call` and that a row arrives in Pabbly.

Test payments are flagged `is_test: "true"` in the Pabbly payload and are skipped
for Meta CAPI, so QA never pollutes the ads algorithm.

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

## Pabbly webhook payload

`/api/razorpay/verify` POSTs JSON to `PABBLY_WEBHOOK_URL` **only after** the
Razorpay HMAC signature verifies. Every key is always present (`""` or `0` when
empty) so the Pabbly column mapping never shifts.

| Group | Fields |
|---|---|
| Event | `event`, `product`, `created_at`, `timestamp` |
| Customer | `first_name`, `last_name`, `full_name`, `email`, `phone`, `city`, `country_code` |
| Payment | `lead_id`, `payment_id`, `order_id`, `purchase_event_id`, `amount` (rupees), `amount_paise`, `currency`, `coupon`, `is_test` |
| How they paid | `payment_method`, `payment_status`, `payment_bank`, `payment_wallet`, `payment_vpa`, `card_network`, `card_last4`, `razorpay_fee`, `razorpay_tax` |
| Ads / attribution | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid` |
| Meta matching | `fbc`, `fbp`, `external_id`, `client_ip_address`, `client_user_agent`, `event_source_url` |
| Journey | `landing_url`, `referrer`, `captured_at` |

A webhook failure is logged but never fails a verified payment — the customer
still reaches the calendar.

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
