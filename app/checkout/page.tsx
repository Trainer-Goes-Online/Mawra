import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";
import { getPriceLabel, getAmountPaise } from "../_lib/price";

export function generateMetadata(): Metadata {
  const price = getPriceLabel();
  return {
    title: `Complete Your Booking · ${price} · Mawra Breakthrough Call`,
    description:
      "Secure your 1:1 Breakthrough Call with Mawra. 100% money-back guarantee if the call doesn't deliver value.",
  };
}

export default function CheckoutPage() {
  const price = getPriceLabel();
  const amountPaise = getAmountPaise();
  return (
    <>
      <link rel="stylesheet" href="/checkout.css?v=4" />

      {/* Top secure-checkout strip */}
      <header className="secure-bar">
        <span className="secure-item">
          <span className="ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          Secure Checkout
        </span>
        <span className="sep" aria-hidden="true">·</span>
        <span className="secure-item">
          <span className="ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          256-bit SSL
        </span>
        <span className="sep" aria-hidden="true">·</span>
        <span className="secure-item">
          <span className="ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
          </span>
          100% Money-Back
        </span>
      </header>

      <main className="checkout-page">
        <div className="checkout-wrap">
          {/* Header block */}
          <div className="checkout-head">
            <span className="checkout-eyebrow">
              <span className="dot" aria-hidden="true">✦</span>
              You're One Step Away
            </span>
            <h1 className="checkout-h1">
              Complete Your <span className="gold">Booking</span>
            </h1>
            <p className="checkout-sub">
              Fill in your details below, we'll send the call link and a reminder to your email.
            </p>
          </div>

          {/* Steps 1 + 2 (details form + order-summary accordion) live in the
              client component so the coupon total is shared and the summary can
              collapse / reorder above the form on mobile. */}
          <CheckoutClient priceLabel={price} amountPaise={amountPaise} />

          <p className="checkout-finetext">
            By completing this booking you agree to our <a href="/terms" className="finetext-link">Terms</a> and <a href="/privacy" className="finetext-link">Privacy Policy</a>. We never share your details. Your call slot is confirmed only after payment.
          </p>
        </div>
      </main>
    </>
  );
}
