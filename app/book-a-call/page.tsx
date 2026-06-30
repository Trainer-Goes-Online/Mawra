import type { Metadata } from "next";
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
      <link rel="stylesheet" href="/book-a-call.css" />
      <main>
        <section className="sec-band-night" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: 32, paddingBottom: 24 }}>
          <div className="wrap narrow" style={{ flex: 1, paddingTop: 8 }}>
            <div className="sec-head" style={{ textAlign: "center" }}>
              <span className="eyebrow-pill" style={{ justifyContent: "center" }}>
                <span className="dot"></span>Details Received · 100% Free
              </span>
              <h1 className="sec-h2" style={{ marginTop: 20 }}>
                Pick Your <span className="accent">Slot.</span>
              </h1>
              <p className="sec-lede" style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", marginTop: 8 }}>
                60 minutes with Mawra — your Zoom link lands in your inbox the moment you book.
              </p>
            </div>

            <div style={{ marginTop: 28 }}>
              {calendlyUrl ? (
                <BookACallEmbed calendlyUrl={calendlyUrl} />
              ) : (
                <p style={{ textAlign: "center", fontFamily: "'Geist', sans-serif", color: "rgba(20,20,15,0.7)", padding: "40px 0" }}>
                  Booking calendar coming soon. (Set <code>NEXT_PUBLIC_CALENDLY_URL</code> to enable.)
                </p>
              )}
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
