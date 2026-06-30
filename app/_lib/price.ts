// Single source of truth for the displayed price. Driven by the SAME env var the
// Razorpay order uses (RAZORPAY_AMOUNT_PAISE) so the page never disagrees with
// the actual charge. Server-only: reads process.env (not exposed to the client),
// so call these from server components and pass the label to client components
// as a prop.

export function getAmountPaise(): number {
  const n = parseInt(process.env.RAZORPAY_AMOUNT_PAISE || "9700", 10);
  return Number.isFinite(n) && n > 0 ? n : 9700;
}

/** Format paise as an INR string, e.g. 9700 -> "₹97", 100 -> "₹1", 150 -> "₹1.50". */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  const body = Number.isInteger(rupees)
    ? rupees.toLocaleString("en-IN")
    : rupees.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `₹${body}`;
}

/** The price label shown across the site, e.g. "₹97". */
export function getPriceLabel(): string {
  return formatINR(getAmountPaise());
}
