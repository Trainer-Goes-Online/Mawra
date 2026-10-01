import WhatsAppCta from "./WhatsAppCta";

/**
 * Post-booking bridge screen.
 *
 * The slot is reserved but not yet confirmed — this step pushes the visitor onto
 * WhatsApp, which is where the show-up rate is actually won. Server component:
 * there is no state here, only a link, so it ships no JS.
 *
 * The sticky bar is deliberately NOT given the global `reveal` class — that one
 * starts at opacity 0 and waits for funnel.js to scroll it in, which would delay
 * the CTA. This renders visible on mount.
 */
export default function ConfirmationStep({
  sessionName = "1:1 Diagnostic Call",
  avatarSrc = "/assets/insta-profile.jpg",
  avatarAlt = "Mawra Ishaque",
  ctaLabel = "Click Here",
}: {
  /** What the landing page calls this booking. Kept in one place so the copy stays consistent. */
  sessionName?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  ctaLabel?: string;
}) {
  const cta = <WhatsAppCta label={ctaLabel} />;

  return (
    <>
      <section className="cstep" aria-labelledby="cstep-title">
        <div className="cstep-inner reveal">
          <h1 className="cstep-title" id="cstep-title">
            <span className="cstep-alert">WAIT!</span> Your {sessionName} Has Not
            Been Confirmed Yet&hellip;
          </h1>

          <div className="cstep-avatar-ring">
            <img
              className="cstep-avatar"
              src={avatarSrc}
              alt={avatarAlt}
              width={112}
              height={112}
              loading="eager"
            />
          </div>

          <p className="cstep-body">
            You&apos;ve just <strong>completed the first step</strong>.
          </p>
          <p className="cstep-body">
            Connect on WhatsApp to{" "}
            <strong>get the next steps to confirm your {sessionName}</strong>.
          </p>

          {/* Stays on every breakpoint — the sticky bar is an addition, not a
              replacement. */}
          <div className="cstep-cta-wrap">{cta}</div>
        </div>
      </section>

      {/* Mobile-only persistent CTA. Visible on mount, no scroll trigger. */}
      <div className="cstep-sticky">
        <div className="cstep-sticky-inner">{cta}</div>
      </div>
    </>
  );
}
