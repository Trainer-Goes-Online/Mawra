import { renderOg, ogSize, ogContentType } from "../_lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Booking confirmed — Coach Mawra assessment call";

export default function Image() {
  return renderOg({
    eyebrow: "You're All Set",
    title: "Booking Confirmed",
    accent: "Confirmed",
    subtitle: "Your free assessment call with Coach Mawra is locked in",
  });
}
