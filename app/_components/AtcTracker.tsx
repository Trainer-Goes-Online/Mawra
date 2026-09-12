"use client";

import { useEffect } from "react";
import { trackGa4EventOnce } from "../_lib/ga4";
import { fireAddToCartOnce } from "../_lib/meta-client";

/**
 * Fires top-of-funnel intent when any landing-page CTA to /checkout is clicked:
 * GA4 `atc_event` + Meta custom `atc_event` (CAPI), each once per browser,
 * host-gated, non-blocking. Rendered once on the landing page. Uses click
 * delegation so the static CTA markup (`<a href="/checkout">`) stays untouched
 * and the navigation is never blocked.
 */
export default function AtcTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.('a[href^="/checkout"]');
      if (!link) return;
      trackGa4EventOnce("atc_event");
      fireAddToCartOnce();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
