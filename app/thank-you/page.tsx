import type { Metadata } from "next";
import Script from "next/script";
import FooterDisclaimer from "../_components/FooterDisclaimer";
import MamReapply from "../_components/MamReapply";
import ConfirmHero from "./ConfirmHero";
import ConfirmCta, { SESSION_NAME } from "./ConfirmCta";

export const metadata: Metadata = {
  // Names the remaining step, so the tab reads as unfinished business.
  title: `WAIT! Confirm Your ${SESSION_NAME} · Coach Mawra`,
  description:
    "Your slot is booked but not yet confirmed. Message Coach Mawra on WhatsApp to lock it in.",
  // Final funnel page — reachable only after booking, so keep it out of search.
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      <MamReapply />
      <link rel="stylesheet" href="/confirm-step.css?v=4" />
      <main>
        <section className="sec-band-night" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div className="wrap narrow">
            {/* Post-booking bridge hero — the slot is taken, but we treat it as
                unconfirmed until the visitor reaches us on WhatsApp. */}
            <ConfirmHero />

            {/* What happens next */}
            <div className="sec-head reveal" style={{ marginTop: 48 }}>
              <span className="sec-label">Next Steps</span>
              <h2 className="sec-h2" style={{ fontSize: "clamp(24px, 3.4vw, 34px)" }}>What Happens <span className="accent">Next.</span></h2>
            </div>
            <div className="numbox-grid reveal">
              <div className="numbox">
                <div className="numbox-num">1</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">Message Us On WhatsApp</h3>
                  <p className="numbox-body">Tap the button above and send the message. Your slot is held, but it isn&apos;t confirmed until we hear from you.</p>
                </div>
              </div>
              <div className="numbox">
                <div className="numbox-num">2</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">Come As You Are</h3>
                  <p className="numbox-body">No prep, no perfect answers. Just be ready to talk honestly about your weight-loss history and what&apos;s really been holding you back.</p>
                </div>
              </div>
              <div className="numbox">
                <div className="numbox-num">3</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">Leave With Real Clarity</h3>
                  <p className="numbox-body">You&apos;ll walk away knowing exactly what has been holding you back, and what would need to change to finally lose the weight and keep it off.</p>
                </div>
              </div>
            </div>

            {/* Reassurance + credentials */}
            <div className="compare-callout reveal" style={{ marginTop: 48 }}>
              <p className="callout-lead">This Hour Is Yours. Make It Count.</p>
              <p className="callout-punch">
                Mawra has helped 500+ women break the cycle of emotional eating, PCOS, thyroid and yo-yo dieting.<br />
                <em>Show up honest, and this call could be the turning point you&apos;ve been waiting years for.</em>
              </p>
            </div>

            <div className="hero-cred-pills cred-row-standalone reveal" style={{ justifyContent: "center" }}>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>TEDx Speaker</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>500+ Transformations</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>60+ Kilos Lost and Maintained</span>
            </div>

            {/* Closing CTA — the same WhatsApp hand-off as the hero, so anyone
                who read to the bottom doesn't have to scroll back up. "Back to
                home" sent them out of the funnel at exactly the wrong moment. */}
            <div className="faq-closing cfm-closing reveal">
              <ConfirmCta label="Click Here To Confirm" className="cfm-cta-closing" />
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
