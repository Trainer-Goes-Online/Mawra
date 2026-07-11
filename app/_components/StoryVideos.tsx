"use client";

import { useEffect, useState } from "react";

export type StoryVideo = {
  thumb: string;
  alt: string;
  title?: string;
  /** YouTube link (watch?v=, youtu.be/, shorts/, embed/) or bare 11-char id. */
  youtube: string;
};

/** Normalise any YouTube link/id to an autoplay embed URL. */
function toEmbed(url: string): string {
  if (!url) return "";
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/
  );
  const id = m ? m[1] : /^[\w-]{11}$/.test(url.trim()) ? url.trim() : "";
  if (!id) return url; // already an embed URL — use as-is
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

/**
 * The "Watched Mawra's Story" pair — thumbnails that open a modal playing the
 * YouTube video (same modal styling as the testimonial videos).
 */
export default function StoryVideos({ items }: { items: StoryVideo[] }) {
  const [active, setActive] = useState<StoryVideo | null>(null);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <>
      <div
        className="proof-grid reveal-stagger"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", maxWidth: 760, margin: "0 auto" }}
      >
        {items.map((it, i) => (
          <button type="button" className="case-card story-vid" key={i} onClick={() => setActive(it)} aria-label={`Play ${it.title || "video"}`}>
            <div className="case-video">
              <img className="case-thumb" src={it.thumb} width={760} height={475} alt={it.alt} loading="lazy" />
              <span className="story-vid-play" aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="vmodal open" role="dialog" aria-modal="true" onClick={() => setActive(null)}>
          <div className="vmodal-stage" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="vmodal-close" onClick={() => setActive(null)} aria-label="Close">
              &times;
            </button>
            <div className="vmodal-frame">
              {active.youtube ? (
                <iframe
                  src={toEmbed(active.youtube)}
                  title={active.title || "Video"}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="vmodal-ph">
                  <span className="vmodal-ph-play" aria-hidden="true" />
                  <div className="vmodal-empty">Video · add the YouTube link to play</div>
                </div>
              )}
            </div>
            {active.title && <p className="vmodal-caption">{active.title}</p>}
          </div>
        </div>
      )}
    </>
  );
}
