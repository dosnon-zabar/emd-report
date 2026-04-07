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

  // Move each slide's .num into its title as an inline prefix
  slides.forEach(slide => {
    const num = slide.querySelector(':scope > .num');
    const heading = slide.querySelector('.h-title, .h-display');
    if (!num || !heading) return;
    const span = document.createElement('span');
    span.className = 'num-inline';
    span.textContent = num.textContent;
    num.remove();
    heading.insertBefore(document.createTextNode(' '), heading.firstChild);
    heading.insertBefore(span, heading.firstChild);
  });

  const pad = n => String(n).padStart(2, '0');
  const indexFromScroll = () => Math.round(deck.scrollLeft / window.innerWidth);

  // Menu links: each entry maps to a slide id (sN), we resolve to a slide index
  const navLinks = [...document.querySelectorAll('.mainnav a[data-target]')];
  const navTargets = navLinks.map(a => slides.findIndex(s => s.id === a.dataset.target));

  // Hash sync — hash format is #N (1-based slide number)
  let suppressHashUpdate = false;
  const indexFromHash = () => {
    const m = (location.hash || '').match(/^#(\d+)$/);
    if (!m) return null;
    const n = parseInt(m[1], 10) - 1;
    return (n >= 0 && n < slides.length) ? n : null;
  };
  const writeHash = i => {
    const target = '#' + (i + 1);
    if (location.hash === target) return;
    suppressHashUpdate = true;
    history.replaceState(null, '', target);
    setTimeout(() => { suppressHashUpdate = false; }, 0);
  };

  const update = () => {
    const i = Math.min(slides.length - 1, Math.max(0, indexFromScroll()));
    cur.textContent = pad(i + 1);
    let activeIdx = -1;
    navTargets.forEach((t, k) => { if (t >= 0 && t <= i) activeIdx = k; });
    navLinks.forEach((a, k) => a.classList.toggle('active', k === activeIdx));
    writeHash(i);
  };

  const goTo = (i, smooth = true) => {
    const idx = Math.min(slides.length - 1, Math.max(0, i));
    deck.scrollTo({ left: idx * window.innerWidth, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Translate vertical wheel into horizontal scroll
  let wheelLock = false;
  deck.addEventListener('wheel', e => {
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 4) return;
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    const dir = delta > 0 ? 1 : -1;
    goTo(indexFromScroll() + dir);
    setTimeout(() => { wheelLock = false; }, 420);
  }, { passive: false });

  // Keyboard
  window.addEventListener('keydown', e => {
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goTo(indexFromScroll() + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(indexFromScroll() - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(slides.length - 1); }
  });

  // Buttons
  prev.addEventListener('click', () => goTo(indexFromScroll() - 1));
  next.addEventListener('click', () => goTo(indexFromScroll() + 1));

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
    if (suppressHashUpdate) return;
    const idx = indexFromHash();
    if (idx !== null) goTo(idx);
  });

  // Scroll listener — keep counter, menu and hash in sync
  deck.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  // Initial position from hash, fall back to slide 1
  const initial = indexFromHash();
  goTo(initial !== null ? initial : 0, false);
  update();
})();
