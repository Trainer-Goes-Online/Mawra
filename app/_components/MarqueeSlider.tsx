"use client";

import { useEffect, useRef, useState } from "react";
import { useMarquee } from "./useMarquee";

export type MarqueeItem = {
  src: string;
  alt: string;
  name?: string;
};

/**
 * Continuous auto-scrolling image marquee (same motion as the video slider).
 * Hover pauses the strip and highlights the hovered card; clicking any image
 * opens a full-screen lightbox. Used for before/after transformations and chat
 * screenshots. `cardClass` controls the card aspect (e.g. "result-card" | "chat-card").
 */
export default function MarqueeSlider({
  items,
  cardClass = "",
  showName = false,
  reverse = false,
}: {
  items: MarqueeItem[];
  cardClass?: string;
  showName?: boolean;
  reverse?: boolean;
}) {
  const [zoom, setZoom] = useState<MarqueeItem | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  // Negative speed scrolls the strip in the opposite direction.
  useMarquee(sliderRef, { speed: reverse ? -0.6 : 0.6 });

  useEffect(() => {
    if (!zoom) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [zoom]);

  // Repeat items so the strip fills wide screens, then double for the -50% loop.
  const baseIdx: number[] = [];
  const reps = Math.max(1, Math.ceil(6 / items.length));
  for (let r = 0; r < reps; r++) for (let i = 0; i < items.length; i++) baseIdx.push(i);
  const loopIdx = [...baseIdx, ...baseIdx];

  return (
    <>
      <div className="vslider mslider" ref={sliderRef}>
        <div className="vslider-track">
          {loopIdx.map((origIdx, i) => {
            const it = items[origIdx];
            return (
              <button
                type="button"
                className={`vcard mcard ${cardClass}`}
                key={i}
                onClick={() => setZoom(it)}
                aria-label={it.name ? `Expand ${it.name}` : "Expand image"}
              >
                <img src={it.src} alt={it.alt} loading="lazy" />
                {showName && it.name && <span className="vcard-name">{it.name}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {zoom && (
        <div
          className="testi-lightbox"
          onClick={() => setZoom(null)}
          role="dialog"
          aria-modal="true"
        >
          <button type="button" className="testi-lightbox-close" aria-label="Close">
            &times;
          </button>
          <img src={zoom.src} alt={zoom.alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
