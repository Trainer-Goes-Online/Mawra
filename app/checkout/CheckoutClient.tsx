"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
  UTM_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  utmQueryString,
  type Attribution,
} from "../_lib/attribution";
import { setMetaAdvancedMatching } from "../_lib/analytics";
import { trackGa4EventOnce } from "../_lib/ga4";
import { fireInitiateCheckoutOnce } from "../_lib/meta-client";
import { type Country } from "../_lib/country";
import CountrySelect from "../_components/CountrySelect";
import {
  validateField,
  normalizePhone,
  phonePlaceholder,
  phoneMaxDigits,
  type FieldName,
} from "../_lib/validation";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  readonly?: { name?: boolean; email?: boolean; contact?: boolean };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean };
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void };

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_code: string;
  country_iso: string;
  town: string;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country_code: "+91",
  country_iso: "IN",
  town: "",
};

const FIELD_ORDER: FieldName[] = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "town",
];

type Errors = Partial<Record<FieldName, string>>;
type Touched = Partial<Record<FieldName, boolean>>;

function ErrorText({ id, children }: { id: string; children: string }) {
  return (
    <p className="field-error" id={id} role="alert">
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16.2v.2" />
      </svg>
      {children}
    </p>
  );
}

export default function CheckoutClient({
  priceLabel = "₹97",
  mrpLabel = "₹999",
}: {
  priceLabel?: string;
  mrpLabel?: string;
}) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mandatory consent checkbox (spec §2) — the pay button is blocked until it
  // is ticked, so nobody reaches Razorpay without seeing the 10-second notice.
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  // Order-summary accordion — open by default on every breakpoint; the user can
  // collapse it from the "Tap for more details" row.
  const [summaryOpen, setSummaryOpen] = useState(true);

  // Shown between "payment captured" and "calendar opens". This is the visual
  // promise made by the 10-second notice above the form: the tab must stay open
  // while the signature is verified and the webhook fires.
  const [redirecting, setRedirecting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  // Attribution captured on the landing page (localStorage), merged with any
  // UTMs present on the current checkout URL.
  const attributionRef = useRef<Attribution>({});

  useEffect(() => {
    try {
      let stored: Attribution = {};
      try {
        stored = JSON.parse(
          localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}"
        );
      } catch {
        stored = {};
      }
      const params = new URLSearchParams(window.location.search);
      const merged: Attribution = { ...stored };
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) merged[k] = v;
      }
      attributionRef.current = merged;
    } catch {
      /* best-effort */
    }
  }, []);

  // Warn on tab close while the post-payment redirect is in flight. Browsers
  // show their own generic wording, but the prompt itself is the safeguard the
  // spec asks for ("leaving early may stop your booking from being completed").
  useEffect(() => {
    if (!redirecting) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [redirecting]);

  // Fire Manual Advanced Matching as soon as the form is filled and every field
  // passes — independent of whether the user pays. Debounced 500ms. Custom-only
  // H&W posture: this enriches PageView, it does NOT fire a conversion event.
  useEffect(() => {
    const allValid = FIELD_ORDER.every(
      (f) => !validateField(f, form[f], form.country_iso)
    );
    if (!allValid) return;

    const timer = setTimeout(() => {
      void setMetaAdvancedMatching({
        email: form.email,
        phone: `${form.country_code}${normalizePhone(form.phone)}`,
        firstName: form.first_name,
        lastName: form.last_name,
        city: form.town,
        country: form.country_iso,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Re-check a field the user has already left, so a correction clears the
    // message the moment it becomes valid instead of waiting for another blur.
    if (FIELD_ORDER.includes(key as FieldName) && touched[key as FieldName]) {
      const msg = validateField(
        key as FieldName,
        String(value),
        form.country_iso
      );
      setErrors((e) => ({ ...e, [key]: msg || undefined }));
    }
    if (error) setError(null);
  }

  function onBlurField(field: FieldName) {
    setTouched((t) => ({ ...t, [field]: true }));
    const msg = validateField(field, form[field], form.country_iso);
    setErrors((e) => ({ ...e, [field]: msg || undefined }));
  }

  function onCountryChange(c: Country) {
    // Trim the number to the new country's maximum, so switching from a 15-digit
    // country to an 8-digit one can't leave an over-long value behind.
    const trimmed = normalizePhone(form.phone).slice(0, phoneMaxDigits(c.iso));
    setForm((prev) => ({
      ...prev,
      country_code: c.dial,
      country_iso: c.iso,
      phone: trimmed,
    }));
    // Phone rules are country-specific, so re-check against the new country.
    if (touched.phone) {
      const msg = validateField("phone", trimmed, c.iso);
      setErrors((e) => ({ ...e, phone: msg || undefined }));
    }
  }

  /** Validate everything. Returns the first invalid field, or null if clean. */
  function validateAll(): FieldName | null {
    const next: Errors = {};
    let first: FieldName | null = null;
    for (const f of FIELD_ORDER) {
      const msg = validateField(f, form[f], form.country_iso);
      if (msg) {
        next[f] = msg;
        if (!first) first = f;
      }
    }
    setErrors(next);
    setTouched(
      FIELD_ORDER.reduce<Touched>((acc, f) => ({ ...acc, [f]: true }), {})
    );
    return first;
  }

  function focusField(field: FieldName) {
    const el = document.getElementById(field);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Focus after the scroll settles so the browser doesn't fight the animation.
    setTimeout(() => (el as HTMLInputElement | null)?.focus(), 260);
  }

  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  /**
   * Post-payment hand-off to the calendar. Carries the payment id (so the
   * booking can be matched back to the payment), every UTM, and the customer's
   * name/email so Calendly prefills and nobody retypes what they just entered.
   */
  function goToBooking(paymentId: string) {
    const params = new URLSearchParams();
    params.set("p", paymentId);
    params.set("first_name", form.first_name);
    params.set("last_name", form.last_name);
    params.set("email", form.email);
    params.set("phone", `${form.country_code}${normalizePhone(form.phone)}`);
    const utmQs = utmQueryString(attributionRef.current);
    window.location.href =
      `/book-a-call?${params.toString()}` + (utmQs ? `&${utmQs}` : "");
  }

  async function onPay(e?: FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    // Our own validation — the form carries noValidate so the browser never
    // shows its default "Please fill out this field" bubble.
    const firstBad = validateAll();
    if (firstBad) {
      focusField(firstBad);
      return;
    }

    // Mandatory acknowledgement gate.
    if (!consent) {
      setConsentError(true);
      document
        .getElementById("consent-box")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const phoneDigits = normalizePhone(form.phone);

    // Identity for the pixel/MAM cookie — also read server-side by the ic_event
    // CAPI route (via tgo_mam) for high EMQ.
    const mam = {
      email: form.email,
      phone: `${form.country_code}${phoneDigits}`,
      firstName: form.first_name,
      lastName: form.last_name,
      city: form.town,
      country: form.country_iso,
    };

    setSubmitting(true);
    try {
      // Write the MAM cookie first, then fire checkout-intent events (GA4
      // ic_event + Meta custom ic_event via CAPI), once per browser, before the
      // order is created. Validation already passed above.
      await setMetaAdvancedMatching(mam);
      trackGa4EventOnce("ic_event");
      fireInitiateCheckoutOnce();

      // 1) Server-side: create the Razorpay order. The server decides the real
      //    charge — the price shown here is advisory. It also packs the
      //    customer + attribution into order.notes for the webhook.
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: phoneDigits,
            country_code: form.country_code,
            town: form.town,
          },
          attribution: attributionRef.current,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData?.error || "Order failed");

      // 2) Open the Razorpay modal.
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load Razorpay. Please retry.");
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Mawra Ishaque",
        description: "1:1 Diagnostic Call · Personalised Consultation",
        order_id: orderData.orderId,
        prefill: {
          name: `${form.first_name} ${form.last_name}`.trim(),
          email: form.email,
          contact: `${form.country_code}${phoneDigits}`,
        },
        // Lock contact + email to what was entered on our form so Razorpay
        // can't substitute a previously-remembered contact on this device.
        readonly: { email: true, contact: true },
        notes: { town: form.town },
        theme: { color: "#DC2626" },
        handler: async (response) => {
          // Payment captured. Purchase + sales (Meta CAPI) and the Pabbly row
          // now fire from the Razorpay webhook server-to-server, so they land
          // even if the buyer never returns to this tab (UPI-away). Here we only
          // refresh MAM, fire GA4 purchase (best-effort, client-side), and hand
          // off to the calendar.
          setRedirecting(true);
          try {
            await setMetaAdvancedMatching(mam);
          } catch {
            /* non-blocking */
          }
          trackGa4EventOnce("purchase");
          goToBooking(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
      rzp.open();
    } catch (err: unknown) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "Payment could not start";
      setError(msg);
    }
  }

  const payLabel = submitting
    ? "Processing…"
    : `Pay ${priceLabel} and Book My Call`;

  const payArrow = (
    <span className="ar" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </span>
  );

  return (
    <>
      <div className="checkout-grid">
        {/* ======================================================
            ORDER SUMMARY — right column on desktop, first on mobile
            ====================================================== */}
        <aside className="col-side">
          <section className="checkout-card order-card">
            <h2 className="card-h2">Order Summary</h2>

            <button
              type="button"
              className="order-acc-toggle"
              aria-expanded={summaryOpen}
              aria-controls="order-acc-body"
              data-open={summaryOpen ? "true" : "false"}
              onClick={() => setSummaryOpen((o) => !o)}
            >
              <span className="order-acc-label">
                {summaryOpen ? "Tap to hide details" : "Tap for more details"}
              </span>
              <svg
                className="order-acc-chev"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <div
              id="order-acc-body"
              className="order-acc-body"
              data-open={summaryOpen ? "true" : "false"}
            >
              <div className="order-acc-inner">
                <div className="order-detail-panel">
                  <p className="order-detail-eyebrow">
                    1:1 Diagnostic Call with Mawra Ishaque · Personalised
                    Consultation
                  </p>
                  <ul className="order-benefits">
                    <li>
                      <span className="ob-tick" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </span>
                      Personalised Diagnosis &amp; Transformation Roadmap
                    </li>
                    <li>
                      <span className="ob-tick" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </span>
                      Honest fit check — I&apos;ll tell you if the Identity
                      Transformation Programme isn&apos;t the right fit for you
                    </li>
                    <li>
                      <span className="ob-tick" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </span>
                      Structured programme walk-through and your personalised
                      path forward
                    </li>
                  </ul>
                  <p className="order-detail-foot">
                    Limited Slots · Secure Checkout
                  </p>
                </div>
              </div>
            </div>

            {/* --- Pricing --- */}
            <div className="order-price-row">
              <span className="strike">{mrpLabel}</span>
              <span className="now">{priceLabel}</span>
            </div>

            <div className="order-total">
              <span className="lbl">Total Due Today</span>
              <span className="amt">{priceLabel}</span>
            </div>

            {/* --- Accepted payment methods --- */}
            <div className="pay-methods" aria-label="Accepted payment methods">
              <span className="pay-methods-label">Accepted Payment Methods</span>
              <ul className="pay-methods-list">
                <li className="pm">
                  <img src="/assets/payment/upi.svg" alt="UPI" loading="lazy" />
                </li>
                <li className="pm">
                  <img src="/assets/payment/visa.svg" alt="Visa" loading="lazy" />
                </li>
                <li className="pm">
                  <img src="/assets/payment/mastercard.svg" alt="Mastercard" loading="lazy" />
                </li>
                <li className="pm">
                  <img src="/assets/payment/rupay.svg" alt="RuPay" loading="lazy" />
                </li>
                <li className="pm">
                  <img src="/assets/payment/amex.svg" alt="American Express" loading="lazy" />
                </li>
                <li className="pm">
                  <img src="/assets/payment/netbanking.svg" alt="Net Banking" loading="lazy" />
                </li>
              </ul>
            </div>
          </section>
        </aside>

        {/* ======================================================
            YOUR DETAILS → fine text → checkbox → pay button
            ====================================================== */}
        <div className="col-main">
          <section className="checkout-card details-card">
            <h2 className="card-h2">Your Details</h2>
            <p className="card-sub">
              We&apos;ll send your call link to these details.
            </p>

            {/* The 10-second notice — the most important copy on the page. */}
            <div className="wait-notice" role="note">
              <span className="wn-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <p>
                <strong>
                  Important – please don&apos;t close this page after paying.
                </strong>{" "}
                The moment your payment succeeds, please wait up to{" "}
                <strong>10 seconds</strong> without closing or refreshing this
                tab. You&apos;ll then be automatically taken to the calendar to
                select your preferred date and time and book your call. Leaving
                early may stop your booking from being completed.
              </p>
            </div>

            <form
              ref={formRef}
              className="checkout-form"
              onSubmit={onPay}
              noValidate
            >
              <div className="form-grid">
                <div className="field" data-invalid={errors.first_name ? "true" : "false"}>
                  <label htmlFor="first_name">
                    First Name <span className="req">*</span>
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="Priya"
                    autoComplete="given-name"
                    maxLength={50}
                    aria-invalid={errors.first_name ? true : undefined}
                    aria-describedby={errors.first_name ? "err-first_name" : undefined}
                    value={form.first_name}
                    onChange={(e) => update("first_name", e.target.value)}
                    onBlur={() => onBlurField("first_name")}
                  />
                  {errors.first_name && (
                    <ErrorText id="err-first_name">{errors.first_name}</ErrorText>
                  )}
                </div>

                <div className="field" data-invalid={errors.last_name ? "true" : "false"}>
                  <label htmlFor="last_name">
                    Last Name <span className="req">*</span>
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Sharma"
                    autoComplete="family-name"
                    maxLength={50}
                    aria-invalid={errors.last_name ? true : undefined}
                    aria-describedby={errors.last_name ? "err-last_name" : undefined}
                    value={form.last_name}
                    onChange={(e) => update("last_name", e.target.value)}
                    onBlur={() => onBlurField("last_name")}
                  />
                  {errors.last_name && (
                    <ErrorText id="err-last_name">{errors.last_name}</ErrorText>
                  )}
                </div>

                <div className="field field-full" data-invalid={errors.email ? "true" : "false"}>
                  <label htmlFor="email">
                    <span>
                      Email Address <span className="req">*</span>
                    </span>
                    <span className="field-hint">Call link comes here</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    placeholder="priya@example.com"
                    autoComplete="email"
                    maxLength={254}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "err-email" : undefined}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    onBlur={() => onBlurField("email")}
                  />
                  {errors.email && <ErrorText id="err-email">{errors.email}</ErrorText>}
                </div>

                <div className="field field-full" data-invalid={errors.phone ? "true" : "false"}>
                  <label htmlFor="phone">
                    <span>
                      Phone Number <span className="req">*</span>
                    </span>
                    <span className="field-hint">For WhatsApp reminders</span>
                  </label>
                  <div className="phone-group">
                    <CountrySelect
                      value={form.country_iso}
                      onChange={onCountryChange}
                      disabled={submitting}
                    />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder={phonePlaceholder(form.country_iso)}
                      autoComplete="tel-national"
                      aria-invalid={errors.phone ? true : undefined}
                      aria-describedby={errors.phone ? "err-phone" : undefined}
                      value={form.phone}
                      onChange={(e) => {
                        // Digits only, capped at what the country allows — the
                        // field simply cannot hold "asdad".
                        const digits = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, phoneMaxDigits(form.country_iso));
                        update("phone", digits);
                      }}
                      onBlur={() => onBlurField("phone")}
                    />
                  </div>
                  {errors.phone && <ErrorText id="err-phone">{errors.phone}</ErrorText>}
                </div>

                <div className="field field-full" data-invalid={errors.town ? "true" : "false"}>
                  <label htmlFor="town">
                    Town / City <span className="req">*</span>
                  </label>
                  <input
                    id="town"
                    name="town"
                    type="text"
                    placeholder="Mumbai"
                    autoComplete="address-level2"
                    maxLength={60}
                    aria-invalid={errors.town ? true : undefined}
                    aria-describedby={errors.town ? "err-town" : undefined}
                    value={form.town}
                    onChange={(e) => update("town", e.target.value)}
                    onBlur={() => onBlurField("town")}
                  />
                  {errors.town && <ErrorText id="err-town">{errors.town}</ErrorText>}
                </div>
              </div>

              <ul className="trust-mini-row" aria-label="Security badges">
                <li>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  256-bit SSL
                </li>
                <li>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8.5 12 2.5 2.5 4.5-5" />
                  </svg>
                  PCI Compliant
                </li>
                <li>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8.5 12 2.5 2.5 4.5-5" />
                  </svg>
                  Razorpay Verified
                </li>
              </ul>

              {error && (
                <div className="checkout-error" role="alert">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.5v5M12 16.2v.2" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </form>
          </section>

          <p className="checkout-finetext">
            By completing this booking you agree to our{" "}
            <a href="/terms" className="finetext-link">Terms</a>,{" "}
            <a href="/privacy" className="finetext-link">Privacy Policy</a> &amp;{" "}
            <a href="/refund" className="finetext-link">Refund Policy</a>.
            <br />
            We never share your details. Your call slot is confirmed only after
            payment.
          </p>

          <div
            id="consent-box"
            className="consent-box"
            data-error={consentError && !consent ? "true" : "false"}
          >
            <label className="consent-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (e.target.checked) setConsentError(false);
                }}
                aria-describedby={
                  consentError && !consent ? "consent-error" : undefined
                }
              />
              <span>
                I understand that after payment, I&apos;ll wait up to{" "}
                <strong>10 seconds</strong> for the booking page to open, then
                select my preferred date and time to book my call.
              </span>
            </label>
            {consentError && !consent && (
              <p id="consent-error" className="consent-error" role="alert">
                Please tick this box to continue.
              </p>
            )}
          </div>

          {/* Desktop pay button — on mobile the sticky bar below carries it. */}
          <button
            type="button"
            className="pay-btn pay-btn-inline"
            onClick={() => onPay()}
            disabled={submitting}
          >
            {payLabel}
            {!submitting && payArrow}
          </button>
        </div>
      </div>

      {/* ==========================================================
          STICKY MOBILE PAY BAR
          ========================================================== */}
      <div className="pay-bar" role="region" aria-label="Payment">
        <div className="pay-bar-total">
          <span className="pbt-label">Total Due Today</span>
          <span className="pbt-amt">
            <span className="pbt-strike">{mrpLabel}</span>
            {priceLabel}
          </span>
        </div>
        <button
          type="button"
          className="pay-btn pay-btn-sticky"
          onClick={() => onPay()}
          disabled={submitting}
        >
          {submitting ? "Processing…" : `Pay ${priceLabel} and Book My Call`}
          {!submitting && payArrow}
        </button>
      </div>

      {/* Full-screen hold while the signature is verified and the webhook
          fires. Makes the 10-second promise visible so nobody closes the tab. */}
      {redirecting && (
        <div className="redirect-overlay" role="status" aria-live="polite">
          <div className="redirect-card">
            <span className="redirect-spinner" aria-hidden="true" />
            <h3>Payment received</h3>
            <p>
              Taking you to the calendar now. Please don&apos;t close or refresh
              this tab — this can take up to 10 seconds.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
