"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import {
  UTM_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  type Attribution,
} from "../_lib/attribution";
import { setMetaAdvancedMatching } from "../_lib/analytics";
import { trackGa4EventOnce, markOnce, unmarkOnce } from "../_lib/ga4";
import { fireAddToCartOnce } from "../_lib/meta-client";
import { COUNTRIES, flagEmoji } from "../_lib/country";
import ThemedSelect, { type ThemedOption } from "./ThemedSelect";

// Option lists for the themed dropdowns (with flag icons).
const COUNTRY_OPTIONS: ThemedOption[] = COUNTRIES.map((c) => ({
  value: c.iso,
  label: `${flagEmoji(c.iso)}  ${c.name} · ${c.dial}`,
  short: `${flagEmoji(c.iso)} ${c.dial}`,
}));

// Step 4 — role / profile (dropdown)
const PROFILE_OPTIONS: ThemedOption[] = [
  "Business Owner / Entrepreneur",
  "CEO / Founder",
  "Senior Corporate Professional",
  "Doctor / Lawyer / Consultant",
  "Other",
].map((v) => ({ value: v, label: v }));

// Step 5 — weight to lose (dropdown, unchanged)
const WEIGHT_OPTIONS: ThemedOption[] = [
  { value: "Less than 10 kg", label: "Less than 10 kg" },
  { value: "10–20 kg", label: "10–20 kg" },
  { value: "20–40 kg", label: "20–40 kg" },
  { value: "40+ kg", label: "40+ kg" },
];

// Step 6 — current annual income (single-select cards)
const INCOME_OPTIONS = [
  "Below ₹15 Lakhs",
  "₹15–25 Lakhs",
  "₹25–50 Lakhs",
  "₹50 Lakhs – ₹1 Crore",
  "Above ₹1 Crore",
];

// Step 7 — investment intent (single-select cards). The final option routes the
// visitor to /disqualified instead of the booking page.
const INVEST_DECLINE =
  "Really interested, but not ready to invest in my health & fitness";
const INVESTMENT_OPTIONS = [
  "₹7,000–₹10,000 per month",
  "₹10,000–₹15,000 per month",
  "₹15,000+ per month",
  INVEST_DECLINE,
];

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_iso: string;
  profile: string;
  weight_to_lose: string;
  annual_income: string;
  investment_level: string;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country_iso: "IN",
  profile: "",
  weight_to_lose: "",
  annual_income: "",
  investment_level: "",
};

const TOTAL_STEPS = 7;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9]{6,15}$/;

// Validate only the fields that belong to the given step. Returns an error
// string (shown under the step) or null when the step is complete & valid.
function validateStep(step: number, form: FormState): string | null {
  switch (step) {
    case 1:
      if (!form.first_name.trim()) return "Please enter your first name.";
      if (!form.last_name.trim()) return "Please enter your last name.";
      return null;
    case 2:
      if (!form.email.trim()) return "Please enter your email address.";
      if (!EMAIL_RE.test(form.email.trim())) return "Enter a valid email address.";
      return null;
    case 3:
      if (!form.country_iso) return "Select your country.";
      if (!form.phone.trim()) return "Please enter your phone number.";
      if (!PHONE_RE.test(form.phone.trim()))
        return "Enter a valid phone number (digits only).";
      return null;
    case 4:
      if (!form.profile) return "Please select an option.";
      return null;
    case 5:
      if (!form.weight_to_lose) return "Please select an option.";
      return null;
    case 6:
      if (!form.annual_income) return "Please select an option.";
      return null;
    case 7:
      if (!form.investment_level) return "Please select an option.";
      return null;
    default:
      return null;
  }
}

/**
 * Free-funnel lead capture — a 7-step wizard. Mounted once in the landing page;
 * any element with a `data-lead` attribute (the CTAs) opens it via click
 * delegation. On the final step the lead is written to the CRM webhook (via
 * /api/lead) and the visitor is forwarded to the booking page — or, if they
 * pick "not ready to invest", to /disqualified.
 */
