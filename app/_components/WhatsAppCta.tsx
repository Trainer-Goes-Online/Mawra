import { WhatsAppIcon } from "./Icons";
import { whatsappUrl, CONFIRM_CALL_MESSAGE } from "../_lib/contact";

/**
 * The green WhatsApp call-to-action. Used by the confirmation hero, its sticky
 * mobile bar, and the closing block at the foot of the thank-you page — one
 * component so the number, the pre-filled message and the styling can never
 * drift apart between them.
 */
export default function WhatsAppCta({
  label = "Click Here",
  className = "",
  iconSize = 24,
}: {
  label?: string;
  className?: string;
  iconSize?: number;
}) {
  return (
    <a
      className={`cstep-cta ${className}`.trim()}
      href={whatsappUrl(CONFIRM_CALL_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <WhatsAppIcon size={iconSize} className="cstep-cta-icon" />
      <span>{label}</span>
    </a>
  );
}
