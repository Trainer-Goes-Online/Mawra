"use client";

import { Fragment, useEffect, useState } from "react";

const STORAGE_KEY = "tgo_offer_deadline";
const WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // evergreen 3-day window per visitor

/**
 * Red urgency countdown shown under the CTAs. Evergreen: each visitor gets a
 * deadline stored in localStorage on first view, so the timer is always live
 * (it never shows a dead 00:00:00:00). Renders nothing until mounted so the
 * server and client markup can't mismatch.
 */
export default function UrgencyTimer({ className = "" }: { className?: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    function readDeadline(): number {
      let deadline = 0;
      try {
        deadline = Number(localStorage.getItem(STORAGE_KEY)) || 0;
      } catch {
        /* storage blocked — fall through to a session-only deadline */
      }
      if (!deadline || deadline <= Date.now()) {
        deadline = Date.now() + WINDOW_MS;
        try {
          localStorage.setItem(STORAGE_KEY, String(deadline));
        } catch {
          /* ignore */
        }
      }
      return deadline;
    }

    let deadline = readDeadline();
    const tick = () => {
      let ms = deadline - Date.now();
      if (ms <= 0) {
        deadline = readDeadline(); // roll the window over
        ms = deadline - Date.now();
      }
      setLeft(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (left === null) return null;

  const total = Math.max(0, Math.floor(left / 1000));
  const days = Math.floor(total / 86400);
  const hrs = Math.floor((total % 86400) / 3600);
  const min = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const units: [string, number][] = [
    ["Days", days],
    ["Hrs", hrs],
    ["Min", min],
    ["Sec", sec],
  ];

  return (
    <div className={`urgency-timer ${className}`.trim()} role="timer" aria-live="off">
      <span className="ut-label">Offer ends in</span>
      <span className="ut-clock">
        {units.map(([label, value], i) => (
          <Fragment key={label}>
            <span className="ut-unit">
              <span className="ut-num">{pad(value)}</span>
              <span className="ut-cap">{label}</span>
            </span>
            {i < units.length - 1 && (
              <span className="ut-sep" aria-hidden="true">:</span>
            )}
          </Fragment>
        ))}
      </span>
    </div>
  );
}
