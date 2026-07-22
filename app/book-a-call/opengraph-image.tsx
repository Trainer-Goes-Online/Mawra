import { renderOg, ogSize, ogContentType } from "../_lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Pick your slot — free assessment call with Coach Mawra";

export default function Image() {
  return renderOg({
    eyebrow: "One Last Step · 100% Free",
    title: "Pick Your Slot — 60 Minutes With Mawra",
    accent: "Pick Your Slot",
    subtitle: "Your free assessment call · the Zoom link lands in your inbox",
  });
}
