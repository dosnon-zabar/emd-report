// Soft password gate (client-side, not real security)
(() => {
  const PASSWORD = 'luciuss';
  const STORAGE_KEY = 'emdash-auth';
  const gate = document.getElementById('gate');
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-input');
  const error = document.getElementById('gate-error');
  if (!gate || !form) return;

  const isAuth = () => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  };
  const setAuth = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };
  const open = () => {
    gate.setAttribute('hidden', '');
    document.body.style.overflow = '';
  };

  if (isAuth()) {
    open();
    return;
  }

  gate.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => input && input.focus(), 50);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const value = (input.value || '').trim();
    if (value === PASSWORD) {
      setAuth();
      gate.style.transition = 'opacity .35s ease';
      gate.style.opacity = '0';
      setTimeout(open, 350);
    } else {
      error.textContent = 'Mot de passe incorrect.';
      gate.classList.remove('shake');
      void gate.offsetWidth;
      gate.classList.add('shake');
      input.select();
    }
  });
})();

(() => {
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const cur = document.getElementById('cur');
  const tot = document.getElementById('tot');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');

  tot.textContent = String(slides.length).padStart(2, '0');

  // For .card.with-frein, inline the .card-num inside the h4
  document.querySelectorAll('.card.with-frein').forEach(card => {
    const num = card.querySelector('.card-num');
    const heading = card.querySelector('h4');
    if (!num || !heading) return;
    const span = document.createElement('span');
    span.className = 'card-num-inline';
    span.textContent = num.textContent;
    heading.insertBefore(span, heading.firstChild);
  });

  const pad = n => String(n).padStart(2, '0');
  const HEADER_OFFSET = 64;

  // Current index — tracked by IntersectionObserver, not recomputed on scroll
  let currentIndex = 0;

  // Menu links: each entry maps to a slide id, we resolve to a slide index
  const navLinks = [...document.querySelectorAll('.mainnav a[data-target]')];
  const navTargets = navLinks.map(a => slides.findIndex(s => s.id === a.dataset.target));

  // Hash sync — hash format is #<slide-id> (semantic slug, stable across reorders)
  // Also accept legacy numeric hash #N (1-based) for backward compat with older links.
  const indexFromHash = () => {
    const raw = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (!raw) return null;
    const numMatch = raw.match(/^(\d+)$/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10) - 1;
      return (n >= 0 && n < slides.length) ? n : null;
    }
    const idx = slides.findIndex(s => s.id === raw);
    return idx >= 0 ? idx : null;
  };
  const writeHash = i => {
    const id = slides[i] && slides[i].id;
    if (!id) return;
    const target = '#' + id;
    if (location.hash === target) return;
    history.replaceState(null, '', target);
  };

  const applyIndex = i => {
    currentIndex = i;
    cur.textContent = pad(i + 1);
    let activeIdx = -1;
    navTargets.forEach((t, k) => { if (t >= 0 && t <= i) activeIdx = k; });
    navLinks.forEach((a, k) => a.classList.toggle('active', k === activeIdx));
    writeHash(i);
  };

  const goTo = (i, smooth = true) => {
    const idx = Math.min(slides.length - 1, Math.max(0, i));
    const top = slides[idx].offsetTop - HEADER_OFFSET;
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    applyIndex(idx);
  };

  // IntersectionObserver: section is "active" when its top edge crosses the header line
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const idx = slides.indexOf(e.target);
      if (e.isIntersecting) visible.add(idx);
      else visible.delete(idx);
    }
    if (visible.size === 0) return;
    // Lowest index wins (topmost currently visible)
    const active = Math.min(...visible);
    if (active !== currentIndex) applyIndex(active);
  }, {
    rootMargin: `-${HEADER_OFFSET + 1}px 0px -60% 0px`,
    threshold: 0,
  });
  slides.forEach(s => io.observe(s));

  // Keyboard — arrows and pagedown navigate to previous/next section
  window.addEventListener('keydown', e => {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); goTo(currentIndex + 1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(currentIndex - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(slides.length - 1); }
  });

  // Buttons
  prev.addEventListener('click', () => goTo(currentIndex - 1));
  next.addEventListener('click', () => goTo(currentIndex + 1));

  // Menu links + brand — convert sN data-target to numeric hash navigation
  document.querySelectorAll('a[data-target]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const idx = slides.findIndex(s => s.id === a.dataset.target);
      if (idx >= 0) goTo(idx);
    });
  });

  // React to manual hash changes (back/forward, paste a URL)
  window.addEventListener('hashchange', () => {
    const idx = indexFromHash();
    if (idx !== null && idx !== currentIndex) goTo(idx);
  });

  // Initial position from hash, fall back to slide 1
  const initial = indexFromHash();
  if (initial !== null && initial > 0) {
    // wait next frame so layout is settled before scrolling
    requestAnimationFrame(() => goTo(initial, false));
  } else {
    applyIndex(0);
  }
})();
