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
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
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
            Book Your <span className="gold">Free</span> Assessment Call
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
            <div className="lead-field">
              <label htmlFor="lead_first">First Name <span className="req">*</span></label>
              <input
                id="lead_first"
                type="text"
                placeholder="First Name"
                required
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
            </div>
            <div className="lead-field">
              <label htmlFor="lead_last">Last Name <span className="req">*</span></label>
              <input
                id="lead_last"
                type="text"
                placeholder="Last Name"
                required
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
            </div>
            <div className="lead-field lead-field-full">
              <label htmlFor="lead_email">Email Address <span className="req">*</span></label>
              <input
                id="lead_email"
                type="email"
                placeholder="Email Address"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="lead-field lead-field-full">
              <label htmlFor="lead_phone">Phone Number <span className="req">*</span></label>
              <div className="lead-phone-group">
                <select
                  aria-label="Country"
                  value={form.country_iso}
                  onChange={(e) => update("country_iso", e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.iso} title={c.name}>
                      {flagEmoji(c.iso)} {c.dial}
                    </option>
                  ))}
                </select>
                <input
                  id="lead_phone"
                  type="tel"
                  placeholder="Phone Number"
                  required
                  pattern="[0-9]{6,15}"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="lead-field lead-field-full">
              <label htmlFor="lead_weight">How much weight do you want to lose? <span className="req">*</span></label>
              <select
                id="lead_weight"
                required
                value={form.weight_to_lose}
                onChange={(e) => update("weight_to_lose", e.target.value)}
              >
                <option value="" disabled>Select an option</option>
                <option value="Less than 10 kg">Less than 10 kg</option>
                <option value="10–20 kg">10–20 kg</option>
                <option value="20–40 kg">20–40 kg</option>
                <option value="40+ kg">40+ kg</option>
              </select>
            </div>
            <div className="lead-field lead-field-full">
              <label htmlFor="lead_challenge">What&apos;s your biggest struggle right now? <span className="req">*</span></label>
              <select
                id="lead_challenge"
                required
                value={form.biggest_challenge}
                onChange={(e) => update("biggest_challenge", e.target.value)}
              >
                <option value="" disabled>Select an option</option>
                <option value="Emotional / stress eating">Emotional / stress eating</option>
                <option value="PCOS, thyroid or insulin resistance">PCOS, thyroid or insulin resistance</option>
                <option value="Lost weight before but regained it">Lost weight before but regained it</option>
                <option value="Low energy & confidence">Low energy &amp; confidence</option>
                <option value="Something else">Something else</option>
              </select>
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
