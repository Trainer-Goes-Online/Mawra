# Coach Mawra — UK Free Funnel

A Next.js (App Router) landing-page funnel for **Coach Mawra** (women's fat-loss &
identity transformation), targeted at **UK traffic**. Visitors read the landing
page, open a registration modal (name, email, phone, town/city), and on submit the
lead is saved to a Google Sheet and the visitor is forwarded to `/book-a-call`
to pick a Calendly slot, then on to `/thank-you` once they book.

**Flow:** Ads (UK) → Landing → registration modal → `/api/lead` (writes to Google
Sheet) → `/book-a-call` (Calendly) → `/thank-you`. UTM / click-id params are
captured on the landing page and carried through every step into the sheet. The
name and email are also handed to Calendly as prefill so nothing is retyped.

> **This funnel is completely free.** There is no payment step, no checkout, no
> Razorpay and no qualification / disqualification branch anywhere in it. Every
> valid submission is a lead.

---

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- Plain CSS (`public/*.css`) — no UI framework
- `sharp` for image compression (dev only)

---

## Local setup

Requires **Node 18.18+** (developed on Node 24).

```bash
npm install
# create .env.local and fill in values (see below)
npm run dev                  # http://localhost:3000
```

Build / run production locally:

```bash
npm run build
npm start
```

---

## Environment variables

Create `.env.local` and fill in. Summary of what's required:

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | **Yes** | Mawra's WhatsApp number, full international format (e.g. `447911123456`). Non-digits are stripped. Used by the "can't find a time?" card. |
| `NEXT_PUBLIC_WHATSAPP_MESSAGE` | **Yes** | The message pre-filled in the user's WhatsApp. See the template syntax below. |
| `LEAD_WEBHOOK_URL` | **Yes** | Where leads are POSTed → Google Sheet (see below) |
| `NEXT_PUBLIC_GA_ID` | optional | Google Analytics 4 ID (nothing loads if blank) |
| `NEXT_PUBLIC_CLARITY_ID` | optional | Microsoft Clarity ID |
| `META_PIXEL_ID` / `META_CAPI_ACCESS_TOKEN` | optional | Meta Pixel + Conversions API for FB/IG ads |
| `NEXT_PUBLIC_CALENDLY_URL` | **Yes** | The Calendly event embedded on `/book-a-call`. Without it nobody can book. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | optional | Shown on the "can't find a time?" card. Defaults to transformationsandbeyond@gmail.com. |
| `NEXT_PUBLIC_WHATSAPP_SLOT_MESSAGE` | optional | Pre-filled text for a slot request from that card. |

> After changing env vars, **restart `npm run dev`** (or redeploy). The two
> `NEXT_PUBLIC_WHATSAPP_*` values are inlined at build time, so changing the
> message on Vercel needs a redeploy to take effect.

---

## The booking step (`/book-a-call`)

Embeds Calendly from `NEXT_PUBLIC_CALENDLY_URL`, with the registrant's name and
email prefilled from the form and the UTMs appended so the booking is attributed.
When Calendly posts `event_scheduled`, the embed fires GA4 `call_booked` + the
Meta Schedule CAPI event and forwards to `/thank-you` itself — so keep the
Calendly event on its **default confirmation page** (no custom redirect), or the
visitor gets a "leaving Calendly" interstitial.

Underneath the calendar is a **"Cannot find a time that works for you?"** card
with WhatsApp and email buttons, for anyone whose preferred slot isn't listed.

## The WhatsApp hand-off (`/wa-dm`) — not currently in the funnel

Kept in the repo but nothing links to it. It confirms the registration, then
hands the visitor to WhatsApp:

