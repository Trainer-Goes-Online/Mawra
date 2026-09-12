import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";
import { getPriceLabel, getMrpLabel } from "../_lib/price";

export function generateMetadata(): Metadata {
  const price = getPriceLabel();
  return {
    title: `Complete Your Booking · ${price} · 1:1 Diagnostic Call with Mawra Ishaque`,
    description:
      "Book your 1:1 diagnostic call with Mawra Ishaque. Personalised diagnosis, an honest fit check, and your transformation roadmap.",
  };
}

export default function CheckoutPage() {
  const price = getPriceLabel();
  const mrp = getMrpLabel();

  return (
    <>
      <link rel="stylesheet" href="/checkout.css?v=6" />

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
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          Limited Slots
        </span>
      </header>

      <main className="checkout-page">
        <div className="checkout-wrap">
          {/* Everything below — Order Summary → Pricing → Payment Methods →
              Your Details → Checkbox → Pay Button — lives in the client
              component so the price, the consent checkbox and the pay button
              share one piece of state. */}
          <CheckoutClient
            priceLabel={price}
            mrpLabel={mrp}
          />
        </div>
      </main>
    </>
  );
}
