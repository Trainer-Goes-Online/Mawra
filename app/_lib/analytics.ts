"use client";

// ============================================================================
// Meta Pixel — Manual Advanced Matching (MAM) helper
// ============================================================================
// Persists hashed user identity to a first-party cookie so EVERY PageView (not
// just the one after form-fill) inherits the user's identity → high Event Match
// Quality. The pixel ID comes from window.__tgoMetaPixelId, which the server
// component app/layout.tsx renders from the single server-side META_PIXEL_ID env
// var (pixel IDs aren't secrets — they're visible in the bundle / Pixel Helper —
// so we avoid a duplicate NEXT_PUBLIC_ copy).
//
// ⚠️ HEALTH & WELLNESS POSTURE (custom-only) — READ THIS:
// This funnel is a health/wellness offer. Per META_HW_PREVENTIVE_SOP.md, we do
// NOT fire a browser-side `Purchase` (or any standard conversion) event — Meta
// restricts standard events by name for H&W datasets, and a browser `Purchase`
// also tends to carry a health-y `content_name`. The ONLY browser-side Meta
// event is `PageView` (fired from layout.tsx) enriched with the MAM below. The
// single conversion signal is the server-side custom event `sales` (see
// app/_lib/meta-capi.ts). If a browser-side conversion pair is ever needed, it
// MUST be the *custom* event (sales) with an eventID matching the CAPI event —
// never `Purchase`.

// First-party cookie holding the hashed MAM values. Named to match the existing
// `tgo_attribution` cookie. 30-day TTL aligns with Meta's attribution windows.
const MAM_COOKIE_NAME = "tgo_mam";
const MAM_COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __tgoMetaPixelId?: string;
  }
}

/** Pixel ID injected by the inline script in app/layout.tsx. "" if not set. */
function getPixelId(): string {
  if (typeof window === "undefined") return "";
  return window.__tgoMetaPixelId || "";
}

/**
 * SHA-256 hex via the Web Crypto API (available over HTTPS and on
 * http://localhost). We pre-hash so the cookie never stores raw PII — Meta
 * detects 64-char hex as already-hashed and uses it verbatim (no double-hash).
 */
async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) return value;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Meta-spec normalise + SHA-256 each field, derive external_id from the email
 * hash, return the matching object ready for `fbq('init', ...)`.
 */
async function buildHashedMatching(data: {
  email?: string;
  phone?: string; // raw, with or without dial code
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string; // 2-letter ISO (e.g. "IN")
}): Promise<Record<string, string>> {
  const normalised: Record<string, string | undefined> = {};
  if (data.email) normalised.em = data.email.trim().toLowerCase();
  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits) normalised.ph = digits;
  }
  if (data.firstName) normalised.fn = data.firstName.trim().toLowerCase();
  if (data.lastName) normalised.ln = data.lastName.trim().toLowerCase();
  if (data.city) {
    const ct = data.city.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (ct) normalised.ct = ct;
  }
  if (data.country) {
    const country = data.country.trim().toLowerCase();
    if (country) normalised.country = country;
  }

  const keys = Object.keys(normalised) as Array<keyof typeof normalised>;
  const hashes = await Promise.all(
    keys.map((k) => sha256Hex(normalised[k] as string))
  );
  const matching: Record<string, string> = {};
  keys.forEach((k, i) => {
    matching[k as string] = hashes[i];
  });

  // external_id: stable per-user identifier. Same hash as `em` so it's
  // deterministic across sessions AND consistent with the server CAPI +
  // Apps Script downstream events (all use sha256(normalised email)).
  if (matching.em) matching.external_id = matching.em;

  return matching;
}

function writeMamCookie(matching: Record<string, string>) {
  if (typeof document === "undefined") return;
  if (Object.keys(matching).length === 0) return;
  const value = encodeURIComponent(JSON.stringify(matching));
  document.cookie = `${MAM_COOKIE_NAME}=${value}; Path=/; Max-Age=${MAM_COOKIE_TTL_SECONDS}; SameSite=Lax`;
}

export function readMamCookie(): Record<string, string> | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${MAM_COOKIE_NAME}=([^;]+)`)
  );
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Re-initialise the Meta Pixel with Manual Advanced Matching. Pass RAW form
 * values — this hashes them client-side, persists the hashes to the tgo_mam
 * cookie, then calls `fbq('init', ...)` so all subsequent pixel events inherit
 * the identity.
 *
 * Call in: (1) form-fill useEffect, (2) payment-success handler (refresh),
 * (3) post-payment pages via reapplyMamFromCookie() (safety net).
 */
export async function setMetaAdvancedMatching(data: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string; // 2-letter ISO
}) {
  const pixelId = getPixelId();
  if (typeof window === "undefined" || !window.fbq || !pixelId) return;
  const matching = await buildHashedMatching(data);
  if (Object.keys(matching).length === 0) return;
  window.fbq("init", pixelId, matching);
  writeMamCookie(matching);
}

/**
 * Re-fire MAM from the persisted cookie. Used on post-payment pages as a safety
 * net in case the inline pixel script raced a route change. `fbq('init')` is
 * idempotent, so re-calling with the same matching is a no-op.
 */
export function reapplyMamFromCookie() {
  const pixelId = getPixelId();
  if (typeof window === "undefined" || !window.fbq || !pixelId) return;
  const matching = readMamCookie();
  if (!matching || Object.keys(matching).length === 0) return;
  window.fbq("init", pixelId, matching);
}
