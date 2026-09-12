"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { COUNTRIES, type Country } from "../_lib/country";

/**
 * Themed country dial-code picker.
 *
 * A native <select> can't hold images, and emoji flags (🇮🇳) don't render at all
 * on Windows Chrome — they fall back to the letters "IN". So this is a custom
 * combobox over flag images, styled to the site instead of the OS.
 *
 * Keyboard: ↑/↓ move, Enter picks, Escape closes, Home/End jump, typing filters.
 */

// Shown first when the search box is empty — India, then the markets the
// audience actually books from.
const PRIORITY_ISO = [
  "IN", "AE", "US", "GB", "CA", "AU", "SG", "SA",
  "QA", "KW", "OM", "BH", "MY", "NZ", "ZA", "HK",
];

const BY_ISO = new Map(COUNTRIES.map((c) => [c.iso, c]));
const PRIORITY: Country[] = PRIORITY_ISO.map((iso) => BY_ISO.get(iso)).filter(
  (c): c is Country => Boolean(c)
);
const REST: Country[] = COUNTRIES.filter((c) => !PRIORITY_ISO.includes(c.iso));
const DEFAULT_ORDER: Country[] = [...PRIORITY, ...REST];

/** Flag image URL for an ISO-2 code. */
function flagSrc(iso: string): string {
  return `https://flagcdn.com/${iso.toLowerCase()}.svg`;
}

function Flag({ iso, name }: { iso: string; name: string }) {
  return (
    <img
      className="cs-flag"
      src={flagSrc(iso)}
      alt=""
      role="presentation"
      loading="lazy"
      width={22}
      height={16}
      data-iso={iso}
      onError={(e) => {
        // Never leave a broken-image glyph in the control — fall back to the
        // ISO letters, which still tell the user which country is selected.
        const img = e.currentTarget;
        img.style.display = "none";
        const sib = img.nextElementSibling as HTMLElement | null;
        if (sib) sib.style.display = "inline-flex";
      }}
      title={name}
    />
  );
}

export default function CountrySelect({
  value,
  onChange,
  disabled = false,
}: {
  /** Selected ISO-2 code, e.g. "IN". */
  value: string;
  onChange: (country: Country) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = BY_ISO.get(value) || BY_ISO.get("IN") || COUNTRIES[0];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEFAULT_ORDER;
    const digits = q.replace(/[^0-9]/g, "");
    return COUNTRIES.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.iso.toLowerCase() === q) return true;
      if (digits && c.dial.replace("+", "").startsWith(digits)) return true;
      return false;
    });
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  // Open with the current selection highlighted, focus the search box.
  useEffect(() => {
    if (!open) return;
    const idx = DEFAULT_ORDER.findIndex((c) => c.iso === selected.iso);
    setActiveIdx(idx < 0 ? 0 : idx);
    const t = setTimeout(() => searchRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open, selected.iso]);

  // Close on outside click / focus leaving the widget.
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
    };
  }, [open, close]);

  // Keep the highlighted row in view as the user arrows through.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-idx="${activeIdx}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  function pick(c: Country) {
    onChange(c);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIdx(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIdx(results.length - 1);
        break;
      case "Enter": {
        e.preventDefault();
        const c = results[activeIdx];
        if (c) pick(c);
        break;
      }
    }
  }

  return (
    <div className="cs-root" ref={rootRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        className="cs-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${selected.name} ${selected.dial}`}
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Flag iso={selected.iso} name={selected.name} />
        <span className="cs-iso-fallback" aria-hidden="true">
          {selected.iso}
        </span>
        <span className="cs-dial">{selected.dial}</span>
        <svg
          className="cs-chev"
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="cs-panel" role="dialog" aria-label="Choose a country">
          <div className="cs-search">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country or code"
              value={query}
              autoComplete="off"
              spellCheck={false}
              aria-label="Search for a country"
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
            />
          </div>

          {results.length === 0 ? (
            <p className="cs-empty">No country matches that.</p>
          ) : (
            <ul className="cs-list" role="listbox" ref={listRef}>
              {results.map((c, i) => (
                <li
                  key={c.iso}
                  data-idx={i}
                  role="option"
                  aria-selected={c.iso === selected.iso}
                  className="cs-option"
                  data-active={i === activeIdx ? "true" : "false"}
                  data-selected={c.iso === selected.iso ? "true" : "false"}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pick(c)}
                >
                  <Flag iso={c.iso} name={c.name} />
                  <span className="cs-iso-fallback" aria-hidden="true">
                    {c.iso}
                  </span>
                  <span className="cs-name">{c.name}</span>
                  <span className="cs-option-dial">{c.dial}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