- **Mobile** → `wa.me/<number>?text=…`, which opens the installed WhatsApp app.
- **Desktop** → `web.whatsapp.com/send?phone=…&text=…`, which opens WhatsApp Web
  with the chat already open. (`wa.me` on desktop shows an extra "Continue to
  Chat" interstitial, so it's skipped.)

**Nothing redirects automatically.** The visitor stays on the page until they tap
the green button, so they actually read the confirmation and the next steps rather
than being thrown straight into WhatsApp. The page is `noindex, nofollow`.

### Message template syntax

To reword the message, edit `NEXT_PUBLIC_WHATSAPP_MESSAGE`. Two bits of syntax:

- `{name}` — the visitor's first name, passed from the registration form as `?fn=`.
- `[ ... ]` — a segment dropped entirely when the `{name}` inside it is empty.

```
Hi Mawra[, I'm {name}]. I've just filled in the form on your website…

  with a name → Hi Mawra, I'm Sarah. I've just filled in the form…
  without one → Hi Mawra. I've just filled in the form…
```

The brackets exist so someone who opens `/wa-dm` directly (no `?fn=`) never gets
a stranded "I'm ." in their message.

### Why this page avoids the scroll-reveal animation

Every other page wraps sections in `.reveal`, which is `opacity: 0` until
`funnel.js` runs. This page deliberately does not: it is the last step of a paid
funnel, and a blank page caused by slow, blocked or failed JS costs a lead. For
the same reason the button's `href` is built on the server, so it is a real
clickable link in the initial HTML rather than something an effect fills in later.

---

## Google Sheet (lead capture) — required

The registration modal POSTs to `/api/lead`, which forwards each lead to
`LEAD_WEBHOOK_URL`. Use either option; both append one row per lead.

**Option A — Google Apps Script (no extra accounts):**
1. Open the CRM Google Sheet → **Extensions → Apps Script**.
2. Paste the contents of [`apps-script/LeadIntake.gs`](apps-script/LeadIntake.gs).
3. **Deploy → New deployment → Web app**: *Execute as: Me*, *Who has access: Anyone*.
4. Copy the `/exec` URL → set it as `LEAD_WEBHOOK_URL`.

**Option B — Pabbly Connect:** create a "Webhook" trigger that writes to the
sheet, and use its URL as `LEAD_WEBHOOK_URL` (or `PABBLY_WEBHOOK_URL`).

Each row contains the full registration plus attribution and Meta match keys:

```
event, product, lead_id, created_at,
first_name, last_name, full_name, email, phone, city, country_code,
fbc, fbp, client_ip_address, client_user_agent, external_id, event_source_url,
landing_url, referrer, is_test,
utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid
```

> **Sheet columns changed.** The old paid/qualifying columns (`profile`,
> `weight_to_lose`, `annual_income`, `investment_level`, `disqualified`,
> `qualified`, `amount`) are no longer sent. Update the Pabbly mapping / sheet
> header before go-live or those columns will sit empty.

---

## Meta events

| Event | When |
|---|---|
| `PageView` | Every page (browser pixel, enriched with hashed identity from the `tgo_mam` cookie) |
| AddToCart (intent) | A landing-page CTA is clicked — i.e. the modal opens. Once per browser. |
| Lead | A registration is submitted (server-side CAPI) |
| QualifiedLead | Also every registration. The old investment question that gated this is gone with the paid funnel, but the event keeps firing so campaigns already optimising against it don't go blind. |

Event names are configurable via the `*_STANDARD_EVENT` / `*_CUSTOM_EVENT` env
vars. `event_id` is stable per email so Meta's 48h window dedups genuine
re-submits by the same person.

---

## Deploy (recommended: Vercel)

1. Push this repo to GitHub.
2. Import it into **Vercel** (auto-detects Next.js).
3. Add all env vars from `.env.local` in **Vercel → Project → Settings → Environment Variables**.
4. Deploy, then attach the custom domain.

---

## Project structure

```
app/
  page.tsx                 Landing page (all sections)
  layout.tsx               <head>, fonts, analytics, Meta pixel, UTM tracker
  _components/
    LeadModal.tsx          Registration modal (opens from any [data-lead] CTA)
    UtmTracker.tsx         Captures UTM/click-id params → localStorage + cookie
    LegalShell.tsx, FooterDisclaimer.tsx
  api/
    lead/route.ts          Receives the registration, writes to the Sheet webhook
    meta/*                 Server-side Meta CAPI helper routes
  book-a-call/             Calendly booking step (+ embed, slot-help card)
  thank-you/               Booking confirmation — the final page of the funnel
  wa-dm/                   WhatsApp hand-off (kept, not in the funnel)
  privacy / terms          Legal pages
  _lib/                    attribution, country list, analytics, meta-capi
public/
  funnel.css               Main stylesheet (versioned via ?v=N in layout.tsx)
  funnel.js                Counters, reveal, sticky CTA, FAQ
  assets/                  Images (results/, reviews/, placeholders, logo)
apps-script/
  LeadIntake.gs            Deployable Google Apps Script for the sheet
```

### Not in the funnel (kept in the repo, unlinked)

`app/wa-dm/` (the WhatsApp hand-off) and `app/disqualified/` are not linked from
anywhere and no CTA routes to them. Delete them freely.

> **CSS cache busting:** `funnel.css` is linked as `?v=N` in `app/layout.tsx`.
> Bump `N` whenever you edit `funnel.css` so browsers fetch the new version.

---

## Still to do before go-live

1. **Set `NEXT_PUBLIC_CALENDLY_URL`** — without it `/book-a-call` shows
   "Booking calendar coming soon" and nobody can book.
2. In Calendly, keep the event confirmation on the **default page** (no custom
   redirect), so the embed's own forward to `/thank-you` is the only one.
3. Set `LEAD_WEBHOOK_URL` (else leads aren't saved) and
   `NEXT_PUBLIC_WHATSAPP_NUMBER` (used by the "can't find a time?" card).
4. Re-map the Pabbly / Sheet columns to the new payload (see above).
5. Review the landing-page copy for UK audience (currency, spelling, claims).
6. Replace the remaining placeholder images (hero, story, logo, favicon).
7. Update the legal pages (support email, business name) — and note UK/GDPR
   consent wording now lives in the modal's consent line.
8. Deploy to Vercel + custom domain.
