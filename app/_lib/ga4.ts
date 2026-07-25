"use client";

// ============================================================================
// GA4 front-end event tracking (native gtag.js)
// ============================================================================
// GA4 is loaded (hardcoded G-… id) in app/layout.tsx. There is NO GTM container,
// so events must be fired with gtag('event', name) directly — a dataLayer.push
// would reach nothing. This module is the single place that does it.
//
// Rules (per the GA4 event brief):
//   • Once per browser, ever — enforced by a localStorage flag per event.
//   • Stamp the flag BEFORE calling gtag (a CTA click often navigates away).
//   • If gtag is absent, return WITHOUT stamping so the event can still fire on
//     a properly configured session (never permanently suppress it).
//   • If localStorage throws (private mode), fire anyway — an extra count beats a
//     lost one.
//   • Host-gated: no-op off the production host so preview / localhost traffic
//     never pollutes the production GA4 property.
//   • Never throw into a click handler.

import { TRACKING_HOST } from "./tracking";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA4_FLAG_PREFIX = "tgo_ga4_";

/** True only on the real production host (never on preview / localhost). */
export function isTrackingHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === TRACKING_HOST;
}

/**
 * Once-per-browser gate backed by localStorage. Returns true the FIRST time it
 * sees `key` (and stamps it), false thereafter. On a storage error it returns
 * true (best-effort: allow the action, accept a possible duplicate). Shared by
 * the GA4 events here and the Meta client triggers in meta-client.ts, each with
 * its own key namespace so a Meta outage never suppresses GA4 and vice-versa.
 */
export function markOnce(key: string): boolean {
  let already = false;
  try {
    already = localStorage.getItem(key) === "1";
  } catch {
    return true; // storage blocked — fire, accept best-effort dedup
  }
  if (already) return false;
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore — flag couldn't be written, still allow */
  }
  return true;
}

/** Undo a markOnce stamp (used to roll back when the guarded action failed). */
export function unmarkOnce(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Fire a GA4 event at most once per browser. No-op off the production host or
 * when gtag isn't present (without stamping the flag in that case).
 */
export function trackGa4EventOnce(event: string): void {
  try {
    if (!isTrackingHost()) return;
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return; // GA4 absent — do NOT stamp, so it can fire later
    }
    if (!markOnce(`${GA4_FLAG_PREFIX}${event}_fired`)) return;
    window.gtag("event", event);
  } catch {
    /* analytics must never throw into a handler */
  }
}
