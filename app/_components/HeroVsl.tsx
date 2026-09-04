"use client";

// ============================================================================
// Hero VSL — Vimeo player with a click-to-play, sound-ON facade
// ============================================================================
// The hero shows a still frame lifted straight out of the VSL (t = 96s, see
// public/assets/mawra_vsl_poster.webp) behind a 3D play button. Clicking
// anywhere on the card swaps the poster for the real Vimeo embed.
//
// WHY THE IFRAME IS MOUNTED INSIDE THE CLICK HANDLER
// A browsing context created *during* a user gesture inherits the parent's
// sticky activation, so `autoplay=1&muted=0` is honoured with sound on iOS
// Safari, Android Chrome, desktop Chrome/Safari/Firefox/Edge alike. Preloading
// the iframe and calling play() later over postMessage does NOT carry that
// activation and gets force-muted — hence the facade.
//
// Belt-and-braces: once the player SDK is up we explicitly setMuted(false) +
// setVolume(1) + play(). If a browser still muted us, `needsUnmute` surfaces a
// tap-for-sound chip so nobody ends up watching silently with no way out.
//
// Vimeo's own analytics stay on (no `dnt` param), and the SDK's play/progress
// events are mirrored into GA4 through the shared once-per-browser helper.

import { useCallback, useEffect, useRef, useState } from "react";
import { trackGa4EventOnce } from "../_lib/ga4";

const VIMEO_ID = "1223932439";
const POSTER = "/assets/mawra_vsl_poster.webp";
const SDK_SRC = "https://player.vimeo.com/api/player.js";
/** 348s runtime, from Vimeo's oEmbed metadata. */
const DURATION_LABEL = "5:48";

const EMBED_SRC =
  `https://player.vimeo.com/video/${VIMEO_ID}` +
  "?autoplay=1&muted=0&playsinline=1&controls=1" +
  "&title=0&byline=0&portrait=0&pip=1&keyboard=1&transparent=0&color=DC2626";

type VimeoPlayer = {
  ready(): Promise<void>;
  play(): Promise<void>;
  setMuted(muted: boolean): Promise<boolean>;
  getMuted(): Promise<boolean>;
  setVolume(volume: number): Promise<number>;
  on(event: string, cb: (data: never) => void): void;
  off(event: string): void;
  unload?(): Promise<void>;
};

declare global {
  interface Window {
    Vimeo?: { Player: new (el: HTMLIFrameElement) => VimeoPlayer };
  }
}

let sdkPromise: Promise<void> | null = null;

/** Inject player.js once; resolves as soon as window.Vimeo is available. */
function loadVimeoSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Vimeo?.Player) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdkPromise = null; // let a later attempt retry
      reject(new Error("vimeo sdk failed"));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export default function HeroVsl() {
  const [playing, setPlaying] = useState(false);
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const milestones = useRef<Set<number>>(new Set());

  /** Warm the SDK on hover/touch-start so the click itself has nothing to wait on. */
  const warm = useCallback(() => {
    loadVimeoSdk().catch(() => {
      /* the embed still plays without the SDK */
    });
  }, []);

  const start = useCallback(() => {
    setPlaying(true);
  }, []);

  const forceUnmute = useCallback(() => {
    const player = playerRef.current;
    setNeedsUnmute(false);
    if (!player) return;
    player
      .setMuted(false)
      .then(() => player.setVolume(1))
      .then(() => player.play())
      .catch(() => setNeedsUnmute(true));
  }, []);

  useEffect(() => {
    if (!playing) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let cancelled = false;
    let player: VimeoPlayer | null = null;

    loadVimeoSdk()
      .then(() => {
        if (cancelled || !window.Vimeo) return;
        player = new window.Vimeo.Player(iframe);
        playerRef.current = player;

        player.on("play", () => trackGa4EventOnce("video_start"));
        player.on("ended", () => trackGa4EventOnce("video_complete"));
        player.on("volumechange", (data: never) => {
          const { volume, muted } = data as unknown as {
            volume: number;
            muted?: boolean;
          };
          if (volume > 0 && !muted) setNeedsUnmute(false);
        });
        player.on("timeupdate", (data: never) => {
          const { percent } = data as unknown as { percent: number };
          for (const mark of [25, 50, 75]) {
            if (percent * 100 >= mark && !milestones.current.has(mark)) {
              milestones.current.add(mark);
              trackGa4EventOnce(`video_progress_${mark}`);
            }
          }
        });

        return player.ready().then(async () => {
          if (cancelled || !player) return;
          try {
            await player.setMuted(false);
            await player.setVolume(1);
            await player.play();
          } catch {
            /* fall through to the muted check */
          }
          try {
            if (!cancelled && (await player.getMuted())) setNeedsUnmute(true);
          } catch {
            /* can't tell — assume sound is on rather than nag the user */
          }
        });
      })
      .catch(() => {
        /* SDK blocked: the iframe's own autoplay=1&muted=0 still carries it */
      });

    return () => {
      cancelled = true;
      const p = playerRef.current;
      playerRef.current = null;
      if (!p) return;
      try {
        ["play", "ended", "volumechange", "timeupdate"].forEach((e) => p.off(e));
      } catch {
        /* ignore */
      }
    };
  }, [playing]);

  return (
    <div className="vsl-wrap hero-portrait-wrap">
      <div
        id="vsl"
        className={`vsl-box hero-portrait hero-vsl${playing ? " is-playing" : ""}`}
      >
        {playing ? (
          <iframe
            ref={iframeRef}
            className="hero-vsl-frame"
            src={EMBED_SRC}
            title="Coach Mawra — how women lose 20 to 60+ kilos and keep it off"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="hero-vsl-trigger"
            onClick={start}
            onPointerEnter={warm}
            onTouchStart={warm}
            aria-label="Play the video — Coach Mawra explains how to lose the weight and keep it off"
          >
            <img
              src={POSTER}
              className="vsl-image"
              alt="Coach Mawra speaking to camera in her transformation video"
              width={1600}
              height={900}
              fetchPriority="high"
              decoding="async"
            />
            <span className="hero-vsl-scrim" aria-hidden="true" />
            <span className="hero-vsl-play" aria-hidden="true">
              <span className="hvp-ring" />
              <span className="hvp-ring" />
              <span className="hvp-core">
                <span className="hvp-gloss" />
                <span className="hvp-tri" />
              </span>
            </span>
            <span className="hero-vsl-dur" aria-hidden="true">
              {DURATION_LABEL}
            </span>
          </button>
        )}

        {needsUnmute && (
          <button
            type="button"
            className="hero-vsl-unmute"
            onClick={forceUnmute}
          >
            <span className="hvu-icon" aria-hidden="true" />
            Tap for sound
          </button>
        )}
      </div>
    </div>
  );
}
