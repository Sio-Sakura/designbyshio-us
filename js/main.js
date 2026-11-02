/* Design by Shio — U.S. site · interactions
   deps (CDN): GSAP 3 + ScrollTrigger, Lenis */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Preloader / page curtain ---------- */
  const curtain = $('.curtain');
  const firstVisit = !sessionStorage.getItem('dbs-seen') && !location.search.includes('nointro');
  // Shio: the logo curtain plays only on Home, first visit in the tab. Everywhere else: no curtain at all.
  const intro = firstVisit && !reduce && document.body.classList.contains('page-home');
  if (!intro) curtain.style.display = 'none';
  function openCurtain() {
    const tl = gsap.timeline({ onComplete: () => { curtain.style.display = 'none'; startHero(); dispatchEvent(new Event('dbs:hero')); } });
    if (intro) {
      sessionStorage.setItem('dbs-seen', '1');
      const count = { v: 0 };
      // Shio: shorter intro, and the logo lifts away WITH the curtain (one sheet, not two steps) — ~2.5s total
      tl.to('.curtain .mark b span', { y: 0, duration: .9, stagger: 0.07, ease: 'power4.out' }, 0)
        .to('.curtain .mark small', { opacity: 1, duration: .5 }, .5)
        .to(count, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { $('.curtain .count').textContent = Math.round(count.v).toString().padStart(3, '0'); } }, 0)
        .to('.curtain .bar', { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
        .to(curtain, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 1.5);
    }
  }
  // outgoing transition for internal links
  $$('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http') || a.target === '_blank') return;
    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey) return;
      document.body.classList.remove('menu-open'); // no outgoing curtain: navigate right away
    });
  });
  window.addEventListener('pageshow', e => { if (e.persisted) { curtain.style.display = 'none'; } });

  /* ---------- Header ---------- */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('scrolled', (lenis ? lenis.scroll : scrollY) > 40);
  (lenis ? lenis.on('scroll', onScroll) : addEventListener('scroll', onScroll, { passive: true }));
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    $('.mmenu')?.setAttribute('aria-hidden', String(!open));
    lenis && (open ? lenis.stop() : lenis.start());
  };
  $('.burger')?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $('.mmenu-close')?.addEventListener('click', () => setMenu(false));
  $('.mmenu-bg')?.addEventListener('click', () => setMenu(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- Contact overlay ---------- */
  const contact = $('.contact');
  contact?.setAttribute('data-lenis-prevent', ''); // 開いている間も、列の中はホイールでスクロールできるように
  const openContact = () => {
    contact.classList.add('open'); document.body.classList.remove('menu-open'); lenis && lenis.stop();
    // always open at the very top (≤900 the panes stack and the panel scrolls)
    contact.scrollTop = 0; $$('.contact .pane').forEach(p => { p.scrollTop = 0; });
    // desktop only: put the cursor in Name without scrolling the panel (on phones/iPad it would also pop up the keyboard)
    if (innerWidth > 900) setTimeout(() => $('#f-name')?.focus({ preventScroll: true }), 900);
  };
  const closeContact = () => { contact.classList.remove('open'); lenis && lenis.start(); };
  $$('[data-contact]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openContact(); }));
  $('.contact .close')?.addEventListener('click', closeContact);
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeContact(); $('.lightbox')?.classList.remove('open'); lenis && lenis.start(); } });
  if (location.hash === '#contact') setTimeout(openContact, 1200);
  // resizing: stop the panes' slide so they don't cross the screen when the hide direction switches at 900px
  let resizeT; addEventListener('resize', () => { contact.classList.add('no-anim'); clearTimeout(resizeT); resizeT = setTimeout(() => contact.classList.remove('no-anim'), 250); });
  // mailto composer (static fallback until a form backend is connected)
  $('.form')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const missing = [...f.querySelectorAll('[required]')].find(el => !el.value.trim());
    if (missing) { missing.focus(); return; }
    const body = [
      `Name: ${f.name.value}`, `Business: ${f.business.value}`, `Website: ${f.website.value}`,
      `Project: ${f.project.value}`, `Budget: ${f.budget.value}`, '', f.message.value
    ].join('\n');
    location.href = `mailto:designbyshio@gmail.com?subject=${encodeURIComponent('Project inquiry — ' + (f.business.value || f.name.value))}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- Custom cursor ---------- */
  if (fine && !reduce) {
    const cur = $('.cursor'), dot = $('.cursor .dot'), ring = $('.cursor .ring');
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }, tgt = { ...pos };
    addEventListener('mousemove', e => { tgt.x = e.clientX; tgt.y = e.clientY; gsap.set(dot, { x: tgt.x, y: tgt.y }); });
    gsap.ticker.add(() => { pos.x += (tgt.x - pos.x) * .18; pos.y += (tgt.y - pos.y) * .18; gsap.set(ring, { x: pos.x, y: pos.y }); });
    const hoverables = 'a, button, .srow, [data-cursor]';
    document.addEventListener('mouseover', e => {
      const t = e.target.closest(hoverables); if (!t) { cur.classList.remove('hover', 'view', 'green'); return; }
      cur.classList.add('hover');
      cur.classList.toggle('green', !!t.closest('.wcard.end'));
      if (t.dataset.cursor) { cur.classList.add('view'); $('.cursor .ring span').textContent = t.dataset.cursor; } else cur.classList.remove('view');
    });
    document.addEventListener('mouseleave', () => cur.classList.remove('hover', 'view', 'green'));
  }

  /* ---------- Split text ---------- */
  $$('[data-split]').forEach(el => {
    // keep explicit <br> line breaks
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map(seg => seg.trim().split(/\s+/).filter(Boolean).map(w => `<span class="w"><i>${w}</i></span>`).join(' ')).join(' <br>'); // 改行の前にスペースを残す（改行を消したときに単語がくっつかないように）
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    if (el.hasAttribute('data-split')) {
      gsap.fromTo(el.querySelectorAll('.w>i'), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, stagger: .035, ease: 'power4.out', delay: +(el.dataset.delay || 0) }); // fromTo: start below even though .in clears the CSS offset
      el.classList.add('in');
    } else {
      const kids = el.hasAttribute('data-stagger') ? [...el.children] : [el];
      kids.forEach((k, i) => { k.style.transitionDelay = `${(+(el.dataset.delay || 0)) + i * .09}s`; k.classList.add('in'); });
      if (el.hasAttribute('data-stagger')) el.classList.add('in');
    }
    io.unobserve(el);
  }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal],[data-split]').forEach(el => { if (el.hasAttribute('data-stagger')) [...el.children].forEach(k => k.setAttribute('data-reveal', '')); io.observe(el); });

  /* ---------- Image reveals + parallax ---------- */
  $$('.figure.reveal').forEach(f => {
    gsap.to(f, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: f, start: 'top 85%' } });
    const img = f.querySelector('img');
    if (!f.classList.contains('whole')) { const z = f.classList.contains('zoom'); gsap.fromTo(img, { scale: z ? 1.3 : 1.25 }, { scale: z ? 1.15 : 1.02, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } }); }
  });
  $$('[data-parallax]').forEach(el => {
    const amt = +el.dataset.parallax || 60;
    gsap.fromTo(el, { y: -amt }, { y: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Counters ---------- */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, dec = (el.dataset.count.split('.')[1] || '').length;
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => el.textContent = o.v.toFixed(dec) }) });
  });

  /* ---------- Marquee ---------- */
  $$('.marquee').forEach(m => {
    const track = m.querySelector('.track');
    track.innerHTML += track.innerHTML;
    const rtl = m.dataset.dir === 'rtl';
    const tween = gsap.fromTo(track, { xPercent: rtl ? -50 : 0 }, { xPercent: rtl ? 0 : -50, duration: +(m.dataset.speed || 28), ease: 'none', repeat: -1 });
    ScrollTrigger.create({ trigger: m, start: 'top bottom', end: 'bottom top', onUpdate: s => { tween.timeScale(1 + Math.min(Math.abs(s.getVelocity()) / 600, 3)); } });
    if (reduce) tween.pause();
  });

  /* ---------- Stat band: slot-machine digits (CSS transitions, no rAF dependency) ---------- */
  const sband = $('.statband');
  if (sband) {
    $$('.reel[data-n]', sband).forEach(r => {
      r.innerHTML = '';
      String(r.dataset.n).split('').forEach(d => {
        const col = document.createElement('span'); col.className = 'reel col'; col.dataset.d = d;
        const strip = document.createElement('span'); strip.className = 'strip';
        for (let k = 0; k < 30; k++) { const b = document.createElement('b'); b.textContent = k % 10; strip.appendChild(b); }
        col.appendChild(strip); r.appendChild(col);
      });
    });
    ScrollTrigger.create({ trigger: sband, start: 'top 90%', once: true, onEnter: () => {
      sband.classList.add('on');
      $$('.stat', sband).forEach((st, si) => $$('.reel.col', st).forEach((col, ci) => {
        const d = +col.dataset.d, strip = $('.strip', col);
        strip.style.transition = reduce ? 'none' : `transform ${1.6 + ci * .3}s cubic-bezier(.16,1,.3,1) ${.3 + si * .18}s`;
        strip.style.transform = `translateY(-${((20 + d) / 30) * 100}%)`;
      }));
    } });
  }

  /* ---------- Flip band: cards flip EN ⇄ JA one after another ---------- */
  const fband = $('.flipband');
  let spun = false;
  const spinTools = () => {
    if (!fband || spun || reduce) return; spun = true;
    const cards = $$('.card3d', fband); let i = 0;
    // one card at a time: 20 turns in 1s, stop, 0.2s pause, then the next card
    const startDelay = 700; // let the band settle on screen before the first card spins
    cards.forEach((c, k) => {
      setTimeout(() => { c.classList.add('spin'); setTimeout(() => c.classList.remove('spin'), 1050); }, startDelay + k * 200);
    });
    // then flip the cards to Japanese one at a time in random order (each turns back to English), one round only
    const order = cards.slice().sort(() => Math.random() - .5);
    setTimeout(() => { const iv = setInterval(() => {
      if (i > 0) order[i - 1].classList.remove('ja');
      if (i < order.length) order[i].classList.add('ja'); else clearInterval(iv);
      i++;
    }, 1600); }, startDelay + cards.length * 200 + 1400);
  };
  // on phones/tablets (no horizontal pin) spin when the band scrolls into view
  if (fband && (innerWidth <= 600 || !$('.hworks'))) ScrollTrigger.create({ trigger: fband, start: 'top 90%', once: true, onEnter: spinTools });

  /* ---------- Line band: draw on enter, then flip labels EN ⇄ JA in sequence ---------- */
  const band = $('.lineband');
  if (band) {
    ScrollTrigger.create({ trigger: band, start: 'top 90%', once: true, onEnter: () => {
      band.classList.add('on');
      if (reduce) return;
      const flips = $$('.flip', band); let i = 0;
      setTimeout(() => setInterval(() => { flips[i % flips.length].classList.toggle('ja'); i++; }, 2200), 2600);
    } });
  }

  /* ---------- Why Shio table (≤900, when wider than the screen): swipe cue like Selected work + one nudge when it first comes into view ---------- */
  const vsT = $('.vs');
  if (vsT) {
    const box = document.createElement('div'); box.className = 'vs-box';
    const vhint = document.createElement('div'); vhint.className = 'swipe-hint'; vhint.setAttribute('aria-hidden', 'true');
    vhint.innerHTML = '<span class="sh-label">Swipe <b>&rarr;</b></span><span class="sh-bar"><i></i></span>';
    vsT.parentNode.insertBefore(box, vsT); box.append(vhint, vsT);
    const vthumb = vhint.querySelector('.sh-bar i');
    let nudged = false, auto = false; // auto: the one-time nudge is moving the table (not the visitor)
    const st = () => {
      const max = vsT.scrollWidth - vsT.clientWidth;
      box.classList.toggle('can-scroll', innerWidth <= 900 && max > 2);
      box.classList.toggle('at-end', vsT.scrollLeft >= max - 2);
      // gold part = visible share of the table; slides so it touches the right end when the table is scrolled to the end
      const vis = vsT.clientWidth / vsT.scrollWidth, p = max > 0 ? vsT.scrollLeft / max : 0;
      vthumb.style.setProperty('--sh-w', (vis * 100).toFixed(2) + '%');
      vthumb.style.setProperty('--sh-x', (p * (1 - vis) / vis * 100).toFixed(2) + '%');
      if (vsT.scrollLeft > 4 && !auto) vhint.classList.add('moved');
    };
    vsT.addEventListener('scroll', st, { passive: true }); addEventListener('resize', st); st();
    new IntersectionObserver((es, io) => es.forEach(e => {
      if (!e.isIntersecting || nudged || reduce || !box.classList.contains('can-scroll') || vsT.scrollLeft > 0) return;
      nudged = true; io.disconnect();
      // slide 60px left and back once, so the row visibly moves sideways
      const o = { x: 0 };
      auto = true;
      gsap.timeline({ delay: .5, onComplete: () => { auto = false; } })
        .to(o, { x: Math.min(60, vsT.scrollWidth - vsT.clientWidth), duration: .55, ease: 'power2.out', onUpdate: () => { vsT.scrollLeft = o.x; } })
        .to(o, { x: 0, duration: .6, ease: 'power2.inOut', delay: .15, onUpdate: () => { vsT.scrollLeft = o.x; } });
    }), { threshold: .4 }).observe(vsT);
  }

  /* ---------- Selected work ≤600: swipe cue (gold bar = visible part of the row, moves as you swipe; card number) ---------- */
  const sHint = $('.hworks .swipe-hint'), sTrack = $('.hworks .track');
  if (sHint && sTrack) {
    const bar = sHint.querySelector('.sh-bar i'), num = sHint.querySelector('.sh-count em'), tot = sHint.querySelector('.sh-count span');
    const cards = [...sTrack.querySelectorAll('.wcard')];
    if (tot) tot.textContent = cards.length;
    const upd = () => {
      if (innerWidth > 600) return;
      const max = sTrack.scrollWidth - sTrack.clientWidth, x = sTrack.scrollLeft;
      const vis = sTrack.clientWidth / sTrack.scrollWidth, p = max > 0 ? x / max : 0;
      bar.style.setProperty('--sh-w', (vis * 100).toFixed(2) + '%');
      bar.style.setProperty('--sh-x', (p * (1 - vis) / vis * 100).toFixed(2) + '%');
      // current card = the one whose left edge is nearest the left padding
      const pad = parseFloat(getComputedStyle(sTrack).paddingLeft) || 0, base = sTrack.getBoundingClientRect().left + pad;
      let k = 0, best = Infinity;
      cards.forEach((c, i) => { const d = Math.abs(c.getBoundingClientRect().left - base); if (d < best) { best = d; k = i; } });
      if (p > .98) k = cards.length - 1;
      num.textContent = k + 1;
      if (x > 4) sHint.classList.add('moved');
    };
    sTrack.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd); upd();
  }

  /* ---------- Horizontal works (home) ---------- */
  const hw = $('.hworks');
  if (hw && !reduce) {
    const track = hw.querySelector('.track');
    const mm = gsap.matchMedia();
    mm.add('(min-width: 601px)', () => { // iPad (601–900) uses the same scroll-to-slide as desktop; phones swipe natively (CSS)
      const dist = () => track.scrollWidth - innerWidth;
      // pin so the H2 sits just under the header; the eyebrow above it may scroll out of view
      const h2 = hw.querySelector('.h-2');
      const pinOffset = () => Math.round(h2.getBoundingClientRect().top - hw.getBoundingClientRect().top - 141); // heading stops 141px from the top
      const t = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: hw, start: () => { const o = pinOffset(); return o >= 0 ? 'top top-=' + o : 'top top+=' + (-o); }, end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: s => { if (s.progress > .96) spinTools(); } } });
      /* no sideways parallax on the photos: show each mockup edge to edge */
      return () => {};
    });
  }

  $$('.srow[data-href]').forEach(r => r.addEventListener('click', () => { const a = document.createElement('a'); a.href = r.dataset.href; document.body.appendChild(a); a.click(); a.remove(); }));

  /* ---------- Approach rows: draw the highlight only when that row scrolls into view ---------- */
  const hlIo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('hl-in'); hlIo.unobserve(e.target); } }), { threshold: .6 });
  $$('.pillar, .vs-row, .ab-story .text p').forEach(p => hlIo.observe(p));
  const vh = $('.vs-head'); if (vh) { new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= .8) vh.classList.add('pop'); vh.classList.toggle('off', !e.isIntersecting); }), { threshold: [0, .8] }).observe(vh); }

  /* ---------- Approach tags: start wobbling as soon as they scroll into view ---------- */
  const facts = $('.side-facts');
  if (facts) ScrollTrigger.create({ trigger: facts, start: 'top 85%', once: true, onEnter: () => facts.classList.add('live') });

  /* ---------- Process line ---------- */
  const proc = $('.process'); proc && ScrollTrigger.create({ trigger: proc, start: 'top 75%', once: true, onEnter: () => proc.classList.add('on') });

  /* ---------- Timeline draw (about) ---------- */
  const tlDraw = $('.timeline .draw');
  if (tlDraw) gsap.to(tlDraw, { height: '100%', ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });

  /* ---------- Works page: filter + veil reveal + lightbox ---------- */
  $$('.witem .img .veil').forEach(v => gsap.to(v, { scaleY: 0, duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: v, start: 'top 80%' } }));
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.classList.toggle('on', x === b));
    const k = b.dataset.f;
    $$('.witem').forEach(w => {
      const off = k !== 'all' && !(w.dataset.k || '').split(' ').includes(k);
      w.classList.toggle('off', off); w.classList.remove('show');
      if (!off) { void w.offsetWidth; w.classList.add('show'); w.querySelectorAll('.veil').forEach(v => gsap.set(v, { scaleY: 0 })); }
    });
    ScrollTrigger.refresh();
  }));
  const lb = $('.lightbox');
  if (lb) {
    $$('.witem .img[data-full]').forEach(i => i.addEventListener('click', () => {
      $('.lightbox .pic img').src = i.dataset.full; $('.lightbox .bar .t').textContent = i.dataset.title || '';
      lb.classList.add('open'); lenis && lenis.stop();
    }));
    $('.lightbox .bar button').addEventListener('click', () => { lb.classList.remove('open'); lenis && lenis.start(); });
  }
  /* Works page opened as works.html#work-site / #work-jp: select that filter and land on the grid */
  const hf = location.hash.match(/^#work-(\w+)$/);
  const hb = hf && $(`.filters button[data-f="${hf[1]}"]`);
  if (hb) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const go = () => {
      hb.click(); ScrollTrigger.refresh();
      const head = $('header')?.getBoundingClientRect().height || 0;
      const y = $('.wgrid-sec .filters').getBoundingClientRect().top + scrollY - head - 24;
      lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
    };
    setTimeout(go, 300); addEventListener('load', () => setTimeout(go, 100), { once: true });
  }

  /* ---------- Works page: scroll-driven 3D cube gallery ----------
     4 ring faces carry 7 projects: the faces nobody can see get refilled as the box turns. */
  const cw = $('.cw');
  if (cw) {
    const items = $$('.cw-item', cw);
    const N = items.length;
    const faceHTML = it => it.dataset.img
      ? `<img src="${it.dataset.img}" alt="">`
      : it.querySelector('.soon').outerHTML;
    const openLb = it => {
      if (!lb || !it.dataset.img) return;
      $('.lightbox .pic img').src = it.dataset.img; $('.lightbox .bar .t').textContent = it.dataset.title || '';
      lb.classList.add('open'); lenis && lenis.stop();
    };
    // list mode (phones / reduced motion): tap an image to zoom
    items.forEach(it => it.querySelector('.img')?.addEventListener('click', () => openLb(it)));

    if (!reduce) gsap.matchMedia().add('(min-width: 901px)', () => {
      cw.classList.add('is-3d');
      const box = $('.cw-box', cw), faces = $$('.cw-face', cw), shadow = $('.cw-shadow', cw), tilt = $('.cw-tilt', cw);
      const countEl = $('.cw-count b', cw), navBtns = $$('.cw-nav button', cw), nav = $('.cw-nav', cw);
      // dice: 6 square faces. Rolls alternate: down (next face comes from below), then right (next comes from the left)
      const FACE_ROT = ['rotateY(0deg)', 'rotateY(180deg)', 'rotateY(90deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];
      faces.forEach((f, j) => f.style.transform = `${FACE_ROT[j]} translateZ(calc(var(--s) / 2))`);
      const FM = FACE_ROT.map(r => new DOMMatrix(r));
      // roll for step k → k+1: down toward the viewer (next face comes from the top), then to the right
      const STEP = (k, deg) => (k % 2 === 0 ? `rotateX(${-deg}deg)` : `rotateY(${deg}deg)`);
      const ASPECT = 891 / 1220; // squash the cube so the front face always has the screenshot's proportions
      let dy = 0; // centres the visible cube between the header and the next section
      const tiltCSS = (lift, sc) => `translateY(${lift + dy}px) scale(${sc}) scaleY(${ASPECT}) rotateX(-8deg) rotateY(-16deg)`;
      const vec = (m, x, y, z) => m.transformPoint(new DOMPoint(x, y, z, 0));
      // orientation after k completed rolls (world-frame rotations, newest on the left)
      const M = [new DOMMatrix()];
      for (let k = 1; k < N; k++) M[k] = new DOMMatrix(STEP(k - 1, 90)).multiply(M[k - 1]);
      // which face is in front at rest for project k, and how much to turn its card so it reads upright
      const plan = M.map(m => {
        let best = 0, bz = -2;
        FM.forEach((fm, j) => { const z = vec(m.multiply(fm), 0, 0, 1).z; if (z > bz) { bz = z; best = j; } });
        const mf = m.multiply(FM[best]), up = vec(mf, 0, -1, 0), rt = vec(mf, 1, 0, 0);
        let phi = 0, by = 2;
        [0, 90, 180, 270].forEach(d => { const r = d * Math.PI / 180, y = Math.sin(r) * rt.y + Math.cos(r) * up.y; if (y < by) { by = y; phi = d; } });
        return { face: best, phi };
      });
      const card = (k, phi) => {
        const it = items[k];
        const inner = it.dataset.img ? `<img src="${it.dataset.img}" alt="">` : it.querySelector('.soon').outerHTML;
        return `<div class="cw-card" style="transform:rotate(${phi}deg)">${inner}</div>`;
      };
      const filled = new Array(6).fill(null);
      const fill = i => {
        const want = {};
        [i - 1, i, i + 1].forEach(k => { if (k >= 0 && k < N) want[plan[k].face] = k; });
        faces.forEach((f, j) => {
          const k = j in want ? want[j] : -1;
          if (filled[j] === k) return;
          filled[j] = k;
          f.innerHTML = k >= 0 ? card(k, plan[k].phi) : '';
        });
      };
      let cur = -1;
      const show = i => {
        if (i === cur) return;
        const prev = items[cur], next = items[i], down = i > cur;
        cur = i;
        items.forEach(it => it.classList.toggle('on', it === next));
        if (prev) gsap.fromTo(prev, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: down ? -30 : 30, duration: .35, ease: 'power2.in', clearProps: 'transform' });
        gsap.fromTo(next.children, { autoAlpha: 0, y: down ? 40 : -40 }, { autoAlpha: 1, y: 0, duration: .7, stagger: .05, ease: 'power3.out', delay: prev ? .15 : 0 });
        gsap.set(next, { autoAlpha: 1, y: 0 });
        countEl.textContent = String(i + 1).padStart(2, '0');
        navBtns.forEach((b, k) => b.classList.toggle('on', k === i));
      };

      let lastS = 0;
      const render = s => { // s = 0 … N-1 (float)
        lastS = s;
        const i = Math.min(Math.floor(s), N - 1), f = s - i;
        fill(i); // outgoing, current and incoming faces
        const m = f > 0 && i < N - 1 ? new DOMMatrix(STEP(i, f * 90)).multiply(M[i]) : M[i];
        box.style.transform = m.toString();
        const turn = Math.sin(f * Math.PI); // 0 at rest, 1 mid-roll
        tilt.style.transform = tiltCSS(-turn * 40, 1 - turn * .1);
        gsap.set(shadow, { scaleX: 1 - turn * .25, opacity: 1 - turn * .5 });
        faces.forEach((fc, j) => { // darker the further a face is turned away
          const z = vec(m.multiply(FM[j]), 0, 0, 1).z;
          fc.style.setProperty('--shade', ((1 - Math.max(z, 0)) * .75).toFixed(3));
        });
        nav.style.setProperty('--p', N > 1 ? s / (N - 1) : 1);
        show(Math.round(s));
      };
      render(0);
      // if any project's text/tags would run into the cube, shrink the cube to 1/1.1 (checked on load and on resize)
      const textRight = () => {
        const r = document.createRange(); let R = -1e9;
        items.forEach(it => {
          it.querySelectorAll('.kind,h3,p,.result').forEach(e => { r.selectNodeContents(e); [...r.getClientRects()].forEach(q => { if (q.width) R = Math.max(R, q.right); }); });
          it.querySelectorAll('.tag').forEach(t => { const q = t.getBoundingClientRect(); if (q.width) R = Math.max(R, q.right); });
        });
        return R;
      };
      const cubeLeft = () => { let L = 1e9; faces.forEach(f => { if (parseFloat(f.style.getPropertyValue('--shade')) < .74) L = Math.min(L, f.getBoundingClientRect().left); }); return L; };
      const fitSize = keep => {
        cw.classList.remove('cw-fit');
        render(Math.round(keep));
        if (textRight() > cubeLeft()) { cw.classList.add('cw-fit'); render(Math.round(keep)); }
      };
      const centerCube = () => {
        const keep = lastS; dy = 0;
        fitSize(keep);
        const sr = $('.cw-stage', cw).getBoundingClientRect(), cs = getComputedStyle($('.cw-stage', cw));
        const bandTop = sr.top + parseFloat(cs.paddingTop), bandBot = sr.bottom - parseFloat(cs.paddingBottom);
        for (let n = 0; n < 8; n++) { // perspective changes the size as it moves, so settle in a few passes
          render(Math.round(keep));
          let top = 1e9, bot = -1e9;
          faces.forEach(f => { if (parseFloat(f.style.getPropertyValue('--shade')) < .74) { const r = f.getBoundingClientRect(); top = Math.min(top, r.top); bot = Math.max(bot, r.bottom); } });
          dy += (bandTop + bandBot) / 2 - (top + bot) / 2; // same space above (to the header) and below (to the next section)
        }
        // shadow follows the cube: just under its lowest edge
        const scR = $('.cw-scene', cw).getBoundingClientRect();
        let bot2 = -1e9; faces.forEach(f => { if (parseFloat(f.style.getPropertyValue('--shade')) < .74) bot2 = Math.max(bot2, f.getBoundingClientRect().bottom); });
        shadow.style.bottom = 'auto'; shadow.style.top = (bot2 - scR.top - 14) + 'px';
        render(keep);
      };
      centerCube();
      ScrollTrigger.addEventListener('refresh', centerCube);

      const st = ScrollTrigger.create({
        trigger: cw, start: 'top top', end: () => '+=' + innerHeight * .85 * (N - 1),
        pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
        snap: { snapTo: 1 / (N - 1), duration: { min: .25, max: .7 }, delay: .08, ease: 'power2.inOut' },
        onUpdate: self => render(self.progress * (N - 1))
      });
      const goTo = k => { const y = st.start + (st.end - st.start) * k / (N - 1); lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' }); };
      navBtns.forEach((b, k) => b.addEventListener('click', () => goTo(k)));
      const onScene = () => openLb(items[cur]);
      $('.cw-scene', cw).addEventListener('click', onScene);

      return () => { // back to list mode below 901px
        st.kill(); cw.classList.remove('is-3d');
        $('.cw-scene', cw).removeEventListener('click', onScene);
        gsap.set(items, { clearProps: 'all' }); items.forEach(it => { it.classList.remove('on'); gsap.set(it.children, { clearProps: 'all' }); });
        cur = -1; filled.fill(null); box.style.transform = ''; tilt.style.transform = ''; ScrollTrigger.removeEventListener('refresh', centerCube);
      };
    });
  }

  /* ---------- Hero intro ---------- */
  function startHero() {
    const hero = $('.hero'); if (!hero) { $$('.phero [data-split]').forEach(el => io.observe(el)); const am = $('.ab-media'); am && gsap.to(am, { clipPath: 'inset(0 0 0% 0)', duration: reduce ? 0 : 1.5, ease: 'expo.out', delay: .2 }); return; }
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.hero-title .line>span', { y: 0, duration: 1.3, stagger: .12 }, 0)
      .to('.hero-media', { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'expo.out' }, .2)
      .to('.hero-sub, .hero-ctas', { y: 0, opacity: 1, duration: 1, stagger: .12 }, .6)
;
    if (reduce) tl.progress(1);
    // hero image parallax
    gsap.to('.hero-media img', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
  gsap.set('.hero-title .line>span', { y: '150%' }); // deep enough that no glyph tops peek out below each line
  gsap.set('.hero .hero-sub, .hero .hero-ctas', { y: 30, opacity: 0 }); // hidden until the intro plays (home FV only; subpage FV buttons use data-reveal)
  // Fit hero title to the full width of its column
  const fitTitle = () => {
    const h1 = $('.hero-title'); if (!h1) return; // ≤900 too: same fit-to-width rule as desktop (photo is stacked, so no height limit)
    const txt = $('.hero-text'), ctas = $('.hero-ctas'), wrap = $('.hero .wrap'), hero = $('.hero');
    const desk = innerWidth > 900 && txt && hero;
    // 901–949: use the 950px size — measure with the 950px text-column width and buttons in one row, then restore
    const as950 = desk && innerWidth < 950 && ctas && wrap;
    if (as950) {
      const wr = wrap.getBoundingClientRect().width;
      txt.style.width = ((950 - (innerWidth - wr)) * 3 / 5) + 'px';
      ctas.style.flexDirection = 'row';
      hero.classList.add('m950');
    }
    h1.style.fontSize = '100px';
    const col = h1.getBoundingClientRect().width;
    const widest = Math.max(...$$('.line>span', h1).map(s => s.scrollWidth));
    let size = Math.min(100 * col / widest, 150);
    h1.style.fontSize = size.toFixed(2) + 'px';
    // keep the whole first view inside 100vh: shrink the title if the text column is too tall (original rule, leaves --fvmin for the 4:5 gaps)
    if (desk) {
      const cs = getComputedStyle(hero);
      const avail = innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (parseFloat(cs.getPropertyValue('--fvmin')) || 0);
      const rest = txt.getBoundingClientRect().height - h1.getBoundingClientRect().height;
      const maxTitle = avail - rest - 6, titleH = h1.getBoundingClientRect().height;
      if (titleH > maxTitle && maxTitle > 0) size = size * maxTitle / titleH;
    }
    // Shio: regular words 5px smaller than the fitted size; "Japanese" keeps its size (em = 1em + 10px)
    h1.style.fontSize = (size - 5).toFixed(2) + 'px';
    // keep at least 10px between the title and the photo
    const fitPhoto = () => {
      for (let i = 0; i < 6; i++) { // repeat: "Japanese" is 1em + 10px, so one proportional step isn't exact
        const edge = txt.getBoundingClientRect().right - 10, left = h1.getBoundingClientRect().left;
        const right = Math.max(...$$('.line>span', h1).map(s => { const r = document.createRange(); r.selectNodeContents(s); return r.getBoundingClientRect().right; })); // actual text edge
        if (right <= edge) break;
        h1.style.fontSize = (parseFloat(h1.style.fontSize) * (edge - left) / (right - left) - .1).toFixed(2) + 'px';
      }
    };
    // safety net: first view inside 100vh with at least 16px above / 20px below (4:5)
    const fitHeight = () => {
      const cs = getComputedStyle(hero);
      const avail = innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 36;
      const max = parseFloat(h1.style.fontSize);
      for (let i = 0; i < 8; i++) {
        const over = txt.getBoundingClientRect().height - avail;
        if (over <= 0) break;
        const f = parseFloat(h1.style.fontSize), tH = h1.getBoundingClientRect().height;
        h1.style.fontSize = Math.min(max, f * (tH - over) / tH - .1).toFixed(2) + 'px';
      }
    };
    // ≤900 (photo on top) — Shio: lower pages' FV H1 + 3px: 51px at 601 → 63px at 900, and 51px at 600 getting smaller at the same rate;
    // ≤430 the widest line runs edge to edge. Never wider than the content width.
    if (innerWidth <= 900) {
      const box = h1.getBoundingClientRect();
      const textW = () => { const rs = $$('.line>span', h1).map(s => { const r = document.createRange(); r.selectNodeContents(s); return r.getBoundingClientRect(); }); return Math.max(...rs.map(r => r.right)) - box.left; };
      for (let i = 0; i < 6; i++) { // edge-to-edge size first (repeat: "Japanese" is 1em + 10px, so one proportional step isn't exact)
        const w = textW(); if (Math.abs(w - box.width) < .5) break;
        h1.style.fontSize = (parseFloat(h1.style.fontSize) * box.width / w).toFixed(2) + 'px';
      }
      const fit = parseFloat(h1.style.fontSize);
      const target = innerWidth > 600 ? 51 + (innerWidth - 601) * 12 / 299 : 51 - (600 - innerWidth) * 12 / 299;
      if (innerWidth > 430) h1.style.fontSize = Math.min(fit, target).toFixed(2) + 'px';
    }
    if (desk) { fitPhoto(); fitHeight(); }
    if (as950) { txt.style.width = ''; ctas.style.flexDirection = ''; hero.classList.remove('m950'); fitPhoto(); fitHeight(); }
  };
  fitTitle(); addEventListener('resize', fitTitle); document.fonts && document.fonts.ready.then(fitTitle);
  // Approach tags: match the height of the quote on the left
  const fitFacts = () => {
    const f = $('.side-facts'), q = $('.sec-head .statement');
    if (!f || !q) return;
    f.style.minHeight = ''; // bottom-aligned with the quote; height is free
  };
  // My approach 601–900: tags beside the H2 — shrink the group only if it's wider than its column (text stays ≥12px)
  const fitSideFacts = () => {
    const sf = $('.sec-head .side-facts'); if (!sf) return;
    const h2 = sf.closest('.sec-head').querySelector('h2'), st = sf.closest('.sec-head').querySelector('.statement');
    sf.style.scale = ''; sf.style.width = ''; sf.style.justifySelf = ''; sf.style.alignSelf = ''; sf.style.marginBottom = ''; sf.style.marginTop = ''; sf.style.marginRight = ''; sf.style.translate = '';
    if (h2) h2.style.fontSize = ''; if (st) st.style.marginTop = '';
    if (innerWidth > 900) return; // ≤600 too: same tag layout as 601
    // 601–900: tags sit above "My approach" — size the group to its widest row so it stays 3 per row; shrink only if wider than the column
    const rs = [...sf.querySelectorAll('.r')], gap = parseFloat(getComputedStyle(sf).columnGap) || 0;
    const rows = {}; rs.forEach(r => { const o = getComputedStyle(r).order; (rows[o] = rows[o] || []).push(r.getBoundingClientRect().width); });
    const need = Math.max(...Object.values(rows).map(ws => ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1)));
    const colW = sf.closest('.wrap').getBoundingClientRect().width; // sec-head is display:contents at ≤900, so measure the section's wrap
    sf.style.width = Math.ceil(need) + 'px';
    // tags under the photo: 1.1× (Shio), smaller only if that would be wider than the column; extra bottom margin for the scaled height
    const k = Math.min(innerWidth > 600 ? 1.21 : 1.1, colW / need); // 601–900: another 1.1× (1.1 × 1.1)
    sf.style.scale = k.toFixed(3);
    // the tags are tilted and scaled, so set the gaps on what you see: photo → highest tag 50px
    const wrapEl = sf.closest('.wrap'), photo = wrapEl.querySelector('.sticky'), rowsEl = wrapEl.querySelector('.pillars');
    if (photo && rowsEl) {
      const tg = [...sf.querySelectorAll('span')];
      const vis = () => { const bs = tg.map(t => t.getBoundingClientRect()); return [Math.min(...bs.map(b => b.top)), Math.max(...bs.map(b => b.bottom))]; };
      const mt = parseFloat(getComputedStyle(sf).marginTop) || 0;
      sf.style.marginTop = (mt + 50 - (vis()[0] - photo.getBoundingClientRect().bottom)).toFixed(1) + 'px';
      const mb = parseFloat(getComputedStyle(sf).marginBottom) || 0;
      sf.style.marginBottom = (mb + 40 - (rowsEl.getBoundingClientRect().top - vis()[1])).toFixed(1) + 'px'; // lowest tag ends 40px above the box
      // centred on what you see (the tilted tags, not the box)
      const bs = tg.map(t => t.getBoundingClientRect()), wr = wrapEl.getBoundingClientRect();
      const off = (Math.min(...bs.map(b => b.left)) + Math.max(...bs.map(b => b.right))) / 2 - (wr.left + wr.right) / 2;
      sf.style.translate = (-off).toFixed(1) + 'px 0';
    }
  };
  // About FV H1, phones (≤600): 3 lines; size follows 48px@600 downward, capped so line 1 never runs past the side padding
  const fitAbTitle = () => {
    const h = $('.page-about .ab-title'); if (!h) return;
    h.style.fontSize = '';
    if (innerWidth > 600) return;
    const firstBr = h.querySelector('br');
    const line1W = () => { const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let n, L = 1e9, R = 0;
      while ((n = tw.nextNode())) { if (firstBr && (firstBr.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)) break; if (!n.textContent.trim()) continue;
        const r = document.createRange(); r.selectNodeContents(n); for (const b of r.getClientRects()) { if (b.width < 1) continue; L = Math.min(L, b.left); R = Math.max(R, b.right); } }
      return R - L; };
    const goal = h.parentElement.getBoundingClientRect().width - parseFloat(getComputedStyle(h.parentElement).paddingLeft) - parseFloat(getComputedStyle(h.parentElement).paddingRight);
    for (let i = 0; i < 5; i++) { const w = line1W(); if (!w || Math.abs(w - goal) < .5) break; h.style.fontSize = (parseFloat(getComputedStyle(h).fontSize) * goal / w).toFixed(2) + 'px'; }
    // Shio: 48px at 600 (same as 601), getting smaller at the same rate as 601–900 — but never wider than the edge-to-edge size
    const smooth = 48 - (600 - innerWidth) * 12 / 299;
    if (innerWidth > 430 && parseFloat(h.style.fontSize) > smooth) h.style.fontSize = smooth.toFixed(2) + 'px'; // ≤430: edge to edge
  };
  fitAbTitle(); addEventListener('resize', fitAbTitle); document.fonts && document.fonts.ready.then(fitAbTitle);
  fitSideFacts(); addEventListener('resize', fitSideFacts); document.fonts && document.fonts.ready.then(fitSideFacts);
  // "why?" no longer needs nudging: at 601–900 it is pinned to the heading's top-right (CSS)
  const fitWhy = () => { const ww = $('.why-word'); if (ww) ww.style.left = ''; };
  fitWhy(); addEventListener('resize', fitWhy); document.fonts && document.fonts.ready.then(fitWhy);
  fitFacts(); addEventListener('resize', fitFacts); document.fonts && document.fonts.ready.then(fitFacts);

  // Left-aligned statement shown centred: shrink its box to the longest line so the ragged right edge doesn't pull it left
  const fitStatements = () => document.querySelectorAll('.page-services .with-statement .statement').forEach(p => {
    p.style.width = '';
    const r = document.createRange(); r.selectNodeContents(p);
    const left = p.getBoundingClientRect().left;
    let max = 0; for (const b of r.getClientRects()) max = Math.max(max, b.right - left);
    if (max) p.style.width = Math.ceil(max + 1) + 'px';
  });
  fitStatements(); addEventListener('resize', fitStatements); document.fonts && document.fonts.ready.then(fitStatements);

  /* ---------- Works hero: thumbnail flow ----------
     Adapted from "Thumbnail Flow Animation with GSAP MotionPath" (demo 2) by Iqbal Muthahhary for Codrops.
     MIT License — Copyright (c) 2009 - 2025 Codrops (https://codrops.com)
     Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
     documentation files (the "Software"), to deal in the Software without restriction, including without limitation
     the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
     to permit persons to whom the Software is furnished to do so, subject to the following conditions:
     The above copyright notice and this permission notice shall be included in all copies or substantial portions
     of the Software.
     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
     THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
     CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
     DEALINGS IN THE SOFTWARE.
     Thumbnails start stacked top-left and flow along a curve into one strip along the bottom of the hero. */
  const wflow = $('.wflow');
  if (wflow && window.MotionPathPlugin && matchMedia('(min-width:901px)').matches) {
    gsap.registerPlugin(MotionPathPlugin);
    const all = [...wflow.querySelectorAll('.wflow-t')];
    const S = .5, EDGE = 24, GAP = 10;
    let tl, used = [];
    const build = () => {
      const prog = tl ? tl.progress() : 0;
      if (tl) { tl.progress(0).kill(); }
      gsap.set(all, { clearProps: 'transform' });
      const w = all[0].offsetWidth, h = all[0].offsetHeight;
      const left0 = all[0].offsetLeft, top0 = all[0].offsetTop;
      const n = Math.min(all.length, Math.floor((wflow.clientWidth - EDGE * 2 + GAP) / (w * S + GAP))); // as many as fit, GAP apart, row centred
      const step = w * S + GAP;
      const startX = Math.max(EDGE, (wflow.clientWidth - (n * w * S + (n - 1) * GAP)) / 2);
      used = all.slice(0, n);
      all.forEach((t, i) => { t.style.display = i < n ? '' : 'none'; });
      gsap.set(used, { zIndex: (i, _, a) => a.length - i, opacity: 1 });
      const wr = wflow.parentElement.querySelector('.wrap'); // strip sits on the bottom of the text block (its padding-bottom holds the strip)
      const Y = wr.getBoundingClientRect().bottom - wflow.getBoundingClientRect().top - h * S - top0;
      tl = gsap.timeline({ paused: true, defaults: { duration: 1.2, ease: 'expo.inOut' } });
      tl.to(used, {
        motionPath: i => {
          const X = startX + i * step - left0;
          if (i === 0) return { path: [{ x: X, y: Y, scale: S }] };
          return {
            path: [
              { x: 0, y: Y * .45, scale: (1 - S) * .5 + S },
              { x: X * .35, y: Y * .95, scale: (1 - S) * .25 + S },
              { x: X, y: Y, scale: S }
            ],
            curviness: .45
          };
        },
        stagger: { from: 'end', each: .02 }
      });
      tl.progress(prog);
    };
    build();
    if (reduce) tl.progress(1);
    else addEventListener('dbs:hero', () => tl.play(), { once: true });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
  }

  /* ---------- About › My story: work shots pop in ---------- */
  const pops = $('.ab-pops');
  if (pops) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { pops.classList.add('on'); o.disconnect(); } }), { threshold: .4 }).observe(pops);

  /* ---------- About › Career: draw the line, light the points ---------- */
  const ctl = $('.ctl');
  if (ctl) {
    if (reduce) ctl.classList.add('on');
    else ScrollTrigger.create({ trigger: ctl, start: 'top 80%', once: true, onEnter: () => ctl.classList.add('on') });
  }
  // dots keep pulsing only while the timeline is on screen
  if (ctl && !reduce) new IntersectionObserver(es => es.forEach(e => ctl.classList.toggle('live', e.isIntersecting))).observe(ctl);

  if (intro) addEventListener('load', () => { openCurtain(); ScrollTrigger.refresh(); });
  else { startHero(); dispatchEvent(new Event('dbs:hero')); addEventListener('load', () => ScrollTrigger.refresh()); }
})();

/* About Tools: tiles pop in one by one when the grid scrolls into view */
(() => {
  const t = document.querySelector('.page-about .ab-tools'); if (!t) return;
  t.querySelectorAll('.tool').forEach((el, i) => el.style.setProperty('--k', i));
  const tiles = [...t.querySelectorAll('.tool')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [], running = false, first = true;
  const stop = () => { timers.forEach(clearTimeout); timers = []; tiles.forEach(x => x.classList.remove('lit')); running = false; };
  /* brand colors ride along with the pop-in: each tile shows its hover color as it appears, then settles */
  const flash = start => {
    if (reduce || running) return; running = true;
    const ON = 600;
    tiles.forEach((x, i) => {
      timers.push(setTimeout(() => { if (!x.matches(':hover')) x.classList.add('lit'); }, start + i * 70));
      timers.push(setTimeout(() => x.classList.remove('lit'), start + i * 70 + ON));
    });
    timers.push(setTimeout(() => { running = false; }, start + tiles.length * 70 + ON));
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { t.classList.add('live'); flash(first ? 0 : 100); first = false; }
    else stop();
  }), { threshold: .35 });
  io.observe(t);
})();
/* TEMP: viewport size badge (bottom-left) — remove before launch */
(() => {
  const b = document.createElement('div');
  b.id = 'vp-size';
  b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;padding:6px 10px;border-radius:6px;background:rgba(14,14,16,.85);color:#c9a86a;font:600 13px/1 Manrope,system-ui,sans-serif;letter-spacing:.04em;pointer-events:none;border:1px solid rgba(201,168,106,.5)';
  const up = () => { b.textContent = `${innerWidth} × ${innerHeight}`; };
  up(); addEventListener('resize', up);
  document.body.appendChild(b);
})();
/* Selected work: give every title block and description the same height so text and tag rows start on one line */
(() => {
  const groups = ['.meta', '.desc'].map(s => [...document.querySelectorAll('.hworks .wcard ' + s)]).filter(g => g.length); if (!groups.length) return;
  const fit = () => groups.forEach(ds => { ds.forEach(d => d.style.minHeight = ''); const m = Math.max(...ds.map(d => d.getBoundingClientRect().height)); ds.forEach(d => d.style.minHeight = m + 'px'); });
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();

/* Works grid: tag rows start on the same line within each row of cards */
(() => {
  const items = [...document.querySelectorAll('.wgrid .witem')]; if (!items.length) return;
  const fit = () => {
    items.forEach(w => { w.querySelectorAll('.tags,.result,:scope > p').forEach(t => t.style.marginTop = ''); const h = w.querySelector('.head'); if (h) h.style.minHeight = ''; });
    // a note that wraps under the title goes on its own line, flush left
    items.filter(w => w.offsetParent).forEach(w => { const h = w.querySelector('h3'), n = h && h.querySelector('.wnote:not(.wfix)'); if (!n) return;
      h.classList.remove('wrapnote'); n.classList.remove('wblock');
      if (n.getBoundingClientRect().left - h.getBoundingClientRect().left < 20) { n.classList.add('wblock'); h.classList.add('wrapnote'); } });
    const rows = {};
    items.filter(w => w.offsetParent).forEach(w => { const k = Math.round(w.getBoundingClientRect().top + scrollY); (rows[k] = rows[k] || []).push(w); });
    Object.values(rows).forEach(row => {
      if (row.length < 2) return;
      const hs = row.map(w => w.querySelector('.head')).filter(Boolean);
      const hm = Math.max(...hs.map(h => h.getBoundingClientRect().height));
      hs.forEach(h => { if (h.getBoundingClientRect().height < hm) h.style.minHeight = hm + 'px'; });
      [':scope > p', '.result', '.tags'].forEach(sel => {
        const els = row.map(w => w.querySelector(sel)).filter(Boolean); if (els.length < 2) return;
        const off = els.map(t => t.getBoundingClientRect().top - t.closest('.witem').getBoundingClientRect().top);
        const max = Math.max(...off);
        els.forEach((t, i) => { if (max > off[i]) t.style.marginTop = (parseFloat(getComputedStyle(t).marginTop) + max - off[i]) + 'px'; });
      });
    });
  };
  let tm; const later = () => { clearTimeout(tm); tm = setTimeout(fit, 150); };
  addEventListener('resize', later);
  document.querySelectorAll('.filters button').forEach(b => b.addEventListener('click', () => setTimeout(fit, 50)));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();

/* Services › client voices: the line above each client name sits at the same height on every card */
(() => {
  const caps = [...document.querySelectorAll('.page-services .voice figcaption')]; if (caps.length < 2) return;
  const fit = () => {
    caps.forEach(c => c.style.minHeight = '');
    if (innerWidth <= 900) return; // cards stack on mobile
    const m = Math.max(...caps.map(c => c.getBoundingClientRect().height));
    caps.forEach(c => c.style.minHeight = m + 'px');
  };
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();

/* Footer: shrink the intro paragraph to its longest line so the space after it matches the other column gaps */
(() => {
  const p = document.querySelector('.footer .brand > p:last-child'); if (!p) return;
  const mw0 = p.style.maxWidth; // the inline max-width (34ch) from the HTML
  const fit = () => {
    p.style.width = ''; p.style.maxWidth = mw0;
    const r = document.createRange();
    r.selectNodeContents(p);
    const right = Math.max(...[...r.getClientRects()].map(q => q.right));
    p.style.width = Math.ceil(right - p.getBoundingClientRect().left) + 'px';
  };
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();

/* Footer (desktop, >1100px): Pages / Services / Contact are one group between the intro text and the right edge,
   their left edges evenly spaced. */
(() => {
  const top = document.querySelector('.footer .top'), lb = document.querySelector('.footer .legal-block');
  if (!top || !lb) return;
  const [brand, pages, services, contact] = top.children;
  const right = el => { const r = document.createRange(); let R = -1e9;
    el.querySelectorAll('img,h4,a,p').forEach(x => { if (x.tagName === 'IMG') { R = Math.max(R, x.getBoundingClientRect().right); return; }
      r.selectNodeContents(x); [...r.getClientRects()].forEach(q => { if (q.width) R = Math.max(R, q.right); }); }); return R; };
  const fit = () => {
    top.style.gridTemplateColumns = ''; top.style.columnGap = ''; top.style.justifyContent = '';
    if (innerWidth <= 1100) return;
    const wrap = top.getBoundingClientRect();
    const bR = right(brand) - wrap.left;
    const pw = right(pages) - pages.getBoundingClientRect().left, sw = right(services) - services.getBoundingClientRect().left,
          cw = right(contact) - contact.getBoundingClientRect().left;
    // Contact ends on the content's right edge. Services → Contact gap = g; Pages → Services gets a little extra
    // (a quarter of the length difference, so short "Pages" items don't look crowded); logo block → Pages = 1.6 g.
    const extra = Math.max(0, (sw - pw) / 4);
    const g = (wrap.width - bR - pw - sw - cw - extra) / 3.6;
    if (g < 32) return;                                      // not enough room: keep the CSS layout
    top.style.justifyContent = 'start'; top.style.columnGap = '0px';
    top.style.gridTemplateColumns = `${bR + 1.6 * g - 55}px ${pw + g + extra}px ${sw + g}px ${cw + 55}px`; // whole group 55px left of the right edge
  };
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();

/* Footer PC (901px+): the logo block spans exactly from the top of the column headings (PAGES…)
   to the baseline of the last Pages link ("Contact"). The logo image has no inner padding,
   so its size is solved so that logo top = heading cap top and description baseline = Contact baseline. */
(() => {
  const brand = document.querySelector('.footer .brand'); if (!brand) return;
  const logo = brand.querySelector('.flogo'), desc = brand.querySelector('p:last-child');
  const h4 = document.querySelector('.footer .top > .col h4');
  const last = [...document.querySelectorAll('.footer .top > .col')][0]?.querySelectorAll('a');
  if (!logo || !desc || !h4 || !last?.length) return;
  const mq = matchMedia('(min-width:901px)');
  const ratio = 565 / 1000; // logo.png height / width
  const baseline = el => { const m = document.createElement('span'); m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; el.appendChild(m); const y = m.getBoundingClientRect().bottom; m.remove(); return y; };
  const ctx = document.createElement('canvas').getContext('2d');
  const capTop = el => { const cs = getComputedStyle(el); ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return baseline(el) - ctx.measureText(el.textContent.toUpperCase()).actualBoundingBoxAscent; };
  const fit = () => {
    brand.style.marginTop = ''; logo.style.width = '';
    if (!mq.matches) return;
    const T = capTop(h4), B = baseline(last[last.length - 1]);
    const rest = baseline(desc) - logo.getBoundingClientRect().bottom; // logo bottom → description baseline
    const h = B - T - rest; if (h <= 20) return;
    logo.style.width = (h / ratio) + 'px';
    brand.style.marginTop = (T - logo.getBoundingClientRect().top) + 'px';
  };
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 100); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();

/* Footer: exactly 25px of visible space between the lowest text above the legal line and the line itself */
(() => {
  const top = document.querySelector('.footer .top'), lb = document.querySelector('.footer .legal-block'); if (!top || !lb) return;
  const fit = () => {
    lb.style.marginTop = '';
    const r = document.createRange(); let B = -1e9;
    top.querySelectorAll('a,p,h4').forEach(x => { r.selectNodeContents(x); [...r.getClientRects()].forEach(q => { if (q.width) B = Math.max(B, q.bottom); }); });
    const mt = parseFloat(getComputedStyle(lb).marginTop) + 25 - (lb.getBoundingClientRect().top - B);
    lb.style.marginTop = Math.max(0, mt) + 'px';
  };
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 200); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(fit, 50));
})();

/* Tag rows with a forced break (category | tools): keep the break only while the first group fits on one line.
   If the first group already wraps, drop the break so the tags pack from the top with no empty gap on the right. */
(() => {
  const rows = [...document.querySelectorAll('.tags')].filter(t => t.querySelector('.tag-br')); if (!rows.length) return;
  const fit = () => rows.forEach(t => {
    t.classList.remove('tags-packed');
    const br = t.querySelector('.tag-br'), first = [];
    for (let n = t.firstElementChild; n && n !== br; n = n.nextElementSibling) first.push(n);
    const tops = new Set(first.map(n => Math.round(n.offsetTop)));
    if (tops.size > 1) t.classList.add('tags-packed');
  });
  let tm; addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(fit, 100); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();
