"use client";

import { useEffect, useState } from "react";
import { buildWaMessage, waMeUrl, waWebUrl } from "./wa";

/**
 * The WhatsApp hand-off button.
 *
 * PROGRESSIVE ENHANCEMENT — this is the last page of a paid-ads funnel, so it
 * must work before (and without) hydration:
 *
 * - The server passes a ready-made `wa.me` URL, which is what renders into the
 *   initial HTML. `wa.me` works on every platform, so the button is a real,
 *   clickable link from first paint. It previously built the URL in an effect,
 *   which left the button href-less — and therefore faded and dead — until
 *   React hydrated.
 * - Once hydrated, the effect *upgrades* the link: desktop swaps to
 *   `web.whatsapp.com/send` (skipping wa.me's "Continue to Chat" interstitial)
 *   and the visitor's first name from `?fn=` is folded into the message.
 *
 * Nothing navigates on its own. The visitor stays on this page until they tap
 * the button, so they get to read the confirmation and the next steps instead of
 * being thrown into WhatsApp mid-sentence.
 */

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(
    navigator.userAgent
  );
}

export default function WaHandoff({
  number,
  message,
  fallbackHref,
  previewMessage,
}: {
  number: string;
  message: string;
  /** Server-built wa.me URL — the href used until (and if) JS upgrades it. */
  fallbackHref: string;
  /** Server-built message with no name — the preview shown until JS upgrades it. */
  previewMessage: string;
}) {
  const [href, setHref] = useState(fallbackHref);
  const [firstName, setFirstName] = useState("");
  // Kept in state next to the href so the bubble the visitor reads is always the
  // exact text the button will send — including their name once JS folds it in.
  const [preview, setPreview] = useState(previewMessage);

  useEffect(() => {
    if (!fallbackHref) return;

    // The registration form passes the first name through as ?fn= so the
    // message can greet them by name.
    let name = "";
    try {
      name = new URLSearchParams(window.location.search).get("fn")?.trim() || "";
    } catch {
      name = "";
    }
    setFirstName(name);

    const text = buildWaMessage(message, name);
    const url = isMobile() ? waMeUrl(number, text) : waWebUrl(number, text);
    setHref(url);
    setPreview(text);
  }, [number, message, fallbackHref]);

  // No number configured — don't render a dead button that goes nowhere.
  if (!fallbackHref) {
    return (
      <div className="wa-error" role="alert">
        WhatsApp isn&apos;t set up yet. Please reply to your confirmation email and
        we&apos;ll pick it up from there.
      </div>
    );
  }

  return (
    <>
      {/* A preview of the exact message, styled like a WhatsApp bubble, so there
          is no mystery about what they're about to send. */}
      <div className="wa-preview" aria-label="Your pre-written message">
        <span className="wa-preview-label">Your message</span>
        <div className="wa-bubble">
          <p>{preview}</p>
          <span className="wa-bubble-meta">
            Ready to send
            <svg viewBox="0 0 16 11" width="15" height="11" aria-hidden="true">
              <path
                fill="currentColor"
                d="M11.07.65 4.86 6.86 2.4 4.4l-.9.9 3.36 3.36L11.97 1.5zm3.4 0L8.26 6.86l-.9-.9 6.2-6.2z"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="wa-action">
        <a className="wa-btn" href={href} rel="noopener noreferrer">
        <svg className="wa-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35M12.04 2h-.01C6.5 2 2.01 6.49 2.01 12.02c0 1.77.46 3.5 1.34 5.02L2 22l5.1-1.33a9.96 9.96 0 0 0 4.94 1.29h.01c5.52 0 10.01-4.49 10.01-10.02C22.06 6.49 17.56 2 12.04 2m5.83 15.85a8.28 8.28 0 0 1-5.83 2.42h-.01a8.28 8.28 0 0 1-4.22-1.16l-.3-.18-3.13.82.84-3.05-.2-.31a8.25 8.25 0 0 1-1.27-4.41c0-4.58 3.73-8.31 8.32-8.31 2.22 0 4.31.87 5.88 2.44a8.26 8.26 0 0 1 2.43 5.88c0 4.58-3.73 8.31-8.31 8.31Z"
          />
        </svg>
          {firstName ? `Send My Message, ${firstName}` : "Send My Message on WhatsApp"}
        </a>
        <p className="wa-hint">
          Opens WhatsApp with your message ready &mdash; you just hit send.
        </p>
      </div>
    </>
  );
}
