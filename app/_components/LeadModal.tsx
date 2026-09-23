"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import {
  UTM_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  type Attribution,
} from "../_lib/attribution";
import { setMetaAdvancedMatching } from "../_lib/analytics";
import { trackGa4EventOnce } from "../_lib/ga4";
import { fireAddToCartOnce } from "../_lib/meta-client";
import { COUNTRIES, flagEmoji } from "../_lib/country";
import ThemedSelect, { type ThemedOption } from "./ThemedSelect";

// Country dial-code options (with flag icons). UK first — this funnel runs on
// UK-targeted ads — then the rest alphabetically, so a +44 visitor never has to
// scroll to find their own code.
const UK_ISO = "GB";
const COUNTRY_OPTIONS: ThemedOption[] = [
  ...COUNTRIES.filter((c) => c.iso === UK_ISO),
  ...COUNTRIES.filter((c) => c.iso !== UK_ISO),
].map((c) => ({
  value: c.iso,
  label: `${flagEmoji(c.iso)}  ${c.name} · ${c.dial}`,
  short: `${flagEmoji(c.iso)} ${c.dial}`,
}));

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_iso: string;
  city: string;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country_iso: UK_ISO,
  city: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9]{6,15}$/;

/**
 * Validate the whole form at once (single-screen — there are no steps to gate).
 * Returns the first problem as `{ field, message }` so the offending input can
 * be highlighted and focused, or null when everything is good.
 */
function validate(form: FormState): { field: keyof FormState; message: string } | null {
  if (!form.first_name.trim())
    return { field: "first_name", message: "Please enter your first name." };
  if (!form.last_name.trim())
    return { field: "last_name", message: "Please enter your last name." };
  if (!form.email.trim())
    return { field: "email", message: "Please enter your email address." };
  if (!EMAIL_RE.test(form.email.trim()))
    return { field: "email", message: "Enter a valid email address." };
  if (!form.country_iso)
    return { field: "country_iso", message: "Select your country." };
  if (!form.phone.trim())
    return { field: "phone", message: "Please enter your phone number." };
  if (!PHONE_RE.test(form.phone.trim()))
    return { field: "phone", message: "Enter a valid phone number (digits only)." };
  if (!form.city.trim())
    return { field: "city", message: "Please enter your town or city." };
  return null;
}

/**
 * Free-funnel registration — a single-screen modal. Mounted once on the landing
 * page; any element with a `data-lead` attribute (the CTAs) opens it via click
 * delegation.
 *
 * On submit the lead is written to the CRM webhook (via /api/lead) along with
 * its UTM / Meta attribution, then the visitor is forwarded to /book-a-call to
 * pick a Calendly slot, and on to /thank-you once they book.
 *
 * There is no payment step, no qualification questions and no disqualify branch
 * anywhere in this funnel — every completed registration is a lead.
 */
