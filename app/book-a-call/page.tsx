import type { Metadata } from "next";
import Script from "next/script";
import BookACallEmbed from "./BookACallEmbed";
import FooterDisclaimer from "../_components/FooterDisclaimer";
import MamReapply from "../_components/MamReapply";
import { UTM_KEYS } from "../_lib/attribution";

export const metadata: Metadata = {
  title: "Pick Your Slot · Coach Mawra",
  description:
    "Pick a 60-minute slot for your free assessment call with Coach Mawra.",
};

type SP = { lead?: string } & Partial<Record<(typeof UTM_KEYS)[number], string>>;

export default async function BookACallPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const baseCalendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

  // Forward any UTM params (carried through the funnel) into the Calendly URL so
  // the booking record is attributed to the original campaign too.
  let calendlyUrl = "";
  if (baseCalendlyUrl) {
    try {
      const calUrl = new URL(baseCalendlyUrl);
      for (const k of UTM_KEYS) {
        const v = sp?.[k];
        if (v) calUrl.searchParams.set(k, v);
      }
      calendlyUrl = calUrl.toString();
    } catch {
      calendlyUrl = baseCalendlyUrl;
    }
  }

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
                  <h3 className="numbox-title">A Personalised Transformation Roadmap</h3>
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

            <div className="hero-cred-pills reveal" style={{ justifyContent: "center", marginTop: 52 }}>
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
