import type { Metadata } from "next";
import Script from "next/script";
import FooterDisclaimer from "../_components/FooterDisclaimer";

const INSTAGRAM_URL = "https://www.instagram.com/dumbbellsandtransformations/";
const IG_HANDLE = "dumbbellsandtransformations";

export const metadata: Metadata = {
  title: "Thanks For Applying · Coach Mawra",
  description:
    "Thanks for your honesty. This programme may not be the right fit right now — but the free work is still yours. Keep learning with Coach Mawra.",
  robots: { index: false, follow: false },
};

type SearchParams = { pr?: string; wt?: string; inc?: string; inv?: string };

function IgGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

export default async function DisqualifiedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const profileAns = (sp.pr || "").trim();
  const weightAns = (sp.wt || "").trim();
  const investAns = (sp.inv || "").trim();

  // The visitor's own answers, shown back to them. The investment question is
  // only flagged in red when they actually picked the "not ready to invest"
  // option — an empty/unrecorded answer stays neutral.
  const INVEST_DECLINE =
    "Really interested, but not ready to invest in my health & fitness";
  const investIsCulprit = investAns === INVEST_DECLINE;
  const criteria = [
    {
      n: 1,
      q: "Which best describes you?",
      answer: profileAns,
      met: true,
    },
    {
      n: 2,
      q: "How much weight do you want to lose?",
      answer: weightAns,
      met: true,
    },
    {
      n: 3,
      q: "What are you ready to invest each month in your health & fitness?",
      answer: investAns,
      met: !investIsCulprit,
    },
  ];

  return (
    <>
      {/* Top ticker ribbon */}
      <div className="disq-ribbon" aria-hidden="true">
        <div className="disq-ribbon-track">
          <span>Thanks For Your Honesty</span>
          <span>The Free Work Is Still Yours</span>
          <span>Application Received</span>
          <span>Thanks For Your Honesty</span>
          <span>The Free Work Is Still Yours</span>
          <span>Application Received</span>
        </div>
      </div>

      <main className="disq-main">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="sec-band-night" style={{ paddingTop: 44, paddingBottom: 40 }}>
          <div className="wrap narrow">
            <div className="sec-head reveal" style={{ textAlign: "center" }}>
              <div className="disq-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
              <span className="eyebrow-pill" style={{ justifyContent: "center" }}>
                <span className="dot"></span>Application Received
              </span>
              <h1 className="sec-h2" style={{ marginTop: 20 }}>
                Thank You<br />For <span className="accent">Applying.</span>
              </h1>
              <p style={{ maxWidth: 560, margin: "18px auto 0", fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.7, color: "rgba(71,85,105,0.85)", textAlign: "center" }}>
                After going through your answers, it looks like the Identity Transformation
                programme <strong style={{ color: "var(--ink)" }}>may not be the right fit for you</strong> at this moment — and being honest about that is the healthiest place to start.
              </p>
            </div>
          </div>
        </section>

        {/* ── Instagram — the free work continues ────────────── */}
        <section className="sec-band-night" style={{ paddingTop: 20, paddingBottom: 44 }}>
          <div className="wrap narrow">
            <div className="sec-head reveal" style={{ textAlign: "center" }}>
              <span className="sec-label">You&apos;re Not Left Empty Handed</span>
              <h2 className="sec-h2">
                The Free Work Doesn&apos;t Stop Here. <span className="accent">Come And Take It.</span>
              </h2>
              <p className="sec-lede" style={{ fontFamily: "'DM Sans', sans-serif", marginTop: 10 }}>
                Follow Mawra on Instagram for free, practical guidance on fat loss, mindset and
                building a body you actually keep — around a real, busy life.
              </p>
            </div>

            <div className="disq-ig-grid reveal">
              {/* Left — why follow */}
              <div>
                <p className="disq-follow-h">Why It&apos;s Worth Following</p>
                <ul className="disq-follow-list">
                  <li>
                    <span className="tick" aria-hidden="true"><Tick /></span>
                    <span>The exact <strong>system this page is built on</strong> — broken down, post by post.</span>
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true"><Tick /></span>
                    <span>How to eat, move and stay consistent through PCOS, thyroid, cravings and a packed schedule.</span>
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true"><Tick /></span>
                    <span>Real transformations from women who broke the yo-yo cycle for good.</span>
                  </li>
                </ul>
                <p className="disq-note">
                  None of it costs anything. <strong>Take it whether or not you ever work with Mawra.</strong>
                </p>
              </div>

              {/* Right — IG profile card */}
              <div className="disq-ig-col">
                <div className="disq-ig-card">
                  <div className="disq-ig-top">
                    <span className="disq-ig-handle">
                      {IG_HANDLE}
                      <span className="disq-ig-verified" aria-label="Verified">
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path fill="currentColor" d="M10 1.2l2.1 1.5 2.6-.2 1 2.4 2.2 1.4-.6 2.5.6 2.5-2.2 1.4-1 2.4-2.6-.2L10 18.8l-2.1-1.5-2.6.2-1-2.4-2.2-1.4.6-2.5-.6-2.5L4.3 4.9l1-2.4 2.6.2z" />
                          <path fill="#fff" d="M8.6 12.3 6.2 9.9l1.1-1.1 1.3 1.3 3-3 1.1 1.1z" />
                        </svg>
                      </span>
                    </span>
                    <span className="ig-glyph" aria-hidden="true"><IgGlyph /></span>
                  </div>
                  <div className="disq-ig-body">
                    <div className="disq-ig-id">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="disq-ig-avatar"
                        src="/assets/insta-profile.jpg"
                        alt="Mawra Maqbool Ishaque"
                      />
                      <div className="disq-ig-stats">
                        <div className="disq-ig-stat"><b>467</b><span>posts</span></div>
                        <div className="disq-ig-stat"><b>21.2K</b><span>followers</span></div>
                        <div className="disq-ig-stat"><b>853</b><span>following</span></div>
                      </div>
                    </div>
                    <p className="disq-ig-name">Mawra Maqbool Ishaque | Fitness coach</p>
                    <p className="disq-ig-cat">Fitness Trainer</p>
                    <p className="disq-ig-bio">
                      I coach people to transform PHYSICALLY, EMOTIONALLY, and MENTALLY.
                      Transformation coach, TEDx speaker, fat loss &amp; identity transformation.
                    </p>
                    <div className="disq-ig-btns">
                      <a className="disq-ig-follow" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Follow</a>
                      <span className="disq-ig-msg">Message</span>
                    </div>
                  </div>
                </div>
                <a className="disq-ig-cta" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <IgGlyph />
                  Follow @{IG_HANDLE}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Think you answered something incorrectly? ──────── */}
        <section className="sec-band-night" style={{ paddingTop: 10, paddingBottom: 56 }}>
          <div className="wrap narrow">
            <div className="disq-reapply reveal">
              <span className="reapply-pill">
                <span aria-hidden="true">↺</span> Answered Something Incorrectly?
              </span>
              <h2 className="sec-h2" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>
                Think You May Have Answered <span className="accent">Something Wrong?</span>
              </h2>
              <a className="cta-big" href="/">
                Re-Apply Now
                <span className="arrow">→</span>
              </a>
              <p className="disq-fine">
                Only re-apply if your answers genuinely didn&apos;t reflect your real situation.
                If you do fit the profile, goals and readiness we&apos;re looking for, start again with accurate answers.
              </p>
            </div>
          </div>
        </section>

        {/* ── Full transparency: why it wasn't a fit ────────── */}
        <section className="disq-dark">
          <div className="wrap narrow">
            <div className="sec-head reveal" style={{ textAlign: "center" }}>
              <span className="sec-label">Full Transparency</span>
              <h2 className="sec-h2">
                Here&apos;s Why It Wasn&apos;t <span className="accent">The Right Fit.</span>
              </h2>
              <p className="disq-dark-lede">
                To make sure every assessment call is genuinely useful, Mawra only books calls with
                women who are a yes on all three of these:
              </p>
            </div>

            <div className="disq-crit-grid reveal">
              {criteria.map((c) => (
                <div key={c.n} className={`disq-crit${c.met ? "" : " is-culprit"}`}>
                  <div className="disq-crit-head">
                    <span className="disq-crit-num">{c.n}</span>
                    <p className="disq-crit-q">{c.q}</p>
                  </div>
                  <div className="disq-crit-resp-box">
                    <span className="disq-resp-label">Your Response</span>
                    {c.answer ? (
                      <p className="disq-resp-val">{c.answer}</p>
                    ) : (
                      <p className="disq-resp-empty">Not recorded</p>
                    )}
                    {!c.met && <span className="disq-resp-tag">This is the one that wasn&apos;t a yes</span>}
                  </div>
                </div>
              ))}
            </div>

            <p className="disq-crit-note">
              {investIsCulprit ? (
                <>You were a clear yes on the first two — it was the <strong>readiness-to-invest</strong> answer that wasn&apos;t a fit right now. <strong>That&apos;s completely okay</strong> — timing matters as much as intent, and the door stays open for when it&apos;s right.</>
              ) : (
                <>From your answers, one or more of these wasn&apos;t a yes right now. <strong>That&apos;s completely okay</strong> — timing matters as much as intent, and the door stays open for when it&apos;s right.</>
              )}
            </p>
          </div>
        </section>

        {/* ── Closing reassurance ───────────────────────────── */}
        <section className="sec-band-night" style={{ paddingTop: 48, paddingBottom: 40 }}>
          <div className="wrap narrow">
            <div className="sec-head reveal" style={{ textAlign: "center" }}>
              <div className="disq-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2.1 5 5.4 5c2 0 3.4 1.2 4.6 2.6C11.2 6.2 12.6 5 14.6 5 17.9 5 19.5 8.4 22 11.8 19.5 16.4 12 21 12 21z" />
                </svg>
              </div>
              <h2 className="sec-h2" style={{ fontSize: "clamp(22px, 3.2vw, 32px)" }}>
                This Doesn&apos;t Mean Your Goals <span className="accent">Aren&apos;t Real.</span>
              </h2>
              <p style={{ maxWidth: 520, margin: "16px auto 0", fontFamily: "'DM Sans', sans-serif", fontSize: 15.5, lineHeight: 1.7, color: "rgba(71,85,105,0.82)", textAlign: "center" }}>
                It simply means this programme, in its current format, isn&apos;t the right fit for you
                right now. Keep showing up for yourself — and when the timing is right, we&apos;ll be here.
              </p>
              <p className="disq-close-links">
                Questions? <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">DM us on Instagram</a> · or head <a href="/">back to the main page</a>.
              </p>
            </div>
          </div>

          <div className="wrap narrow" style={{ marginTop: 44 }}>
            <div className="foot-bottom">
              <span>Coach Mawra · Fat Loss and Identity Transformation</span>
              <span className="foot-ornament" aria-hidden="true">✦</span>
              <span className="foot-links">
                <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
              </span>
            </div>
            <FooterDisclaimer />
          </div>
        </section>
      </main>
      <Script src="/funnel.js?v=6" strategy="afterInteractive" />
    </>
  );
}
