"use client";

import { useEffect } from "react";
import { reapplyMamFromCookie } from "../_lib/analytics";

/**
 * Backup safety net for Manual Advanced Matching. Re-applies the hashed identity
 * from the tgo_mam cookie on mount, in case the inline pixel script in the
 * layout raced a client-side route change (or the form-fill MAM call didn't
 * finish before the post-payment redirect). `fbq('init')` is idempotent, so
 * this is a no-op when MAM is already applied. Renders nothing.
 *
 * Dropped on the post-payment pages (/book-a-call and /thank-you) so the
 * PageView there ships with full identity → high EMQ.
 */
export default function MamReapply() {
  useEffect(() => {
    reapplyMamFromCookie();
  }, []);
  return null;
}
