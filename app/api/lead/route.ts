import { NextRequest, NextResponse } from "next/server";
import { UTM_KEYS, type Attribution } from "@/app/_lib/attribution";
import { sha256, toOrigin, sendMetaLeadCapi } from "@/app/_lib/meta-capi";
import { dialCodeToCountryIso } from "@/app/_lib/country";

// Node runtime (uses node:crypto via sha256). Free funnel: this endpoint takes
// the popup lead form, writes one row to the CRM Google Sheet (through a webhook
// — Pabbly Connect OR a Google Apps Script Web App), and returns a lead id so
// the client can redirect to the Calendly booking page.
export const runtime = "nodejs";

type Body = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  weight_to_lose?: string;
  biggest_challenge?: string;
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
      console.error("Lead webhook responded", res.status, await res.text());
    }
  } catch (err) {
    console.error("Lead webhook error:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    const required = ["first_name", "last_name", "email", "phone"] as const;
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

    const phone = `${body.country_code || "+91"}${phoneDigits}`;
    const countryIso = dialCodeToCountryIso(body.country_code); // "+91" -> "IN"
    const externalId = sha256(email.toLowerCase());

    // Meta matching identifiers (read from cookies / headers, like the verify route).
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
    // CRM-lifecycle fields (attended, qualified, sale_closed, …) are reserved as
    // empty placeholders and filled later by downstream automation.
    const payload: Record<string, unknown> = {
      event: "lead_submitted",
      product: "Free Assessment Call",
      lead_id: leadId,
      created_at: new Date().toISOString(),
      first_name: body.first_name,
      last_name: body.last_name,
      email,
      phone,
      city: "",
      country_code: countryIso,
      weight_to_lose: body.weight_to_lose || "",
      biggest_challenge: body.biggest_challenge || "",
      fbc,
      fbp,
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
      external_id: externalId,
      event_source_url: originUrl,
      amount: 0,
      is_test: "false",
      full_name: `${body.first_name} ${body.last_name}`.trim(),
      landing_url: attribution.landing_url || "",
      referrer: attribution.referrer || "",
    };
    // UTM / click-id fields flattened to the top level.
    for (const k of UTM_KEYS) {
      payload[k] = attribution[k] || "";
    }

    await sendToSheet(payload);

    // Fire the free-registration Meta CAPI events (standard + custom).
    // Awaited (so it completes in serverless) but self-contained — it logs and
    // swallows its own errors, so a CAPI failure never fails the lead.
    await sendMetaLeadCapi({
      eventId: leadId,
      email,
      phone,
      firstName: body.first_name!,
      lastName: body.last_name!,
      city: "",
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
