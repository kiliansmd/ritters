/* Schornsteinfeger Ritters – Interaktion (ohne externe Bibliotheken, ohne Tracking)
 * Zweisprachig: Texte richten sich nach <html lang="de|en">.
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EN = document.documentElement.lang.startsWith('en');
  const T = (de, en) => EN ? en : de;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* Header: Schatten + aktiver Menüpunkt */
  const header = $('.site-header');
  const navLinks = $$('#menu > a').filter(a => a.hash && a.pathname === location.pathname);
  const onScroll = () => {
    header && header.classList.toggle('scrolled', scrollY > 8);
    let cur = null;
    for (const a of navLinks) {
      const s = document.getElementById(a.hash.slice(1));
      if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = a;
    }
    navLinks.forEach(a => a === cur ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobiles Menü */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = open => {
    if (!burger || !menu) return;
    if (open) document.querySelector('[data-phone-menu]')?.removeAttribute('open');
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? T('Menü schließen', 'Close menu') : T('Menü öffnen', 'Open menu'));
    $('use', burger).setAttribute('href', '/assets/icons.svg#' + (open ? 'close' : 'menu'));
    if (open) $('a', menu)?.focus();
  };
  if (burger && menu) {
    burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    // Fokus verlässt das Menü -> schließen
    menu.addEventListener('focusout', e => {
      if (menu.classList.contains('open') && !menu.contains(e.relatedTarget) && e.relatedTarget !== burger) setMenu(false);
    });
    matchMedia('(min-width: 961px)').addEventListener('change', e => e.matches && setMenu(false));
  }

  /* Native Telefonauswahl: zwei direkte tel-Links, auch ohne JavaScript. */
  const phoneMenu = $('[data-phone-menu]');
  if (phoneMenu) {
    const closePhone = (restoreFocus = false) => {
      phoneMenu.open = false;
      if (restoreFocus) $('summary', phoneMenu).focus();
    };
    phoneMenu.addEventListener('toggle', () => { if (phoneMenu.open) setMenu(false); });
    phoneMenu.addEventListener('keydown', e => {
      if (e.key === 'Escape' && phoneMenu.open) { e.preventDefault(); closePhone(true); }
    });
    phoneMenu.addEventListener('focusout', e => { if (!phoneMenu.contains(e.relatedTarget)) closePhone(); });
    document.addEventListener('click', e => { if (!phoneMenu.contains(e.target)) closePhone(); });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.classList.contains('open')) { setMenu(false); burger.focus(); }
  });

  /* Sprachen direkt im mobilen Menü bzw. Desktop-Footer auswählen. */
  const SECTION_MAP = { leistungen: 'services', 'ueber-uns': 'about', partner: 'partners', kontakt: 'contact', anfrage: 'request', familie: 'family', team: 'team', kundenstimmen: 'reviews' };
  $$('[data-language-switch] a[hreflang]').forEach(a => a.addEventListener('click', () => {
    const h = location.hash.slice(1);
    if (!h || !['/', '/en/'].includes(new URL(a.href).pathname)) return;
    const toEn = a.hreflang === 'en';
    const mapped = toEn ? SECTION_MAP[h] : Object.keys(SECTION_MAP).find(k => SECTION_MAP[k] === h);
    if (mapped) a.hash = mapped;
  }));

  /* Leistungen: Detailbereiche */
  const toggles = $$('.service .link-arrow');
  toggles.forEach(btn => btn.addEventListener('click', () => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';
    toggles.forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.closest('.service').classList.remove('is-open');
      document.getElementById(b.getAttribute('aria-controls')).hidden = true;
    });
    if (!willOpen) return;
    btn.setAttribute('aria-expanded', 'true');
    btn.closest('.service').classList.add('is-open');
    panel.hidden = false;
    const r = panel.getBoundingClientRect();
    if (r.bottom > innerHeight || r.top < 0) panel.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
  }));
  // Escape im Detailbereich schließt ihn und gibt den Fokus zurück
  $$('.panel').forEach(p => p.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const b = $(`[aria-controls="${p.id}"]`);
    if (b) { b.click(); b.focus(); }
  }));

  /* Anfrage-Tabs (WAI-ARIA Tabs, Pfeiltasten) */
  const tabs = $$('[role="tab"]');
  const selectTab = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });
  const terminTab = $('#tab-termin');
  if (terminTab && ['#anfrage', '#request'].includes(location.hash)) selectTab(terminTab);

  /* Formulare: Validierung, Spam-Schutz, Versand */
  const dateInput = $('#t-datum');
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

  const messages = {
    valueMissing: T('Bitte füllen Sie dieses Feld aus.', 'Please fill in this field.'),
    typeMismatch: T('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'Please enter a valid email address.'),
    rangeUnderflow: T('Bitte wählen Sie ein Datum in der Zukunft.', 'Please choose a date in the future.')
  };
  const validateField = f => {
    const err = document.getElementById(f.id + '-err');
    let msg = '';
    if (!f.checkValidity()) msg = messages[Object.keys(messages).find(k => f.validity[k])] || f.validationMessage;
    if (f.type === 'tel' && f.value && !/^[+()\d\s\/-]{6,}$/.test(f.value)) msg = T('Bitte geben Sie eine gültige Telefonnummer ein.', 'Please enter a valid phone number.');
    if (f.type === 'checkbox' && f.required && !f.checked) msg = T('Bitte bestätigen Sie die Datenschutzhinweise, damit wir Ihre Anfrage bearbeiten dürfen.', 'Please confirm the privacy notice so that we may process your request.');
    f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) {
      err.textContent = msg;
      const base = (f.dataset.describedby ??= f.getAttribute('aria-describedby') || '');
      const ids = [base, msg ? err.id : ''].filter(Boolean).join(' ');
      ids ? f.setAttribute('aria-describedby', ids) : f.removeAttribute('aria-describedby');
    }
    return !msg;
  };

  const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PHONE = T('0221 – 7400 990', '+49 221 7400 990');

  const isLocalPreview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /(^|\.)(vercel\.app|meindigitalerbetrieb\.de)$/.test(location.hostname);
  $$('form[data-kind]').forEach(form => {
    if (isLocalPreview) {
      const notice = document.createElement('p');
      notice.className = 'bk-notice full';
      notice.textContent = T('Vorschau: Hier werden keine Nachrichten versendet. Für eine echte Anfrage rufen Sie bitte 0221 – 7400 990 an.', 'Preview: no messages are sent here. For a real request, please call +49 221 7400 990.');
      form.prepend(notice);
      $('button[type=submit]', form).textContent = T('Formular testen (ohne Versand)', 'Test form (nothing sent)');
    }
    const loaded = Date.now();
    $('input[name="ts"]', form).value = Math.floor(loaded / 1000);
    const fields = $$('input:not([type=hidden]):not([type=radio]):not([name=website]), select, textarea', form);
    fields.forEach(f => f.type === 'checkbox'
      ? f.addEventListener('change', () => validateField(f))
      : f.addEventListener('blur', () => { if (f.value || f.getAttribute('aria-invalid') === 'true') validateField(f); }));
    const status = $('.form-status', form);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const invalid = fields.filter(f => !validateField(f));
      if (invalid.length) {
        status.className = 'form-status fail';
        status.innerHTML = `<p>${T(`Bitte prüfen Sie ${invalid.length === 1 ? 'das markierte Feld' : `die ${invalid.length} markierten Felder`}.`, `Please check the ${invalid.length === 1 ? 'highlighted field' : `${invalid.length} highlighted fields`}.`)}</p>`;
        invalid[0].focus();
        return;
      }

      const data = new FormData(form);
      // Spam-Schutz: Honeypot-Feld muss leer sein, Mindest-Ausfüllzeit 3 s
      if (data.get('website')) return;
      if (!isLocalPreview && Date.now() - loaded < 3000) { status.className = 'form-status fail'; status.textContent = T('Bitte prüfen Sie Ihre Angaben kurz und senden Sie erneut.', 'Please review your details and send again.'); status.focus(); return; }

      const btn = $('button[type=submit]', form);
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      // Vorschau/Demo (lokal, Vercel, Demo-Domain): Formulare werden nur simuliert, da dort kein PHP läuft
      try {
        if (isLocalPreview) { await new Promise(r => setTimeout(r, 500)); }
        else {
          const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok || (await res.json()).ok !== true) throw new Error('request failed');
        }
        showStatus(true);
        form.reset();
        fields.forEach(f => f.removeAttribute('aria-invalid'));
      } catch (_) {
        showStatus(false);
      } finally {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      }

      function showStatus(ok) {
        const name = String(data.get('name') || '').trim().split(/\s+/)[0];
        const termin = form.dataset.kind === 'termin';
        status.className = 'form-status ' + (ok ? 'ok' : 'fail');
        status.innerHTML = ok && isLocalPreview
          ? `<h3>${T('Vorschau abgeschlossen', 'Preview complete')}</h3><p>${T('Es wurden keine Daten versendet. Für eine echte Anfrage rufen Sie bitte an:', 'No data was sent. For a real request please call:')} <a href="tel:+492217400990">${PHONE}</a>.</p>`
          : ok
          ? `<h3>${T('Vielen Dank', 'Thank you')}${name ? ', ' + escapeHtml(name) : ''}!</h3><p>${termin
              ? T('Ihre Terminanfrage ist bei uns eingegangen. Wir prüfen die Planung und melden uns zur Bestätigung bei Ihnen.', 'We have received your appointment request. We will check our schedule and get back to you to confirm.')
              : T('Ihre Nachricht ist bei uns eingegangen. Wir melden uns so schnell wie möglich.', 'We have received your message and will reply as soon as possible.')}</p>${isLocalPreview ? `<p><small>${T('(Vorschau: Es wurden keine Daten übertragen.)', '(Preview: no data was sent.)')}</small></p>` : ''}`
          : `<h3>${T('Das hat leider nicht geklappt.', 'Sorry, something went wrong.')}</h3><p>${T('Bitte versuchen Sie es später erneut oder rufen Sie uns direkt an:', 'Please try again later or call us directly:')} <a href="tel:+492217400990">${PHONE}</a>.</p>`;
        status.focus();
      }
    });
  });

  /* Rückmeldung nach Versand ohne JavaScript (Weiterleitung von anfrage.php) */
  const qs = new URLSearchParams(location.search).get('anfrage');
  const st = $('#form-termin .form-status');
  if (qs && st) {
    st.className = 'form-status ' + (qs === 'ok' ? 'ok' : 'fail');
    st.innerHTML = qs === 'ok'
      ? `<h3>${T('Vielen Dank!', 'Thank you!')}</h3><p>${T('Ihre Anfrage ist bei uns eingegangen. Wir melden uns bei Ihnen.', 'We have received your request and will be in touch.')}</p>`
      : `<h3>${T('Das hat leider nicht geklappt.', 'Sorry, something went wrong.')}</h3><p>${T('Bitte prüfen Sie Ihre Angaben oder rufen Sie uns an:', 'Please check your details or call us:')} <a href="tel:+492217400990">${PHONE}</a>.</p>`;
  }

  /* Einblenden beim Scrollen */
  if ('IntersectionObserver' in window && !reduced()) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
    // Sprungziele sofort sichtbar machen (Anker, Fokus)
    const showTarget = () => { const t = location.hash && document.getElementById(location.hash.slice(1)); t && (t.closest('.reveal') || t).classList.add('in'); $$('.reveal', t || document.createElement('div')).forEach(r => r.classList.add('in')); };
    addEventListener('hashchange', showTarget); showTarget();
    document.addEventListener('focusin', e => e.target.closest('.reveal')?.classList.add('in'));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }
})();
