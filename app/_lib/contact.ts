// Single source of truth for the client's public contact details.
//
// The WhatsApp number was previously hard-coded in the booking page's help box.
// It now lives here so there is one place to change it, and so it can be
// overridden per-environment without a code edit.

/** Brand name used in page titles and headings. */
export const BRAND_NAME = "Coach Mawra";

/**
 * WhatsApp number in international format, digits only — no "+", spaces or
 * dashes, which the wa.me / api.whatsapp.com endpoints both reject.
 */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, "") ||
  "919900247291";

/**
 * Build a WhatsApp deep link that opens a chat with the client, pre-filled with
 * `message`. Spaces encode as "+" (form encoding), which is what the
 * api.whatsapp.com template expects.
 */
export function whatsappUrl(message: string): string {
  const params = new URLSearchParams({
    phone: WHATSAPP_NUMBER,
    text: message,
    type: "phone_number",
    app_absent: "0",
  });
  return `https://api.whatsapp.com/send/?${params.toString()}`;
}

/** Opening message for someone who has booked but not yet confirmed a call. */
export const CONFIRM_CALL_MESSAGE =
  "Hey, I've booked a call. What's the next step to confirm my call?";

/** Opening message for someone who paid but can't find a slot that works. */
export const NO_SLOT_MESSAGE =
  "Hi! I've paid for my call but can't find a slot that works. Name: | Email: | Phone: | Preferred day & time:";
