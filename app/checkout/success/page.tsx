import type { Metadata } from "next";
import Link from "next/link";
import FooterDisclaimer from "../../_components/FooterDisclaimer";

export const metadata: Metadata = {
  title: "Booking Confirmed · Mawra Breakthrough Call",
};

type SP = { p?: string };

export default async function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const paymentId = sp?.p || "";

  return (
    <>
      <link rel="stylesheet" href="/checkout.css" />
      <main className="checkout-page">
        <div className="checkout-wrap" style={{ maxWidth: 600 }}>
          <div className="checkout-head" style={{ marginBottom: 28 }}>
            <span className="checkout-eyebrow">
              <span className="dot" aria-hidden="true">✦</span>
              Payment Received
            </span>
            <h1 className="checkout-h1">
              You're <span className="gold">In.</span>
            </h1>
            <p className="checkout-sub">
              Your 1:1 Breakthrough Call is booked. We've sent a confirmation and call link to your inbox. Watch your WhatsApp for the reminder.
            </p>
          </div>

          <section className="checkout-card" style={{ textAlign: "center" }}>
            <div
              aria-hidden="true"
              style={{
                width: 64, height: 64, borderRadius: "50%",
                margin: "0 auto 20px",
                background: "linear-gradient(180deg, #FFEDB8 0%, #F1D684 30%, #B0884A 70%, #8A6736 100%)",
                display: "grid", placeItems: "center",
                color: "#1a2e10", fontSize: 30,
                boxShadow: "0 0 0 1px rgba(10, 80, 194, 0.35), 0 8px 22px -6px rgba(10, 80, 194, 0.45)",
              }}
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            </div>

            <h2 className="step-title" style={{ marginBottom: 8 }}>Booking Confirmed</h2>
            {paymentId && (
              <p className="order-meta" style={{ margin: 0 }}>
                Payment ID&nbsp;&middot;&nbsp;{paymentId}
              </p>
            )}

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              lineHeight: 1.55,
              color: "rgba(20, 20, 15, 0.74)",
              margin: "22px auto 0",
              maxWidth: 460,
            }}>
              Mawra will personally review your details before the call. Please come open, honest, and ready to talk about what's really going on. That's how we make this hour count.
            </p>

            <div style={{ marginTop: 26 }}>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  padding: "12px 26px",
                  background: "transparent",
                  border: "1px solid rgba(10, 80, 194, 0.4)",
                  borderRadius: 999,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10.5,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#e6cf95",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Back to home
              </Link>
            </div>
          </section>
        </div>

        <FooterDisclaimer />
      </main>
    </>
  );
}
