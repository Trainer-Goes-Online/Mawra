import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { UTM_KEYS, type Attribution } from "@/app/_lib/attribution";
import { sendMetaCapiEvent, sha256, toOrigin } from "@/app/_lib/meta-capi";
import { dialCodeToCountryIso } from "@/app/_lib/country";
import { validateCoupon, discountedPaise } from "@/app/_lib/coupon";
import { getAmountPaise } from "@/app/_lib/price";

export const runtime = "nodejs";

type Customer = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  town?: string;
};

type Body = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  customer?: Customer;
  attribution?: Attribution;
  amount?: number; // in paise (from the created order)
  currency?: string;
  eventSourceUrl?: string; // page URL at conversion (reduced to origin server-side)
  free?: boolean; // true for a 100%-off coupon booking (no Razorpay payment)
  coupon?: string;
};

/**
 * Fire the Pabbly Connect webhook with the full lead + payment + attribution
 * payload. Best-effort: a webhook failure must never fail a verified payment.
 * Awaited (not fire-and-forget) so it completes before the serverless function
 * is frozen on Vercel.
 */
async function sendToPabbly(payload: Record<string, unknown>) {
  const url = process.env.PABBLY_WEBHOOK_URL;
  if (!url) {
    console.warn("PABBLY_WEBHOOK_URL not set — skipping webhook.");
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Pabbly webhook responded", res.status, await res.text());
    }
  } catch (err) {
    console.error("Pabbly webhook error:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      attribution,
      amount,
      currency,
      eventSourceUrl,
      free,
      coupon,
    } = body;

    // The identifier used everywhere downstream (lead_id / CAPI event_id / the
    // ?p= query on the booking page). For paid orders it's the Razorpay payment
    // id; for free coupon bookings we mint a synthetic one.
    let paymentId: string;
    // Server-authoritative coupon code that ends up in the CRM payload.
    const appliedCouponCode = validateCoupon(coupon)?.code || "";

    if (free) {
      // ── FREE BOOKING (100%-off coupon, no Razorpay payment) ──
      // Re-validate server-side: only a coupon that genuinely reduces the price
      // to ₹0 can authorize a booking without a payment. This is the gate that
      // makes the client-side free:true unforgeable.
      const finalPaise = discountedPaise(getAmountPaise(), coupon);
      if (!appliedCouponCode || finalPaise > 0) {
        return NextResponse.json(
          { ok: false, error: "Invalid or non-free coupon" },
          { status: 400 }
        );
      }
      paymentId = `coupon_${appliedCouponCode}_${Date.now()}`;
    } else {
      // ── PAID ORDER — verify the Razorpay signature ──
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { ok: false, error: "Missing Razorpay payment fields" },
          { status: 400 }
        );
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return NextResponse.json(
          { ok: false, error: "Razorpay secret not configured." },
          { status: 500 }
        );
      }

      // Razorpay signs `${order_id}|${payment_id}` with HMAC SHA256 using the secret.
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const expectedBuf = Buffer.from(expected);
      const gotBuf = Buffer.from(razorpay_signature);
      const valid =
        expectedBuf.length === gotBuf.length &&
        crypto.timingSafeEqual(expectedBuf, gotBuf);

      if (!valid) {
        return NextResponse.json(
          { ok: false, error: "Signature verification failed" },
          { status: 400 }
        );
      }

      paymentId = razorpay_payment_id;
    }

    // Authentic (signed payment, or validated free coupon).
    const c = customer || {};
    const phone = c.phone
      ? `${c.country_code || "+91"}${c.phone}`.replace(/\s+/g, "")
      : "";

    // ---- Meta matching identifiers (shared by CAPI + the Pabbly CRM payload) ----
    const fbc = req.cookies.get("_fbc")?.value || "";
    const fbp = req.cookies.get("_fbp")?.value || "";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const clientUserAgent = req.headers.get("user-agent") || "";

    const email = c.email || "";
    const countryIso = dialCodeToCountryIso(c.country_code); // "+91" → "IN"
    const externalId = email ? sha256(email.trim().toLowerCase()) : "";
    const amountRupees = typeof amount === "number" ? amount / 100 : 0;
    const resolvedCurrency = currency || "INR";
    // Origin-only — never leak path/UTMs to Meta (H&W posture). Also what the
    // downstream Apps Script events reuse as their event_source_url.
    const originUrl = toOrigin(eventSourceUrl);

    // is_test: test Razorpay keys (rzp_test_) are non-production. A ₹0 / missing
    // amount is also treated as a test/bypass order. These skip CAPI so QA never
    // pollutes the ad algorithm.
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const isFreeOrder = !(amountRupees > 0);
    const isTest = isFreeOrder || keyId.startsWith("rzp_test_");

    // ---- Fire the Meta CAPI custom `sales` event (custom-only, H&W posture) ----
    // Best-effort: a CAPI failure must never fail a verified payment.
    const metaPixelId = process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (metaPixelId && metaAccessToken && !isFreeOrder) {
      try {
        await sendMetaCapiEvent({
          pixelId: metaPixelId,
          accessToken: metaAccessToken,
          paymentId,
          email,
          phone,
          firstName: c.first_name || "",
          lastName: c.last_name || "",
          city: c.town || "",
          countryCode: countryIso,
          eventSourceUrl: originUrl,
          fbc: fbc || undefined,
          fbp: fbp || undefined,
          clientIp: clientIp || undefined,
          clientUserAgent: clientUserAgent || undefined,
          valueRupees: amountRupees,
          currency: resolvedCurrency,
          testEventCode: process.env.META_TEST_EVENT_CODE || undefined,
        });
      } catch (err) {
        console.error("[verify] Meta CAPI error:", err);
      }
    }

    // ---- Enriched Pabbly CRM payload (23 canonical fields, A–W of the Sheet) ----
    // Every field is always present (""/0 when empty) so Pabbly's column mapping
    // stays stable. Extra keys (product/full_name/gclid) are harmless — Pabbly
    // maps only what the Sheet needs.
    const payload: Record<string, unknown> = {
      event: "payment_success",
      product: "1:1 Breakthrough Call",
      // 23-field CRM schema (columns A–W)
      lead_id: paymentId, // 1
      created_at: new Date().toISOString(), // 2
      first_name: c.first_name || "", // 3
      last_name: c.last_name || "", // 4
      email, // 5
      phone, // 6
      city: c.town || "", // 7
      country_code: countryIso, // 8  (2-letter ISO)
      fbc, // 9
      fbp, // 10
      client_ip_address: clientIp, // 11
      client_user_agent: clientUserAgent, // 12
      external_id: externalId, // 13
      event_source_url: originUrl, // 14 (origin-only)
      amount: amountRupees, // 15 (rupees)
      is_test: isTest ? "true" : "false", // 16
      purchase_event_id: paymentId, // 17 (= lead_id / CAPI event_id)
      // utm_source/medium/campaign/content/term (18–22) + fbclid (23) filled below
      // ---- extras kept for backwards-compat / convenience ----
      order_id: razorpay_order_id || "",
      coupon: appliedCouponCode,
      amount_paise: amount ?? null,
      currency: resolvedCurrency,
      full_name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
      landing_url: attribution?.landing_url || "",
      referrer: attribution?.referrer || "",
      captured_at: attribution?.captured_at || "",
      timestamp: new Date().toISOString(),
    };
    // Flatten UTM / click-id keys to the top level (covers fields 18–23 + gclid).
    for (const k of UTM_KEYS) {
      payload[k] = attribution?.[k] || "";
    }

    await sendToPabbly(payload);

    return NextResponse.json({ ok: true, paymentId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
