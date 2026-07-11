"use client";

import { RefObject, useEffect } from "react";

/**
 * Turns a horizontal strip (a scroll container whose single child is a track of
 * duplicated items) into a continuous auto-scrolling marquee that the user can
 * ALSO drive manually — native touch-swipe on mobile and click-and-drag on
 * desktop. Auto-scroll pauses while the pointer is over it, during a drag, and
 * for a moment after any manual interaction, then resumes and loops seamlessly.
 *
 * A drag that moves past a small threshold suppresses the click that follows so
 * dragging never accidentally opens a card's modal/lightbox.
 */
export function useMarquee(
  ref: RefObject<HTMLDivElement | null>,
  opts?: { speed?: number }
) {
  const speed = opts?.speed ?? 0.6; // px per animation frame (~36px/s @60fps)

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let paused = false;
    let resumeT: ReturnType<typeof setTimeout> | null = null;

    // drag state
    let down = false;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let suppressClick = false;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function period(): number {
      // One repeat = half the doubled content, plus one connecting gap, so the
      // reset is seamless. gap comes from the track's flex column-gap.
      const track = el.firstElementChild as HTMLElement | null;
      const gap = track ? parseFloat(getComputedStyle(track).columnGap || "0") || 0 : 0;
      return (el.scrollWidth + gap) / 2;
    }

    function normalize() {
      const p = period();
      if (p <= 0) return;
      if (el.scrollLeft >= p) el.scrollLeft -= p;
      else if (el.scrollLeft < 0) el.scrollLeft += p;
    }

    function tick() {
      if (!paused && !dragging && !reduce) {
        el.scrollLeft += speed;
        normalize();
      }
      raf = requestAnimationFrame(tick);
    }

    function scheduleResume(delay = 1400) {
      if (resumeT) clearTimeout(resumeT);
      resumeT = setTimeout(() => {
        paused = false;
      }, delay);
    }

    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      if (!dragging) scheduleResume(400);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== undefined && e.button !== 0) return;
      down = true;
      dragging = false;
      paused = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        el.classList.add("is-dragging");
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (dragging) {
        el.scrollLeft = startScroll - dx;
        normalize();
      }
    };
    const endDrag = () => {
      if (!down) return;
      down = false;
      if (dragging) {
        dragging = false;
        el.classList.remove("is-dragging");
        suppressClick = true; // this pointer-up follows a drag, not a tap
      }
      scheduleResume();
    };

    // Native touch swipe / wheel: just pause + resume shortly after.
    const onTouchStart = () => {
      paused = true;
    };
    const onTouchEnd = () => scheduleResume(1600);
    const onWheel = () => {
      paused = true;
      scheduleResume(1600);
    };
    // Swallow the click that ends a drag so it doesn't open a card.
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      }
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClick, true); // capture: stop before React onClick
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (resumeT) clearTimeout(resumeT);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [ref, speed]);
}
