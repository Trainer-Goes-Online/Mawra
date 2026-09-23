import type { Metadata } from "next";
import Script from "next/script";
import BookACallEmbed from "./BookACallEmbed";
import FooterDisclaimer from "../_components/FooterDisclaimer";
import MamReapply from "../_components/MamReapply";
import { UTM_KEYS } from "../_lib/attribution";
import { normaliseNumber, waMeUrl } from "../wa-dm/wa";

export const metadata: Metadata = {
  title: "Pick Your Slot · Coach Mawra",
  description:
    "Pick a 60-minute slot for your free consultation with Coach Mawra.",
  // Mid-funnel page — reachable only after registering, so keep it out of search.
  robots: { index: false, follow: false },
};

// Used by the "can't find a time" fallback card under the calendar.
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "transformationsandbeyond@gmail.com";
const SLOT_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_SLOT_MESSAGE ||
  "Hi Mawra, I've registered for my free consultation but none of the times on the booking page work for me. Here are my details and the day/time I'd prefer:";

/** Present a raw dial number as "+44 7911 123456" for display only. */
function formatNumber(raw: string): string {
  const d = normaliseNumber(raw);
  if (!d) return "";
  if (d.startsWith("44")) return `+44 ${d.slice(2, 6)} ${d.slice(6)}`.trim();
  if (d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`.trim();
  return `+${d}`;
}

type SP = {
  lead?: string;
  /** Prefill values handed over by the registration modal. */
  nm?: string;
  em?: string;
} & Partial<Record<(typeof UTM_KEYS)[number], string>>;

export default async function BookACallPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const baseCalendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

  // Forward any UTM params (carried through the funnel) into the Calendly URL so
  // the booking record is attributed to the original campaign too, and prefill
  // the name/email the visitor just gave us on the registration form.
  let calendlyUrl = "";
  if (baseCalendlyUrl) {
    try {
      const calUrl = new URL(baseCalendlyUrl);
      for (const k of UTM_KEYS) {
        const v = sp?.[k];
        if (v) calUrl.searchParams.set(k, v);
      }
      if (sp?.nm) calUrl.searchParams.set("name", sp.nm);
      if (sp?.em) calUrl.searchParams.set("email", sp.em);
      calendlyUrl = calUrl.toString();
    } catch {
      calendlyUrl = baseCalendlyUrl;
    }
  }

  const hasWa = !!normaliseNumber(WA_NUMBER);
  const waHref = hasWa ? waMeUrl(WA_NUMBER, SLOT_MESSAGE) : "";
  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Preferred slot request — free consultation"
  )}&body=${encodeURIComponent(`${SLOT_MESSAGE}\n\nName:\nEmail:\nPhone:\nPreferred day and time:\n`)}`;

  return (
    <>
      <MamReapply />
      <link rel="stylesheet" href="/book-a-call.css?v=2" />
      <main>
        <section className="sec-band-night" style={{ paddingTop: 36, paddingBottom: 40 }}>
          <div className="wrap narrow">
            <div className="sec-head reveal" style={{ textAlign: "center" }}>
              <span className="eyebrow-pill" style={{ justifyContent: "center" }}>
                <span className="dot"></span>Details Received · One Last Step
              </span>
              <h1 className="sec-h2" style={{ marginTop: 20 }}>
                Pick Your <span className="accent">Slot.</span>
              </h1>
              <p className="sec-lede" style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: "italic", marginTop: 8 }}>
                60 honest minutes with Mawra — your Zoom link lands in your inbox the moment you book.
              </p>
            </div>

            <div className="hero-cred-pills reveal" style={{ justifyContent: "center", marginTop: 22 }}>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>60 Minutes · 1-on-1</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>100% Free</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>No Card Needed</span>
            </div>

            <div className="reveal" style={{ marginTop: 28 }}>
              {calendlyUrl ? (
                <BookACallEmbed calendlyUrl={calendlyUrl} />
              ) : (
                <p style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif", color: "rgba(71,85,105,0.78)", padding: "40px 0" }}>
                  Booking calendar coming soon. (Set <code>NEXT_PUBLIC_CALENDLY_URL</code> to enable.)
                </p>
              )}
            </div>

            {/* ── Fallback for anyone whose preferred slot isn't listed ── */}
            <div className="slot-help reveal">
              <span className="slot-help-eyebrow">
                <span className="dot" aria-hidden="true"></span>Preferred Slot Not Available?
              </span>
              <h2 className="slot-help-title">
                Cannot Find A Time That <span className="accent">Works For You?</span>
              </h2>
              <p className="slot-help-body">
                Your place is already saved, so you won&apos;t lose it. If none of the
                times above suit you, message us your{" "}
                <strong>name, email, phone number, and your preferred day and time</strong>,
                and we&apos;ll personally set up your slot.
              </p>

              <div className="slot-help-actions">
                {hasWa && (
                  <a className="slot-btn slot-btn-wa" href={waHref} rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35M12.04 2h-.01C6.5 2 2.01 6.49 2.01 12.02c0 1.77.46 3.5 1.34 5.02L2 22l5.1-1.33a9.96 9.96 0 0 0 4.94 1.29h.01c5.52 0 10.01-4.49 10.01-10.02C22.06 6.49 17.56 2 12.04 2m5.83 15.85a8.28 8.28 0 0 1-5.83 2.42h-.01a8.28 8.28 0 0 1-4.22-1.16l-.3-.18-3.13.82.84-3.05-.2-.31a8.25 8.25 0 0 1-1.27-4.41c0-4.58 3.73-8.31 8.32-8.31 2.22 0 4.31.87 5.88 2.44a8.26 8.26 0 0 1 2.43 5.88c0 4.58-3.73 8.31-8.31 8.31Z"
                      />
                    </svg>
                    Message us on WhatsApp
                  </a>
                )}
                <a className="slot-btn slot-btn-mail" href={mailHref}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  Email us
                </a>
              </div>

              <p className="slot-help-contacts">
                {hasWa && (
                  <>
                    <a href={waHref} rel="noopener noreferrer">{formatNumber(WA_NUMBER)}</a>
                    <span className="slot-help-sep" aria-hidden="true">·</span>
                  </>
                )}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </p>
            </div>

            {/* What you'll walk away with */}
            <div className="sec-head reveal" style={{ marginTop: 56 }}>
              <span className="sec-label">On The Call</span>
              <h2 className="sec-h2" style={{ fontSize: "clamp(24px, 3.4vw, 34px)" }}>What You&apos;ll Walk Away <span className="accent">With.</span></h2>
            </div>
            <div className="numbox-grid reveal">
              <div className="numbox">
                <div className="numbox-num">1</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">The Hidden Patterns Keeping You Stuck</h3>
                  <p className="numbox-body">Emotional eating, all-or-nothing thinking, self-sabotage — we&apos;ll uncover what keeps pulling you back into the same cycle.</p>
                </div>
              </div>
              <div className="numbox">
                <div className="numbox-num">2</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">An Honest Look At Your Roadblocks</h3>
                  <p className="numbox-body">Whether it&apos;s PCOS, thyroid, insulin resistance or your relationship with food — Mawra will pinpoint what&apos;s making fat loss harder for you.</p>
                </div>
              </div>
              <div className="numbox">
                <div className="numbox-num">3</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">A Clear Path Forward</h3>
                  <p className="numbox-body">Clarity on exactly what needs to change — in your habits, mindset and identity — to lose the weight and keep it off for life.</p>
                </div>
              </div>
            </div>

            <div className="compare-callout reveal" style={{ marginTop: 48 }}>
              <p className="callout-lead">This Call Is For Women Who Are Ready For Real Change.</p>
              <p className="callout-punch">
                If you&apos;re looking for a quick fix, this probably isn&apos;t for you.<br />
                <em>But if you&apos;re tired of losing the same kilos over and over, and you&apos;re finally ready to understand what it takes to transform for life — you&apos;re in the right place.</em>
              </p>
            </div>

            <div className="hero-cred-pills cred-row-standalone reveal" style={{ justifyContent: "center" }}>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>TEDx Speaker</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>500+ Transformations</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>60+ Kilos Lost and Maintained</span>
            </div>
          </div>

          <div className="wrap narrow" style={{ marginTop: 48 }}>
            <div className="foot-bottom">
              <span>Coach Mawra · Fat Loss and Identity Transformation</span>
              <span className="foot-ornament" aria-hidden="true">✦</span>
              <span className="foot-links">
                <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
              </span>
            </div>
            <FooterDisclaimer />
          </div>
        </section>
      </main>
      <Script src="/funnel.js?v=6" strategy="afterInteractive" />
    </>
  );
}
