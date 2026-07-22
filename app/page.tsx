import Script from "next/script";
import FooterDisclaimer from "./_components/FooterDisclaimer";
import LeadModal from "./_components/LeadModal";
import { type SlideItem } from "./_components/TestiSlider";
import TestiVideoSlider, { type VideoItem } from "./_components/TestiVideoSlider";
import MarqueeSlider from "./_components/MarqueeSlider";
import StoryVideos, { type StoryVideo } from "./_components/StoryVideos";

const IMG = "/assets/mawra_hero.png"; // hero banner of Coach Mawra (16:9)
const CTA_LABEL = "Book Your FREE Assessment Call";

// Before/after client results — Mandawi, Sahana, Leonna (with captions) first,
// then the remaining two. Images in /public/assets/results.
const CLIENT_RESULTS: SlideItem[] = [
  {
    src: "/assets/results/1.webp",
    name: "Mandawi Tripathi",
    quote:
      "Lost 7+ kg in under 5 months — broke years of yo-yo dieting, stopped emotional eating, and now trains every single day with real confidence.",
    alt: "Mandawi Tripathi — before and after transformation with Coach Mawra",
  },
  {
    src: "/assets/results/2.webp",
    name: "Sahana",
    quote:
      "Lost 10+ kg of post-pregnancy weight — now does strength training and pilates, travels without food guilt, and won awards as an entrepreneur.",
    alt: "Sahana — before and after transformation with Coach Mawra",
  },
  {
    src: "/assets/results/4.webp",
    name: "Leonna",
    quote:
      "Lost weight without losing focus through medical school — and qualified as a resident doctor.",
    alt: "Leonna — before and after transformation with Coach Mawra",
  },
  {
    src: "/assets/results/3.webp",
    alt: "Client before and after transformation with Coach Mawra",
  },
  {
    src: "/assets/results/Rashmi.jpeg",
    name: "Rashmi",
    alt: "Rashmi — before and after transformation with Coach Mawra",
  },
];

// Video testimonials — real client videos. The card thumbnail is the video's
// first frame; clicking opens the modal player. Add more items here as they come.
const VIDEO_TESTIMONIALS: VideoItem[] = [
  {
    poster: "/assets/video-testimonials/surbhi.jpg",
    name: "Surbhi",
    tag: "In her own words",
    alt: "Surbhi's video testimonial for Coach Mawra",
    src: "https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Mawra/Surbhi.MOV",
  },
  {
    poster: "/assets/video-testimonials/rashmi.jpg",
    name: "Rashmi Ji",
    tag: "In her own words",
    alt: "Rashmi Ji's video testimonial for Coach Mawra",
    src: "https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Mawra/Rashmi_Ji.MOV",
  },
  {
    poster: "/assets/video-testimonials/trupti.jpg",
    name: "Trupti",
    tag: "In her own words",
    alt: "Trupti's video testimonial for Coach Mawra",
    src: "https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Mawra/Trupti%20testimonial.mp4",
  },
];

