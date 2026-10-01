import { WhatsAppIcon } from "../_components/Icons";
import { normaliseNumber } from "../wa-dm/wa";

/**
 * The WhatsApp confirm button, and the single place the hand-off URL is built.
 *
 * Shared by the hero, the mobile sticky bar and the closing CTA at the foot of
 * /thank-you, so the three can never drift apart or point at different numbers.
 */

/** What the funnel calls the booking. Change here and the whole screen follows. */
export const SESSION_NAME = "Free Consultation";

/** Mawra's WhatsApp number — never hardcoded, always from the environment. */
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

const CONFIRM_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_CONFIRM_MESSAGE ||
  `Hey, I've booked a call. What's the next step to confirm my ${SESSION_NAME}?`;

/**
 * The confirm URL, or "" when no number is configured.
 * api.whatsapp.com/send resolves to the app on mobile and WhatsApp Web on
 * desktop, so one URL covers both without sniffing the user agent.
 */
export const confirmWaUrl: string = (() => {
  const digits = normaliseNumber(WA_NUMBER);
  if (!digits) return "";
  return (
    `https://api.whatsapp.com/send/?phone=${digits}` +
    `&text=${encodeURIComponent(CONFIRM_MESSAGE)}` +
    `&type=phone_number&app_absent=0`
  );
})();

export default function ConfirmCta({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  if (!confirmWaUrl) {
    return (
      <p className="cfm-cta-missing" role="alert">
        WhatsApp isn&rsquo;t configured yet. Set{" "}
        <code>NEXT_PUBLIC_WHATSAPP_NUMBER</code> to enable this step.
      </p>
    );
  }

  return (
    <a
      className={`cfm-cta ${className}`.trim()}
      href={confirmWaUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <WhatsAppIcon className="cfm-cta-icon" />
      <span className="cfm-cta-label">{label}</span>
    </a>
  );
}
