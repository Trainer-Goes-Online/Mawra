// Shared tracking constants. Plain module (no "use client") so both client
// helpers (ga4.ts / meta-client.ts) and server API routes can import it.

// Production host for the funnel. Tracking that we DON'T want polluting the
// production GA4 property / Meta pixel with preview + localhost traffic (the GA4
// custom events and the AddToCart / Schedule CAPI routes) only fires when the
// request is on this host. PageView / MAM keep their existing behaviour.
export const TRACKING_HOST = "vsl.transformationsandbeyond.com";
