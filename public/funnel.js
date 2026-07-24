// Sreshtha VSL Funnel — conversion chrome

// ============ Marquee population — real transformation images ============
// Filenames in /public/assets/transformation-images follow:
//   "Name _ N Kgs Lost _ Condition One _ Condition Two ... .png"
// Each underscore-separated chunk becomes a piece of the card label.
(function() {
  const files = [
    "Aishani Sheth _ 18 Kgs Lost _ Identity Shift.png",
    "Amrapali Basu _ 11 Kgs Lost _ PCOS, Thyroid, Migraines and Insomnia Reversed.png",
    "Ann Shirley Natasha _ 12 Kgs Lost _ Identity Shift.png",
    "Anviti Chaurasiya _ 17 Kgs Lost _ Confidence Boosted _ Massive Career Success.png",
    "Deepali Sekhani _ 13 Kgs Lost _ Culinary Reinvention at Home.png",
    "Divyasree Bobba _ 15 Kgs Lost _ PCOS Reversed.png",
    "Ispita Sen _ 10 Kgs Lost _ Massive Career Success.png",
    "Jija Bhattacharya _ 19 Kgs Lost _ Thyroid Reversed.png",
    "Keerthana Bairi _ 14 Kgs Lost _ PCOS Reversed.png",
    "Krishnachura Banerjee _ 21 Kgs Lost _ Identity Evolution.png",
    "Pooja Patodia _ 11 Kgs Lost _ Inflammation Reversed.png",
    "Preeti Roy Chowdhury _ 16 Kgs Lost _ PCOS Reversed.png",
    "Ritika Deb _ 17 Kgs Lost _ Type 2 Diabetes Reversed.png",
    "Sandhya Allu _ 17 Kgs Lost _ Type 2 Diabetes Reversed _ Uveitis Reversed_.png",
    "Sharmistha Bose _ 11 Kgs Lost _ Fatty Liver Reversed _ Uric Acid Stabilised _ Blood Pressure Reversed.png",
    "Shirina Mukherjee _ 14 Kgs Lost _ Bloating and Inflammation Reversed.png",
    "Shruti Verma _ 15 Kgs Lost _ Obesity & Fatty Liver Reversed _ Inflammation & Bloating Reversed.png",
    "Sreyoshi Bose _ 14 Kgs Lost _ Chronic Anxiety Reversed.png",
    "Swati Mantri _ 10 Kgs Lost _ Bloating & Inflammation Reversed.png",
    "Vaishnavi Chowdhary _ 10 Kgs Lost _ Endometriosis Reversed.png",
    "Zarina Mukherjee _ 15 Kgs Lost _ Thyroid & Inflammation Reversed.png",
  ];

  function parse(filename) {
    const base = filename.replace(/\.(png|jpe?g)$/i, "");
    const parts = base.split(" _ ").map(s => s.trim().replace(/_+$/, "").trim());
    return {
      file: filename,
      name: parts[0],
      kgs: parts[1],
      conditions: parts.slice(2),
    };
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function card(t) {
    const conds = t.conditions.join(" · ");
    return `<div class="marquee-card">
      <div class="marquee-img-wrap">
        <img class="marquee-img" src="/assets/transformation-images/${encodeURI(t.file)}" alt="${esc(t.name)}, ${esc(t.kgs)}, ${esc(conds)}" loading="lazy" />
      </div>
      <div class="marquee-meta">
        <span class="mm-name">${esc(t.name)}</span>
        <span class="mm-kgs">${esc(t.kgs.toUpperCase())}</span>
        <span class="mm-cond">${esc(conds)}</span>
      </div>
    </div>`;
  }

  const items = files.map(parse);
  // Split into two visually balanced rows scrolling opposite directions
  const half = Math.ceil(items.length / 2);
  const row1 = items.slice(0, half);
  const row2 = items.slice(half);

  const html1 = row1.map(card).join("");
  const html2 = row2.map(card).join("");
  const m1 = document.getElementById("marquee1");
  const m2 = document.getElementById("marquee2");
  if (m1) m1.innerHTML = html1 + html1; // double for seamless loop
  if (m2) m2.innerHTML = html2 + html2;

  // Touch: pause both rows while a finger is held down, resume on release.
  const rows = [m1, m2].filter(Boolean);
  if (rows.length) {
    const pause = () => rows.forEach(r => r.classList.add('touch-paused'));
    const resume = () => rows.forEach(r => r.classList.remove('touch-paused'));
    const band = document.querySelector('.marquee-edges');
    if (band) {
      band.addEventListener('touchstart', pause, { passive: true });
      band.addEventListener('touchend', resume, { passive: true });
      band.addEventListener('touchcancel', resume, { passive: true });
    }
  }
})();

// ============ Reveal ============
(function() {
  const els = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(el => io.observe(el));
})();

// ============ Number counters ============
(function() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;
  function animate(el) {
    const to = parseFloat(el.dataset.to);
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    function tick(t) {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = to * eased;
      const isInt = !el.dataset.suffix;
      el.textContent = (isInt ? Math.round(v) : v.toFixed(0)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = (isInt ? to : to + suffix);
    }
    requestAnimationFrame(tick);
  }
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animate);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => io.observe(c));
})();

