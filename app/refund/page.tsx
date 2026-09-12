import type { Metadata } from "next";
import LegalShell from "../_components/LegalShell";
import { getPriceLabel } from "../_lib/price";

export const metadata: Metadata = {
  title: "Refund Policy · Coach Mawra",
  description:
    "The refund and cancellation policy for the 1:1 diagnostic call with Mawra Ishaque.",
};

export default function RefundPage() {
  const price = getPriceLabel();

  return (
    <LegalShell title="Refund Policy" updated="September 2026" current="refund">
      <p className="legal-intro">
        This policy covers the {price} booking fee for the 1:1 diagnostic call
        with Mawra Ishaque. It applies to every booking made through this
        website. Payments are processed by Razorpay; we never store your card
        or UPI details.
      </p>

      <section className="legal-section">
        <h2><span className="legal-num">01</span> What the fee is for</h2>
        <p>
          The {price} booking fee reserves a slot in Mawra&apos;s calendar for a
          personalised 1:1 diagnostic call. It is a commitment fee that keeps
          slots for people who genuinely intend to attend. It is not a payment
          for the Identity Transformation Programme, and it creates no
          obligation on either side to continue beyond the call.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">02</span> Rescheduling</h2>
        <p>
          You can reschedule your call free of charge using the link in your
          confirmation email, up to 12 hours before the scheduled time. Your
          booking fee carries over to the new slot. There is no limit on
          genuine rescheduling.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">03</span> Cancellations and refunds</h2>
        <p>
          If you cancel more than 12 hours before your scheduled call, the
          booking fee is refunded in full on request. Write to us from the email
          address you booked with and we will process it.
        </p>
        <p>
          If you do not attend your scheduled call and did not cancel or
          reschedule in time, the booking fee is not refundable. The slot was
          held for you and could not be offered to someone else.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">04</span> If the call does not happen</h2>
        <p>
          If the call cannot go ahead for any reason on our side — a technical
          failure, a scheduling error, or Mawra being unavailable — you will be
          offered a new slot, or a full refund if you prefer. You are never
          charged for a call we could not deliver.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">05</span> How to request a refund</h2>
        <p>
          Email us from the address you used at checkout, with the payment
          reference from your Razorpay receipt. Approved refunds are issued to
          the original payment method. Razorpay typically returns funds within
          5&ndash;7 working days, though your bank may take longer.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">06</span> Honest fit check</h2>
        <p>
          On the call, Mawra will tell you honestly if the Identity
          Transformation Programme is not the right fit for you. That outcome is
          a legitimate result of the diagnostic call, not a failure to deliver,
          and it does not by itself entitle you to a refund of the booking fee.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">07</span> Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The version shown on this
          page at the moment you pay is the one that applies to your booking.
        </p>
      </section>
    </LegalShell>
  );
}
