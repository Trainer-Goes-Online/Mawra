"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import {
  UTM_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  utmQueryString,
  type Attribution,
} from "../_lib/attribution";
import { setMetaAdvancedMatching } from "../_lib/analytics";
import { COUNTRIES, flagEmoji } from "../_lib/country";
import ThemedSelect, { type ThemedOption } from "./ThemedSelect";

// Option lists for the themed dropdowns (with flag icons).
const COUNTRY_OPTIONS: ThemedOption[] = COUNTRIES.map((c) => ({
  value: c.iso,
  label: `${flagEmoji(c.iso)}  ${c.name} · ${c.dial}`,
  short: `${flagEmoji(c.iso)} ${c.dial}`,
}));
const WEIGHT_OPTIONS: ThemedOption[] = [
  { value: "Less than 10 kg", label: "Less than 10 kg" },
  { value: "10–20 kg", label: "10–20 kg" },
  { value: "20–40 kg", label: "20–40 kg" },
  { value: "40+ kg", label: "40+ kg" },
];
const CHALLENGE_OPTIONS: ThemedOption[] = [
  { value: "Emotional / stress eating", label: "Emotional / stress eating" },
  { value: "PCOS, thyroid or insulin resistance", label: "PCOS, thyroid or insulin resistance" },
  { value: "Lost weight before but regained it", label: "Lost weight before but regained it" },
  { value: "Low energy and confidence", label: "Low energy and confidence" },
  { value: "Something else", label: "Something else" },
];

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9]{6,15}$/;

function validateForm(form: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!form.first_name.trim()) e.first_name = "Please enter your first name.";
  if (!form.last_name.trim()) e.last_name = "Please enter your last name.";
  if (!form.email.trim()) e.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address.";
  if (!form.phone.trim()) e.phone = "Please enter your phone number.";
  else if (!PHONE_RE.test(form.phone.trim())) e.phone = "Enter a valid phone number (digits only).";
  if (!form.country_iso) e.country_iso = "Select your country.";
  if (!form.weight_to_lose) e.weight_to_lose = "Please select an option.";
  if (!form.biggest_challenge) e.biggest_challenge = "Please select an option.";
  return e;
}

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_iso: string;
  weight_to_lose: string;
  biggest_challenge: string;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country_iso: "IN",
  weight_to_lose: "",
  biggest_challenge: "",
};

/**
 * Free-funnel lead capture. Mounted once in the landing page. Any element with a
 * `data-lead` attribute (the CTAs) opens this popup via click delegation, so the
 * page markup stays static. On submit the lead is written to the Google Sheet
 * (via /api/lead) and the visitor is forwarded to the Calendly booking page.
 */
