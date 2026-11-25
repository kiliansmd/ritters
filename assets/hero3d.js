/* Hero-Bühne (V3): Ebenen-Parallax, Hutwurf, Scroll-Tiefe. Ohne Bibliotheken, ohne Tracking.
 * Setzt nur CSS-Variablen (--px/--py Zeigerposition −1…1, --sy Scrollanteil 0…1) und Klassen;
 * die Bewegung selbst liegt in theme-v3.css. Läuft bewusst auch bei „Bewegung reduzieren“ (Kundenwunsch). */
(() => {
  const scene = document.querySelector('[data-hero-scene]');
  if (!scene) return;
  const hero = scene.closest('.hero') || scene;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const hat = hero.querySelector('.hero-hat img');
  const person = scene.querySelector('.hero-person img');

  /* Testvariante Feedback 24.11.: kleinerer Zylinder über ?hut=klein */
  if (new URLSearchParams(location.search).get('hut') === 'klein') hero.classList.add('hut-klein');

  /* Wurf starten, sobald die Person geladen ist (sonst würde der Hut ins Leere fliegen) */
  const ready = () => { scene.classList.add('is-ready'); hat && hat.classList.add('throw'); };
  if (person && !person.complete) { person.addEventListener('load', ready, { once: true }); person.addEventListener('error', ready, { once: true }); }
  else ready();

  /* Noch einmal werfen: Klick auf den Hut, Rückkehr aus dem Browser-Cache, Hero scrollt wieder ins Bild */
  const rethrow = () => { if (!hat) return; hat.classList.remove('throw'); void hat.offsetWidth; hat.classList.add('throw'); };
  hat && hat.addEventListener('click', rethrow);
  addEventListener('pageshow', e => { if (e.persisted) rethrow(); });
  if ('IntersectionObserver' in window) {
    let away = false;
    new IntersectionObserver(([e]) => { if (e.isIntersecting && away) rethrow(); away = !e.isIntersecting; }, { threshold: .4 }).observe(hero);
  }

  /* Zeiger-Parallax (nur Maus/Trackpad), weich nachgeführt */
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const tick = () => {
    cx += (tx - cx) * .09; cy += (ty - cy) * .09;
    hero.style.setProperty('--px', cx.toFixed(4)); hero.style.setProperty('--py', cy.toFixed(4));
    raf = (Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002) ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  if (fine.matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - .5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - .5) * 2));
      kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  }

  /* Scroll-Tiefe: Hut steigt schneller als die Person */
  let sraf = 0;
  const onScroll = () => {
    sraf = 0;
    const h = hero.offsetHeight || 1;
    hero.style.setProperty('--sy', Math.min(1, Math.max(0, scrollY / h)).toFixed(4));
  };
  addEventListener('scroll', () => { if (!sraf) sraf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();
})();
