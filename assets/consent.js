/* Einwilligungs-Management (Consent-Banner) – ohne externe Dienste
 * Kategorien:
 *  - notwendig: Speicherung der Consent-Entscheidung (technisch erforderlich, § 25 Abs. 2 Nr. 2 TDDDG) – immer aktiv
 *  - medien:    externe Inhalte (Google Maps) – nur mit Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO)
 * Die Entscheidung wird 12 Monate gespeichert und kann jederzeit über „Cookie-Einstellungen“ geändert/widerrufen werden.
 */
(() => {
  const EN = document.documentElement.lang.startsWith('en');
  const T = (de, en) => EN ? en : de;
  const KEY = 'sr-consent';
  const VERSION = 1;
  const MAX_AGE = 365 * 864e5;
  const MAP_SRC = 'https://www.google.com/maps?q=Knechtstedener+Stra%C3%9Fe+20,+50733+K%C3%B6ln&z=15&output=embed';

  const read = () => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!c || c.v !== VERSION || Date.now() - c.ts > MAX_AGE) return null;
      return c;
    } catch (_) { return null; }
  };
  const write = medien => {
    const c = { v: VERSION, ts: Date.now(), medien: !!medien };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (_) {}
    apply(c);
    return c;
  };

  /* ---------- Banner ---------- */
  const bar = document.createElement('section');
  bar.className = 'consent';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-modal', 'false');
  bar.setAttribute('aria-labelledby', 'consent-title');
  bar.setAttribute('aria-describedby', 'consent-text');
  bar.hidden = true;
  bar.innerHTML = `
    <div class="consent-inner">
      <div class="consent-main">
        <h2 id="consent-title" tabindex="-1">${T('Ihre Privatsphäre ist uns wichtig', 'We respect your privacy')}</h2>
        <p id="consent-text">${T('Wir verwenden keine Tracking- oder Werbe-Cookies. Technisch notwendig ist nur das Speichern Ihrer Auswahl. Externe Inhalte wie die Google-Karte laden wir ausschließlich mit Ihrer Einwilligung – dabei werden Daten (u. a. Ihre IP-Adresse) an Google übertragen, ggf. auch in die USA. Sie können Ihre Entscheidung jederzeit unter „Cookie-Einstellungen“ ändern. Mehr in der <a href="/datenschutz">Datenschutzerklärung</a> · <a href="/impressum">Impressum</a>.', 'We do not use tracking or advertising cookies. The only thing we need to store is your choice. External content such as the Google map is loaded only with your consent – this transfers data (including your IP address) to Google, possibly also to the USA. You can change your decision at any time via “Cookie settings”. More in our <a href="/en/privacy">privacy policy</a> · <a href="/en/legal-notice">legal notice</a>.')}</p>
        <div class="consent-details" id="consent-details" hidden>
          <label class="consent-opt">
            <input type="checkbox" checked disabled>
            <span><b>${T('Notwendig', 'Necessary')}</b><small>${T('Speichert Ihre Datenschutz-Auswahl (12 Monate). Ohne diese Speicherung würde dieser Hinweis bei jedem Besuch erscheinen.', 'Stores your privacy choice (12 months). Without it, this notice would appear on every visit.')}</small></span>
          </label>
          <label class="consent-opt">
            <input type="checkbox" data-consent-medien>
            <span><b>${T('Externe Medien', 'External media')}</b><small>${T('Google Maps (Google Ireland Ltd.) – interaktive Karte im Kontaktbereich. Übertragung u. a. der IP-Adresse an Google, Drittlandtransfer in die USA möglich (EU-US Data Privacy Framework).', 'Google Maps (Google Ireland Ltd.) – interactive map in the contact section. Transfers data such as your IP address to Google; transfer to the USA possible (EU-US Data Privacy Framework).')}</small></span>
          </label>
        </div>
      </div>
      <div class="consent-actions">
        <button type="button" class="btn btn-gold" data-consent="all">${T('Alle akzeptieren', 'Accept all')}</button>
        <button type="button" class="btn btn-gold" data-consent="necessary">${T('Nur notwendige', 'Necessary only')}</button>
        <button type="button" class="consent-link" data-consent="toggle" aria-expanded="false" aria-controls="consent-details">${T('Einstellungen', 'Settings')}</button>
        <button type="button" class="btn btn-outline" data-consent="save" hidden>${T('Auswahl speichern', 'Save selection')}</button>
      </div>
    </div>`;
  document.body.append(bar);

  const details = bar.querySelector('#consent-details');
  const medienBox = bar.querySelector('[data-consent-medien]');
  const toggleBtn = bar.querySelector('[data-consent="toggle"]');
  const saveBtn = bar.querySelector('[data-consent="save"]');
  let lastFocus = null;

  const show = (expand) => {
    lastFocus = document.activeElement;
    const c = read();
    medienBox.checked = !!(c && c.medien);
    setExpanded(!!expand);
    bar.hidden = false;
    document.documentElement.classList.add('consent-open');
    requestAnimationFrame(() => bar.classList.add('in'));
    // Fokus auf die Überschrift statt auf „Akzeptieren“ – keine Vorauswahl
    bar.querySelector('#consent-title').focus({ preventScroll: true });
  };
  const hide = () => {
    bar.classList.remove('in');
    bar.hidden = true;
    document.documentElement.classList.remove('consent-open');
    if (lastFocus && document.body.contains(lastFocus) && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
  };
  const setExpanded = on => {
    details.hidden = !on;
    toggleBtn.setAttribute('aria-expanded', on);
    toggleBtn.textContent = on ? T('Einstellungen ausblenden', 'Hide settings') : T('Einstellungen', 'Settings');
    saveBtn.hidden = !on;
  };

  bar.addEventListener('click', e => {
    const a = e.target.closest('[data-consent]'); if (!a) return;
    const act = a.dataset.consent;
    if (act === 'toggle') return setExpanded(details.hidden);
    write(act === 'all' ? true : act === 'save' ? medienBox.checked : false);
    hide();
  });
  bar.addEventListener('keydown', e => { if (e.key === 'Escape' && read()) hide(); });

  // „Cookie-Einstellungen“-Links (Footer) öffnen den Banner erneut
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-consent-open]'); if (!t) return;
    e.preventDefault(); show(true);
  });

  /* ---------- Google-Karte (2-Klick-Lösung) ---------- */
  const mapBox = document.querySelector('[data-map]');
  const loadMap = () => {
    if (!mapBox || mapBox.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.src = MAP_SRC;
    f.title = T('Google-Karte: Knechtstedener Straße 20, 50733 Köln', 'Google map: Knechtstedener Straße 20, 50733 Cologne');
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.setAttribute('allowfullscreen', '');
    mapBox.classList.add('is-live');
    mapBox.prepend(f);
  };
  const unloadMap = () => {
    if (!mapBox) return;
    mapBox.querySelector('iframe')?.remove();
    mapBox.classList.remove('is-live');
  };
  if (mapBox) {
    mapBox.querySelector('[data-map-load]')?.addEventListener('click', () => {
      if (mapBox.querySelector('[data-map-remember]')?.checked) write(true);
      loadMap();
    });
  }

  function apply(c) {
    if (c && c.medien) loadMap(); else unloadMap();
    document.documentElement.dataset.consentMedien = c && c.medien ? 'ja' : 'nein';
  }

  const current = read();
  apply(current);
  if (!current) setTimeout(() => show(false), 400);
})();
