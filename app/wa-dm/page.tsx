import type { Metadata } from "next";
import Script from "next/script";
import FooterDisclaimer from "../_components/FooterDisclaimer";
import MamReapply from "../_components/MamReapply";
import WaHandoff from "./WaHandoff";
import { buildWaMessage, normaliseNumber, waMeUrl } from "./wa";

export const metadata: Metadata = {
  title: "You're In · Coach Mawra",
  description:
    "You're registered. Send Mawra one quick WhatsApp message and we'll get your free consultation started.",
  // Final funnel page — never index it, and never let it be crawled from ads.
  robots: { index: false, follow: false },
};

// Mawra's WhatsApp number in full international format (digits only is fine —
// anything else is stripped). The message is a template so the copy can be
// reworded from the dashboard; `{name}` is the visitor's first name and
// [square brackets] mark a segment to drop when there's no name.
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
const WA_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ||
  "Hi Mawra[, I'm {name}]. I've just filled in the form on your website and I'd like to get started with my free consultation.";

export default function WaDmPage() {
  // Built on the server so the button is a real, clickable link in the initial
  // HTML — before hydration, and even if JS never runs. The client upgrades it
  // to the desktop URL and folds in the visitor's name.
  const hasNumber = !!normaliseNumber(WA_NUMBER);
  const previewMessage = buildWaMessage(WA_MESSAGE, "");
  const fallbackHref = hasNumber ? waMeUrl(WA_NUMBER, previewMessage) : "";

  return (
    <>
      <MamReapply />
      {/* The .reveal animation lives in funnel.js. If JS is blocked or slow, this
          keeps every section visible instead of leaving a blank page. */}
      <noscript>
        <style>{`.reveal,.reveal-stagger>*{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <main>
        <section className="sec-band-night" style={{ paddingTop: 36, paddingBottom: 40 }}>
          <div className="wrap narrow">

            {/* ── Confirmation hero — deliberately NOT .reveal, so it is painted
                immediately rather than waiting on the reveal observer. ── */}
            <div className="sec-head" style={{ marginBottom: 20 }}>
              <span className="eyebrow-pill" style={{ justifyContent: "center" }}>
                <span className="dot"></span>Registration Confirmed
              </span>
              <h1 className="sec-h2" style={{ marginTop: 20 }}>
                Congratulations &mdash; <span className="accent">you&apos;re in.</span>
              </h1>
              <p
                className="sec-lede"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontStyle: "italic",
                  marginTop: 10,
                }}
              >
                Your place is saved. There&apos;s one last step, and it takes ten seconds.
              </p>
            </div>

            {/* ── The hand-off card ── */}
            <div className="wa-card">
              <div className="wa-card-head">
                <span className="wa-step-chip">Final Step</span>
                <h2 className="wa-card-title">Send Mawra your message on WhatsApp</h2>
                <p className="wa-card-sub">
                  This is how we know you&apos;re ready to start. We&apos;ve already
                  written it for you &mdash; just tap the button and hit send.
                </p>
              </div>

              {/* Renders the message preview + the button together, so the bubble
                  the visitor reads is always the exact text the button sends. */}
              <WaHandoff
                number={WA_NUMBER}
                message={WA_MESSAGE}
                fallbackHref={fallbackHref}
                previewMessage={previewMessage}
              />

              <ul className="wa-trust" aria-label="Reassurance">
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
                  100% free
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
                  No card ever
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
                  Reply in ~24 hrs
                </li>
              </ul>
            </div>

            {/* ── What happens next ── */}
            <div className="sec-head" style={{ marginTop: 56 }}>
              <span className="sec-label">Next Steps</span>
              <h2 className="sec-h2" style={{ fontSize: "clamp(24px, 3.4vw, 34px)" }}>
                What Happens <span className="accent">Next.</span>
              </h2>
            </div>
            <div className="numbox-grid">
              <div className="numbox">
                <div className="numbox-num">1</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">You Send The Message</h3>
                  <p className="numbox-body">
                    Tap the button above and hit send. Nothing moves until you do &mdash;
                    this is the only thing standing between you and your consultation.
                  </p>
                </div>
              </div>
              <div className="numbox">
                <div className="numbox-num">2</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">A Few Honest Questions</h3>
                  <p className="numbox-body">
                    We&apos;ll ask about your weight-loss history, your routine, and
                    what&apos;s really been holding you back. Honesty here is what makes
                    the advice actually fit your life.
                  </p>
                </div>
              </div>
              <div className="numbox">
                <div className="numbox-num">3</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">Your Free Consultation</h3>
                  <p className="numbox-body">
                    A proper conversation about what&apos;s actually been going wrong and
                    what would need to change to lose the weight for good. No cost, no
                    obligation.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Reassurance ── */}
            <div className="compare-callout" style={{ marginTop: 52 }}>
              <p className="callout-lead">You&apos;ve Already Done The Hard Part.</p>
              <p className="callout-punch">
                Mawra has helped 500+ women break the cycle of emotional eating, PCOS,
                thyroid and years of yo-yo dieting.
                <br />
                <em>
                  One message is all that stands between you and the conversation that
                  finally changes it.
                </em>
              </p>
            </div>

            {/* ── Small FAQ — kills the last hesitations before the tap ── */}
            <div className="sec-head" style={{ marginTop: 56 }}>
              <span className="sec-label">Quick Answers</span>
              <h2 className="sec-h2" style={{ fontSize: "clamp(24px, 3.4vw, 34px)" }}>
                Before You <span className="accent">Message.</span>
              </h2>
            </div>
            <div className="wa-faq">
              <details className="wa-faq-item">
                <summary>Is this really free?</summary>
                <p>
                  Yes. There&apos;s no payment at any stage, no card details are taken and
                  nothing is charged. If that ever changes, you&apos;ll be told before
                  anything happens &mdash; never after.
                </p>
              </details>
              <details className="wa-faq-item">
                <summary>What if the button doesn&apos;t open WhatsApp?</summary>
                <p>
                  Make sure WhatsApp is installed, then tap the green button again. On a
                  computer it opens WhatsApp Web &mdash; you may need to scan the QR code
                  once. Still stuck? Reply to your confirmation email and we&apos;ll sort
                  it out.
                </p>
              </details>
              <details className="wa-faq-item">
                <summary>How soon will I hear back?</summary>
                <p>
                  Usually within 24 hours, and we reply in the order messages arrive. The
                  sooner you send yours, the sooner you&apos;re in the queue.
                </p>
              </details>
              <details className="wa-faq-item">
                <summary>Do I have to send the message you wrote?</summary>
                <p>
                  Not at all &mdash; it&apos;s just there to save you typing. Edit it
                  however you like before sending, or write your own from scratch.
                </p>
              </details>
            </div>

            {/* ── Credentials ── */}
            <div className="hero-cred-pills cred-row-standalone" style={{ justifyContent: "center" }}>
              <span className="hero-cred-pill">
                <span className="cpd" aria-hidden="true"></span>TEDx Speaker
              </span>
              <span className="hero-cred-pill">
                <span className="cpd" aria-hidden="true"></span>500+ Transformations
              </span>
              <span className="hero-cred-pill">
                <span className="cpd" aria-hidden="true"></span>60+ Kilos Lost and
                Maintained
              </span>
            </div>

            {/* Secondary escape hatch for anyone who scrolled all the way down. */}
            {hasNumber && (
              <div className="wa-tail">
                <p className="wa-tail-text">Still haven&apos;t sent your message?</p>
                <a className="wa-btn wa-btn-ghost" href={fallbackHref} rel="noopener noreferrer">
                  <svg className="wa-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12.04 2h-.01C6.5 2 2.01 6.49 2.01 12.02c0 1.77.46 3.5 1.34 5.02L2 22l5.1-1.33a9.96 9.96 0 0 0 4.94 1.29h.01c5.52 0 10.01-4.49 10.01-10.02C22.06 6.49 17.56 2 12.04 2m5.83 15.85a8.28 8.28 0 0 1-5.83 2.42h-.01a8.28 8.28 0 0 1-4.22-1.16l-.3-.18-3.13.82.84-3.05-.2-.31a8.25 8.25 0 0 1-1.27-4.41c0-4.58 3.73-8.31 8.32-8.31 2.22 0 4.31.87 5.88 2.44a8.26 8.26 0 0 1 2.43 5.88c0 4.58-3.73 8.31-8.31 8.31Z"
                    />
                  </svg>
                  Open WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="wrap narrow" style={{ marginTop: 56 }}>
            <div className="foot-bottom">
              <span>Coach Mawra · Fat Loss and Identity Transformation</span>
              <span className="foot-ornament" aria-hidden="true">
                ✦
              </span>
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
