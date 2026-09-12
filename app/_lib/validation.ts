// Checkout form validation — plain module so the rules live in one place and
// read the same on every field. The checkout renders these messages inline and
// the form carries `noValidate`, so the browser's own tooltips never appear.

export type FieldName =
  | "first_name"
  | "last_name"
  | "email"
  | "phone"
  | "town";

/** Per-country phone rules. Anything not listed falls back to 6–15 digits. */
type PhoneRule = { min: number; max: number; startsWith?: RegExp; example?: string };

const PHONE_RULES: Record<string, PhoneRule> = {
  IN: { min: 10, max: 10, startsWith: /^[6-9]/, example: "9876543210" },
  US: { min: 10, max: 10, example: "2015550123" },
  CA: { min: 10, max: 10, example: "4165550123" },
  GB: { min: 9, max: 11, example: "7400123456" },
  AE: { min: 8, max: 9, example: "501234567" },
  AU: { min: 9, max: 9, example: "412345678" },
  SG: { min: 8, max: 8, example: "81234567" },
  SA: { min: 9, max: 9, example: "512345678" },
  QA: { min: 8, max: 8, example: "33123456" },
  KW: { min: 8, max: 8, example: "51234567" },
  OM: { min: 8, max: 8, example: "91234567" },
  BH: { min: 8, max: 8, example: "36123456" },
  MY: { min: 9, max: 10, example: "123456789" },
  NZ: { min: 8, max: 10, example: "211234567" },
  ZA: { min: 9, max: 9, example: "821234567" },
  PK: { min: 10, max: 10, example: "3001234567" },
  BD: { min: 10, max: 10, example: "1712345678" },
  LK: { min: 9, max: 9, example: "712345678" },
  NP: { min: 10, max: 10, example: "9812345678" },
};

/** Digits only — strips spaces, dashes, brackets and a leading zero. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "").replace(/^0+/, "");
}

// Letters from any script, plus space, apostrophe, hyphen and period. Covers
// "O'Brien", "Jean-Luc" and non-Latin names without allowing digits or symbols.
const NAME_OK = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;

// Deliberately pragmatic: one @, a dot in the domain, no spaces. Strict RFC
// regexes reject addresses that work, which costs conversions.
const EMAIL_OK = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

function nameError(value: string, label: string): string | null {
  const v = value.trim();
  if (!v) return `Please enter your ${label}.`;
  if (v.length < 2) return `That ${label} looks too short.`;
  if (v.length > 50) return `That ${label} is too long.`;
  if (/\d/.test(v)) return `${capitalize(label)} can't contain numbers.`;
  if (!NAME_OK.test(v)) return `Please use letters only in your ${label}.`;
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Validate one field. Returns an error message, or null when the value is fine.
 * `countryIso` is only read for `phone`.
 */
export function validateField(
  field: FieldName,
  value: string,
  countryIso = "IN"
): string | null {
  switch (field) {
    case "first_name":
      return nameError(value, "first name");

    case "last_name":
      return nameError(value, "last name");

    case "email": {
      const v = value.trim();
      if (!v) return "Please enter your email address.";
      if (v.length > 254) return "That email address is too long.";
      if (!EMAIL_OK.test(v))
        return "That doesn't look like a valid email — check for typos.";
      return null;
    }

    case "phone": {
      const raw = value.trim();
      if (!raw) return "Please enter your phone number.";
      if (/[a-zA-Z]/.test(raw)) return "Phone number can only contain digits.";
      const digits = normalizePhone(raw);
      if (!digits) return "Please enter your phone number.";

      const rule = PHONE_RULES[countryIso] || { min: 6, max: 15 };
      if (digits.length < rule.min) {
        return rule.min === rule.max
          ? `This number needs ${rule.min} digits — you've entered ${digits.length}.`
          : `This number is too short — it needs at least ${rule.min} digits.`;
      }
      if (digits.length > rule.max) {
        return rule.min === rule.max
          ? `This number needs ${rule.max} digits — you've entered ${digits.length}.`
          : `This number is too long — it can have at most ${rule.max} digits.`;
      }
      if (rule.startsWith && !rule.startsWith.test(digits)) {
        return `Indian mobile numbers start with 6, 7, 8 or 9${
          rule.example ? ` — e.g. ${rule.example}` : ""
        }.`;
      }
      return null;
    }

    case "town": {
      const v = value.trim();
      if (!v) return "Please enter your town or city.";
      if (v.length < 2) return "That town or city name looks too short.";
      if (v.length > 60) return "That town or city name is too long.";
      if (/\d/.test(v)) return "Town or city can't contain numbers.";
      if (!NAME_OK.test(v)) return "Please use letters only.";
      return null;
    }

    default:
      return null;
  }
}

/** The placeholder digits to show for a country, e.g. "9876543210" for IN. */
export function phonePlaceholder(countryIso: string): string {
  return PHONE_RULES[countryIso]?.example || "612345678";
}

/** Max digits a country's number can have — used to cap typing. */
export function phoneMaxDigits(countryIso: string): number {
  return PHONE_RULES[countryIso]?.max || 15;
}
