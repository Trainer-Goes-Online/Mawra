import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { type Attribution } from "@/app/_lib/attribution";
import { dialCodeToCountryIso } from "@/app/_lib/country";
import { validateCoupon, discountedPaise } from "@/app/_lib/coupon";

// Node runtime (razorpay SDK uses node crypto).
export const runtime = "nodejs";

// Canonical checkout URL — used as event_source_url for Meta CAPI (origin-only
// after toOrigin) so no path/UTM leaks (H&W posture).
const CHECKOUT_URL = "https://vsl.transformationsandbeyond.com/checkout";

type Customer = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string; // digits only
  country_code?: string; // dial code, e.g. "+91"
  town?: string;
};

type Body = {
  customer?: Customer;
  attribution?: Attribution;
  coupon?: string;
};

/** Razorpay notes cap: 15 keys, 256 chars/value. Never send a raw over-long value. */
const trunc = (v: string | undefined | null, n = 256): string =>
  (v || "").slice(0, n);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const c = body.customer || {};
    const attr = body.attribution || {};

    const required: (keyof Customer)[] = ["first_name", "last_name", "email", "phone", "town"];
    for (const field of required) {
      if (!c[field] || typeof c[field] !== "string") {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const baseAmount = parseInt(process.env.RAZORPAY_AMOUNT_PAISE || "9700", 10);
    const currency = process.env.RAZORPAY_CURRENCY || "INR";

    // Server-authoritative coupon check (client price preview is advisory).
    const appliedCoupon = validateCoupon(body.coupon);
    const amount = discountedPaise(baseAmount, body.coupon);

    // A 100%-off coupon → ₹0 → Razorpay can't create the order → free booking.
    // The (client) success path re-validates before honouring it.
    if (amount <= 0) {
      return NextResponse.json({
        free: true,
        amount: 0,
        currency,
        coupon: appliedCoupon?.code || null,
      });
    }

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys not configured on the server." },
        { status: 500 }
      );
    }

    // ---- Meta matching identifiers, snapshotted at order-create time ----
    // The Razorpay webhook is server-to-server (no browser cookies), so we pack
    // everything it needs into order.notes. Razorpay propagates order notes onto
    // the payment entity automatically.
    const phoneDigits = (c.phone || "").replace(/\D/g, "");
    const dial = c.country_code || "+91";
    const countryIso = dialCodeToCountryIso(dial); // "+91" -> "IN"
    const cookieFbc = req.cookies.get("_fbc")?.value || "";
    const cookieFbp = req.cookies.get("_fbp")?.value || "";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const clientUserAgent = req.headers.get("user-agent") || "";

    // Consolidated blobs keep us well under the 15-key notes cap.
    const cust = JSON.stringify({
      fn: c.first_name || "",
      ln: c.last_name || "",
      em: c.email || "",
      ph: phoneDigits,
      ct: c.town || "",
      co: countryIso,
      dl: dial,
    });
    const utm = JSON.stringify({
      s: attr.utm_source || "",
      m: attr.utm_medium || "",
      c: attr.utm_campaign || "",
      n: attr.utm_content || "",
      t: attr.utm_term || "",
    });

    const notes: Record<string, string> = {
      kind: "client_funnel", // webhook gate — ignore anything else on this account
      cust: trunc(cust),
      utm: trunc(utm),
      clid: trunc(attr.fbclid), // fbclid — hybrid _fbc rebuild + Pabbly
      fbc: trunc(cookieFbc),
      fbp: trunc(cookieFbp),
      ip: trunc(clientIp, 45),
      ua: trunc(clientUserAgent),
      esu: CHECKOUT_URL,
      lp: trunc(attr.landing_url), // Pabbly landing_page_url
      ref: trunc(attr.referrer), // Pabbly referrer
      ts: String(attr.captured_at ? Date.parse(attr.captured_at) || Date.now() : Date.now()),
    };
    if (appliedCoupon) notes.coupon = appliedCoupon.code;

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await rzp.orders.create({
      amount,
      currency,
      receipt: `mwdc_${Date.now()}`,
      notes,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Order creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
