"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
  UTM_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  utmQueryString,
  type Attribution,
} from "../_lib/attribution";
import { setMetaAdvancedMatching } from "../_lib/analytics";
import { dialCodeToCountryIso } from "../_lib/country";
import { validateCoupon, type AppliedCoupon } from "../_lib/coupon";

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
  modal?: { ondismiss?: () => void };
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
  town: string;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country_code: "+91",
  town: "",
};

/** Pure INR formatter (client-safe — no env access, unlike app/_lib/price.ts). */
function formatINR(paise: number): string {
  const rupees = paise / 100;
  const body = Number.isInteger(rupees)
    ? rupees.toLocaleString("en-IN")
    : rupees.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `₹${body}`;
}

export default function CheckoutClient({
  priceLabel = "₹97",
  amountPaise = 9700,
}: {
  priceLabel?: string;
  amountPaise?: number;
}) {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Coupon state (shared between the form input and the order-summary total).
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<
    { type: "ok" | "err"; text: string } | null
  >(null);

  // Order-summary accordion (mobile only — CSS forces it open on desktop).
  const [summaryOpen, setSummaryOpen] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  // Attribution captured on the landing page (localStorage), merged with any
  // UTMs present on the current checkout URL.
  const attributionRef = useRef<Attribution>({});

  // Live discounted price derived from the applied coupon.
  const discountedPaise = coupon
    ? Math.max(0, Math.round(amountPaise * (1 - coupon.percentOff / 100)))
    : amountPaise;
  const isFree = discountedPaise <= 0;
  const discountedLabel = formatINR(discountedPaise);

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

  // Fire Manual Advanced Matching as soon as the form is fully filled + valid —
  // independent of whether the user pays. This identifies all subsequent pixel
  // events AND persists hashed identity to the tgo_mam cookie (so even a return
  // visit gets a high-EMQ PageView). Debounced 500ms. Custom-only H&W posture:
  // this only enriches PageView — it does NOT fire any conversion event.
  useEffect(() => {
    const allFilled =
      form.first_name.trim() &&
      form.last_name.trim() &&
      form.email.trim() &&
      form.town.trim() &&
      form.phone.trim();
    if (!allFilled) return;
    const emailOk = /.+@.+\..+/.test(form.email.trim());
    const phoneOk = /^[0-9]{6,15}$/.test(form.phone.trim());
    if (!emailOk || !phoneOk) return;

    const timer = setTimeout(() => {
      void setMetaAdvancedMatching({
        email: form.email,
        phone: `${form.country_code}${form.phone}`,
        firstName: form.first_name,
        lastName: form.last_name,
        city: form.town,
        country: dialCodeToCountryIso(form.country_code),
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  function applyCoupon() {
    const c = validateCoupon(couponInput);
    if (!c) {
      setCoupon(null);
      setCouponMsg({ type: "err", text: "That coupon code isn't valid." });
      return;
    }
    setCoupon(c);
    setCouponMsg({
      type: "ok",
      text:
        c.percentOff >= 100
          ? `Coupon ${c.code} applied — your call is free!`
          : `Coupon ${c.code} applied — ${c.percentOff}% off.`,
    });
    // Reveal the summary so the new total is visible on mobile.
    setSummaryOpen(true);
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMsg(null);
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

  /** Shared success redirect (used by both the paid + free-coupon flows). */
  function goToBooking(paymentId: string) {
    const utmQs = utmQueryString(attributionRef.current);
    window.location.href =
      `/book-a-call?p=${encodeURIComponent(paymentId)}` +
      (utmQs ? `&${utmQs}` : "");
  }

  async function onPay(e?: FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    // Native HTML5 validation first
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    setSubmitting(true);
    try {
      // 1) Server-side: create Razorpay order (server re-validates the coupon
      //    and decides the real charge — a 100%-off coupon returns free:true).
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          coupon: coupon?.code,
          attribution: attributionRef.current,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData?.error || "Order failed");

      // Persist the latest identity to the pixel before conversion.
      const mam = {
        email: form.email,
        phone: `${form.country_code}${form.phone}`,
        firstName: form.first_name,
        lastName: form.last_name,
        city: form.town,
        country: dialCodeToCountryIso(form.country_code),
      };

      // ── FREE ORDER (100%-off coupon) — skip Razorpay entirely ──
      if (orderData.free) {
        await setMetaAdvancedMatching(mam);
        const v = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            free: true,
            coupon: coupon?.code,
            customer: form,
            attribution: attributionRef.current,
            amount: 0,
            currency: orderData.currency || "INR",
            eventSourceUrl:
              typeof window !== "undefined" ? window.location.href : undefined,
          }),
        });
        const vd = await v.json();
        if (!v.ok || !vd.ok) throw new Error(vd?.error || "Could not confirm booking");
        goToBooking(vd.paymentId);
        return;
      }

      // ── PAID ORDER — open the Razorpay modal ──
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load Razorpay. Please retry.");
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Coach Mawra",
        description: "1:1 Breakthrough Call",
        order_id: orderData.orderId,
        prefill: {
          name: `${form.first_name} ${form.last_name}`.trim(),
          email: form.email,
          contact: `${form.country_code}${form.phone}`,
        },
        // Lock the contact + email to what the customer entered on our form, so
        // Razorpay can't substitute a previously-remembered contact on this
        // device. Keeps the payment record consistent with the lead we send to
        // Pabbly.
        readonly: { email: true, contact: true },
        notes: {
          town: form.town,
          ...(coupon ? { coupon: coupon.code } : {}),
        },
        theme: { color: "#0A50C2" },
        handler: async (response) => {
          // 4) Verify signature on server
          try {
            // Refresh MAM with the latest form values right before conversion so
            // the persisted identity is as complete as possible for the pixel.
            await setMetaAdvancedMatching(mam);

            const v = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                customer: form,
                coupon: coupon?.code,
                attribution: attributionRef.current,
                amount: orderData.amount,
                currency: orderData.currency,
                // The page the user is on at conversion. The server reduces this
                // to origin-only before sending to Meta (H&W: no path/UTM leak).
                eventSourceUrl:
                  typeof window !== "undefined"
                    ? window.location.href
                    : undefined,
              }),
            });
            const vd = await v.json();
            if (!v.ok || !vd.ok) throw new Error(vd?.error || "Verification failed");
            goToBooking(response.razorpay_payment_id);
          } catch (err) {
            setSubmitting(false);
            const msg = err instanceof Error ? err.message : "Verification error";
            setError(msg);
          }
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

  return (
    <div className="checkout-cards">
      {/* === Step 1 — Your Details (form) === */}
      <section className="checkout-card details-card">
        <header className="step-head">
          <span className="step-num">1</span>
          <div>
            <h2 className="step-title">Your Details</h2>
            <p className="step-sub">We'll send your call link to these details.</p>
          </div>
        </header>

        <form ref={formRef} className="checkout-form" onSubmit={onPay} noValidate>
          <input type="hidden" name="landing_url" value="/" />

          <div className="form-grid">
            <div className="field">
              <label htmlFor="first_name">
                First Name <span className="req">*</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="Priya"
                required
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="last_name">
                Last Name <span className="req">*</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Sharma"
                required
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
            </div>
            <div className="field field-full">
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
                placeholder="priya@example.com"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="field field-full">
              <label htmlFor="phone">
                <span>
                  Phone Number <span className="req">*</span>
                </span>
                <span className="field-hint">For WhatsApp reminders</span>
              </label>
              <div className="phone-group">
                <select
                  name="country_code"
                  value={form.country_code}
                  onChange={(e) => update("country_code", e.target.value)}
                  aria-label="Country code"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+60">🇲🇾 +60</option>
                  <option value="+64">🇳🇿 +64</option>
                  <option value="+27">🇿🇦 +27</option>
                  <option value="+966">🇸🇦 +966</option>
                </select>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="9876543210"
                  required
                  pattern="[0-9]{6,15}"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="field field-full">
              <label htmlFor="town">
                Town / City <span className="req">*</span>
              </label>
              <input
                id="town"
                name="town"
                type="text"
                placeholder="Mumbai"
                required
                value={form.town}
                onChange={(e) => update("town", e.target.value)}
              />
            </div>
          </div>

          {/* === Coupon row === */}
          <div className="coupon-row">
            <label htmlFor="coupon" className="coupon-label">
              Have a coupon?
            </label>
            <div className="coupon-input-group">
              <input
                id="coupon"
                name="coupon"
                type="text"
                placeholder="Enter code"
                autoComplete="off"
                value={couponInput}
                disabled={!!coupon}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (couponMsg) setCouponMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
              />
              {coupon ? (
                <button
                  type="button"
                  className="coupon-btn coupon-btn-remove"
                  onClick={removeCoupon}
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="coupon-btn"
                  onClick={applyCoupon}
                  disabled={!couponInput.trim()}
                >
                  Apply
                </button>
              )}
            </div>
            {couponMsg && (
              <p
                className={`coupon-msg coupon-msg-${couponMsg.type}`}
                role="status"
              >
                {couponMsg.text}
              </p>
            )}
          </div>

          <ul className="trust-mini-row" aria-label="Security badges">
            <li>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              SSL Secure
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
              </svg>
              Verified
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 5 5L20 7" />
              </svg>
              Protected
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              Instant
            </li>
          </ul>

          {/* Accepted payment methods — official brand logos */}
          <div className="pay-methods" aria-label="Accepted payment methods">
            <span className="pay-methods-label">Accepted Payment Methods</span>
            <ul className="pay-methods-list">
              <li className="pm"><img src="/assets/payment/upi.svg" alt="UPI" loading="lazy" /></li>
              <li className="pm"><img src="/assets/payment/visa.svg" alt="Visa" loading="lazy" /></li>
              <li className="pm"><img src="/assets/payment/mastercard.svg" alt="Mastercard" loading="lazy" /></li>
              <li className="pm"><img src="/assets/payment/rupay.svg" alt="RuPay" loading="lazy" /></li>
              <li className="pm"><img src="/assets/payment/amex.svg" alt="American Express" loading="lazy" /></li>
              <li className="pm"><img src="/assets/payment/netbanking.svg" alt="Net Banking" loading="lazy" /></li>
            </ul>
          </div>

          {error && <div className="checkout-error" role="alert">{error}</div>}
        </form>
      </section>

      {/* === Step 2 — Order Summary (accordion: collapsed on mobile, open on desktop) === */}
      <section className="checkout-card order-card">
        <button
          type="button"
          className="order-acc-toggle"
          aria-expanded={summaryOpen}
          aria-controls="order-acc-body"
          data-open={summaryOpen ? "true" : "false"}
          onClick={() => setSummaryOpen((o) => !o)}
        >
          <span className="step-head order-acc-head">
            <span className="step-num">2</span>
            <span className="step-title">Order Summary</span>
          </span>
          <span className="order-acc-extra" aria-hidden="true">
            <span className="order-acc-total">{discountedLabel}</span>
            <svg className="order-acc-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>

        <div
          id="order-acc-body"
          className="order-acc-body"
          data-open={summaryOpen ? "true" : "false"}
        >
          <div className="order-acc-inner">
            <div className="order-row">
              <div className="order-line">
                <h4 className="order-name">1:1 Breakthrough Call</h4>
                <p className="order-meta">60 minutes · No prep · One conversation</p>
              </div>
              <div className="order-price">
                <span className="strike">₹1,499</span>
                <span className="now">{discountedLabel}</span>
              </div>
            </div>

            {coupon && (
              <div className="order-discount-row">
                <span className="order-discount-tag">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 5H7a2 2 0 0 0-2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 0 2 2h2" />
                    <path d="M15 5h2a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2h-2" />
                    <path d="M9 5v14" strokeDasharray="2 3" />
                  </svg>
                  Coupon {coupon.code}
                </span>
                <span className="order-discount-amt">
                  −{formatINR(amountPaise - discountedPaise)}
                </span>
              </div>
            )}

            <div className="order-total">
              <span className="lbl">Total Due Today</span>
              <span className="amt">{discountedLabel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky pay bar — fixed to the viewport bottom, triggers onPay */}
      <aside className="pay-bar" aria-label="Payment bar">
        <div className="pay-bar-inner">
          <p className="pay-guarantee">
            <span className="seal" aria-hidden="true"></span>
            100% money-back guarantee if the call doesn't deliver value.
          </p>
          <button
            type="button"
            className="pay-btn"
            onClick={() => onPay()}
            disabled={submitting}
          >
            {submitting ? (
              <>Processing&hellip;</>
            ) : isFree ? (
              <>
                Confirm My Booking · Free
                <span className="ar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </>
            ) : (
              <>
                Pay Now · {discountedLabel}
                <span className="ar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
