import { NextRequest, NextResponse } from "next/server";
import { type Attribution } from "@/app/_lib/attribution";
import { sha256, toOrigin, resolveFbc, sendMetaLeadCapi } from "@/app/_lib/meta-capi";
import { dialCodeToCountryIso } from "@/app/_lib/country";

// Node runtime (uses node:crypto via sha256). Free UK funnel: this endpoint
// takes the registration modal, writes one row to the CRM Google Sheet (through
// a webhook — Pabbly Connect OR a Google Apps Script Web App), and returns a
// lead id so the client can redirect to the WhatsApp hand-off page (/wa-dm).
//
// There is no payment and no qualification step in this funnel — every valid
// submission is a lead.
export const runtime = "nodejs";

// UK-targeted ads, so an unspecified dial code defaults to the UK.
const DEFAULT_DIAL = "+44";

type Body = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  city?: string;
  attribution?: Attribution;
  eventSourceUrl?: string;
};

/**
 * Forward the lead to the Google Sheet. The webhook URL can be either a Pabbly
 * Connect "Webhook" trigger or a Google Apps Script Web App `/exec` URL — both
 * append a row. Best-effort: never fail the lead because the sheet is down.
 */
async function sendToSheet(payload: Record<string, unknown>) {
  const url = process.env.LEAD_WEBHOOK_URL || process.env.PABBLY_WEBHOOK_URL;
  if (!url) {
    console.warn("LEAD_WEBHOOK_URL / PABBLY_WEBHOOK_URL not set — skipping sheet write.");
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[lead] Pabbly webhook FAILED", res.status, await res.text());
    } else {
      console.log("[lead] Pabbly webhook accepted", res.status);
    }
  } catch (err) {
    console.error("[lead] Pabbly webhook error:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    const required = ["first_name", "last_name", "email", "phone", "city"] as const;
    for (const field of required) {
      if (!body[field] || typeof body[field] !== "string") {
        return NextResponse.json(
          { ok: false, error: `Please enter your ${field.replace("_", " ")}.` },
          { status: 400 }
        );
      }
    }

    const email = body.email!.trim();
    if (!/.+@.+\..+/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    const phoneDigits = (body.phone || "").replace(/\D/g, "");
    if (phoneDigits.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    const phone = `${body.country_code || DEFAULT_DIAL}${phoneDigits}`;
    const countryIso = dialCodeToCountryIso(body.country_code || DEFAULT_DIAL); // "+44" -> "GB"
    const city = (body.city || "").trim();
    const externalId = sha256(email.toLowerCase());

    const attribution = body.attribution || {};

    // Meta matching identifiers (read from cookies / headers) — same fetch logic
    // as the paid branch webhook. Hybrid _fbc: prefer the cookie, else rebuild
    // fb.1.<ts>.<fbclid> from the captured click id.
    const fbclid = attribution.fbclid || "";
    const fbclidTs = attribution.captured_at
      ? Date.parse(attribution.captured_at) || Date.now()
      : Date.now();
    const fbc = resolveFbc({
      cookieFbc: req.cookies.get("_fbc")?.value || "",
      fbclid,
      fbclidTs,
    });
    const fbp = req.cookies.get("_fbp")?.value || "";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const clientUserAgent = req.headers.get("user-agent") || "";

    const leadId = `lead_${Date.now()}`;
    const originUrl = toOrigin(body.eventSourceUrl);

    // Exact 25-field CRM payload, mirroring the paid branch webhook shape and
    // per-field logic. Free funnel: there is no payment, so amount is 0 and
    // purchase_event_id falls back to the lead id (same slot the paid webhook
    // used for the Razorpay payment id). CRM-lifecycle columns (call_booked,
    // schedule_capi_*, …) are filled downstream by the Sheet's Apps Script.
    const payload: Record<string, unknown> = {
      lead_id: leadId,
      created_at: new Date().toISOString(),
      first_name: body.first_name,
      last_name: body.last_name,
      email,
      phone: phoneDigits,
      city,
      country_code: countryIso,
      fbc,
      fbp,
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
      external_id: externalId,
      event_source_url: originUrl,
      amount: 0,
      is_test: "false",
      purchase_event_id: leadId,
      utm_source: attribution.utm_source || "",
      utm_medium: attribution.utm_medium || "",
      utm_campaign: attribution.utm_campaign || "",
      utm_content: attribution.utm_content || "",
      utm_term: attribution.utm_term || "",
      fbclid,
      landing_page_url: attribution.landing_url || "",
      referrer: attribution.referrer || "",
    };

    console.log(`[lead] ${leadId} received. Pabbly payload:`, JSON.stringify(payload));
    await sendToSheet(payload);

    // Fire the free-registration Meta CAPI event — the custom `registration_complete`
    // ONLY (H&W custom-only; no standard CompleteRegistration). There is no
    // qualification step in this funnel, so no QualifiedLead is fired. Awaited so
    // it completes in serverless, but self-contained — it logs and swallows its
    // own errors, so a CAPI failure never fails the lead. event_id is stable per
    // email so Meta's 48h dedup collapses a genuine re-submit by the same person.
    await sendMetaLeadCapi({
      eventId: `reg_${externalId}`,
      email,
      phone,
      firstName: body.first_name!,
      lastName: body.last_name!,
      city,
      countryCode: countryIso,
      eventSourceUrl: originUrl,
      fbc,
      fbp,
      clientIp,
      clientUserAgent,
    });

    return NextResponse.json({ ok: true, leadId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not submit your details.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
