"use client";

import { useEffect, useRef, useState } from "react";

export type SlideItem = {
  src: string;
  alt: string;
  name?: string;
  quote?: string;
};

/**
 * Testimonial slider. Desktop: a centered flex-wrap grid (no autoplay).
 * Mobile (≤640px): a horizontal scroll-snap slider that autoplays, can be
 * swiped manually, pauses on interaction/hover, loops, and shows no dots/arrows.
 * Tapping any image opens a full-screen lightbox.
 */
export default function TestiSlider({
  items,
  variant = "",
  intervalMs = 3200,
}: {
  items: SlideItem[];
  variant?: string;
  intervalMs?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<SlideItem | null>(null);

  // Mobile autoplay + pause-on-interaction.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const mq = window.matchMedia("(max-width: 640px)");
    let timer: ReturnType<typeof setInterval> | null = null;
    let resumeT: ReturnType<typeof setTimeout> | null = null;
    let paused = false;

    const step = () => {
      if (paused) return;
      const first = track.firstElementChild as HTMLElement | null;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap || "14") || 14;
      const cardW = first.offsetWidth + gap;
      const maxLeft = track.scrollWidth - track.clientWidth - 4;
      if (track.scrollLeft >= maxLeft) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: cardW, behavior: "smooth" });
      }
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      if (mq.matches) timer = setInterval(step, intervalMs);
    };
    const pause = () => {
      paused = true;
      if (resumeT) clearTimeout(resumeT);
    };
    const resumeSoon = () => {
      if (resumeT) clearTimeout(resumeT);
      resumeT = setTimeout(() => {
        paused = false;
      }, 2500);
    };
    const resumeNow = () => {
      paused = false;
    };

    track.addEventListener("pointerdown", pause);
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resumeNow);
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", resumeSoon, { passive: true });
    track.addEventListener("wheel", () => {
      pause();
      resumeSoon();
    }, { passive: true });

    const onChange = () => start();
    mq.addEventListener?.("change", onChange);
    start();

    return () => {
      stop();
      if (resumeT) clearTimeout(resumeT);
      mq.removeEventListener?.("change", onChange);
      track.removeEventListener("pointerdown", pause);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resumeNow);
    };
  }, [intervalMs]);

  // Lightbox: lock scroll + ESC to close.
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

  return (
    <>
      <div className="testi-slider">
        <div className={`testi-track ${variant}`} ref={trackRef}>
          {items.map((it, i) => (
            <article className="case-card" key={i}>
              <button
                type="button"
                className="testi-zoom-btn"
                onClick={() => setZoom(it)}
                aria-label="Expand image"
              >
                <img
                  className="result-photo"
                  src={it.src}
                  width={900}
                  height={900}
                  alt={it.alt}
                  loading="lazy"
                />
              </button>
              {(it.name || it.quote) && (
                <div className="case-body">
                  {it.name && <h3 className="case-name">{it.name}</h3>}
                  {it.name && <div className="case-stars">★★★★★</div>}
                  {it.quote && <p className="case-quote">{it.quote}</p>}
                </div>
              )}
            </article>
          ))}
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
