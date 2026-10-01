import ConfirmCta, { SESSION_NAME, confirmWaUrl } from "./ConfirmCta";

export { SESSION_NAME };

/**
 * Post-booking bridge hero for /thank-you.
 *
 * The Calendly slot is taken, but the funnel treats a booking as unconfirmed
 * until the visitor also reaches us on WhatsApp — this screen is the hand-off
 * that gets them there.
 *
 * Server component: there is no state, and the mobile sticky bar is pure CSS,
 * so nothing here needs to ship JavaScript. Styling lives in
 * /public/confirm-step.css, which the page links (same pattern as
 * /book-a-call). Tokens, type scale and the CTA keyframes all come from
 * funnel.css, which the root layout loads globally.
 */
export default function ConfirmHero({
  avatarSrc = "/assets/insta-profile.jpg",
  avatarAlt = "Coach Mawra",
  sessionName = SESSION_NAME,
}: {
  avatarSrc?: string;
  avatarAlt?: string;
  sessionName?: string;
}) {
  return (
    <section className="cfm" aria-labelledby="cfm-title">
      <div className="cfm-inner">
        <span className="cfm-eyebrow">
          <span className="dot" aria-hidden="true"></span>One Step Remaining
        </span>

        <h1 className="cfm-title" id="cfm-title">
          <span className="cfm-alert">WAIT!</span> Your {sessionName} Has Not Been
          Confirmed Yet&hellip;
        </h1>

        <div className="cfm-avatar-ring">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cfm-avatar" src={avatarSrc} alt={avatarAlt} width="128" height="128" />
        </div>

        <div className="cfm-copy">
          <p>
            You&rsquo;ve just <strong>completed the first step</strong>.
          </p>
          <p>
            Connect on WhatsApp to{" "}
            <strong>get the next steps to confirm your {sessionName}</strong>.
          </p>
        </div>

        {/* Stays in the hero at every width — the sticky bar below is additional,
            never a replacement for it. */}
        <ConfirmCta label="Click Here" className="cfm-cta-hero" />
      </div>

      {/* Mobile-only persistent bar. Visible the instant the page paints — no
          scroll trigger and no entrance delay, unlike the landing page's
          .sticky-cta, which starts off-screen until funnel.js adds .in. */}
      {confirmWaUrl && (
        <div className="cfm-sticky">
          <ConfirmCta label={`Confirm My ${sessionName}`} className="cfm-cta-sticky" />
        </div>
      )}
    </section>
  );
}