export default function LeadModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<keyof FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  // Attribution kept in state so the UTMs render as hidden <input>s in the form.
  const [attribution, setAttribution] = useState<Attribution>({});

  // Capture attribution (landing-page UTMs from localStorage + current URL).
  useEffect(() => {
    try {
      let stored: Attribution = {};
      try {
        stored = JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}");
      } catch {
        stored = {};
      }
      const params = new URLSearchParams(window.location.search);
      const merged: Attribution = { ...stored };
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) merged[k] = v;
      }
      setAttribution(merged);
    } catch {
      /* best-effort */
    }
  }, []);

  // Open the modal when any [data-lead] CTA is clicked (event delegation).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const trigger = target?.closest?.("[data-lead]");
      if (trigger) {
        e.preventDefault();
        // Any landing-page CTA counts as top-of-funnel intent. Fire GA4
        // add_to_cart + the Meta intent event (CAPI) — each once per browser,
        // host-gated, non-blocking.
        trackGa4EventOnce("add_to_cart");
        fireAddToCartOnce();
        setError(null);
        setErrorField(null);
        setOpen(true);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Lock body scroll + ESC to close while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus the first field when the modal opens.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => firstInputRef.current?.focus());
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) {
      setError(null);
      setErrorField(null);
    }
  }

  async function submitLead(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const problem = validate(form);
    if (problem) {
      setError(problem.message);
      setErrorField(problem.field);
      // Put the cursor on the field that failed.
      document
        .querySelector<HTMLInputElement>(`[data-field="${problem.field}"] input`)
        ?.focus();
      return;
    }

    // GA4 registration_complete = the form was completed and submitted.
    trackGa4EventOnce("registration_complete");
    setSubmitting(true);
    setError(null);
    setErrorField(null);

    try {
      const dial = COUNTRIES.find((c) => c.iso === form.country_iso)?.dial || "+44";

      // Enrich the Meta pixel with hashed identity (advanced matching). This
      // also writes the tgo_mam cookie later events read.
      void setMetaAdvancedMatching({
        email: form.email,
        phone: `${dial}${form.phone}`,
        firstName: form.first_name,
        lastName: form.last_name,
        city: form.city,
        country: form.country_iso,
      });

      // Every completed submission posts to /api/lead, which writes the webhook
      // row (Pabbly) and fires the CAPI events. Duplicate protection lives
      // server-side: the Meta event_id is stable per email, so Meta's 48h window
      // collapses a true re-submit by the same person while a different email is
      // correctly counted as a new lead. A double-click can't reach here either —
      // this returns early while `submitting` is true.
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          country_code: dial,
          attribution,
          eventSourceUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      const leadId: string = data.leadId || "";
      try {
        localStorage.setItem("tgo_lead_id", leadId);
      } catch {
        /* ignore */
      }

      // Forward all landing-page URL params (+ any stored UTMs) so attribution
      // rides through to the booking page and on into /thank-you.
      const forward = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      for (const k of UTM_KEYS) {
        const v = attribution[k];
        if (v && !forward.get(k)) forward.set(k, v);
      }
      forward.set("lead", leadId);
      forward.set("fn", form.first_name.trim());
      // Handed to Calendly as prefill so the visitor doesn't retype what they
      // just gave us — retyping on the booking step is where bookings get lost.
      forward.set("nm", `${form.first_name} ${form.last_name}`.trim());
      forward.set("em", form.email.trim());
      window.location.href = `/book-a-call?${forward.toString()}`;
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className={`lead-modal${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="lead-modal-backdrop" onClick={() => setOpen(false)} />
      <div
        className="lead-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Register for your free consultation"
      >
        <button
          type="button"
          className="lead-modal-close"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          &times;
        </button>

        <div className="lead-modal-head">
          <span className="lead-eyebrow">
            <span className="dot" aria-hidden="true">
              ●
            </span>
            100% Free · No Card Needed
          </span>
          <h2 className="lead-title">
            Let&apos;s get you <span className="gold">started.</span>
          </h2>
          <p className="lead-sub">
            Fill this in and we&apos;ll continue on WhatsApp — it takes less than a
            minute.
          </p>
        </div>

        <form className="lead-form" onSubmit={submitLead} noValidate>
          {/* UTM / click-id attribution — hidden fields carried with the lead. */}
          {UTM_KEYS.map((k) => (
            <input key={k} type="hidden" name={k} value={attribution[k] || ""} readOnly />
          ))}
          <input type="hidden" name="landing_url" value={attribution.landing_url || ""} readOnly />
          <input type="hidden" name="referrer" value={attribution.referrer || ""} readOnly />

          <div className="lead-grid">
            <div
              className={`lead-field${errorField === "first_name" ? " has-error" : ""}`}
              data-field="first_name"
            >
              <label htmlFor="lead_first">
                First Name <span className="req">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="lead_first"
                name="first_name"
                type="text"
                placeholder="First name"
                autoComplete="given-name"
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
            </div>

            <div
              className={`lead-field${errorField === "last_name" ? " has-error" : ""}`}
              data-field="last_name"
            >
              <label htmlFor="lead_last">
                Last Name <span className="req">*</span>
              </label>
              <input
                id="lead_last"
                name="last_name"
                type="text"
                placeholder="Last name"
                autoComplete="family-name"
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
            </div>

            <div
              className={`lead-field lead-field-full${errorField === "email" ? " has-error" : ""}`}
              data-field="email"
            >
              <label htmlFor="lead_email">
                Email Address <span className="req">*</span>
              </label>
              <input
                id="lead_email"
                name="email"
                type="email"
                inputMode="email"
                placeholder="you@email.com"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            <div
              className={`lead-field lead-field-full${errorField === "phone" ? " has-error" : ""}`}
              data-field="phone"
            >
              <label htmlFor="lead_phone" className="label-row">
                <span>
                  Phone Number <span className="req">*</span>
                </span>
                <span className="field-hint">We&apos;ll message you here</span>
              </label>
              <div className="lead-phone-group">
                <ThemedSelect
                  ariaLabel="Country"
                  value={form.country_iso}
                  onChange={(v) => update("country_iso", v)}
                  options={COUNTRY_OPTIONS}
                />
                <input
                  id="lead_phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="7911 123456"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) =>
                    update("phone", e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </div>
            </div>

            <div
              className={`lead-field lead-field-full${errorField === "city" ? " has-error" : ""}`}
              data-field="city"
            >
              <label htmlFor="lead_city">
                Town / City <span className="req">*</span>
              </label>
              <input
                id="lead_city"
                name="city"
                type="text"
                placeholder="London"
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="lead-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="lead-submit" disabled={submitting}>
            {submitting ? "Just a moment…" : "Continue on WhatsApp"}
            <span className="ar" aria-hidden="true">
              →
            </span>
          </button>

          <p className="lead-fine lead-consent">
            By continuing you agree to be contacted by Coach Mawra on WhatsApp and
            email about your free consultation. No payment is taken at any point, and you can
            ask us to stop at any time. See our{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
