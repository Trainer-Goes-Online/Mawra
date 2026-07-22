"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMarquee } from "./useMarquee";

export type VideoItem = {
  poster: string;      // thumbnail / poster image
  alt: string;
  name?: string;
  tag?: string;        // short result line
  src?: string;        // mp4 URL (drop real files in later); empty => "coming soon"
};

/**
 * Continuous, smoothly auto-scrolling video-testimonial slider.
 * - The track loops seamlessly (items are rendered twice; CSS translates -50%).
 * - Hovering the strip pauses it and dims every card except the hovered one,
 *   which is highlighted with a blue neon glow (all in CSS).
 * - Clicking a card opens a themed modal player with prev / next / dots and
 *   keyboard support. If an item has no `src` yet, the modal shows the poster
 *   with a "video coming soon" note so the layout is production-ready.
 */
export default function TestiVideoSlider({ items }: { items: VideoItem[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  useMarquee(sliderRef);

  const go = useCallback(
    (dir: number) => setIdx((i) => (i + dir + items.length) % items.length),
    [items.length]
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  const openAt = (i: number) => {
    setIdx(i);
    setOpen(true);
  };

  // Build a base list long enough to fill the marquee (repeat when there are
  // only a couple of videos), then double it for the seamless -50% loop. We
  // track each card's original index so clicks open the right video.
  const baseIdx: number[] = [];
  const reps = Math.max(1, Math.ceil(5 / items.length));
  for (let r = 0; r < reps; r++) for (let i = 0; i < items.length; i++) baseIdx.push(i);
  const loopIdx = [...baseIdx, ...baseIdx];
  const active = items[idx];

  return (
    <>
      <div className="vslider" aria-label="Video testimonials" ref={sliderRef}>
        <div className="vslider-track">
          {loopIdx.map((origIdx, i) => {
            const it = items[origIdx];
            return (
              <button
                type="button"
                className="vcard"
                key={i}
                onClick={() => openAt(origIdx)}
                aria-label={`Play ${it.name || "video testimonial"}`}
              >
                {it.poster ? (
                  // Pre-extracted poster frame. Using a plain <img> keeps the
                  // strip reliable and light — browsers cap concurrent video
                  // decoders, so duplicated <video> thumbnails often never paint.
                  <img
                    className="vcard-video"
                    src={it.poster}
                    alt=""
                    // Eager: only a few unique posters, reused across every
                    // duplicate in the marquee — lazy leaves off-screen cards blank.
                    loading="eager"
                    decoding="async"
                    aria-hidden="true"
                  />
                ) : it.src ? (
                  // Fallback when no poster exists: first frame from the video.
                  <video
                    className="vcard-video"
                    src={`${it.src}#t=0.5`}
                    muted
                    playsInline
                    preload="metadata"
                    tabIndex={-1}
                    aria-hidden="true"
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      try {
                        if (v.currentTime < 0.4) v.currentTime = 0.5;
                      } catch {
                        /* ignore */
                      }
                    }}
                  />
                ) : (
                  <span className="vcard-ph" aria-hidden="true">
                    <span className="vcard-ph-tag">Video Testimonial</span>
                  </span>
                )}
                <span className="vcard-play" aria-hidden="true" />
                {it.name && (
                  <span className="vcard-name">
                    {it.name}
                    {it.tag && <span>{it.tag}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {open && active && (
        <div
          className="vmodal open"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="vmodal-stage" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="vmodal-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>

            <div className="vmodal-frame">
              {active.src ? (
                <video
                  key={active.src}
                  src={active.src}
                  poster={active.poster || undefined}
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <div className="vmodal-ph">
                  <span className="vmodal-ph-play" aria-hidden="true" />
                  <div className="vmodal-empty">Video testimonial · coming soon</div>
                </div>
              )}

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    className="vmodal-nav vmodal-prev"
                    onClick={() => go(-1)}
                    aria-label="Previous"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    className="vmodal-nav vmodal-next"
                    onClick={() => go(1)}
                    aria-label="Next"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </>
              )}
            </div>

            {(active.name || active.tag) && (
              <p className="vmodal-caption">
                {active.name}
                {active.tag && <span>{active.tag}</span>}
              </p>
            )}

            <div className="vmodal-dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-current={i === idx}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
