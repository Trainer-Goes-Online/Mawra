import type { Metadata } from "next";
import LegalShell from "../_components/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service · Coach Mawra",
  description:
    "The terms that apply when you book a free assessment call or use services from Coach Mawra.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="June 2026" current="terms">
      <p className="legal-intro">
        These terms set out the agreement between you and Coach Mawra
        (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) when you use this
        website or book a free assessment call. By using the site you agree to them.
      </p>

      <section className="legal-section">
        <h2><span className="legal-num">01</span> The free assessment call</h2>
        <p>
          The assessment call is a free, no-obligation conversation to understand
          your situation and whether Mawra&apos;s coaching is the right fit. It is
          not a paid service and creates no ongoing commitment.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">02</span> Not medical advice</h2>
        <p>
          Coach Mawra provides coaching and educational guidance — not medical care,
          diagnosis or treatment. Always consult a qualified healthcare professional
          before changing your diet, exercise or lifestyle, especially if you have a
          medical condition such as PCOS, thyroid issues or insulin resistance.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">03</span> No guaranteed results</h2>
        <p>
          Results vary from person to person based on individual factors such as
          consistency, medical history and lifestyle. Any results or testimonials
          shown are not a promise or guarantee of the outcome you will achieve.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">04</span> Your responsibilities</h2>
        <ul>
          <li>Provide accurate details when booking your call.</li>
          <li>Show up on time, or reschedule using the link in your confirmation.</li>
          <li>Treat Mawra and the team with respect during all interactions.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">05</span> Intellectual property</h2>
        <p>
          All content on this website — text, images, videos and frameworks —
          belongs to Coach Mawra and may not be copied or reused without permission.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">06</span> Contact</h2>
        <p>
          Questions about these terms? Email us at{" "}
          <a href="mailto:hello@coachmawra.com">hello@coachmawra.com</a>.
        </p>
      </section>
    </LegalShell>
  );
}
