// Coupon engine — shared by the client (price preview) and the server
// (create-order + verify authorization). Plain module (no "use client") so both
// sides import the SAME source of truth. Codes are matched case-insensitively.
//
// Security note: the server ALWAYS re-validates the coupon. A 100%-off coupon
// produces a ₹0 order, which Razorpay cannot process — so those orders skip the
// payment gateway entirely and are authorized purely by this server-side check
// (see app/api/razorpay/verify/route.ts). The coupon code is the authorization.

// code (UPPERCASE) -> percent off (0–100)
const COUPONS: Record<string, number> = {
  TGOTEST2025: 100,
};

export type AppliedCoupon = { code: string; percentOff: number };

/** Returns the validated coupon (normalized code + percent) or null if unknown. */
export function validateCoupon(raw?: string | null): AppliedCoupon | null {
  if (!raw || typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  const pct = COUPONS[code];
  if (pct == null) return null;
  return { code, percentOff: pct };
}

/** Apply a coupon to a base price (in paise). Never goes below 0. */
export function discountedPaise(basePaise: number, raw?: string | null): number {
  const c = validateCoupon(raw);
  if (!c) return basePaise;
  return Math.max(0, Math.round(basePaise * (1 - c.percentOff / 100)));
}
