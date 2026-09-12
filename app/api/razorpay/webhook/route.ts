import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendMetaCapiEvent, sha256, toOrigin, resolveFbc } from "@/app/_lib/meta-capi";

// Razorpay-triggered, server-to-server. This is the SOLE tracking authority for
// the paid funnel: it fires Purchase + sales (Meta CAPI) and the Pabbly CRM row
// on payment.captured — independent of whether the buyer returned to the funnel
// tab (fixes lost UPI-app payers). Razorpay retries on non-200; Meta dedups on
// event_id (payment id) within 48h. Every log line carries the paymentId.
export const runtime = "nodejs";

type Notes = Record<string, string> | undefined;

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function sendToPabbly(payload: Record<string, unknown>, paymentId: string): Promise<"sent" | "skipped" | "error"> {
  const url = process.env.PABBLY_WEBHOOK_URL;
  if (!url) {
    console.warn(`[webhook] paymentId=${paymentId} PABBLY_WEBHOOK_URL not set — skipping`);
    return "skipped";
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[webhook] paymentId=${paymentId} Pabbly FAILED`, res.status, await res.text());
      return "error";
    }
    console.log(`[webhook] paymentId=${paymentId} Pabbly sent (${res.status})`);
    return "sent";
  } catch (err) {
    console.error(`[webhook] paymentId=${paymentId} Pabbly error:`, err);
    return "error";
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1) HMAC signature verify — MUST use the raw body bytes.
    const raw = await req.text();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set");
      return NextResponse.json({ ok: false, error: "secret_not_configured" }, { status: 500 });
    }
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
    }

    // 2) Event filter.
    const body = parseJson<Record<string, unknown>>(raw, {});
    const event = body.event as string | undefined;
    if (event !== "payment.captured") {
      return NextResponse.json({ ok: true, ignored: true, reason: "event_not_captured", event });
    }

    // 3) Extract the payment entity.
    const payment = (body as { payload?: { payment?: { entity?: Record<string, unknown> } } })
      ?.payload?.payment?.entity;
    if (!payment) {
      return NextResponse.json({ ok: false, error: "no_payment_entity" }, { status: 400 });
    }
    const paymentId = String(payment.id || "");

    // 4) Kind gate — ignore payments that didn't originate in this funnel.
    const notes = payment.notes as Notes;
    if (!notes || notes.kind !== "client_funnel") {
      return NextResponse.json({ ok: true, ignored: true, reason: "kind_mismatch", kind: notes?.kind || null });
    }
    console.log(`[webhook] paymentId=${paymentId} signature verified, kind matched: client_funnel`);

    // 5) Unpack notes.
    const cust = parseJson<{ fn?: string; ln?: string; em?: string; ph?: string; ct?: string; co?: string; dl?: string }>(notes.cust, {});
    const utm = parseJson<{ s?: string; m?: string; c?: string; n?: string; t?: string }>(notes.utm, {});
    const fbclid = notes.clid || "";
    const fbclidTs = Number(notes.ts) || undefined;
    const fbp = notes.fbp || "";
    const clientIp = notes.ip || "";
    const clientUserAgent = notes.ua || "";
    const esu = notes.esu || "";
    const landingPageUrl = notes.lp || "";
    const referrer = notes.ref || "";

    // 6) Server-derived fields.
    const amountPaise = typeof payment.amount === "number" ? payment.amount : parseInt(String(payment.amount || "0"), 10);
    const amountRupees = Math.round(amountPaise / 100);
    const currency = String(payment.currency || process.env.RAZORPAY_CURRENCY || "INR");
    const createdAtSec = typeof payment.created_at === "number" ? payment.created_at : Math.floor(Date.now() / 1000);
    const createdAtIso = new Date(createdAtSec * 1000).toISOString();
    const email = cust.em || "";
    const externalId = email ? sha256(email.trim().toLowerCase()) : "";
    const countryIso = cust.co || "";

    // Hybrid _fbc — prefer the cookie value snapshotted at order-create, else
    // rebuild from the captured fbclid.
    const fbc = resolveFbc({ cookieFbc: notes.fbc || "", fbclid, fbclidTs });

    // is_test: test Razorpay keys or a ₹0 order → QA. Skips CAPI (never pollutes
    // the ad algorithm) but still writes a Pabbly row (flagged is_test=true).
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const isTest = amountRupees <= 0 || keyId.startsWith("rzp_test_");

    // 7) Meta CAPI — Purchase + sales. Best-effort; never fails the webhook.
    let capi: "sent" | "skipped" | "error" = "skipped";
    const metaPixelId = process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (metaPixelId && metaAccessToken && !isTest) {
      try {
        await sendMetaCapiEvent({
          pixelId: metaPixelId,
          accessToken: metaAccessToken,
          paymentId, // event_id
          email,
          phone: `${cust.dl || ""}${cust.ph || ""}`, // dial+digits for match quality
          firstName: cust.fn || "",
          lastName: cust.ln || "",
          city: cust.ct || "",
          countryCode: countryIso,
          eventSourceUrl: esu, // reduced to origin inside sendMetaCapiEvent
          fbc: fbc || undefined,
          fbp: fbp || undefined,
          clientIp: clientIp || undefined,
          clientUserAgent: clientUserAgent || undefined,
          valueRupees: amountRupees,
          currency,
          testEventCode: process.env.META_TEST_EVENT_CODE || undefined,
        });
        capi = "sent";
        console.log(`[webhook] paymentId=${paymentId} Meta CAPI sent (Purchase + sales)`);
      } catch (err) {
        capi = "error";
        console.error(`[webhook] paymentId=${paymentId} Meta CAPI error:`, err);
      }
    }

    // 8) Pabbly CRM row — EXACTLY the 25 agreed fields, always present.
    const pabblyPayload: Record<string, unknown> = {
      lead_id: paymentId,
      created_at: createdAtIso,
      first_name: cust.fn || "",
      last_name: cust.ln || "",
      email,
      phone: cust.ph || "",
      city: cust.ct || "",
      country_code: countryIso,
      fbc,
      fbp,
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
      external_id: externalId,
      event_source_url: esu,
      amount: amountRupees,
      is_test: isTest ? "true" : "false",
      purchase_event_id: paymentId,
      utm_source: utm.s || "",
      utm_medium: utm.m || "",
      utm_campaign: utm.c || "",
      utm_content: utm.n || "",
      utm_term: utm.t || "",
      fbclid,
      landing_page_url: landingPageUrl,
      referrer,
    };
    const pabbly = await sendToPabbly(pabblyPayload, paymentId);

    return NextResponse.json({ ok: true, paymentId, kind: "client_funnel", pabbly, capi });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "webhook_error";
    console.error("[webhook] error:", message);
    // 200 so Razorpay doesn't hammer retries on our own bug; logs capture it.
    return NextResponse.json({ ok: false, error: message });
  }
}
