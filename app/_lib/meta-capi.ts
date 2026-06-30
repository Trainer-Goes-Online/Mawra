import crypto from "node:crypto";

// ============================================================================
// Meta Conversions API (CAPI) — server-side conversion event
// ============================================================================
// ⚠️ HEALTH & WELLNESS POSTURE (custom-only) — READ THIS:
// This funnel is a health/wellness offer. Per META_HW_PREVENTIVE_SOP.md, the
// server fires the CUSTOM event `sales` ONLY — NOT the standard `Purchase`.
// Meta restricts mid/lower-funnel standard events (Purchase / AddToCart /
// InitiateCheckout / Subscribe / Lead) BY NAME for H&W-classified datasets;
// confirmed custom events with PHI-free payloads keep flowing and optimizing.
// Campaigns must optimize directly on `sales` (no Custom Conversion needed).
//
// To keep `sales` from being filtered as sensitive:
//   • neutral event name (`sales`)
//   • neutral custom_data (value / currency / payment_id only — no content_name
//     or product strings)
//   • host-only event_source_url (path/UTMs stripped before it reaches Meta)
//
// Full hashed user_data (11 signals) + external_id are kept — they are hashed
// PII, not health data, and keep Event Match Quality high.

const CUSTOM_EVENT_NAME = "sales";
const GRAPH_API_VERSION = "v25.0";

/** SHA-256 hex (lowercase). Used for em/ph/fn/ln/ct/country + external_id. */
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Reduce any URL to its origin (scheme + host), dropping path/query. Core Setup
 * strips the path anyway; doing it ourselves avoids leaking UTMs / health-y
 * path segments to Meta. Falls back to the input (or "") if it can't parse.
 */
export function toOrigin(url: string | undefined | null): string {
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

export type MetaCapiParams = {
  pixelId: string;
  accessToken: string;
  paymentId: string; // unique per transaction — used as event_id
  email: string;
  phone: string; // dial code + number, raw
  firstName: string;
  lastName: string;
  city: string;
  countryCode: string; // 2-letter ISO (e.g. "IN")
  eventSourceUrl: string; // already origin-only by the time it gets here
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
  valueRupees: number; // major units (rupees), NOT paise
  currency: string; // ISO 4217, e.g. "INR"
  testEventCode?: string; // optional — Events Manager → Test Events QA
};

/**
 * Fire the single custom `sales` event to Meta CAPI for a verified payment.
 * Throws on a non-2xx response so the caller can log it; the caller must wrap
 * this in try/catch so a CAPI failure never fails a real payment.
 */
export async function sendMetaCapiEvent(params: MetaCapiParams) {
  const normalisedEmail = params.email.trim().toLowerCase();
  const hashedEmail = sha256(normalisedEmail);

  // Phone: digits only (E.164 without +) before hashing.
  const rawPhone = params.phone.replace(/\D/g, "");
  const hashedPhone = rawPhone ? sha256(rawPhone) : undefined;

  // external_id: stable per-USER id = sha256(normalised email). Must match the
  // browser MAM and the Apps Script downstream events for cross-channel linking.
  const externalId = sha256(normalisedEmail);

  const fn = params.firstName.trim().toLowerCase();
  const ln = params.lastName.trim().toLowerCase();
  const ct = params.city.trim().toLowerCase().replace(/[^a-z]/g, "");
  const country = params.countryCode.trim().toLowerCase();

  const hashedFn = fn ? sha256(fn) : undefined;
  const hashedLn = ln ? sha256(ln) : undefined;
  const hashedCt = ct ? sha256(ct) : undefined;
  const hashedCountry = country ? sha256(country) : undefined;

  const event = {
    event_name: CUSTOM_EVENT_NAME,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.paymentId,
    action_source: "website",
    event_source_url: toOrigin(params.eventSourceUrl),
    user_data: {
      em: [hashedEmail],
      ...(hashedPhone && { ph: [hashedPhone] }),
      ...(hashedFn && { fn: [hashedFn] }),
      ...(hashedLn && { ln: [hashedLn] }),
      ...(hashedCt && { ct: [hashedCt] }),
      ...(hashedCountry && { country: [hashedCountry] }),
      external_id: [externalId],
      ...(params.fbc && { fbc: params.fbc }),
      ...(params.fbp && { fbp: params.fbp }),
      ...(params.clientUserAgent && {
        client_user_agent: params.clientUserAgent,
      }),
      ...(params.clientIp && { client_ip_address: params.clientIp }),
    },
    // PHI-free: value / currency / payment_id only. Never add content_name,
    // product, or condition strings — that's what gets a custom event filtered.
    custom_data: {
      currency: params.currency,
      value: params.valueRupees,
      payment_id: params.paymentId,
    },
  };

  const payload: Record<string, unknown> = { data: [event] };
  if (params.testEventCode) payload.test_event_code = params.testEventCode;

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${params.pixelId}/events?access_token=${params.accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta CAPI ${res.status}: ${err}`);
  }
  return res.json();
}
