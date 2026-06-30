// Shared attribution helpers — UTM + click-id capture that flows from the
// landing page through checkout to the post-payment booking page, and into the
// Pabbly webhook. Plain module (no "use client") so both the client tracker and
// the server API routes can import it.

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type Attribution = Partial<Record<UtmKey, string>> & {
  landing_url?: string;
  referrer?: string;
  captured_at?: string;
};

// localStorage + cookie key used to persist attribution across page navigations.
export const ATTRIBUTION_STORAGE_KEY = "tgo_attribution";

/** Build a `utm_source=...&utm_medium=...` query string from an attribution object. */
export function utmQueryString(attr: Attribution | undefined | null): string {
  if (!attr) return "";
  const parts: string[] = [];
  for (const k of UTM_KEYS) {
    const v = attr[k];
    if (v) parts.push(`${k}=${encodeURIComponent(v)}`);
  }
  return parts.join("&");
}