// ============ Countdown timer (top strip) ============
(function() {
  const el = document.getElementById('countdown');
  if (!el) return;
  // start around 14:17, loop every 30 min so always visible
  let total = 14 * 60 + 17;
  function tick() {
    if (total < 0) total = 30 * 60;
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
    total--;
  }
  tick();
  setInterval(tick, 1000);
})();

// ============ Spots-left ticker ============
(function() {
  const els = [
    document.getElementById('spots'),
    document.getElementById('spots-2'),
    document.getElementById('spots-3'),
  ].filter(Boolean);
  if (!els.length) return;
  let count = 7;
  function setAll() { els.forEach(e => e.textContent = String(count)); }
  setAll();
  // tick down occasionally — slow & subtle
  setInterval(() => {
    if (count > 3 && Math.random() > 0.55) {
      count--;
      setAll();
      els.forEach(e => {
        e.style.transition = 'none';
        e.style.transform = 'scale(1.25)';
        e.style.color = '#ffbfa0';
        requestAnimationFrame(() => {
          e.style.transition = 'transform .35s ease, color .35s ease';
          e.style.transform = 'scale(1)';
        });
      });
    }
  }, 22000);
})();

// ============ Sticky CTA bar ============
(function() {
  const bar = document.getElementById('stickyCta');
  const vsl = document.getElementById('vsl');
  const finalCta = document.getElementById('book-form');
  if (!bar || !vsl) return;

  function update() {
    const vslRect = vsl.getBoundingClientRect();
    // show once the video is mostly scrolled out of view
    const past = vslRect.bottom < window.innerHeight * 0.4;
    // hide if final CTA is in view (so it doesn't double up)
    let inFinal = false;
    if (finalCta) {
      const r = finalCta.getBoundingClientRect();
      inFinal = r.top < window.innerHeight * 0.8 && r.bottom > 0;
    }
    if (past && !inFinal) bar.classList.add('in');
    else bar.classList.remove('in');
    // Mobile shows the bar by default via CSS (visible from the first screen);
    // only hide it once the final CTA is on screen so the two don't stack.
    bar.classList.toggle('is-hidden', window.innerWidth <= 720 && inFinal);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ============ VSL play (Vimeo embed) ============
(function() {
  const vsl = document.getElementById('vsl');
  if (!vsl) return;
  const src = vsl.getAttribute('data-video');
  // No embedded video on this layout (the hero banner is a plain link to the
  // Then/Now section) — bail out so we never preventDefault its navigation.
  if (!src) return;

  function start() {
    if (vsl.dataset.playing === '1' || !src) return;
    vsl.dataset.playing = '1';
    vsl.classList.add('playing');
    const sep = src.indexOf('?') >= 0 ? '&' : '?';
    const iframe = document.createElement('iframe');
    iframe.src = src + sep + 'autoplay=1&title=0&byline=0&portrait=0&dnt=1&playsinline=1';
    iframe.className = 'vsl-video';
    iframe.title = 'Sreshtha VSL';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.allowFullscreen = true;
    iframe.style.border = '0';
    vsl.appendChild(iframe);
  }

  vsl.addEventListener('click', (e) => {
    if (vsl.dataset.playing === '1') return; // let the Vimeo player handle clicks
    e.preventDefault();
    start();
  });
})();

// ============ Case study video modal ============
(function() {
  const modal = document.getElementById('caseModal');
  const video = document.getElementById('caseModalVideo');
  if (!modal || !video) return;

  function open(src) {
    video.src = src;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    video.play().catch(() => {});
  }
  function close() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.case-video[data-video]').forEach(card => {
    const src = card.getAttribute('data-video');
    if (!src) return;
    card.addEventListener('click', () => open(src));
  });

  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
})();

// ============ FAQ — close others ============
(function() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach(other => { if (other !== item) other.open = false; });
      }
    });
  });
})();

// ============ Timeline scroll progress (live, reversible) ============
(function() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const items = Array.from(timeline.querySelectorAll('.tl-item'));
  if (!items.length) return;

  let ticking = false;
  function update() {
    ticking = false;
    // Reference line ~58% down the viewport. A step is active once its node
    // has scrolled above this line, and de-activates when scrolled back below.
    const refLine = window.innerHeight * 0.58;
    items.forEach((item) => {
      const node = item.querySelector('.tl-node') || item;
      const rect = node.getBoundingClientRect();
      const nodeCenter = rect.top + rect.height / 2;
      // Active once the node has scrolled above the reference line; de-activates
      // when scrolled back below it — fully reversible, tracks scroll position.
      item.classList.toggle('is-active', nodeCenter <= refLine);
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// ============ Scroll progress bar (golden, top of page) ============
(function() {
  const bar = document.createElement('div');
  bar.className = 'scroll-prog';
  const fill = document.createElement('i');
  bar.appendChild(fill);
  document.body.appendChild(bar);

  let ticking = false;
  function update() {
    ticking = false;
    const doc = document.documentElement;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    const p = Math.min(Math.max(window.scrollY / max, 0), 1);
    fill.style.width = (p * 100).toFixed(2) + '%';
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
