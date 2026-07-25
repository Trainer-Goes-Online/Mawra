"use client";

// ============================================================================
// Meta CAPI client triggers (browser → our server routes)
// ============================================================================
// The browser Pixel fires ONLY PageView (see app/layout.tsx). These two intent
// events are fired server-side via CAPI; the client's only job is to tell the
// server "it happened" via a small POST. Both are once-per-browser (own flag
// namespace, separate from GA4) and host-gated. The server routes read the
// _fbc/_fbp cookies + IP/UA (and, for Schedule, the hashed tgo_mam cookie) —
// all attached automatically because the beacon URL is same-origin.

import { isTrackingHost, markOnce } from "./ga4";

/**
 * Fire-and-forget same-origin POST. Prefers sendBeacon (guaranteed to send even
 * as the page navigates away), falls back to keepalive fetch. Never throws.
 */
function post(url: string, body: Record<string, unknown>): void {
  try {
    const json = JSON.stringify(body);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([json], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
    void fetch(url, {
      method: "POST",
      body: json,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } catch {
    /* never throw into a handler */
  }
}

/**
 * Standard `AddToCart` via CAPI — the first landing-page CTA click of the
 * browser's lifetime. No PII at click time (server sends fbc/fbp/IP/UA only).
 */
export function fireAddToCartOnce(): void {
  if (!isTrackingHost()) return;
  if (!markOnce("tgo_atc_fired")) return;
  post("/api/meta/add-to-cart", {
    eventSourceUrl: typeof window !== "undefined" ? window.location.href : "",
  });
}

/**
 * Standard `Schedule` + custom `call_booked` via CAPI — fired when the visitor
 * completes the Calendly booking. The server enriches user_data with the hashed
 * identity from the tgo_mam cookie (set at form-fill) for high EMQ.
 */
export function fireScheduleOnce(): void {
  if (!isTrackingHost()) return;
  if (!markOnce("tgo_sched_fired")) return;
  const search = typeof window !== "undefined" ? window.location.search : "";
  const leadId = new URLSearchParams(search).get("lead") || "";
  post("/api/meta/schedule", {
    eventSourceUrl: typeof window !== "undefined" ? window.location.href : "",
    leadId,
  });
}
