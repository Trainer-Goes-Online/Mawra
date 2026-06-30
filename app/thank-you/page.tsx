import type { Metadata } from "next";
import FooterDisclaimer from "../_components/FooterDisclaimer";
import MamReapply from "../_components/MamReapply";

export const metadata: Metadata = {
  title: "You're Confirmed · Coach Mawra",
  description:
    "Your free assessment call with Coach Mawra is confirmed. Check your email for the call link and details.",
};

export default function ThankYouPage() {
  return (
    <>
      <MamReapply />
      <main>
        <section className="sec-band-night" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: 32, paddingBottom: 24 }}>
          <div className="wrap narrow" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <span className="eyebrow-pill" style={{ justifyContent: "center" }}>
              <span className="dot"></span>Booking Confirmed
            </span>

            <h1 className="sec-h2" style={{ marginTop: 20 }}>
              You&apos;re <span className="accent">Confirmed.</span>
            </h1>
            <p className="sec-lede" style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", marginTop: 10 }}>
              Your free assessment call with Coach Mawra is booked.
            </p>

            <p style={{ maxWidth: 520, margin: "22px auto 0", fontFamily: "'Geist', sans-serif", fontSize: 15.5, lineHeight: 1.7, color: "rgba(20,20,15,0.74)" }}>
              The Zoom link and call details are on their way to your inbox — check your
              spam folder if you don&apos;t see them. Come ready to talk honestly about
              what&apos;s really going on; that&apos;s how we make this hour count.
            </p>

            <div style={{ marginTop: 32 }}>
              <a className="cta-big" href="/">
                Back to home
                <span className="arrow">→</span>
              </a>
            </div>
          </div>

          <div className="wrap narrow">
            <div className="foot-bottom">
              <span>Coach Mawra · Fat Loss &amp; Identity Transformation</span>
              <span className="foot-ornament" aria-hidden="true">✦</span>
              <span className="foot-links">
                <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
              </span>
            </div>
            <FooterDisclaimer />
          </div>
        </section>
      </main>
    </>
  );
}
