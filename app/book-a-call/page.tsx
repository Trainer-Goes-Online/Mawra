import type { Metadata } from "next";
import Script from "next/script";
import BookACallEmbed from "./BookACallEmbed";
import FooterDisclaimer from "../_components/FooterDisclaimer";
import MamReapply from "../_components/MamReapply";
import { UTM_KEYS } from "../_lib/attribution";

export const metadata: Metadata = {
  title: "Pick Your Slot · Coach Mawra",
  description:
    "Pick a 60-minute slot for your 1:1 diagnostic call with Mawra Ishaque.",
};

type SP = {
  lead?: string;
  /** Razorpay payment id, set by the checkout redirect. */
  p?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
} & Partial<Record<(typeof UTM_KEYS)[number], string>>;

export default async function BookACallPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const baseCalendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

  // Forward UTM params (carried through the funnel) into the Calendly URL so the
  // booking record is attributed to the original campaign, and prefill the
  // invitee fields with what was just entered at checkout so nobody retypes.
  let calendlyUrl = "";
  if (baseCalendlyUrl) {
    try {
      const calUrl = new URL(baseCalendlyUrl);
      for (const k of UTM_KEYS) {
        const v = sp?.[k];
        if (v) calUrl.searchParams.set(k, v);
      }

      const fullName = [sp?.first_name, sp?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (fullName) calUrl.searchParams.set("name", fullName);
      if (sp?.first_name) calUrl.searchParams.set("first_name", sp.first_name);
      if (sp?.last_name) calUrl.searchParams.set("last_name", sp.last_name);
      if (sp?.email) calUrl.searchParams.set("email", sp.email);
      // Calendly reads the invitee phone from this param when the event has a
      // phone field configured; harmless when it doesn't.
      if (sp?.phone) calUrl.searchParams.set("location", sp.phone);
      // The payment id is deliberately NOT pushed into Calendly's UTM params —
      // that would overwrite the real ad attribution. The booking is matched
      // back to the payment on email + phone, which Pabbly already carries.

      calendlyUrl = calUrl.toString();
    } catch {
      calendlyUrl = baseCalendlyUrl;
    }
  }

  return (
    <>
      <MamReapply />
      <link rel="stylesheet" href="/book-a-call.css?v=3" />
      <main>
        <section className="sec-band-night" style={{ paddingTop: 36, paddingBottom: 40 }}>
          <div className="wrap narrow">
            <div className="sec-head reveal" style={{ textAlign: "center" }}>
              <span className="eyebrow-pill" style={{ justifyContent: "center" }}>
                <span className="dot"></span>Payment Received · One Last Step
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
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>Slot Paid &amp; Held</span>
              <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>Pick Any Time That Suits You</span>
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

            {/* Preferred slot not available? — post-payment safety net */}
            <div className="slot-help reveal">
              <span className="eyebrow-pill slot-help-pill">
                <span className="dot" aria-hidden="true"></span>Preferred Slot Not Available?
              </span>
              <h2 className="sec-h2 slot-help-h">
                Cannot Find A Time That <span className="accent">Works For You?</span>
              </h2>
              <p className="slot-help-p">
                You have already paid, and your seat is reserved, so you will not lose it. If none
                of the times above suit you, message us your{" "}
                <strong>name, email, phone number, and your preferred day and time</strong>, and
                we will personally set up your slot.
              </p>
              <div className="slot-help-actions">
                <a
                  className="slot-help-wa"
                  href="https://wa.me/919900247291?text=Hi%21%20I%27ve%20paid%20for%20my%20call%20but%20can%27t%20find%20a%20slot%20that%20works.%20Name%3A%20%7C%20Email%3A%20%7C%20Phone%3A%20%7C%20Preferred%20day%20%26%20time%3A"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.6 15.06L2 22l5.06-1.33A10 10 0 1 0 12 2z" />
                  </svg>
                  Message us on WhatsApp
                </a>
                <a className="slot-help-email" href="mailto:transformationsandbeyond@gmail.com">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                  Email us
                </a>
              </div>
              <p className="slot-help-contact">
                <a href="tel:+919900247291">+91 99002 47291</a>
                <span className="sep" aria-hidden="true">·</span>
                <a href="mailto:transformationsandbeyond@gmail.com">transformationsandbeyond@gmail.com</a>
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

            <div className="hero-cred-pills reveal" style={{ justifyContent: "center", marginTop: "1rem !important" }}>
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
