import { renderOg, ogSize, ogContentType } from "./_lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt =
  "Coach Mawra — Women's Fat Loss & Identity Transformation Specialist";

export default function Image() {
  return renderOg({
    eyebrow: "Women's Fat Loss & Identity Transformation",
    title: "Lose 20, 30, 40, Even 60+ Kilos — Keep It Off For Life",
    accent: "60+ Kilos",
    subtitle:
      "TEDx Speaker · 500+ Transformations · Book your FREE assessment call",
  });
}
