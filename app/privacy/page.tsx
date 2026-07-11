import type { Metadata } from "next";
import LegalShell from "../_components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy · Coach Mawra",
  description:
    "How Coach Mawra collects, uses and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="June 2026" current="privacy">
      <p className="legal-intro">
        This website is operated by Coach Mawra. This policy explains what we
        collect when you book a free assessment call and how we use it.
      </p>

      <section className="legal-section">
        <h2><span className="legal-num">01</span> What we collect</h2>
        <ul>
          <li><strong>Your details:</strong> the name, email, phone number and the answers you give in the booking form.</li>
          <li><strong>Booking information:</strong> the slot you select is handled through Calendly, including your time zone.</li>
          <li><strong>Usage data:</strong> basic analytics and marketing identifiers (such as cookies and campaign/UTM tags) to understand how people find and use the site.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">02</span> How we use it</h2>
        <ul>
          <li>To schedule and run your free assessment call.</li>
          <li>To contact you about your booking and how to prepare.</li>
          <li>To measure and improve our marketing, in aggregate.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">03</span> Who we share it with</h2>
        <p>We only share data with the tools that run this funnel:</p>
        <ul>
          <li><strong>Calendly</strong> — to manage scheduling.</li>
          <li><strong>Google Sheets</strong> — to store your enquiry securely.</li>
          <li><strong>Analytics and ad platforms</strong> — for measurement, where enabled.</li>
        </ul>
        <p>We never sell your personal information.</p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">04</span> Your choices</h2>
        <p>
          You can ask us to access, correct or delete your information at any time.
          You can also opt out of marketing cookies via your browser settings.
        </p>
      </section>

      <section className="legal-section">
        <h2><span className="legal-num">05</span> Contact</h2>
        <p>
          For any privacy request, email us at{" "}
          <a href="mailto:hello@coachmawra.com">hello@coachmawra.com</a>.
        </p>
      </section>
    </LegalShell>
  );
}
