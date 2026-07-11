"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";

export type ThemedOption = {
  value: string;
  label: string;   // shown in the dropdown panel
  short?: string;  // optional compact label shown on the button (falls back to label)
};

/**
 * Accessible, fully-themed dropdown that replaces the native <select> so the
 * open list matches the dark-neon theme (native option lists are OS-styled and
 * can't be themed). Controlled component: pass `value` + `onChange`. Validation
 * (required) is handled by the parent form via state.
 */
export default function ThemedSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  invalid = false,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ThemedOption[];
  placeholder?: string;
  invalid?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // When opening, highlight the current selection and scroll it into view.
  useEffect(() => {
    if (!open) return;
    const i = options.findIndex((o) => o.value === value);
    setActive(i);
    requestAnimationFrame(() => {
      const el = listRef.current?.children[i] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    });
  }, [open, value, options]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function move(delta: number) {
    setActive((a) => {
      const next = Math.min(Math.max(a + delta, 0), options.length - 1);
      const el = listRef.current?.children[next] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
      return next;
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active >= 0) choose(options[active].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      className={`tsel${open ? " open" : ""}${invalid ? " is-invalid" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        className="tsel-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? "tsel-val" : "tsel-val tsel-placeholder"}>
          {selected ? selected.short || selected.label : placeholder}
        </span>
        <span className="tsel-chev" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </button>

      {open && (
        <ul className="tsel-list" role="listbox" ref={listRef} aria-label={ariaLabel}>
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`tsel-opt${i === active ? " active" : ""}${o.value === value ? " selected" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
            >
              <span>{o.label}</span>
              {o.value === value && (
                <span className="tsel-check" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8.5 6.5 12 13 4.5" />
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