// Written testimonials — WhatsApp chat screenshots in /public/assets/reviews.
const WRITTEN_TESTIMONIALS: SlideItem[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/assets/reviews/${i + 1}.webp`,
  alt: "Written testimonial from a Coach Mawra client",
}));

// "Watched Mawra's Story" YouTube videos — paste each video's YouTube link
// into `youtube` (watch?v=…, youtu.be/…, or the 11-char id) to enable playback.
const STORY_VIDEOS: StoryVideo[] = [
  { thumb: "/assets/story/watch-1.webp", alt: "Mawra's transformation story video", title: "Mawra's Transformation Story", youtube: "https://youtu.be/5PoVQn36qY4" },
  { thumb: "/assets/story/watch-2.webp", alt: "How Mawra lost 61 kg after being bullied and fat shamed", title: "How Mawra Lost 61 Kg", youtube: "https://youtu.be/6Hwcdl0r_r8" },
];

// 8 framework points with contextual icons (timeline).
const FRAMEWORK: { icon: IconName; title: string; body: string }[] = [
  { icon: "nutrition", title: "Personalised Nutrition Strategy", body: "Built around your lifestyle, preferences and health challenges." },
  { icon: "heart", title: "Emotional Eating Support", body: "Understand what's driving the urge to eat when you're not physically hungry." },
  { icon: "identity", title: "Behaviour and Identity Coaching", body: "Address the habits and beliefs that keep pulling you back to old versions of yourself." },
  { icon: "training", title: "Training That Fits Real Life", body: "A plan designed around your schedule, not someone else's." },
  { icon: "medical", title: "Support For PCOS, Thyroid and Insulin Resistance", body: "Strategies adapted to your body's unique needs." },
  { icon: "mind", title: "Counsellor-Led Mindset Support", body: "Work through the thoughts and emotional patterns that traditional weight loss programmes ignore." },
  { icon: "habit", title: "Progressive Habit Building", body: "Small changes that become permanent instead of overwhelming rules you can't sustain." },
  { icon: "target", title: "Long-Term Transformation Focus", body: "Designed to help you keep the weight off, not just lose it." },
];

// 5 "what you'll walk away with" points (numbered boxes).
const WALKAWAY: [string, string][] = [
  ["A Deep Dive Into Your Weight Loss History", "We'll look at every major attempt you've made before: what worked, what didn't, and why the results never lasted."],
  ["The Hidden Patterns Keeping You Stuck", "Emotional eating, all-or-nothing thinking, stress eating, self-sabotage, giving up after one bad day... we'll uncover the patterns that may be pulling you back into the same cycle."],
  ["An Honest Assessment Of Your Biggest Roadblocks", "Whether it's PCOS, thyroid issues, insulin resistance, your relationship with food, or your lifestyle, Mawra will identify the factors that are making fat loss harder for you."],
  ["A Personalised Transformation Roadmap", "You'll get clarity on what would actually need to change, not just in your diet or workouts, but in your habits, mindset and identity, to finally lose the weight and keep it off."],
  ["A Clear Answer On Whether Mawra Can Help", "If Mawra believes her programme is the right fit for you, she'll explain what working together would look like. And if she doesn't think she's the best person to help, she'll tell you that honestly too."],
];

// 5 qualification points with green highlights + bold emphasis.
const QUALIFY: React.ReactNode[] = [
  <>You have <span className="hl">30, 40, even 50+ kilos to lose</span>, and after years of trying, the goal feels <strong>further away than ever</strong>.</>,
  <>You&apos;ve lost weight before, maybe several times, but no matter how much progress you make, you somehow <span className="hl">end up back where you started</span>.</>,
  <>You struggle with <span className="hl">emotional eating, stress eating</span>, or turning to food when life gets overwhelming, even when you&apos;re <strong>not physically hungry</strong>.</>,
  <><span className="hl">PCOS, thyroid issues, insulin resistance</span>, or other health challenges make it feel like your body is <strong>working against you</strong> while everyone else seems to lose weight with ease.</>,
  <>Deep down, you know losing the weight would change <span className="hl">far more than how you look</span> — it would change how you feel, how you show up, and <strong>the life you&apos;re able to live</strong>.</>,
];

type IconName = "nutrition" | "heart" | "identity" | "training" | "medical" | "mind" | "habit" | "target";

function Icon({ name }: { name: IconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "nutrition":
      return (<svg {...common}><path d="M11 20A7 7 0 0 1 4 13c0-4 3-7 7-7 1.2 0 2.3.3 3.2.9" /><path d="M11 20c0-6 3.5-10 9.5-12" /><path d="M14 7c0-2 1.6-3.5 3.6-3.5" /></svg>);
    case "heart":
      return (<svg {...common}><path d="M19.5 13.5C21 12 22 10.4 22 8.5A4.5 4.5 0 0 0 12 6 4.5 4.5 0 0 0 2 8.5c0 1.9 1 3.5 2.5 5L12 21z" /></svg>);
    case "identity":
      return (<svg {...common}><circle cx="12" cy="8" r="4" /><path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /></svg>);
    case "training":
      return (<svg {...common}><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></svg>);
    case "medical":
      return (<svg {...common}><path d="M2 12h4l2.5-6 4 12 2.5-6H22" /></svg>);
    case "mind":
      return (<svg {...common}><path d="M21 11.5a8 8 0 0 1-8.5 8L7 22v-3.5A8 8 0 1 1 21 11.5z" /><path d="M9 11h6M9 8h6" /></svg>);
    case "habit":
      return (<svg {...common}><path d="M3 17l5-5 4 4 9-9" /><path d="M17 7h4v4" /></svg>);
    case "target":
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg>);
  }
}

export default function Page() {
  return (
    <>
      <main id="top">
        {/* ============ TOP STRIP (moving marquee) ============ */}
        <div className="urgency-strip">
          <div className="urgency-marquee">
            <div className="urgency-track" aria-hidden="true">
              {Array.from({ length: 2 }).map((_, dup) => (
                <div className="um-group" key={dup} style={{ display: "inline-flex" }}>
                  <span className="um-item"><span className="um-dot" /><b>LIVE</b> · Limited free assessment calls this week</span>
                  <span className="um-sep">✦</span>
                  <span className="um-item">Only a few spots left this week</span>
                  <span className="um-sep">✦</span>
                  <span className="um-item">500+ women transformed for life</span>
                  <span className="um-sep">✦</span>
                  <span className="um-item">TEDx Speaker · 60+ Kilos Lost and Maintained</span>
                  <span className="um-sep">✦</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============ HERO ============ */}
        <section className="hero-funnel" data-screen-label="01 Hero">
          <div className="wrap">
            <div className="hero-funnel-inner">
              <span className="eyebrow-pill">
                <span className="dot"></span>For Women With Significant Weight To Lose · Battling PCOS, Thyroid Or Insulin Resistance · Feeling Stuck In A Cycle Of Emotional Eating, Failed Diets and Lost Confidence
              </span>

              <h1 className="hero-h1">
                Lose 20, 30, 40, Even <span className="accent-italic">60+ Kilos,</span> Keep It Off For Life<br className="br-d" />
                {" "}And Love The Woman In The Mirror Again
              </h1>

              {/* Mawra's picture (placeholder) */}
              <div className="vsl-wrap hero-portrait-wrap">
                <div className="vsl-box hero-portrait" id="vsl">
                  <img src={IMG} className="vsl-image" alt="Coach Mawra — Transformation Coach" width={1672} height={941} fetchPriority="high" decoding="async" />
                </div>
              </div>

              {/* Credentials — below the image */}
              <div className="hero-creds">
                <h2 className="hero-name">Coach Mawra</h2>
                <p className="hero-role">Women&apos;s Fat Loss and Identity Transformation Specialist</p>
                <div className="hero-cred-pills">
                  <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>TEDx Speaker</span>
                  <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>500+ Transformations</span>
                  <span className="hero-cred-pill"><span className="cpd" aria-hidden="true"></span>60+ Kilos Lost and Maintained</span>
                </div>
              </div>

              <div className="hero-cta-block">
                <a className="cta-big" href="#book" data-lead="1">
                  {CTA_LABEL}
                  <span className="arrow">→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============ STORY ============ */}
        <section className="sec-band-paper sec-dark" data-screen-label="02 Story">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="sec-label">Story Section</span>
              <h2 className="sec-h2">Before Mawra Helped <span className="accent">500+ Women</span><br />Change Their Lives,</h2>
              <p className="sec-lede" style={{ fontFamily: "'Manrope', sans-serif", fontStyle: "italic" }}>She Had To Change Her Own.</p>
            </div>

            {/* Single 2-column section: before/after photo on the left,
                Then → Now comparison table (red/green) on the right. */}
            <div className="story-split reveal">
              <div className="story-photo">
                <img src="/assets/story/helped.webp" width={1000} height={1000} alt="Coach Mawra before and after — 115 kg to 55 kg" />
              </div>

              <div className="story-compare">
                <span className="sec-label xform-label">Then and Now</span>
                <div className="xform">
                  <div className="xform-head">
                    <span className="xform-h then">Then</span>
                    <span className="xform-h now">Now</span>
                  </div>
                  {([
                    ["115 kilos", "55 kilos"],
                    ["Lost 100+ kilos and gained it back", "60+ kilos lost and maintained"],
                    ["Battled emotional eating", "Helps women break the cycle"],
                    ["Thought she'd never escape the cycle", "Helped 500+ women transform for life"],
                    ["Felt stuck for 15 years", "Featured on TEDx and Josh Talks"],
                  ] as [string, string][]).map(([then, now], i) => (
                    <div className="xform-row" key={i}>
                      <div className="xform-then">{then}</div>
                      <div className="xform-now">{now}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sec-head reveal" style={{ marginTop: 56 }}>
              <h2 className="sec-h2" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>Over <span className="accent">7 Lakh People</span> Have Watched Mawra&apos;s Story.</h2>
            </div>
            <div className="reveal">
              <StoryVideos items={STORY_VIDEOS} />
            </div>

            <div className="sec-head reveal" style={{ marginTop: 56, marginBottom: 28 }}>
              <h2 className="sec-h2" style={{ fontSize: "clamp(26px, 3.6vw, 40px)" }}>Featured By India&apos;s<br /><span className="accent">Leading Publications</span></h2>
            </div>
            <div className="reveal" style={{ textAlign: "center" }}>
              <div className="press-row">
                <img className="press-logo" src="/assets/press/toi.png" alt="The Times of India" loading="lazy" />
                <img className="press-logo" src="/assets/press/hindu.png" alt="The Hindu" loading="lazy" />
                <img className="press-logo" src="/assets/press/fittak.png" alt="Fit Tak" loading="lazy" />
                <img className="press-logo" src="/assets/press/jagran.png" alt="Dainik Jagran" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        {/* ============ CLIENT RESULTS ============ */}
        <section className="sec-band-night" data-screen-label="03 Results">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="sec-label">Client Results Section</span>
              <h2 className="sec-h2">Women Who Lost The Weight They Thought<br />They&apos;d Carry <span className="accent">Forever.</span></h2>
            </div>

            <div className="reveal">
              <TestiVideoSlider items={VIDEO_TESTIMONIALS} />
            </div>

            <div className="sec-head reveal" style={{ marginTop: 56 }}>
              <h2 className="sec-h2" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>Their <span className="accent">Transformations.</span></h2>
              <p className="sec-lede">Real before-and-afters from women who kept it off.</p>
            </div>
            <div className="reveal">
              <MarqueeSlider items={CLIENT_RESULTS} cardClass="result-card" showName />
            </div>

            <div className="sec-head reveal" style={{ marginTop: 56 }}>
              <h2 className="sec-h2" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>Straight From Their <span className="accent">Chats.</span></h2>
              <p className="sec-lede">Unfiltered messages from women mid-transformation. Tap to read.</p>
            </div>
            <div className="reveal">
              <MarqueeSlider items={WRITTEN_TESTIMONIALS} cardClass="chat-card" />
            </div>

            <div className="faq-closing reveal" style={{ marginTop: 48 }}>
              <a className="cta-big" href="#book" data-lead="1">{CTA_LABEL}<span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        {/* ============ QUALIFICATION ============ */}
        <section className="sec-band-paper-2 sec-dark" data-screen-label="04 Qualify">
          <div className="wrap narrow">
            <div className="sec-head reveal">
              <span className="sec-label">Qualification Section</span>
              <h2 className="sec-h2">Does This Sound Like <span className="accent">You?</span></h2>
            </div>

            <div className="agenda-box reveal">
              {QUALIFY.map((point, i) => (
                <div className="agenda-row" key={i}>
                  <div className="agenda-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
                  </div>
                  <div><p className="agenda-body">{point}</p></div>
                </div>
              ))}
            </div>

            <div className="faq-closing reveal">
              <div className="faq-closing-plaque">
                <p className="faq-closing-lead">Then you&apos;re exactly the kind of woman Mawra works with.</p>
              </div>
              <a className="cta-big" href="#book" data-lead="1">{CTA_LABEL}<span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        {/* ============ PROGRAM FRAMEWORK (timeline) ============ */}
        <section className="sec-band-night" data-screen-label="05 Approach">
          <div className="wrap narrow">
            <div className="sec-head reveal">
              <span className="sec-label">Program Framework / Approach Section</span>
              <h2 className="sec-h2">What Makes Mawra&apos;s Approach <span className="accent">Different?</span></h2>
            </div>

            <div className="timeline reveal">
              {FRAMEWORK.map((f, i) => (
                <div className="tl-item" key={i}>
                  <div className="tl-node"><Icon name={f.icon} /></div>
                  <div className="tl-content">
                    <h3 className="tl-title">{f.title}</h3>
                    <p className="tl-body">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ DETAILS ABOUT THE CALL (numbered boxes) ============ */}
        <section className="sec-band-paper sec-dark" data-screen-label="06 The Call">
          <div className="wrap narrow">
            <div className="sec-head reveal">
              <span className="sec-label">Details About The Call Section</span>
              <h2 className="sec-h2">Book Your <span className="accent">Assessment Call.</span></h2>
              <p className="sec-lede" style={{ fontFamily: "'Manrope', sans-serif", fontStyle: "italic" }}>Here&apos;s what you&apos;ll walk away with.</p>
            </div>

            <div className="numbox-grid reveal">
              {WALKAWAY.map(([title, body], i) => (
                <div className="numbox" key={i}>
                  <div className="numbox-num">{i + 1}</div>
                  <div className="numbox-content">
                    <h3 className="numbox-title">{title}</h3>
                    <p className="numbox-body">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="compare-callout reveal">
              <p className="callout-lead">This Call Is For Women Who Are Ready For Real Change.</p>
              <p className="callout-punch">
                If you&apos;re looking for a quick fix, this probably isn&apos;t for you.<br />
                <em>But if you&apos;re tired of losing the same kilos over and over again, and you&apos;re finally ready to understand what it takes to transform for life...</em>
              </p>
            </div>

            <div className="faq-closing reveal">
              <a className="cta-big" href="#book" data-lead="1">{CTA_LABEL}<span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <section className="final-cta-block" id="book-form" data-screen-label="07 Footer">
          <div className="foot-bottom">
            <span>Coach Mawra · Fat Loss and Identity Transformation</span>
            <span className="foot-ornament" aria-hidden="true">✦</span>
            <span className="foot-links">
              <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
            </span>
          </div>
          <FooterDisclaimer />
        </section>

        {/* ============ STICKY CTA ============ */}
        <a className="sticky-cta" id="stickyCta" href="#book" data-lead="1">
          <span className="sticky-tag">Free this week</span>
          <span className="sticky-label"><strong>{CTA_LABEL}</strong></span>
          <span className="sticky-arrow">Book now <span className="ar">→</span></span>
        </a>
      </main>

      <LeadModal />
      <Script src="/funnel.js?v=6" strategy="afterInteractive" />
    </>
  );
}
