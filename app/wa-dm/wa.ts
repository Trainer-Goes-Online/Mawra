// WhatsApp link + message helpers. Shared by the server component (which builds
// the no-JS fallback link) and the client component (which upgrades it), so both
// produce byte-identical URLs and React never complains about a mismatch.

/** Strip everything but digits — wa.me rejects "+", spaces and dashes. */
export function normaliseNumber(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

/**
 * Fill the message template.
 *
 * Two pieces of syntax, both optional:
 *   {name}  → the visitor's first name.
 *   [ ... ] → a segment that is dropped entirely when the {name} inside it is
 *             empty, so a visitor who arrives without a name doesn't get
 *             "Hi Mawra, I'm . I've just…" with a stranded full stop.
 *
 * e.g. "Hi Mawra[, I'm {name}]. I've just registered."
 *        with a name → "Hi Mawra, I'm Sarah. I've just registered."
 *        without one → "Hi Mawra. I've just registered."
 */
export function buildWaMessage(template: string, name: string): string {
  const clean = (name || "").trim();
  return template
    .replace(/\[([^\[\]]*)\]/g, (_full, segment: string) =>
      segment.includes("{name}") && !clean ? "" : segment
    )
    .replace(/\{name\}/gi, clean)
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Universal link — opens the app on mobile, an interstitial on desktop. */
export function waMeUrl(number: string, text: string): string {
  return `https://wa.me/${normaliseNumber(number)}?text=${encodeURIComponent(text)}`;
}

/** Desktop link — opens WhatsApp Web straight into the chat, no interstitial. */
export function waWebUrl(number: string, text: string): string {
  return `https://web.whatsapp.com/send?phone=${normaliseNumber(
    number
  )}&text=${encodeURIComponent(text)}`;
}
