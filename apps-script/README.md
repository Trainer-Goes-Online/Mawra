# Sreshtha CRM — Apps Script Downstream CAPI Engine

Apps Script bound to the **Sreshtha CRM** Google Sheet that fires three downstream
Meta Conversions API events whenever a sales-team-edited dropdown is set to TRUE:

| Sheet dropdown set to TRUE | Meta CAPI event fired | Carries value? |
|---|---|---|
| `call_booked` (col X) | `CallBooked` | no |
| `call_showed` (col AB) | `CallDone` | no |
| `sale_closed` (col AF) | `HighTicketPurchase` | yes — `contracted_value` from col AG |

The tripwire `sales` event for the ₹97 payment is fired separately by the Next.js
backend at payment-verify time (custom-only, **Health & Wellness posture — no
standard `Purchase`**, see `app/_lib/meta-capi.ts`). This script handles only the
three downstream events. The two systems share the same Meta pixel ID and access
token but never talk to each other directly — the Sheet is the only link.

> **Why these event names (bare, no `Purchase`/`Schedule`/`Lead`)?** They are
> *custom* events. Meta's Health & Wellness restriction blocks mid/lower-funnel
> *standard* events by name; custom events with PHI-free payloads keep flowing.
> Keep the names neutral and never add condition/product strings to `custom_data`.

---

## Files

- **`Code.gs`** — paste into the Apps Script editor (replaces the default file)
- **`appsscript.json`** — paste into the manifest (editor → gear icon → Show appsscript.json)
- **`README.md`** — this file

These files are a template in the repo. They are NOT auto-deployed — copy-paste
them into the Sheet's Apps Script editor (steps below).

---

## Prerequisites

1. **The Sreshtha CRM Google Sheet exists** with the 36-column schema in row 1,
   columns A through AJ:

   ```
   lead_id | created_at | first_name | last_name | email | phone | city | country_code | fbc | fbp | client_ip_address | client_user_agent | external_id | event_source_url | amount | is_test | purchase_event_id | utm_source | utm_medium | utm_campaign | utm_content | utm_term | fbclid | call_booked | booking_time | schedule_capi_event_id | schedule_capi_sent | call_showed | showup_time | showup_capi_event_id | showup_capi_sent | sale_closed | contracted_value | sales_time | htsale_capi_event_id | htsale_capi_sent
   ```

   Columns **A–W** are auto-filled by Pabbly from the verify-payment webhook (these
   map 1:1 to the 23-field payload the backend sends). Columns **X–AJ** are the
   sales-team lifecycle + Apps Script bookkeeping.

2. **The hidden `_Errors` tab exists** with this header in row 1:
   `timestamp | row_number | event_type | http_status | response_body | retry_count`

3. **Column types** are correctly set:
   - **X, AB, AF** (`call_booked` / `call_showed` / `sale_closed`) → **Dropdown**
     (Data → Data validation → Dropdown → values `TRUE` and `FALSE`, exact
     uppercase). **Do NOT use checkboxes** — they pre-populate as FALSE when
     Pabbly creates a new row, indistinguishable from "sales team marked FALSE".
     Dropdowns stay empty until a human picks a value.
   - **Y, AC, AH** (`booking_time` / `showup_time` / `sales_time`) → **Date+time**
   - **AG** (`contracted_value`) → **Plain number** (no separators, no symbol)
   - **Z, AA, AD, AE, AI, AJ** → leave for Apps Script (text + `TRUE`)

4. **Spreadsheet timezone is `Asia/Kolkata`** (File → Settings → Timezone) so the
   datetime columns parse correctly.

5. **Pabbly is writing rows** — at least one real payment has produced a row with
   all 23 auto-fill columns populated (especially `lead_id`, `email`, `fbc`, `fbp`,
   `client_ip_address`, `client_user_agent`, `external_id`).

---

## Deployment (first-time, ~10 minutes)

1. **Open the Sheet's Apps Script editor** — Extensions → Apps Script.
2. **Paste `Code.gs`** — select-all + delete the default, paste this repo's
   `Code.gs`, save. Rename the file to `Code`.
3. **Replace the manifest** — gear icon (Project Settings) → check "Show
   'appsscript.json' manifest file in editor" → open `appsscript.json` → paste
   this repo's manifest → save.
