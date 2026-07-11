import type { Metadata } from "next";
import Script from "next/script";
import FooterDisclaimer from "../_components/FooterDisclaimer";
import MamReapply from "../_components/MamReapply";

export const metadata: Metadata = {
  title: "Booking Confirmed · Coach Mawra",
  description:
    "Your free assessment call with Coach Mawra is confirmed. Check your email for the call link and details.",
};

export default function ThankYouPage() {
  return (
    <>
      <MamReapply />
      <main>
        <section className="sec-band-night" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div className="wrap narrow">
            {/* Confirmation hero */}
            <div className="sec-head reveal" style={{ marginBottom: 24 }}>
              <span className="eyebrow-pill" style={{ justifyContent: "center" }}>
                <span className="dot"></span>You&apos;re All Set
              </span>
              <h1 className="sec-h2" style={{ marginTop: 20 }}>
                Booking <span className="accent">Confirmed.</span>
              </h1>
              <p className="sec-lede" style={{ fontFamily: "'Manrope', sans-serif", fontStyle: "italic", marginTop: 10 }}>
                Your free assessment call with Coach Mawra is locked in.
              </p>
              <p style={{ maxWidth: 560, margin: "18px auto 0", fontFamily: "'Manrope', sans-serif", fontSize: 15.5, lineHeight: 1.7, color: "rgba(71,85,105,0.82)", textAlign: "center" }}>
                The Zoom link and call details are on their way to your inbox — check your
                spam folder if you don&apos;t see them in a few minutes.
              </p>
            </div>

            {/* What happens next */}
            <div className="sec-head reveal" style={{ marginTop: 48 }}>
              <span className="sec-label">Next Steps</span>
              <h2 className="sec-h2" style={{ fontSize: "clamp(24px, 3.4vw, 34px)" }}>What Happens <span className="accent">Next.</span></h2>
            </div>
            <div className="numbox-grid reveal">
              <div className="numbox">
                <div className="numbox-num">1</div>
                <div className="numbox-content">
                  <h3 className="numbox-title">Check Your Email</h3>
                  <p className="numbox-body">Your confirmation and Zoom link are in your inbox. Add the call to your calendar so it doesn&apos;t slip.</p>
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

            {/* Reassurance + credentials */}
            <div className="compare-callout reveal" style={{ marginTop: 48 }}>
              <p className="callout-lead">This Hour Is Yours. Make It Count.</p>
              <p className="callout-punch">
                Mawra has helped 500+ women break the cycle of emotional eating, PCOS, thyroid and yo-yo dieting.<br />
                <em>Show up honest, and this call could be the turning point you&apos;ve been waiting years for.</em>
              </p>
            </div>

            <div className="hero-cred-pills reveal" style={{ justifyContent: "center", marginTop: 32 }}>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>TEDx Speaker</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>500+ Transformations</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>60+ Kilos Lost and Maintained</span>
            </div>

            <div className="faq-closing reveal" style={{ marginTop: 36, textAlign: "center" }}>
              <a className="cta-big" href="/">
                Back to home
                <span className="arrow">→</span>
              </a>
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
