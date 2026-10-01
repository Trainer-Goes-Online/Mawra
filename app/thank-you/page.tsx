import type { Metadata } from "next";
import Script from "next/script";
import FooterDisclaimer from "../_components/FooterDisclaimer";
import MamReapply from "../_components/MamReapply";
import ConfirmationStep from "../_components/ConfirmationStep";
import WhatsAppCta from "../_components/WhatsAppCta";
import { BRAND_NAME } from "../_lib/contact";

const SESSION_NAME = "1:1 Diagnostic Call";

export const metadata: Metadata = {
  title: `WAIT! Confirm Your Call | ${BRAND_NAME}`,
  description:
    "One last step — connect on WhatsApp to confirm your 1:1 diagnostic call with Mawra Ishaque.",
};

export default function ThankYouPage() {
  return (
    <>
      <MamReapply />
      <link rel="stylesheet" href="/confirmation-step.css?v=2" />
      <main>
        <section
          className="sec-band-night cstep-host"
          style={{ paddingTop: 40, paddingBottom: 40 }}
        >
          <div className="wrap narrow">
            {/* Confirmation hero — WhatsApp bridge */}
            <ConfirmationStep sessionName={SESSION_NAME} />

            {/* What happens next */}
            <div className="sec-head reveal" style={{ marginTop: 48 }}>
              <span className="sec-label">Next Steps</span>
              <h2 className="sec-h2" style={{ fontSize: "clamp(24px, 3.4vw, 34px)" }}>What Happens <span className="accent">Next.</span></h2>
            </div>
            <div className="numbox-grid reveal">
              <div className="numbox">
                <div className="numbox-num">1</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">Confirm On WhatsApp</h3>
                  <p className="numbox-body">Message us on WhatsApp to confirm your slot. Once it&apos;s confirmed, your Zoom link and call details land in your inbox — add them to your calendar so the call doesn&apos;t slip.</p>
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
                  <h3 className="numbox-title">Leave With A Plan</h3>
                  <p className="numbox-body">You&apos;ll walk away with clarity on your biggest roadblocks and a personalised roadmap to finally lose the weight and keep it off.</p>
                </div>
              </div>
            </div>

            {/* Reassurance + credentials + the closing WhatsApp step */}
            <div className="ty-closing reveal">
              <div className="compare-callout">
                <p className="callout-lead">This Hour Is Yours. Make It Count.</p>
                <p className="callout-punch">
                  Mawra has helped 500+ women break the cycle of emotional eating, PCOS, thyroid and yo-yo dieting.<br />
                  <em>Show up honest, and this call could be the turning point you&apos;ve been waiting years for.</em>
                </p>
              </div>

              <hr className="ty-closing-rule" />

              <div className="hero-cred-pills ty-closing-pills">
                <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>TEDx Speaker</span>
                <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>500+ Transformations</span>
                <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>60+ Kilos Lost and Maintained</span>
              </div>

              <hr className="ty-closing-rule" />

              <div className="ty-closing-cta">
                <WhatsAppCta label="Click Here To Confirm" />
              </div>
            </div>
          </div>

          <div className="wrap narrow" style={{ marginTop: 48 }}>
            <div className="foot-bottom">
              <span>Coach Mawra · Fat Loss and Identity Transformation</span>
              <span className="foot-ornament" aria-hidden="true">✦</span>
              <span className="foot-links">
                <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/refund">Refund</a>
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
