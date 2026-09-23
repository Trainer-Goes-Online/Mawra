import { NextRequest, NextResponse } from "next/server";
import { UTM_KEYS, type Attribution } from "@/app/_lib/attribution";
import { sha256, toOrigin, sendMetaLeadCapi, sendMetaQualifiedLeadCapi } from "@/app/_lib/meta-capi";
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

    // Meta matching identifiers (read from cookies / headers).
    const fbc = req.cookies.get("_fbc")?.value || "";
    const fbp = req.cookies.get("_fbp")?.value || "";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const clientUserAgent = req.headers.get("user-agent") || "";

    const attribution = body.attribution || {};
    const leadId = `lead_${Date.now()}`;
    const originUrl = toOrigin(body.eventSourceUrl);

    // One row per lead. Stable keys so the Sheet column mapping never shifts;
    // CRM-lifecycle fields (contacted, replied, sale_closed, …) are reserved as
    // empty placeholders and filled later by downstream automation.
    const payload: Record<string, unknown> = {
      event: "lead_submitted",
      product: "Free Consultation · UK",
      lead_id: leadId,
      created_at: new Date().toISOString(),
      first_name: body.first_name,
      last_name: body.last_name,
      email,
      phone,
      city,
      country_code: countryIso,
      fbc,
      fbp,
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
      external_id: externalId,
      event_source_url: originUrl,
      is_test: "false",
      full_name: `${body.first_name} ${body.last_name}`.trim(),
      landing_url: attribution.landing_url || "",
      referrer: attribution.referrer || "",
    };
    // UTM / click-id fields flattened to the top level.
    for (const k of UTM_KEYS) {
      payload[k] = attribution[k] || "";
    }

    console.log(`[lead] ${leadId} received. Pabbly payload:`, JSON.stringify(payload));
    await sendToSheet(payload);

    // Shared Meta identity for both CAPI events below.
    const identity = {
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
    };

    // Fire the free-registration Meta CAPI events (standard + custom).
    // Awaited (so they complete in serverless) but self-contained — each logs
    // and swallows its own errors, so a CAPI failure never fails the lead.
    // event_id is stable per email (not the per-submit lead_id) so Meta's 48h
    // dedup collapses a genuine re-submit by the same person.
    await sendMetaLeadCapi({ eventId: `reg_${externalId}`, ...identity });

    // QualifiedLead used to be gated on the old investment question. That
    // qualification step is gone with the paid funnel, so every registration now
    // counts — the event keeps firing so campaigns already optimising against it
    // don't go blind.
    await sendMetaQualifiedLeadCapi({ eventId: `qual_${externalId}`, ...identity });

    return NextResponse.json({ ok: true, leadId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not submit your details.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
