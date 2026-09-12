import { NextRequest, NextResponse } from "next/server";
import { sha256, toOrigin } from "@/app/_lib/meta-capi";
import { TRACKING_HOST } from "@/app/_lib/tracking";

// Server-side Meta CAPI: custom `ic_event`, fired when the visitor clicks Pay on
// /checkout with a valid form (checkout intent), once per browser. H&W: custom
// name ONLY — no standard `InitiateCheckout`. user_data is enriched from the
// tgo_mam cookie (already-hashed identity set at form-fill) + fbc/fbp/IP/UA.
// Never fails the click — always returns 200 with a status.
export const runtime = "nodejs";

const GRAPH_API_VERSION = "v25.0";
const IC_CUSTOM_EVENT = process.env.IC_CUSTOM_EVENT || "ic_event";

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

    let body: { eventSourceUrl?: string } = {};
    try {
      body = await req.json();
    } catch {
      /* beacon may send an empty body */
    }

    const fbc = req.cookies.get("_fbc")?.value || undefined;
    const fbp = req.cookies.get("_fbp")?.value || undefined;
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const clientUserAgent = req.headers.get("user-agent") || undefined;

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

    // Same browser → same event_id (Meta 48h dedup). Prefer the hashed email.
    const eventId = mam.em
      ? sha256(`${mam.em}|ic`)
      : fbp
        ? sha256(`${fbp}|ic`)
        : `ic_${Date.now()}`;

    const event = {
      event_name: IC_CUSTOM_EVENT,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website" as const,
      event_source_url: toOrigin(body.eventSourceUrl),
      user_data: userData,
    };

    const payload: Record<string, unknown> = { data: [event] };
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
      console.error("[ic] Meta CAPI FAILED", res.status, await res.text());
      return NextResponse.json({ ok: true, capi: "error" });
    }
    console.log(`[ic] CAPI sent → ${IC_CUSTOM_EVENT} (event_id=${eventId})`);
    return NextResponse.json({ ok: true, capi: "sent" });
  } catch (err) {
    console.error("[ic] error", err);
    return NextResponse.json({ ok: true, capi: "error" });
  }
}
