import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { UTM_KEYS, type Attribution } from "@/app/_lib/attribution";
import { validateCoupon, discountedPaise } from "@/app/_lib/coupon";

// Force this route to run as a serverless function on Node, not Edge
// (the razorpay SDK uses Node crypto).
export const runtime = "nodejs";

type Body = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  town?: string;
  coupon?: string;
  attribution?: Attribution;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    const required = ["first_name", "last_name", "email", "phone", "town"] as const;
    for (const field of required) {
      if (!body[field] || typeof body[field] !== "string") {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 }
        );
      }
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const baseAmount = parseInt(process.env.RAZORPAY_AMOUNT_PAISE || "9700", 10);
    const currency = process.env.RAZORPAY_CURRENCY || "INR";

    // Server-authoritative coupon check. The client price preview is advisory;
    // this is what actually decides the charge.
    const appliedCoupon = validateCoupon(body.coupon);
    const amount = discountedPaise(baseAmount, body.coupon);

    // A 100%-off coupon yields ₹0 — Razorpay can't create a zero-amount order,
    // so we short-circuit to a free booking. The verify route re-checks the
    // coupon before honouring it, so this can't be forged client-side.
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

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const notes: Record<string, string> = {
      first_name: body.first_name!,
      last_name: body.last_name!,
      email: body.email!,
      phone: `${body.country_code || "+91"} ${body.phone}`,
      town: body.town!,
      product: "1:1 Breakthrough Call",
    };
    if (appliedCoupon) notes.coupon = appliedCoupon.code;
    // Stamp campaign attribution onto the order so it shows in the Razorpay
    // dashboard (notes cap at 15 keys — the 5 UTM keys keep us well under).
    if (body.attribution) {
      for (const k of UTM_KEYS) {
        const v = body.attribution[k];
        if (v) notes[k] = String(v).slice(0, 256);
      }
    }

    const order = await rzp.orders.create({
      amount,
      currency,
      receipt: `srbk_${Date.now()}`,
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
