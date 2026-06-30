"use client";

import { useEffect, useState } from "react";

export default function BookACallEmbed({ calendlyUrl }: { calendlyUrl: string }) {
  // Render only on client so the iframe doesn't ship with the SSR HTML
  // (avoids hydration mismatches and lets us add the embed_domain param).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When the booking completes, Calendly posts a `calendly.event_scheduled`
  // message to this parent window. We redirect the top window to our own
  // /thank-you page ourselves — a clean URL with no Calendly data, and no
  // "You are leaving Calendly" interstitial (which appears when Calendly's own
  // redirect runs inside an iframe). For this to be the only redirect, the
  // Calendly event should be set to its default confirmation page (no redirect).
  useEffect(() => {
    function isCalendlyOrigin(origin: string): boolean {
      try {
        const host = new URL(origin).hostname;
        return host === "calendly.com" || host.endsWith(".calendly.com");
      } catch {
        return false;
      }
    }
    function onMessage(e: MessageEvent) {
      if (!isCalendlyOrigin(e.origin)) return;
      const data = e.data as { event?: string } | null;
      if (data && typeof data === "object" && data.event === "calendly.event_scheduled") {
        window.location.href = "/thank-you";
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!mounted) {
    return (
      <div className="cal-frame cal-skeleton" id="cal" aria-busy="true">
        <span className="cal-skeleton-text">Loading calendar&hellip;</span>
      </div>
    );
  }

  const url = new URL(calendlyUrl);
  // Pass embed params so Calendly renders inline-mode
  url.searchParams.set("embed_domain", window.location.host);
  url.searchParams.set("embed_type", "Inline");
  url.searchParams.set("hide_event_type_details", "0");
  url.searchParams.set("hide_gdpr_banner", "1");
  // Theme params (Calendly supports them on the URL)
  url.searchParams.set("background_color", "ffffff");
  url.searchParams.set("text_color", "14140f");
  url.searchParams.set("primary_color", "0A50C2");

  return (
    <div className="cal-frame" id="cal">
      <iframe
        src={url.toString()}
        width="100%"
        height="100%"
        title="Pick a date & time with Mawra"
        loading="lazy"
        style={{ border: 0, display: "block" }}
      />
    </div>
  );
}