export default function LeadModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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
        // add_to_cart + Meta standard AddToCart (CAPI) — each once per browser,
        // host-gated, non-blocking.
        trackGa4EventOnce("add_to_cart");
        fireAddToCartOnce();
        setStep(1);
        setError(null);
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

  // Focus the first text input each time a text step is shown.
  useEffect(() => {
    if (!open) return;
    if (step === 1 || step === 2 || step === 3) {
      requestAnimationFrame(() => firstInputRef.current?.focus());
    }
  }, [open, step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  // Advance to the next step, or submit if we're on the last one.
  function advance(nextForm: FormState) {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      void submitLead(nextForm);
    }
  }

  // Used by the single-select steps (dropdowns + radio cards): set the value and
  // auto-advance after a beat so the choice is visible — no Continue click needed.
  function selectAndAdvance<K extends keyof FormState>(key: K, value: FormState[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    setError(null);
    window.setTimeout(() => advance(next), 240);
  }

  async function submitLead(finalForm: FormState = form) {
    // GA4 registration_complete = the lead form was completed and submitted.
    // Once per browser, non-blocking.
    trackGa4EventOnce("registration_complete");
    setSubmitting(true);
    setError(null);
    try {
      const dial =
        COUNTRIES.find((c) => c.iso === finalForm.country_iso)?.dial || "+91";
      const disqualified = finalForm.investment_level === INVEST_DECLINE;

      // Enrich the Meta pixel with hashed identity (advanced matching). This
      // also writes the tgo_mam cookie the Schedule CAPI reads later.
      void setMetaAdvancedMatching({
        email: finalForm.email,
        phone: `${dial}${finalForm.phone}`,
        firstName: finalForm.first_name,
        lastName: finalForm.last_name,
        country: finalForm.country_iso,
      });

      // Once per browser: the /api/lead call does BOTH the webhook row and the
      // CompleteRegistration CAPI events. A second submit in the same browser
      // skips it and just re-forwards, reusing the stored lead id.
      let leadId = "";
      if (markOnce("tgo_reg_fired")) {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...finalForm,
            country_code: dial,
            disqualified,
            attribution,
            eventSourceUrl:
              typeof window !== "undefined" ? window.location.href : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          // Roll back the flag so the user can retry (and webhook/CAPI can fire).
          unmarkOnce("tgo_reg_fired");
          throw new Error(data?.error || "Something went wrong. Please try again.");
        }
        leadId = data.leadId || "";
        try {
          localStorage.setItem("tgo_lead_id", leadId);
        } catch {
          /* ignore */
        }
      } else {
        try {
          leadId = localStorage.getItem("tgo_lead_id") || "";
        } catch {
          leadId = "";
        }
      }

      // Forward all landing-page URL params (+ any stored UTMs) so attribution
      // rides through the whole funnel.
      const forward = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      for (const k of UTM_KEYS) {
        const v = attribution[k];
        if (v && !forward.get(k)) forward.set(k, v);
      }
      if (disqualified) {
        // Carry the answers through so the disqualified page can show them back
        // and pinpoint the investment question as the reason.
        forward.set("pr", finalForm.profile);
        forward.set("wt", finalForm.weight_to_lose);
        forward.set("inc", finalForm.annual_income);
        forward.set("inv", finalForm.investment_level);
        window.location.href = `/disqualified?${forward.toString()}`;
      } else {
        forward.set("lead", leadId);
        window.location.href = `/book-a-call?${forward.toString()}`;
      }
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  // Continue / Submit handler for the form (Enter key or button click).
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const stepError = validateStep(step, form);
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      void submitLead();
    }
  }

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);
  const isLast = step === TOTAL_STEPS;

  return (
    <div className={`lead-modal${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="lead-modal-backdrop" onClick={() => setOpen(false)} />
      <div
        className="lead-modal-card lead-wizard"
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

        {/* Progress + meta */}
        <div className="wiz-progress" aria-hidden="true">
          <span className="wiz-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="wiz-meta">
          <span className="wiz-count">
            Question <strong>{step}</strong> of {TOTAL_STEPS}
          </span>
          <span className="wiz-badge">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 2l6 2.5v4.2c0 4-2.7 7.3-6 8.3-3.3-1-6-4.3-6-8.3V4.5L10 2z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M7.2 10.2l2 2 3.6-3.8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Free · No card needed
          </span>
        </div>

        <form ref={formRef} className="lead-form wiz-form" onSubmit={onSubmit} noValidate>
          {/* UTM / click-id attribution — hidden fields carried with the lead. */}
          {UTM_KEYS.map((k) => (
            <input key={k} type="hidden" name={k} value={attribution[k] || ""} readOnly />
          ))}
          <input type="hidden" name="landing_url" value={attribution.landing_url || ""} readOnly />
          <input type="hidden" name="referrer" value={attribution.referrer || ""} readOnly />

          {/* STEP 1 — name */}
          {step === 1 && (
            <div className="wiz-step">
              <h2 className="wiz-q">What&apos;s your name?</h2>
              <div className="wiz-grid-2">
                <div className="lead-field" data-field="first_name">
                  <label htmlFor="lead_first">First Name</label>
                  <input
                    ref={firstInputRef}
                    id="lead_first"
                    type="text"
                    placeholder="First name"
                    autoComplete="given-name"
                    value={form.first_name}
                    onChange={(e) => update("first_name", e.target.value)}
                  />
                </div>
                <div className="lead-field" data-field="last_name">
                  <label htmlFor="lead_last">Last Name</label>
                  <input
                    id="lead_last"
                    type="text"
                    placeholder="Last name"
                    autoComplete="family-name"
                    value={form.last_name}
                    onChange={(e) => update("last_name", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — email */}
          {step === 2 && (
            <div className="wiz-step">
              <h2 className="wiz-q">What&apos;s your email address?</h2>
              <div className="lead-field" data-field="email">
                <label htmlFor="lead_email">Email Address</label>
                <input
                  ref={firstInputRef}
                  id="lead_email"
                  type="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3 — phone */}
          {step === 3 && (
            <div className="wiz-step">
              <h2 className="wiz-q">What&apos;s your phone number?</h2>
              <div className="lead-field" data-field="phone">
                <label htmlFor="lead_phone">Phone Number</label>
                <div className="lead-phone-group">
                  <ThemedSelect
                    ariaLabel="Country"
                    value={form.country_iso}
                    onChange={(v) => update("country_iso", v)}
                    options={COUNTRY_OPTIONS}
                  />
                  <input
                    ref={firstInputRef}
                    id="lead_phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Phone number"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — profile / role */}
          {step === 4 && (
            <div className="wiz-step">
              <h2 className="wiz-q">Which best describes you?</h2>
              <div className="lead-field" data-field="profile">
                <ThemedSelect
                  ariaLabel="Which best describes you?"
                  placeholder="Select an option"
                  value={form.profile}
                  onChange={(v) => selectAndAdvance("profile", v)}
                  options={PROFILE_OPTIONS}
                />
              </div>
            </div>
          )}

          {/* STEP 5 — weight to lose */}
          {step === 5 && (
            <div className="wiz-step">
              <h2 className="wiz-q">How much weight do you want to lose?</h2>
              <div className="lead-field" data-field="weight_to_lose">
                <ThemedSelect
                  ariaLabel="How much weight do you want to lose?"
                  placeholder="Select an option"
                  value={form.weight_to_lose}
                  onChange={(v) => selectAndAdvance("weight_to_lose", v)}
                  options={WEIGHT_OPTIONS}
                />
              </div>
            </div>
          )}

          {/* STEP 6 — annual income (single-select cards) */}
          {step === 6 && (
            <div className="wiz-step">
              <h2 className="wiz-q">What is your current annual income?</h2>
              <div className="wiz-radios" role="radiogroup" aria-label="Current annual income">
                {INCOME_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    role="radio"
                    aria-checked={form.annual_income === opt}
                    className={`wiz-radio${form.annual_income === opt ? " selected" : ""}`}
                    onClick={() => selectAndAdvance("annual_income", opt)}
                  >
                    <span className="wiz-radio-dot" aria-hidden="true" />
                    <span className="wiz-radio-label">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7 — investment intent (single-select cards) */}
          {step === 7 && (
            <div className="wiz-step">
              <h2 className="wiz-q">
                With a personalised plan built around your busy schedule, what are you
                ready to invest each month in your transformation?
              </h2>
              <div className="wiz-radios" role="radiogroup" aria-label="Monthly investment">
                {INVESTMENT_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    role="radio"
                    aria-checked={form.investment_level === opt}
                    className={`wiz-radio${form.investment_level === opt ? " selected" : ""}${opt === INVEST_DECLINE ? " wiz-radio-soft" : ""}`}
                    onClick={() => selectAndAdvance("investment_level", opt)}
                  >
                    <span className="wiz-radio-dot" aria-hidden="true" />
                    <span className="wiz-radio-label">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="lead-error wiz-error" role="alert">{error}</div>}

          <div className="wiz-nav">
            {step > 1 ? (
              <button type="button" className="wiz-back" onClick={goBack} disabled={submitting}>
                <span className="ar" aria-hidden="true">←</span> Back
              </button>
            ) : (
              <span className="wiz-back-spacer" aria-hidden="true" />
            )}
            {/* Text steps show Continue; select/radio steps auto-advance, so the
                button only appears there to signal the final submit is running. */}
            {(step <= 3 || submitting) && (
              <button type="submit" className="lead-submit wiz-next" disabled={submitting}>
                {submitting ? "Submitting…" : isLast ? "See My Results" : "Continue"}
                <span className="ar" aria-hidden="true">→</span>
              </button>
            )}
          </div>

          <p className="lead-fine wiz-fine">
            Your details are used to run the call and send reminders. Nothing is charged at any point.
          </p>
        </form>
      </div>
    </div>
  );
}
