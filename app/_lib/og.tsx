import { ImageResponse } from "next/og";

// Shared 1200x630 social-card renderer. On-brand dark-navy + blue, with the
// page title (accent words highlighted in blue) — matches the site theme.
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function renderOg({
  eyebrow,
  title,
  accent,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
}) {
  const accentWords = new Set(
    (accent || "")
      .toLowerCase()
      .replace(/[.,]/g, "")
      .split(/\s+/)
      .filter(Boolean)
  );
  const words = title.toUpperCase().split(/\s+/);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 78px",
          background:
            "linear-gradient(135deg, #070C18 0%, #0B1326 55%, #0A1120 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* blue glow */}
        <div
          style={{
            position: "absolute",
            top: -170,
            right: -130,
            width: 540,
            height: 540,
            borderRadius: 540,
            background:
              "radial-gradient(circle, rgba(59,130,246,0.30), transparent 70%)",
            display: "flex",
          }}
        />
        {/* subtle grid corner */}
        <div
          style={{
            position: "absolute",
            left: -80,
            bottom: -120,
            width: 420,
            height: 420,
            borderRadius: 420,
            background:
              "radial-gradient(circle, rgba(34,211,238,0.14), transparent 70%)",
            display: "flex",
          }}
        />

        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              width: 16,
              height: 16,
              borderRadius: 16,
              background: "#3B82F6",
            }}
          />
          <div
            style={{
              display: "flex",
              color: "#93B8F7",
              fontSize: 27,
              fontWeight: 800,
              letterSpacing: 5,
            }}
          >
            COACH MAWRA
          </div>
        </div>

        {/* main copy */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              color: "#60A5FA",
              fontSize: 25,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {eyebrow.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 1044 }}>
            {words.map((w, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  color: accentWords.has(w.toLowerCase().replace(/[.,]/g, ""))
                    ? "#3B82F6"
                    : "#F8FAFC",
                  fontSize: 72,
                  fontWeight: 800,
                  lineHeight: 1.04,
                  marginRight: 18,
                }}
              >
                {w}
              </div>
            ))}
          </div>
          {subtitle ? (
            <div
              style={{
                display: "flex",
                color: "#CBD5E1",
                fontSize: 29,
                fontWeight: 500,
                maxWidth: 960,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* accent bar */}
        <div
          style={{
            display: "flex",
            width: 130,
            height: 9,
            borderRadius: 9,
            background: "linear-gradient(90deg, #1E40AF, #3B82F6, #22D3EE)",
          }}
        />
      </div>
    ),
    { ...ogSize }
  );
}
