import { NextRequest, NextResponse } from "next/server";
import { sha256, toOrigin } from "@/app/_lib/meta-capi";
import { TRACKING_HOST } from "@/app/_lib/tracking";

// Server-side Meta CAPI: standard `AddToCart`, fired when the visitor clicks the
// first landing-page CTA of the browser's lifetime (once per browser, enforced
// client-side + Meta's 48h event_id dedup here). No PII available at click time
// — user_data is fbc/fbp/IP/UA only, so EMQ is naturally ~4-6. Free funnel: no
// value/currency. Never fails the click — always returns 200 with a status.
export const runtime = "nodejs";

const GRAPH_API_VERSION = "v25.0";

export async function POST(req: NextRequest) {
  try {
    // Host gate — keep preview / localhost traffic out of the production pixel.
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
      /* beacon may send an empty/at-unload body — that's fine */
    }

    const fbc = req.cookies.get("_fbc")?.value || undefined;
    const fbp = req.cookies.get("_fbp")?.value || undefined;
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const clientUserAgent = req.headers.get("user-agent") || undefined;

    // Same browser → same event_id, so Meta collapses accidental duplicates
    // within 48h. Falls back to a time-based id when _fbp is unavailable.
    const eventId = fbp ? sha256(`${fbp}|atc`) : `atc_${Date.now()}`;

    const event = {
      event_name: "AddToCart",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: toOrigin(body.eventSourceUrl),
      user_data: {
        ...(fbc && { fbc }),
        ...(fbp && { fbp }),
        ...(clientUserAgent && { client_user_agent: clientUserAgent }),
        ...(clientIp && { client_ip_address: clientIp }),
      },
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
      console.error("[atc] Meta CAPI", res.status, await res.text());
      return NextResponse.json({ ok: true, capi: "error" });
    }
    return NextResponse.json({ ok: true, capi: "sent" });
  } catch (err) {
    console.error("[atc] error", err);
    return NextResponse.json({ ok: true, capi: "error" });
  }
}
