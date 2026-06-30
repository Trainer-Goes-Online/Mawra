"use client";

import { useEffect } from "react";
import {
  UTM_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  type Attribution,
} from "../_lib/attribution";

/**
 * Captures UTM / click-id params from the landing URL and persists them
 * (localStorage + cookie) so they survive full-page navigation through the
 * funnel. Also decorates internal funnel links so the params ride along in the
 * URL bar too. Rendered once in the root layout, so it runs on every page.
 *
 * Last-touch wins: a visit that arrives with fresh UTMs overwrites the stored
 * set; a visit without UTMs keeps whatever was captured earlier in the session.
 */
export default function UtmTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      let stored: Attribution = {};
      try {
        stored = JSON.parse(
          localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}"
        );
      } catch {
        stored = {};
      }

      const incoming: Attribution = {};
      let hasUtm = false;
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) {
          incoming[k] = v;
          hasUtm = true;
        }
      }

      let data: Attribution = stored;

      if (hasUtm) {
        // Fresh campaign params on this visit → record them (last-touch).
        data = {
          ...incoming,
          landing_url: window.location.href,
          referrer: document.referrer || stored.referrer || "",
          captured_at: new Date().toISOString(),
        };
      } else if (!stored.captured_at) {
        // Direct / no-UTM first visit → still record the entry point once.
        data = {
          landing_url: window.location.href,
          referrer: document.referrer || "",
          captured_at: new Date().toISOString(),
        };
      }

      const serialized = JSON.stringify(data);
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
      document.cookie =
        `${ATTRIBUTION_STORAGE_KEY}=${encodeURIComponent(serialized)}` +
        `;path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;

      // Decorate internal funnel links so UTMs are visible in the URL on the
      // next page too (data still flows via localStorage regardless).
      const hasAnyUtm = UTM_KEYS.some((k) => data[k]);
      if (hasAnyUtm) {
        document
          .querySelectorAll<HTMLAnchorElement>(
            'a[href^="/checkout"], a[href^="/book-a-call"]'
          )
          .forEach((a) => {
            const href = a.getAttribute("href");
            if (!href) return;
            const [path, existingQs] = href.split("?");
            const merged = new URLSearchParams(existingQs || "");
            for (const k of UTM_KEYS) {
              const v = data[k];
              if (v) merged.set(k, v);
            }
            a.setAttribute("href", `${path}?${merged.toString()}`);
          });
      }
    } catch {
      /* attribution is best-effort; never break the page */
    }
  }, []);

  return null;
}
