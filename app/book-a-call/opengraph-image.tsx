import { renderOg, ogSize, ogContentType } from "../_lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Pick your slot — 1:1 diagnostic call with Mawra Ishaque";

export default function Image() {
  return renderOg({
    eyebrow: "One Last Step · Slot Paid",
    title: "Pick Your Slot — 60 Minutes With Mawra",
    accent: "Pick Your Slot",
    subtitle: "Your 1:1 diagnostic call · the Zoom link lands in your inbox",
  });
}