4. **Add Script Properties** — Project Settings → Script Properties → add:

   | Property | Value |
   |---|---|
   | `META_PIXEL_ID` | the Sreshtha pixel/dataset ID (same value as Vercel's `META_PIXEL_ID` / `NEXT_PUBLIC_META_PIXEL_ID`) |
   | `META_CAPI_ACCESS_TOKEN` | same token as Vercel's `META_CAPI_ACCESS_TOKEN` — **secret** |
   | `EVENT_SOURCE_URL_DEFAULT` | the post-payment page **origin only**, e.g. `https://www.thefoodfreedomco.com` (no path — H&W posture) |

   Optional overrides: `MAIN_SHEET_NAME` (default `Sheet1`),
   `META_GRAPH_API_VERSION` (default `v25.0`), `META_TEST_EVENT_CODE` (set only
   while QA-ing against Test Events; remove for production).

5. **Install the trigger** — function dropdown → `setupTriggers` → Run →
   authorize (you'll see "Google hasn't verified this app" → Advanced → Go to
   project (unsafe) → approve scopes). Expect the log:
   `setupTriggers OK — removed 0 old, installed 1 new onSheetEdit trigger`.

6. **Smoke test** — open Meta Events Manager → Sreshtha dataset → Test Events,
   copy the test code into the `META_TEST_EVENT_CODE` script property, then drive
   the dummy row (below) through each event and confirm it arrives with EMQ 8–9+.
   Remove `META_TEST_EVENT_CODE` when done.

---

## How it works (per event)

```
Sales team sets call_booked (col X) → TRUE
  → installable onEdit fires → onSheetEdit(e)
  → matches col X to EVENTS.CALL_BOOKED
  → confirms schedule_capi_sent (AA) is blank (not already sent)
  → fireDownstreamEvent:
      • reads the 36-cell row
      • event_id = `${lead_id}_schedule` (deterministic → idempotent retries)
      • event_time = booking_time (col Y) → Unix seconds
      • user_data = SHA-256(em/ph/fn/ln/ct/country) + external_id
                    + raw fbc/fbp/client_ip_address/client_user_agent
      • custom_data = payment_id + UTM context (HighTicketPurchase also adds
        value = contracted_value, currency = INR)
      • POST graph.facebook.com/v25.0/{pixel}/events  (3 retries, 1s/2s/4s backoff)
  → 200: stamp col Z = event_id, col AA = TRUE
  → non-200: append to _Errors, leave AA blank (row stays retry-able)
```

**Dedup:** per-row `*_capi_sent` flag + deterministic `event_id`. Meta dedupes
same `event_name` + `event_id` within 48h. Each event type has a distinct name,
so they never dedupe against each other.

---

## Operations & troubleshooting

- **Logs:** Apps Script editor → Executions tab. Failures also land in `_Errors`.
- **Dropdown TRUE but nothing fired:** check the trigger is installed (clock icon
  → one `onSheetEdit` On-edit trigger); if Pabbly wrote the cell programmatically,
  set it blank then TRUE again (installable onEdit is reliable for human edits).
- **Low EMQ (5–6 not 9):** an identifier column is blank for that row — check
  `fbc`, `fbp`, `client_ip_address`, `client_user_agent`, `external_id`, `email`,
  `phone` are all populated (Pabbly mapping issue if not).
- **Force a re-fire:** clear the `*_capi_sent` flag (AA/AE/AJ), set the trigger
  dropdown blank then TRUE again.
- **Bulk replay** (after a Meta outage): editor → `replayPendingEvents` → Run.
- **Rotate token:** update `META_CAPI_ACCESS_TOKEN` script property; no redeploy.

---

## Dummy row for smoke testing

Paste into row 2 (adjust timestamps to recent IST values). `external_id` below is
`sha256('test+sreshtha@example.com')`, so it should match the script's hash.

| Col | Value |
|---|---|
| A `lead_id` | `pay_dummyTFF123` |
| B `created_at` | `2026-06-25T14:00:00+05:30` |
| C `first_name` | `Test` |
| D `last_name` | `Lead` |
| E `email` | `test+sreshtha@example.com` |
| F `phone` | `+919999999999` |
| G `city` | `Mumbai` |
| H `country_code` | `IN` |
| I `fbc` | `fb.1.1716200533000.IwAR2_test_fbc` |
| J `fbp` | `fb.1.1716200533000.1234567890` |
| K `client_ip_address` | `203.0.113.42` |
| L `client_user_agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15` |
| M `external_id` | `61f1c... (sha256 of the email above)` |
| N `event_source_url` | `https://www.thefoodfreedomco.com` |
| O `amount` | `97` |
| P `is_test` | `false` |
| Q `purchase_event_id` | `pay_dummyTFF123` |
| R–W (utm_* + fbclid) | any test values |
| X–AJ | leave blank (sales team / script fill these) |

Test sequence:
1. **CallBooked** — set col X → `TRUE`. Expect col Z `pay_dummyTFF123_schedule`,
   col AA `TRUE`, and `CallBooked` in Test Events (EMQ ~9).
2. **CallDone** — fill col AC datetime, set col AB → `TRUE`. Expect `CallDone`.
3. **HighTicketPurchase** — fill col AG `60000`, col AH datetime, set col AF →
   `TRUE`. Expect `HighTicketPurchase` with `value: 60000, currency: INR`.

If a step doesn't fire, check `_Errors` + the Executions log.