export default function LeadModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Validate every field by type; block submit and surface inline errors.
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      (el?.querySelector("input, button") as HTMLElement | null)?.focus();
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    try {
      const dial =
        COUNTRIES.find((c) => c.iso === form.country_iso)?.dial || "+91";

      // Enrich the Meta pixel with hashed identity (advanced matching).
      void setMetaAdvancedMatching({
        email: form.email,
        phone: `${dial}${form.phone}`,
        firstName: form.first_name,
        lastName: form.last_name,
        country: form.country_iso,
      });

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

      const utmQs = utmQueryString(attribution);
      window.location.href =
        `/book-a-call?lead=${encodeURIComponent(data.leadId || "")}` +
        (utmQs ? `&${utmQs}` : "");
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
        aria-label="Book your free assessment call"
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
            <span className="dot" aria-hidden="true">✦</span>
            Free Assessment Call
          </span>
          <h2 className="lead-title">
            Book Your<br /><span className="gold">Free</span> Assessment Call
          </h2>
          <p className="lead-sub">
            Enter your details and pick your slot on the next screen. Takes 30 seconds.
          </p>
        </div>

        <form ref={formRef} className="lead-form" onSubmit={onSubmit} noValidate>
          {/* UTM / click-id attribution — hidden fields carried with the lead.
              Captured from the landing URL, persisted, sent to the sheet, and
              forwarded to the booking page. */}
          {UTM_KEYS.map((k) => (
            <input key={k} type="hidden" name={k} value={attribution[k] || ""} readOnly />
          ))}
          <input type="hidden" name="landing_url" value={attribution.landing_url || ""} readOnly />
          <input type="hidden" name="referrer" value={attribution.referrer || ""} readOnly />

          <div className="lead-grid">
            <div className={`lead-field${fieldErrors.first_name ? " has-error" : ""}`} data-field="first_name">
              <label htmlFor="lead_first">First Name <span className="req">*</span></label>
              <input
                id="lead_first"
                type="text"
                placeholder="First Name"
                autoComplete="given-name"
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
              {fieldErrors.first_name && <p className="field-error">{fieldErrors.first_name}</p>}
            </div>
            <div className={`lead-field${fieldErrors.last_name ? " has-error" : ""}`} data-field="last_name">
              <label htmlFor="lead_last">Last Name <span className="req">*</span></label>
              <input
                id="lead_last"
                type="text"
                placeholder="Last Name"
                autoComplete="family-name"
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
              {fieldErrors.last_name && <p className="field-error">{fieldErrors.last_name}</p>}
            </div>
            <div className={`lead-field lead-field-full${fieldErrors.email ? " has-error" : ""}`} data-field="email">
              <label htmlFor="lead_email">Email Address <span className="req">*</span></label>
              <input
                id="lead_email"
                type="email"
                inputMode="email"
                placeholder="Email Address"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>
            <div className={`lead-field lead-field-full${fieldErrors.phone || fieldErrors.country_iso ? " has-error" : ""}`} data-field="phone">
              <label htmlFor="lead_phone">Phone Number <span className="req">*</span></label>
              <div className={`lead-phone-group${fieldErrors.phone ? " has-error" : ""}`}>
                <ThemedSelect
                  ariaLabel="Country"
                  value={form.country_iso}
                  onChange={(v) => update("country_iso", v)}
                  options={COUNTRY_OPTIONS}
                  invalid={!!fieldErrors.country_iso}
                />
                <input
                  id="lead_phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Phone Number"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
              {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
            </div>
            <div className={`lead-field lead-field-full${fieldErrors.weight_to_lose ? " has-error" : ""}`} data-field="weight_to_lose">
              <label htmlFor="lead_weight">How much weight do you want to lose? <span className="req">*</span></label>
              <ThemedSelect
                id="lead_weight"
                ariaLabel="How much weight do you want to lose?"
                value={form.weight_to_lose}
                onChange={(v) => update("weight_to_lose", v)}
                options={WEIGHT_OPTIONS}
                invalid={!!fieldErrors.weight_to_lose}
              />
              {fieldErrors.weight_to_lose && <p className="field-error">{fieldErrors.weight_to_lose}</p>}
            </div>
            <div className={`lead-field lead-field-full${fieldErrors.biggest_challenge ? " has-error" : ""}`} data-field="biggest_challenge">
              <label htmlFor="lead_challenge">What&apos;s your biggest struggle right now? <span className="req">*</span></label>
              <ThemedSelect
                id="lead_challenge"
                ariaLabel="What's your biggest struggle right now?"
                value={form.biggest_challenge}
                onChange={(v) => update("biggest_challenge", v)}
                options={CHALLENGE_OPTIONS}
                invalid={!!fieldErrors.biggest_challenge}
              />
              {fieldErrors.biggest_challenge && <p className="field-error">{fieldErrors.biggest_challenge}</p>}
            </div>
          </div>

          {error && <div className="lead-error" role="alert">{error}</div>}

          <button type="submit" className="lead-submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Continue To Booking"}
            <span className="ar" aria-hidden="true">→</span>
          </button>

          <p className="lead-fine">100% Free · No card needed · Zero spam</p>
        </form>
      </div>
    </div>
  );
}
