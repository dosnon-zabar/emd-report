(() => {
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const cur = document.getElementById('cur');
  const tot = document.getElementById('tot');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');

  tot.textContent = String(slides.length).padStart(2, '0');

  const pad = n => String(n).padStart(2, '0');
  const indexFromScroll = () => Math.round(deck.scrollLeft / window.innerWidth);

  const update = () => {
    const i = Math.min(slides.length - 1, Math.max(0, indexFromScroll()));
    cur.textContent = pad(i + 1);
  };

  const goTo = i => {
    const idx = Math.min(slides.length - 1, Math.max(0, i));
    deck.scrollTo({ left: idx * window.innerWidth, behavior: 'smooth' });
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

  // Touch swipe (basic — scroll-snap handles most)
  deck.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
