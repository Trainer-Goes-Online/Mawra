import { NextRequest, NextResponse } from "next/server";
import { sha256, toOrigin } from "@/app/_lib/meta-capi";
import { TRACKING_HOST } from "@/app/_lib/tracking";

// Server-side Meta CAPI: standard `Schedule` + custom `call_booked`, fired when
// the visitor completes the Calendly booking. Sends BOTH events in one call
// (same event_id, different event_name) — mirrors the free-registration pair.
// user_data is enriched from the tgo_mam cookie (already-hashed em/ph/fn/ln/
// country/external_id set at form-fill) → high EMQ, plus fbc/fbp/IP/UA. Once per
// browser (client flag) + Meta's 48h event_id dedup. Never fails the booking.
export const runtime = "nodejs";

const GRAPH_API_VERSION = "v25.0";
// H&W: `Schedule` (standard) is blocked by name on a restricted dataset; the
// neutral custom `call_booked` is the signal that keeps flowing. Both fire, both
// env-configurable so they can be recoded (roadmap Scenario C) without a deploy.
const SCHEDULE_STANDARD_EVENT = process.env.SCHEDULE_STANDARD_EVENT || "Schedule";
const SCHEDULE_CUSTOM_EVENT = process.env.SCHEDULE_CUSTOM_EVENT || "call_booked";

/** Pull the already-hashed MAM identity out of the tgo_mam cookie, if present. */
function readMam(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    if ((req.headers.get("host") || "") !== TRACKING_HOST) {
      return NextResponse.json({ ok: true, skipped: "host" });
    }

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (!pixelId || !accessToken) {
      return NextResponse.json({ ok: true, skipped: "env_missing" });
    }

    let body: { eventSourceUrl?: string; leadId?: string } = {};
    try {
      body = await req.json();
    } catch {
      /* beacon may send an empty body during navigation */
    }

    const fbc = req.cookies.get("_fbc")?.value || undefined;
    const fbp = req.cookies.get("_fbp")?.value || undefined;
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const clientUserAgent = req.headers.get("user-agent") || undefined;

    // Hashed identity from form-fill (verbatim — already SHA-256, never re-hash).
    const mam = readMam(req.cookies.get("tgo_mam")?.value);

    const userData: Record<string, unknown> = {
      ...(mam.em && { em: [mam.em] }),
      ...(mam.ph && { ph: [mam.ph] }),
      ...(mam.fn && { fn: [mam.fn] }),
      ...(mam.ln && { ln: [mam.ln] }),
      ...(mam.ct && { ct: [mam.ct] }),
      ...(mam.country && { country: [mam.country] }),
      ...(mam.external_id && { external_id: [mam.external_id] }),
      ...(fbc && { fbc }),
      ...(fbp && { fbp }),
      ...(clientUserAgent && { client_user_agent: clientUserAgent }),
      ...(clientIp && { client_ip_address: clientIp }),
    };

    // Stable event_id: prefer the lead_id carried through the funnel so the pair
    // is deterministic; fall back to fbp-derived, then time-based.
    const leadId = (body.leadId || "").trim();
    const eventId = leadId
      ? `${leadId}_sched`
      : fbp
        ? sha256(`${fbp}|sched`)
        : `sched_${Date.now()}`;

    const base = {
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website" as const,
      event_source_url: toOrigin(body.eventSourceUrl),
      user_data: userData,
    };
    const events = [
      { ...base, event_name: SCHEDULE_STANDARD_EVENT },
      { ...base, event_name: SCHEDULE_CUSTOM_EVENT },
    ];

    const payload: Record<string, unknown> = { data: events };
    if (process.env.META_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.META_TEST_EVENT_CODE;
    }

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      console.error("[sched] Meta CAPI FAILED", res.status, await res.text());
      return NextResponse.json({ ok: true, capi: "error" });
    }
    console.log(
      `[sched] CAPI sent → ${SCHEDULE_STANDARD_EVENT} + ${SCHEDULE_CUSTOM_EVENT} (event_id=${eventId})`
    );
    return NextResponse.json({ ok: true, capi: "sent" });
  } catch (err) {
    console.error("[sched] error", err);
    return NextResponse.json({ ok: true, capi: "error" });
  }
}
