/* Online-Terminbuchung (Simulation)
 * - Sticky-Button am rechten Rand + Buchungs-Drawer
 * - Verfügbarkeit wird aus einem simulierten Kalender berechnet (belegte Blöcke je Tag, Fahrzeitpuffer, Arbeitszeiten)
 * - Später austauschbar: nur `Calendar.fetchBusy()` und `Calendar.book()` müssen an eine echte Schnittstelle angebunden werden
 */
(() => {
  const ICON = id => `<svg class="ic" aria-hidden="true"><use href="/assets/icons.svg#${id}"/></svg>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EN = document.documentElement.lang.startsWith('en');
  const T = (de, en) => EN ? en : de;
  const UHR = T(' Uhr', '');
  const HOME = T('/', '/en/');

  /* ---------- Konfiguration ---------- */
  const SERVICES = [
    { id: 'arbeiten', name: T('Schornsteinfegerarbeiten', 'Chimney sweeping'), dur: 45, icon: 's-flame', note: T('Kehren & Überprüfen', 'Sweeping & inspection') },
    { id: 'schau', name: T('Feuerstättenschau', 'Fireplace inspection'), dur: 60, icon: 's-clip', note: T('Alle Feuerstätten im Gebäude', 'All heating appliances in the building') },
    { id: 'messung', name: T('Prüfungen & Messungen', 'Inspections & measurements'), dur: 45, icon: 's-gauge', note: T('Abgasweg, CO, Emissionen', 'Flue, CO, emissions') },
    { id: 'reinigung', name: T('Reinigung', 'Cleaning'), dur: 90, icon: 's-brush', note: T('Kaminofen, Ofen, Lüftung', 'Wood stove, stove, ventilation') },
    { id: 'brandschutz', name: T('Brandschutz & Rauchwarnmelder', 'Fire safety & smoke alarms'), dur: 60, icon: 's-alarm', note: T('Montage & Wartung', 'Installation & maintenance') },
    { id: 'energie', name: T('Energieberatung', 'Energy consulting'), dur: 90, icon: 's-leaf', note: T('inkl. Fördermittel KfW/BAFA', 'incl. KfW/BAFA subsidies') }
  ];
  const WORK = { start: 7 * 60 + 30, end: 17 * 60 };   // Mo–Fr 7:30–17:00
  const STEP = 30;            // Raster der Startzeiten (Minuten)
  const BUFFER = 30;          // Fahrzeit zwischen Terminen
  const HORIZON_DAYS = 56;    // Buchbar bis 8 Wochen im Voraus
  const CLOSED = ['12-24', '12-25', '12-26', '12-31', '01-01']; // feste Feier-/Schließtage (MM-TT)

  /* ---------- Hilfsfunktionen Datum ---------- */
  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const fmtTime = m => `${Math.floor(m / 60)}:${pad(m % 60)}`;
  const WD = T(['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const WDL = T(['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'], ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const MON = T(['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'], ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtShort = d => EN ? `${WD[d.getDay()]}, ${d.getDate()} ${MONS[d.getMonth()]}` : `${WD[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
  const fmtLong = d => EN ? `${WDL[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}` : `${WDL[d.getDay()]}, ${d.getDate()}. ${MON[d.getMonth()]} ${d.getFullYear()}`;

  const today = startOfDay(new Date());
  const firstBookable = addDays(today, 1);
  const lastBookable = addDays(today, HORIZON_DAYS);

  /* ---------- Simulierter Kalender ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('sr-bookings') || '[]'); } catch (_) { return []; } },
    add(b) { try { const a = store.get(); a.push(b); localStorage.setItem('sr-bookings', JSON.stringify(a)); } catch (_) {} }
  };
  // deterministischer Zufall je Datum -> gleiche Belegung bei jedem Besuch
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hash = s => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

  const Calendar = {
    isWorkday(d) {
      const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return d.getDay() > 0 && d.getDay() < 6 && !CLOSED.includes(md);
    },
    busy(d) {
      if (!this.isWorkday(d)) return null;
      const r = rng(hash(key(d)));
      const blocks = [];
      // Auslastung: nahe Tage voller, einzelne Tage komplett ausgebucht
      const distance = (d - today) / 864e5;
      const load = r() < 0.12 ? 99 : Math.round(2 + r() * 3 + (distance < 7 ? 2 : 0));
      if (load === 99) return [[WORK.start, WORK.end]];
      for (let i = 0; i < load; i++) {
        const s = WORK.start + Math.floor(r() * ((WORK.end - WORK.start) / STEP)) * STEP;
        blocks.push([s, Math.min(WORK.end, s + (2 + Math.floor(r() * 4)) * STEP)]);
      }
      store.get().filter(b => b.date === key(d)).forEach(b => blocks.push([b.start, b.start + b.dur]));
      return blocks;
    },
    slots(d, dur) {
      const busy = this.busy(d);
      if (!busy || startOfDay(d) < firstBookable || startOfDay(d) > lastBookable) return [];
      const out = [];
      for (let s = WORK.start; s + dur <= WORK.end; s += STEP) {
        const e = s + dur;
        const clash = busy.some(([bs, be]) => s < be + BUFFER && e + BUFFER > bs); // inkl. Fahrzeitpuffer
        const lunch = s < 12 * 60 + 30 && e > 12 * 60;                                // Mittagspause 12:00–12:30
        if (!clash && !lunch) out.push(s);
      }
      return out;
    },
    // simuliert die Latenz einer echten Kalender-API
    fetchBusy(d, dur) { return new Promise(res => setTimeout(() => res(this.slots(d, dur)), reduced ? 0 : 350)); },
    nextFree(dur) {
      for (let d = new Date(firstBookable); d <= lastBookable; d = addDays(d, 1)) {
        const s = this.slots(d, dur);
        if (s.length) return { date: new Date(d), start: s[0] };
      }
      return null;
    },
    book(b) { return new Promise(res => setTimeout(() => { store.add(b); res({ id: 'SR-' + Date.now().toString(36).toUpperCase().slice(-6) }); }, reduced ? 0 : 900)); }
  };

  /* ---------- Markup ---------- */
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'book-fab';
  fab.setAttribute('aria-haspopup', 'dialog');
  fab.innerHTML = `<span class="book-fab-tab">${ICON('cal')}<span class="book-fab-label">${T('Termin online buchen', 'Book appointment')}</span><span class="book-fab-dot" aria-hidden="true"></span></span>
    <span class="book-fab-peek" aria-hidden="true"><small>${T('Nächster freier Termin', 'Next available slot')}</small><b data-next>–</b><em>${T('In 60 Sekunden gebucht', 'Booked in 60 seconds')} ${ICON('arrow')}</em></span>`;

  const dlg = document.createElement('dialog');
  dlg.className = 'booking';
  dlg.setAttribute('aria-labelledby', 'bk-title');
  dlg.innerHTML = `
    <div class="bk-head">
      <div class="bk-head-top">
        <div class="bk-person"><img src="/assets/schornsteinfegermeister-philipp-ritters-koeln.jpg" alt="" width="48" height="48"><div><h2 id="bk-title">${T('Termin online buchen', 'Book an appointment')}</h2><p>${T('bei Schornsteinfegermeister Philipp Ritters', 'with master chimney sweep Philipp Ritters')}</p></div></div>
        <button type="button" class="bk-close" data-bk-close aria-label="${T('Terminbuchung schließen', 'Close booking')}">${ICON('close')}</button>
      </div>
      <ol class="bk-progress" aria-label="${T('Fortschritt', 'Progress')}">
        <li data-step-ind="1">${T('Leistung', 'Service')}</li><li data-step-ind="2">${T('Termin', 'Date & time')}</li><li data-step-ind="3">${T('Ihre Daten', 'Your details')}</li>
      </ol>
    </div>
    <div class="bk-body">
      <section class="bk-step" data-step="1" aria-labelledby="bk-s1">
        <h3 id="bk-s1" class="bk-h">${T('Wobei dürfen wir helfen?', 'How can we help?')}</h3>
        <div class="bk-services" role="radiogroup" aria-labelledby="bk-s1">
          ${SERVICES.map(s => `<button type="button" class="bk-service" role="radio" aria-checked="false" data-service="${s.id}">
            <svg class="ic bk-sicon" aria-hidden="true"><use href="/assets/icons.svg#${s.icon}"/></svg>
            <span><b>${s.name}</b><small>${s.note}</small></span>
            <span class="bk-dur">${ICON('clock')}${T('ca.', 'approx.')} ${s.dur} ${T('Min.', 'min')}</span></button>`).join('')}
        </div>
        <ul class="bk-trust">
          <li>${ICON('check')}${T('Sofortige Terminbestätigung', 'Instant confirmation')}</li>
          <li>${ICON('check')}${T('Live-Abgleich mit Philipps Kalender', "Live sync with Philipp's calendar")}</li>
          <li>${ICON('check')}${T('Meisterbetrieb aus Köln-Nippes', 'Master craftsman business in Cologne-Nippes')}</li>
        </ul>
      </section>

      <section class="bk-step" data-step="2" aria-labelledby="bk-s2" hidden>
        <h3 id="bk-s2" class="bk-h">${T('Wählen Sie Tag und Uhrzeit', 'Choose a day and time')}</h3>
        <p class="bk-sync" aria-live="polite"><span class="bk-sync-dot" aria-hidden="true"></span><span data-sync>${T('Kalender synchronisiert', 'Calendar synced')}</span></p>
        <button type="button" class="bk-next-free" data-next-free></button>
        <div class="bk-cal">
          <div class="bk-cal-head">
            <button type="button" class="bk-nav" data-month="-1" aria-label="${T('Vorheriger Monat', 'Previous month')}">${ICON('arrow')}</button>
            <b data-month-label aria-live="polite"></b>
            <button type="button" class="bk-nav" data-month="1" aria-label="${T('Nächster Monat', 'Next month')}">${ICON('arrow')}</button>
          </div>
          <div class="bk-grid bk-wd" aria-hidden="true">${T(['Mo','Di','Mi','Do','Fr','Sa','So'], ['Mo','Tu','We','Th','Fr','Sa','Su']).map(d => `<span>${d}</span>`).join('')}</div>
          <div class="bk-grid" data-days></div>
          <p class="bk-legend"><span><i class="lv-high"></i>${T('gut verfügbar', 'available')}</span><span><i class="lv-low"></i>${T('nur noch wenige', 'few left')}</span><span><i class="lv-none"></i>${T('ausgebucht', 'fully booked')}</span></p>
        </div>
        <div class="bk-slots" data-slots aria-live="polite"></div>
      </section>

      <section class="bk-step" data-step="3" aria-labelledby="bk-s3" hidden>
        <h3 id="bk-s3" class="bk-h">${T('Fast geschafft – wohin dürfen wir kommen?', 'Almost done – where should we come?')}</h3>
        <form class="bk-form" novalidate>
          <div class="hp" aria-hidden="true"><label for="bk-website">Website</label><input id="bk-website" name="website" tabindex="-1" autocomplete="off"></div>
          <div class="field full"><label for="bk-name">Name <span class="req" aria-hidden="true">*</span></label><input id="bk-name" name="name" required autocomplete="name"><p class="err" id="bk-name-err"></p></div>
          <div class="field"><label for="bk-tel">${T('Telefon', 'Phone')} <span class="req" aria-hidden="true">*</span></label><input id="bk-tel" name="telefon" type="tel" required autocomplete="tel" inputmode="tel"><p class="err" id="bk-tel-err"></p></div>
          <div class="field"><label for="bk-mail">${T('E-Mail', 'Email')} <span class="req" aria-hidden="true">*</span></label><input id="bk-mail" name="email" type="email" required autocomplete="email" aria-describedby="bk-mail-hint"><p class="err" id="bk-mail-err"></p><p class="bk-hint" id="bk-mail-hint">${T('Für Ihre Terminbestätigung', 'For your booking confirmation')}</p></div>
          <div class="field full"><label for="bk-adr">${T('Adresse des Objekts', 'Property address')} <span class="req" aria-hidden="true">*</span></label><input id="bk-adr" name="adresse" required autocomplete="street-address" placeholder="${T('Straße, Hausnummer, PLZ, Ort', 'Street, number, postcode, town')}"><p class="err" id="bk-adr-err"></p></div>
          <div class="field full"><label for="bk-note">${T('Hinweise', 'Notes')} <span class="muted">(optional)</span></label><textarea id="bk-note" name="hinweis" rows="2" placeholder="${T('z. B. Klingel, Zugang zum Dach, Art der Feuerstätte', 'e.g. doorbell name, roof access, type of appliance')}"></textarea></div>
          <div class="field full"><label class="checkbox"><input type="checkbox" id="bk-ds" name="datenschutz" value="ja" required><span>${T(`Ich habe die <a href="/datenschutz#terminbuchung" target="_blank" rel="noopener">Datenschutzerklärung</a> zur Kenntnis genommen und bin einverstanden, dass meine Angaben zur Planung und Durchführung des Termins verarbeitet und gespeichert werden. Widerruf jederzeit per E-Mail möglich.`, `I have read the <a href="/en/privacy#booking" target="_blank" rel="noopener">privacy policy</a> and agree that my details are processed and stored to plan and carry out the appointment. I can withdraw my consent at any time by email.`)} <span class="req" aria-hidden="true">*</span></span></label><p class="err" id="bk-ds-err"></p></div>
          <div class="field full"><label class="checkbox"><input type="checkbox" id="bk-reminder" name="erinnerung" value="ja"><span>${T('Ja, bitte erinnern Sie mich einen Tag vorher per E-Mail an den Termin.', 'Yes, please remind me by email one day before the appointment.')} <span class="muted">(optional)</span></span></label></div>
          <p class="privacy full">${T('Ihre Daten werden verschlüsselt übertragen und nur für diesen Termin verwendet – keine Weitergabe an Dritte, keine Werbung.', 'Your data is encrypted in transit and used only for this appointment – never shared, never used for advertising.')}</p>
        </form>
      </section>

      <section class="bk-step bk-done" data-step="4" aria-labelledby="bk-s4" hidden tabindex="-1">
        <div class="bk-check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
        <h3 id="bk-s4">${T('Ihr Termin ist gebucht!', 'Your appointment is booked!')}</h3>
        <p class="bk-done-lead" data-done-lead></p>
        <dl class="bk-receipt" data-receipt></dl>
        <div class="bk-done-actions">
          <a class="btn btn-gold" data-ics download="${T('termin', 'appointment')}-schornsteinfeger-ritters.ics">${ICON('cal')}${T('Zum Kalender hinzufügen', 'Add to calendar')}</a>
          <button type="button" class="btn btn-outline" data-bk-close>${T('Fertig', 'Done')}</button>
        </div>
        <p class="bk-sim">${T('Vorschau: Dies ist eine Simulation. Es wurde kein echter Termin gebucht und nichts versendet.', 'Preview: this is a simulation. No real appointment was booked and nothing was sent.')}</p>
      </section>
    </div>

    <div class="bk-foot">
      <div class="bk-summary" data-summary aria-live="polite"><span class="bk-summary-empty">${T('Bitte wählen Sie eine Leistung.', 'Please choose a service.')}</span></div>
      <div class="bk-foot-actions">
        <button type="button" class="btn btn-outline btn-sm bk-back" data-back hidden>${T('Zurück', 'Back')}</button>
        <button type="button" class="btn btn-gold bk-cta" data-next disabled>${T('Weiter', 'Continue')}${ICON('arrow')}</button>
      </div>
      <p class="bk-alt">${T('Kein passender Termin?', 'No suitable slot?')} <a href="${HOME}#${T('anfrage', 'request')}" data-alt>${T('Wunschtermin anfragen', 'Request a preferred date')}</a> ${T('oder', 'or')} <a href="tel:+492217400990">${T('0221 – 7400 990', '+49 221 7400 990')}</a></p>
    </div>`;

  document.body.append(fab, dlg);

  /* ---------- Zustand ---------- */
  const $ = s => dlg.querySelector(s);
  const $$ = s => [...dlg.querySelectorAll(s)];
  const st = { step: 1, service: null, date: null, start: null, month: new Date(firstBookable.getFullYear(), firstBookable.getMonth(), 1) };
  const svc = () => SERVICES.find(s => s.id === st.service);

  /* ---------- Sticky-Button: nächster freier Termin ---------- */
  const updatePeek = () => {
    const n = Calendar.nextFree(45);
    fab.querySelector('[data-next]').textContent = n ? `${fmtShort(n.date)} · ${fmtTime(n.start)}${UHR}` : T('auf Anfrage', 'on request');
    fab.setAttribute('aria-label', T('Termin online buchen', 'Book appointment online') + (n ? T(` – nächster freier Termin ${fmtShort(n.date)} um ${fmtTime(n.start)} Uhr`, ` – next available slot ${fmtShort(n.date)} at ${fmtTime(n.start)}`) : ''));
  };
  updatePeek();

  /* ---------- Öffnen / Schließen ---------- */
  let lastFocus = null;
  const open = (serviceName) => {
    lastFocus = document.activeElement;
    const pre = serviceName && SERVICES.find(s => s.name === serviceName || serviceName.startsWith(s.name.split(' ')[0]));
    if (st.step === 4) reset();
    if (pre) { st.service = pre.id; go(2); } else go(st.step);
    dlg.showModal();
    document.documentElement.classList.add('bk-open');
    requestAnimationFrame(() => dlg.classList.add('in'));
  };
  const close = () => {
    dlg.classList.remove('in');
    setTimeout(() => { dlg.close(); document.documentElement.classList.remove('bk-open'); lastFocus && lastFocus.focus(); }, reduced ? 0 : 280);
  };
  fab.addEventListener('click', () => open());
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-bk-close]')) close(); });
  $('[data-alt]').addEventListener('click', e => {
    const onHome = document.querySelector('.request');
    if (!onHome) return;
    e.preventDefault(); close();
    setTimeout(() => { document.getElementById('tab-termin')?.click(); onHome.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }, 300);
  });

  // Alle „Termin“-CTAs der Seite öffnen die Online-Buchung (Capture-Phase, vor site.js)
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-termin]');
    if (!t || dlg.contains(t)) return;
    e.preventDefault(); e.stopPropagation();
    document.getElementById('menu')?.classList.remove('open');
    open(t.dataset.termin || null);
  }, true);
  if (new URLSearchParams(location.search).has('buchen') || ['#termin-buchen', '#book'].includes(location.hash)) setTimeout(() => open(), 300);

  /* ---------- Schritte ---------- */
  const go = n => {
    st.step = n;
    $$('.bk-step').forEach(s => { s.hidden = +s.dataset.step !== n; });
    $$('[data-step-ind]').forEach(li => {
      const i = +li.dataset.stepInd;
      li.classList.toggle('done', i < n);
      li.classList.toggle('active', i === n);
      i === n ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current');
    });
    dlg.classList.toggle('is-done', n === 4);
    $('[data-back]').hidden = n === 1 || n === 4;
    if (n === 1) renderServices();
    if (n === 2) { renderCalendar(); renderSlots(); }
    renderFoot();
    $('.bk-body').scrollTop = 0;
    const h = n === 4 ? $('[data-step="4"]') : $(`#bk-s${n}`);
    if (dlg.open && h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  };
  const reset = () => { st.step = 1; st.service = null; st.date = null; st.start = null; $('.bk-form').reset(); $$('.bk-form [aria-invalid]').forEach(f => f.removeAttribute('aria-invalid')); $$('.bk-form .err').forEach(e => e.textContent = ''); };

  /* Schritt 1 */
  const renderServices = () => $$('.bk-service').forEach(b => b.setAttribute('aria-checked', b.dataset.service === st.service));
  $('.bk-services').addEventListener('click', e => {
    const b = e.target.closest('.bk-service'); if (!b) return;
    if (st.service !== b.dataset.service) { st.start = null; }
    st.service = b.dataset.service;
    renderServices(); renderFoot();
    setTimeout(() => go(2), reduced ? 0 : 220); // direkt weiter = weniger Klicks
  });
  $('.bk-services').addEventListener('keydown', e => {
    const list = $$('.bk-service'), i = list.indexOf(document.activeElement);
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (d && i > -1) { e.preventDefault(); list[(i + d + list.length) % list.length].focus(); }
  });

  /* Schritt 2: Kalender */
  const level = d => {
    const n = Calendar.slots(d, svc().dur).length;
    return n === 0 ? 'none' : n <= 3 ? 'low' : 'high';
  };
  const renderCalendar = () => {
    const m = st.month, y = m.getFullYear(), mo = m.getMonth();
    $('[data-month-label]').textContent = `${MON[mo]} ${y}`;
    $('[data-month="-1"]').disabled = new Date(y, mo, 1) <= new Date(firstBookable.getFullYear(), firstBookable.getMonth(), 1);
    $('[data-month="1"]').disabled = new Date(y, mo + 1, 1) > lastBookable;
    const first = new Date(y, mo, 1), offset = (first.getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
    let html = '<span></span>'.repeat(offset);
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, mo, d);
      const inRange = date >= firstBookable && date <= lastBookable;
      const lv = inRange && Calendar.isWorkday(date) ? level(date) : 'off';
      const sel = st.date && key(st.date) === key(date);
      const label = `${fmtLong(date)}${lv === 'none' ? T(', ausgebucht', ', fully booked') : lv === 'low' ? T(', nur noch wenige Termine', ', few slots left') : lv === 'high' ? T(', Termine frei', ', slots available') : T(', nicht buchbar', ', not bookable')}`;
      html += `<button type="button" class="bk-day lv-${lv}${key(date) === key(today) ? ' is-today' : ''}" data-date="${key(date)}" aria-pressed="${!!sel}" aria-label="${label}" ${lv === 'off' || lv === 'none' ? 'disabled' : ''}>${d}</button>`;
    }
    $('[data-days]').innerHTML = html;
    const nf = Calendar.nextFree(svc().dur);
    const b = $('[data-next-free]');
    b.hidden = !nf;
    if (nf) { b.innerHTML = `<span>${ICON('clock')}${T('Nächster freier Termin', 'Next available slot')}</span><b>${fmtShort(nf.date)} · ${fmtTime(nf.start)}${UHR}</b><em>${T('Übernehmen', 'Select')}</em>`; b.dataset.date = key(nf.date); b.dataset.start = nf.start; }
  };
  $$('[data-month]').forEach(b => b.addEventListener('click', () => {
    st.month = new Date(st.month.getFullYear(), st.month.getMonth() + +b.dataset.month, 1);
    renderCalendar();
  }));
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  $('[data-days]').addEventListener('click', e => {
    const b = e.target.closest('.bk-day'); if (!b || b.disabled) return;
    st.date = parseKey(b.dataset.date); st.start = null;
    $$('.bk-day').forEach(x => x.setAttribute('aria-pressed', x === b));
    renderSlots(true); renderFoot();
  });
  $('[data-next-free]').addEventListener('click', e => {
    const b = e.currentTarget;
    st.date = parseKey(b.dataset.date); st.start = +b.dataset.start;
    st.month = new Date(st.date.getFullYear(), st.date.getMonth(), 1);
    renderCalendar(); renderSlots(); renderFoot();
  });

  let slotReq = 0;
  const renderSlots = async (scroll) => {
    const box = $('[data-slots]');
    if (!st.date) { box.innerHTML = `<p class="bk-placeholder">${ICON('cal')}${T('Wählen Sie einen Tag – freie Uhrzeiten erscheinen hier.', 'Choose a day – available times will appear here.')}</p>`; return; }
    const req = ++slotReq;
    $('[data-sync]').textContent = T('Gleiche Verfügbarkeit ab …', 'Checking availability …');
    $('.bk-sync').classList.add('loading');
    box.innerHTML = `<div class="bk-skel">${'<span></span>'.repeat(8)}</div>`;
    const slots = await Calendar.fetchBusy(st.date, svc().dur);
    if (req !== slotReq) return;
    $('.bk-sync').classList.remove('loading');
    $('[data-sync]').textContent = `${T('Kalender synchronisiert', 'Calendar synced')} · ${new Date().toLocaleTimeString(T('de-DE', 'en-GB'), { hour: '2-digit', minute: '2-digit' })}${UHR}`;
    const group = (label, list) => list.length ? `<div class="bk-slot-group"><h4>${label}</h4><div class="bk-slot-list">${list.map(s =>
      `<button type="button" class="bk-slot" data-start="${s}" aria-pressed="${st.start === s}" aria-label="${fmtTime(s)} ${T('bis', 'to')} ${fmtTime(s + svc().dur)}${UHR}">${fmtTime(s)}</button>`).join('')}</div></div>` : '';
    box.innerHTML = slots.length
      ? `<p class="bk-slot-day"><b>${fmtLong(st.date)}</b><span>${slots.length <= 3 ? T(`Nur noch ${slots.length} ${slots.length === 1 ? 'Termin' : 'Termine'} frei`, `Only ${slots.length} ${slots.length === 1 ? 'slot' : 'slots'} left`) : T(`${slots.length} freie Zeiten`, `${slots.length} times available`)}</span></p>`
        + group(T('Vormittag', 'Morning'), slots.filter(s => s < 12 * 60)) + group(T('Nachmittag', 'Afternoon'), slots.filter(s => s >= 12 * 60))
      : `<p class="bk-placeholder">${T('An diesem Tag ist leider nichts mehr frei.', 'Sorry, this day is fully booked.')}</p>`;
    if (scroll && innerWidth < 900) box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  };
  $('[data-slots]').addEventListener('click', e => {
    const b = e.target.closest('.bk-slot'); if (!b) return;
    st.start = +b.dataset.start;
    $$('.bk-slot').forEach(x => x.setAttribute('aria-pressed', x === b));
    renderFoot();
  });

  /* Fußleiste: Zusammenfassung + CTA */
  const renderFoot = () => {
    const s = svc();
    const parts = [];
    if (s) parts.push(`<span>${ICON(s.icon)}${s.name}</span>`);
    if (st.date) parts.push(`<span>${ICON('cal')}${fmtShort(st.date)}${st.start != null ? ` · ${fmtTime(st.start)}–${fmtTime(st.start + s.dur)}${UHR}` : ''}</span>`);
    $('[data-summary]').innerHTML = parts.length ? parts.join('') : `<span class="bk-summary-empty">${T('Bitte wählen Sie eine Leistung.', 'Please choose a service.')}</span>`;
    const next = $('[data-next]');
    const ok = st.step === 1 ? !!s : st.step === 2 ? st.start != null : true;
    next.disabled = !ok;
    next.innerHTML = st.step === 3 ? `${ICON('check')}${T('Termin verbindlich buchen', 'Confirm booking')}` : `${T('Weiter', 'Continue')}${ICON('arrow')}`;
    dlg.querySelector('.bk-foot').hidden = st.step === 4;
  };
  $('[data-back]').addEventListener('click', () => go(st.step - 1));

  /* Schritt 3: Validierung + Buchung */
  const msgs = { valueMissing: T('Bitte füllen Sie dieses Feld aus.', 'Please fill in this field.'), typeMismatch: T('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'Please enter a valid email address.') };
  const check = f => {
    let m = '';
    if (!f.checkValidity()) m = msgs[Object.keys(msgs).find(k => f.validity[k])] || f.validationMessage;
    if (f.type === 'tel' && f.value && !/^[+()\d\s\/-]{6,}$/.test(f.value)) m = T('Bitte geben Sie eine gültige Telefonnummer ein.', 'Please enter a valid phone number.');
    if (f.type === 'checkbox' && !f.checked) m = T('Bitte bestätigen Sie die Datenschutzhinweise, um den Termin zu buchen.', 'Please confirm the privacy notice to book the appointment.');
    const err = $(`#${f.id}-err`);
    f.setAttribute('aria-invalid', m ? 'true' : 'false');
    if (err) err.textContent = m;
    return !m;
  };
  const fields = $$('.bk-form [required]');
  fields.forEach(f => f.type === 'checkbox'
    ? f.addEventListener('change', () => check(f))
    : f.addEventListener('blur', () => f.value && check(f)));
  $('.bk-form').addEventListener('submit', e => { e.preventDefault(); $('[data-next]').click(); });

  const openedAt = Date.now();
  $('[data-next]').addEventListener('click', async () => {
    if (st.step < 3) return go(st.step + 1);
    const bad = fields.filter(f => !check(f));
    if (bad.length) return bad[0].focus();
    const fd = new FormData($('.bk-form'));
    if (fd.get('website') || Date.now() - openedAt < 3000) return; // Spam-Schutz

    // Letzter Abgleich direkt vor der Buchung (Slot könnte inzwischen vergeben sein)
    const btn = $('[data-next]');
    btn.disabled = true; btn.classList.add('is-loading'); btn.textContent = T('Termin wird reserviert …', 'Reserving your slot …');
    const still = (await Calendar.fetchBusy(st.date, svc().dur)).includes(st.start);
    if (!still) {
      btn.classList.remove('is-loading');
      go(2);
      $('[data-slots]').insertAdjacentHTML('afterbegin', `<p class="bk-warn">${T('Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit.', 'This slot was just taken. Please choose another time.')}</p>`);
      return;
    }
    const res = await Calendar.book({ date: key(st.date), start: st.start, dur: svc().dur, service: st.service });
    btn.classList.remove('is-loading');
    confirm(res.id, fd);
  });

  const confirm = (id, fd) => {
    const s = svc(), name = String(fd.get('name')).trim().split(/\s+/)[0];
    const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    $('[data-done-lead]').innerHTML = T(`Danke, ${esc(name)}! Die Bestätigung geht an <b>${esc(fd.get('email'))}</b>. Philipp meldet sich, falls vorab etwas zu klären ist.`, `Thank you, ${esc(name)}! Your confirmation is on its way to <b>${esc(fd.get('email'))}</b>. Philipp will get in touch if anything needs clarifying beforehand.`);
    $('[data-receipt]').innerHTML = `
      <dt>${T('Leistung', 'Service')}</dt><dd>${s.name}</dd>
      <dt>${T('Termin', 'Date')}</dt><dd>${fmtLong(st.date)}<br>${fmtTime(st.start)}–${fmtTime(st.start + s.dur)}${UHR}</dd>
      <dt>${T('Adresse', 'Address')}</dt><dd>${esc(fd.get('adresse'))}</dd>
      <dt>${T('Buchungsnr.', 'Booking no.')}</dt><dd>${id}</dd>`;
    // iCalendar-Datei für den eigenen Kalender
    const dt = m => `${key(st.date).replace(/-/g, '')}T${pad(Math.floor(m / 60))}${pad(m % 60)}00`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Schornsteinfeger Ritters//Termin//DE', 'BEGIN:VEVENT',
      `UID:${id}@schornsteinfeger.koeln`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;TZID=Europe/Berlin:${dt(st.start)}`, `DTEND;TZID=Europe/Berlin:${dt(st.start + s.dur)}`,
      `SUMMARY:Schornsteinfeger Ritters – ${s.name}`, `LOCATION:${String(fd.get('adresse')).replace(/[,;]/g, '\\$&')}`,
      T('DESCRIPTION:Fragen? 0221 7400 990', 'DESCRIPTION:Questions? +49 221 7400 990'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = $('[data-ics]');
    if (a.href) URL.revokeObjectURL(a.href);
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    go(4);
    updatePeek();
  };
})();
