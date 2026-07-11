import Link from "next/link";
import FooterDisclaimer from "./FooterDisclaimer";

type LegalShellProps = {
  /** Page title, e.g. "Privacy Policy" */
  title: string;
  /** Short eyebrow label above the title */
  eyebrow?: string;
  /** Human-readable last-updated date */
  updated: string;
  /** Which footer link is the current page */
  current: "privacy" | "terms";
  children: React.ReactNode;
};

/**
 * Shared chrome for the legal pages (Privacy, Terms).
 * Mobile-first layout; visual language inherited from funnel.css tokens.
 */
export default function LegalShell({
  title,
  eyebrow = "Legal",
  updated,
  current,
  children,
}: LegalShellProps) {
  return (
    <>
      <link rel="stylesheet" href="/legal.css?v=2" />
      <main className="legal-page">
        <div className="legal-wrap">
          <nav className="legal-topnav">
            <Link className="legal-back" href="/">
              <span className="ar" aria-hidden="true">←</span>
              Back to home
            </Link>
          </nav>

          <header className="legal-head">
            <span className="legal-eyebrow">
              <span className="dot" aria-hidden="true">✦</span>
              {eyebrow}
            </span>
            <h1 className="legal-h1">{title}</h1>
            <p className="legal-updated">Last updated · {updated}</p>
          </header>

          <article className="legal-body">{children}</article>

          <footer className="legal-foot">
            <nav className="legal-foot-links" aria-label="Legal pages">
              <Link href="/privacy" className={current === "privacy" ? "is-current" : ""}>
                Privacy
              </Link>
              <Link href="/terms" className={current === "terms" ? "is-current" : ""}>
                Terms
              </Link>
            </nav>
            <FooterDisclaimer />
          </footer>
        </div>
      </main>
    </>
  );
}
