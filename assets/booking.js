/* Geführte, unverbindliche Terminanfrage in drei Schritten: Anliegen → Details → Kontakt.
 * Anliegen und Zusatzfelder kommen aus assets/anliegen.js (erzeugt aus assets/data/anliegen.json).
 * Auf Vorschau-Hosts wird nichts versendet. Es gibt keinen Kalender und keine Verfügbarkeitsanzeige. */
(() => {
  const CFG = window.RITTERS_ANLIEGEN; if (!CFG) return;
  const EN = document.documentElement.lang.startsWith('en');
  const T = (de, en) => EN ? en : de;
  const L = a => EN ? a.en : a.de, K = a => EN ? a.kurz_en : a.kurz_de;
  const ICON = id => `<svg class="ic" aria-hidden="true"><use href="/assets/icons.svg#${id}"/></svg>`;
  const PREVIEW = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /(^|\.)(vercel\.app|meindigitalerbetrieb\.de)$/.test(location.hostname);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FIELDS = CFG.felder;
  const SERVICES = CFG.anliegen.filter(a => a.gruppe !== 'nachricht' || a.id === 'allgemeine_frage');
  const MAIN = SERVICES.filter(a => a.gruppe === 'einstieg'), MORE = SERVICES.filter(a => a.gruppe !== 'einstieg');
  const COST = T('Die Kosten hängen von Anlage, Anzahl der Feuerstätten und Aufwand ab. Mit dieser Anfrage beauftragen Sie keine kostenpflichtige Leistung. Wir klären den Leistungsumfang und nennen Ihnen den Preis vor Ihrer Beauftragung.', 'The cost depends on your system, number of appliances and the work involved. This request does not place a paid order. We clarify the scope and price before you commit.');
  const demo = T('Vorschau: Hier wird nichts versendet und kein Termin reserviert. Für eine echte Anfrage rufen Sie bitte 0221 – 7400 990 an.', 'Preview: nothing is sent and no appointment is reserved. For a real request, please call +49 221 7400 990.');
  const REQ = T('Bitte füllen Sie dieses Feld aus.', 'Please fill in this field.');

  const dlg = document.createElement('dialog');
  dlg.className = 'booking';
  dlg.setAttribute('aria-labelledby', 'bk-title');
  const choices = (list, label) => `<div class="bk-services" role="radiogroup" aria-label="${label}">${list.map(s => `<button type="button" class="bk-service" role="radio" aria-checked="false" data-service="${s.id}">${ICON(s.icon)}<span><b>${esc(L(s))}</b><small>${esc(K(s))}</small></span></button>`).join('')}</div>`;
  dlg.innerHTML = `<div class="bk-head"><div class="bk-head-top"><div class="bk-person"><img src="/assets/img/philipp-ritters-ansprechpartner-192.jpg" srcset="/assets/img/philipp-ritters-ansprechpartner-192.jpg 192w, /assets/img/philipp-ritters-ansprechpartner-384.jpg 384w" sizes="48px" alt="" width="48" height="48"><div><h2 id="bk-title">${T('Termin anfragen', 'Request appointment')}</h2><p>${T('bei Schornsteinfegermeister Philipp Ritters', 'with master chimney sweep Philipp Ritters')}</p></div></div><button type="button" class="bk-close" data-bk-close aria-label="${T('Terminanfrage schließen', 'Close appointment request')}">${ICON('close')}</button></div><ol class="bk-progress" aria-label="${T('Fortschritt', 'Progress')}"><li data-step-ind="1">${T('Anliegen', 'Request')}</li><li data-step-ind="2">${T('Details', 'Details')}</li><li data-step-ind="3">${T('Ihre Daten', 'Your details')}</li></ol></div>
  <div class="bk-body">
    ${PREVIEW ? `<p class="bk-notice">${demo}</p>` : ''}
    <section class="bk-step" data-step="1" aria-labelledby="bk-s1"><h3 class="bk-h" id="bk-s1">${T('Was steht bei Ihnen an?', 'What can we help you with?')}</h3><p class="bk-hint">${T('Wählen Sie Ihr Anliegen. Sie müssen die Fachbegriffe nicht kennen.', 'Choose your situation. No technical knowledge needed.')}</p>${choices(MAIN, T('Ihr Anliegen', 'Your situation'))}<details class="bk-expert"><summary>${T('Ich kenne die gewünschte Leistung', 'I know which service I need')}</summary>${choices(MORE, T('Weitere Leistungen', 'More services'))}</details><div class="bk-cost"><h4>${T('Kosten vorab klären', 'Clarify the cost first')}</h4><p>${COST}</p></div></section>
    <section class="bk-step" data-step="2" aria-labelledby="bk-s2" hidden><h3 class="bk-h" id="bk-s2">${T('Ein paar Details', 'A few details')}</h3><p class="bk-hint" data-details-hint></p><div class="bk-details" data-details></div></section>
    <section class="bk-step" data-step="3" aria-labelledby="bk-s3" hidden><h3 class="bk-h" id="bk-s3">${T('Wie erreichen wir Sie?', 'How can we reach you?')}</h3><div class="bk-cost"><h4>${T('Ihre Anfrage ist unverbindlich', 'Your request is non-binding')}</h4><p>${COST}</p></div><form class="bk-form" novalidate><div class="hp" aria-hidden="true"><label for="bk-website">Website</label><input id="bk-website" name="website" tabindex="-1" autocomplete="off"></div>
    <div class="field full"><label for="bk-name">Name *</label><input id="bk-name" name="name" required autocomplete="name" aria-describedby="bk-name-err"><p class="err" id="bk-name-err"></p></div>
    <div class="field"><label for="bk-tel">${T('Telefon', 'Phone')} *</label><input id="bk-tel" name="telefon" type="tel" required autocomplete="tel" inputmode="tel" aria-describedby="bk-tel-err"><p class="err" id="bk-tel-err"></p></div>
    <div class="field"><label for="bk-mail">${T('E-Mail (optional)', 'Email (optional)')}</label><input id="bk-mail" name="email" type="email" autocomplete="email" aria-describedby="bk-mail-err"><p class="err" id="bk-mail-err"></p></div>
    <div class="field full"><label for="bk-adr">${T('Adresse des Objekts', 'Property address')} *</label><input id="bk-adr" name="adresse" required autocomplete="street-address" placeholder="${T('Straße, Hausnummer, PLZ, Ort', 'Street, number, postcode, town')}" aria-describedby="bk-adr-err"><p class="err" id="bk-adr-err"></p></div>
    <div class="field full"><label for="bk-note">${T('Hinweise (optional)', 'Notes (optional)')}</label><textarea id="bk-note" name="nachricht" rows="3" placeholder="${T('z. B. Zugang zum Dach, Ansprechpartner vor Ort, Fragen zum Preis', 'e.g. roof access, contact person on site, questions about cost')}"></textarea></div>
    <div class="field full"><label class="checkbox"><input type="checkbox" id="bk-ds" name="datenschutz" value="ja" required aria-describedby="bk-ds-err"><span>${T('Ich habe die', 'I have read the')} <a href="${EN ? '/en/privacy#forms' : '/datenschutz#formulare'}" target="_blank" rel="noopener">${T('Datenschutzerklärung', 'privacy policy')}<span class="sr-only">${T(' (öffnet in neuem Fenster)', ' (opens in a new window)')}</span></a> ${T('zur Kenntnis genommen und bin mit der Verarbeitung meiner Angaben zur Bearbeitung dieser Anfrage einverstanden.', 'and agree to my details being processed to handle this request.')} *</span></label><p class="err" id="bk-ds-err"></p></div><p class="privacy full">${T('Pflichtfelder sind mit * markiert. Wir melden uns zur Kostenklärung und Terminbestätigung.', 'Required fields are marked *. We will get in touch to clarify the cost and confirm a date.')}</p><p class="bk-warn full" data-send-error role="alert" hidden></p></form></section>
    <section class="bk-step bk-done" data-step="4" aria-labelledby="bk-s4" hidden tabindex="-1"><h3 id="bk-s4"></h3><p data-done-lead></p><dl class="bk-receipt" data-receipt></dl><button type="button" class="btn btn-gold" data-bk-close>${T('Schließen', 'Close')}</button></section>
  </div><div class="bk-foot"><div class="bk-summary" data-summary aria-live="polite"></div><div class="bk-foot-actions"><button type="button" class="btn btn-outline btn-sm bk-back" data-back hidden>${T('Zurück', 'Back')}</button><button type="button" class="btn btn-gold bk-cta" data-next disabled>${T('Weiter', 'Continue')}${ICON('arrow')}</button></div><p class="bk-alt">${T('Lieber persönlich?', 'Prefer to speak to us?')} <a href="tel:+492217400990">${T('0221 – 7400 990', '+49 221 7400 990')}</a></p></div>`;
  const fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'book-fab'; fab.setAttribute('aria-haspopup', 'dialog');
  fab.innerHTML = `<span class="book-fab-tab">${ICON('cal')}<span class="book-fab-label">${T('Termin anfragen', 'Request appointment')}</span></span>`;
  document.body.append(fab, dlg);
  const $ = s => dlg.querySelector(s), $$ = s => [...dlg.querySelectorAll(s)];
  const localDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const TODAY = localDate(new Date());
  let step = 1, service = null, lastFocus = null, sending = false, openedAt = 0;
  const svc = () => SERVICES.find(s => s.id === service);
  const optLabel = (key, v) => { const o = (FIELDS[key].optionen || []).find(x => x[0] === v); return o ? (EN ? o[2] : o[1]) : v; };

  /* Schritt 2: Felder je Anliegen */
  const fieldHtml = key => {
    const f = FIELDS[key], lab = esc(EN ? f.en : f.de), id = `bk-f-${key}`, req = f.pflicht ? ' *' : '';
    const opt = (v, d, e, type, name, checked) => `<label><input type="${type}" name="${name}" value="${v}"${checked ? ' checked' : ''}> ${esc(EN ? e : d)}</label>`;
    if (f.typ === 'radio') return `<fieldset class="field full" data-key="${key}"><legend>${lab}${req}</legend><div class="radios">${f.optionen.map(([v, d, e]) => opt(v, d, e, 'radio', id, f.standard === v)).join('')}</div><p class="err" id="${id}-err"></p></fieldset>`;
    if (f.typ === 'checkbox') return `<fieldset class="field full" data-key="${key}"><legend>${lab}</legend><div class="radios checks">${f.optionen.map(([v, d, e]) => opt(v, d, e, 'checkbox', id, false)).join('')}</div></fieldset>`;
    if (f.typ === 'select') return `<div class="field" data-key="${key}"><label for="${id}">${lab}</label><select id="${id}"><option value="">–</option>${f.optionen.map(([v, d, e]) => `<option value="${v}">${esc(EN ? e : d)}</option>`).join('')}</select></div>`;
    if (f.typ === 'date') return `<div class="field" data-key="${key}"><label for="${id}">${lab}</label><input id="${id}" type="date"></div>`;
    if (f.typ === 'dates') return `<div class="field full" data-key="${key}"><span class="label" id="${id}-label">${lab}</span><div class="dates" role="group" aria-labelledby="${id}-label">${Array.from({ length: f.anzahl || 3 }, (_, i) => `<input id="${id}-${i + 1}" type="date" min="${TODAY}" aria-label="${lab} ${i + 1}" aria-describedby="${id}-err">`).join('')}</div><p class="bk-hint">${esc(EN ? f.hinweis.en : f.hinweis.de)}</p><p class="err" id="${id}-err" aria-live="polite"></p></div>`;
    if (f.typ === 'text') return `<div class="field full" data-key="${key}"><label for="${id}">${lab}${req}</label><input id="${id}" placeholder="${esc((f.platzhalter || {})[EN ? 'en' : 'de'] || '')}"${f.pflicht ? ' required' : ''} aria-describedby="${id}-err"><p class="err" id="${id}-err"></p></div>`;
    if (f.typ === 'textarea') return `<div class="field full" data-key="${key}"><label for="${id}">${lab}${req}</label><textarea id="${id}" rows="4"${f.pflicht ? ' required' : ''} aria-describedby="${id}-err"></textarea><p class="err" id="${id}-err"></p></div>`;
    return '';
  };
  const HINTS = {
    termin_verschieben: T('Nennen Sie uns Ihren bisherigen Termin und wann es Ihnen besser passt.', 'Tell us your current appointment and when would suit you better.'),
    rueckruf: T('Wir rufen Sie zurück – Sie müssen nichts weiter ausfüllen.', 'We call you back – nothing else to fill in.'),
    energieberatung: T('Ihre Anfrage geben wir an Kessel & Ritters – Die Energieberater weiter.', 'We pass your request on to Kessel & Ritters – Die Energieberater.')
  };
  const renderDetails = () => {
    const s = svc(); if (!s) return;
    $('[data-details]').innerHTML = s.felder.map(fieldHtml).join('');
    $('[data-details-hint]').textContent = HINTS[s.id] || T('Alle Angaben sind unverbindlich. Die Wunschtage zeigen keine Verfügbarkeit – wir bestätigen den Termin persönlich.', 'All details are non-binding. Preferred days do not show availability – we confirm the appointment personally.');
    $$('[data-details] input, [data-details] select, [data-details] textarea').forEach(f => f.addEventListener(f.type === 'radio' || f.type === 'checkbox' ? 'change' : 'blur', () => checkDetail(f.closest('[data-key]'))));
  };
  const detailValue = key => {
    const box = $(`[data-details] [data-key="${key}"]`); if (!box) return '';
    const f = FIELDS[key];
    if (f.typ === 'radio') return box.querySelector('input:checked')?.value || '';
    if (f.typ === 'checkbox') return [...box.querySelectorAll('input:checked')].map(i => i.value).join(', ');
    if (f.typ === 'dates') return [...box.querySelectorAll('input')].map(i => i.value).filter(Boolean).join(', ');
    return (box.querySelector('input, select, textarea')?.value || '').trim();
  };
  const isWeekend = v => { const d = new Date(v + 'T12:00:00'); return [0, 6].includes(d.getDay()); };
  const checkDetail = box => {
    const key = box.dataset.key, f = FIELDS[key], err = box.querySelector('.err'); let m = '';
    if (f.typ === 'dates') { const bad = [...box.querySelectorAll('input')].filter(i => i.value && (i.value < TODAY || isWeekend(i.value))); if (bad.length) m = T('Bitte wählen Sie Montag bis Freitag ab heute oder lassen Sie das Feld frei.', 'Choose a weekday from today onwards, or leave the field blank.'); box.querySelectorAll('input').forEach(i => i.setAttribute('aria-invalid', bad.includes(i) ? 'true' : 'false')); }
    else if (f.pflicht && !detailValue(key)) { m = REQ; const first = box.querySelector('input, textarea'); first && first.setAttribute('aria-invalid', 'true'); }
    else box.querySelectorAll('[aria-invalid]').forEach(i => i.setAttribute('aria-invalid', 'false'));
    if (err) err.textContent = m; return !m;
  };
  const validDetails = () => { const boxes = $$('[data-details] [data-key]'); const bad = boxes.filter(b => !checkDetail(b)); if (bad.length) { (bad[0].querySelector('input, select, textarea') || bad[0]).focus(); return false; } return true; };

  const summaryText = () => {
    const s = svc(); if (!s) return T('Bitte wählen Sie ein Anliegen.', 'Please choose a request.');
    const parts = [L(s)];
    if (step >= 3) { const w = detailValue('wunschtage'), z = detailValue('zeit'), b = detailValue('bisheriger_termin'); if (b) parts.push(T('bisher: ', 'current: ') + b); if (w) parts.push(w); if (z && z !== 'egal') parts.push(optLabel('zeit', z)); }
    return parts.join(' · ');
  };
  const update = () => {
    $$('[data-step]').forEach(s => s.hidden = +s.dataset.step !== step);
    $$('[data-step-ind]').forEach(li => { const i = +li.dataset.stepInd; li.classList.toggle('done', i < step); li.classList.toggle('active', i === step); i === step ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current'); });
    $$('[data-service]').forEach(b => b.setAttribute('aria-checked', b.dataset.service === service));
    $('[data-back]').hidden = step === 1;
    $('.bk-foot').hidden = step === 4;
    dlg.classList.toggle('is-done', step === 4);
    $('[data-summary]').textContent = summaryText();
    $('[data-next]').disabled = step === 1 && !service;
    $('[data-next]').innerHTML = step === 3 ? T(PREVIEW ? 'Anfrage testen (ohne Versand)' : 'Unverbindlich anfragen', PREVIEW ? 'Test request (nothing sent)' : 'Send non-binding request') : T('Weiter', 'Continue') + ICON('arrow');
  };
  const go = n => { if (n === 2) renderDetails(); step = n; update(); $('.bk-body').scrollTop = 0; const h = $(`#bk-s${n}`); h.tabIndex = -1; if (dlg.open) h.focus({ preventScroll: true }); };
  const close = () => { if (sending) return; dlg.classList.remove('in'); dlg.close(); document.documentElement.classList.remove('bk-open'); lastFocus?.focus(); };
  const find = v => { if (!v) return null; const k = String(v).trim(); return SERVICES.find(s => s.id === k || s.de === k || s.en === k || (s.aliase || []).includes(k)); };
  const open = value => {
    lastFocus = document.activeElement;
    if (step === 4) { step = 1; service = null; $('.bk-form').reset(); $('[data-details]').innerHTML = ''; }
    const pre = find(value);
    if (pre) { service = pre.id; renderDetails(); step = 2; }
    $('.bk-expert').open = !!service && MORE.some(s => s.id === service);
    openedAt = Date.now(); update(); dlg.showModal(); document.documentElement.classList.add('bk-open'); dlg.classList.add('in');
  };
  fab.addEventListener('click', () => open());
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-bk-close]')) close(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-termin]'); if (!a || dlg.contains(a) || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); e.stopPropagation(); document.getElementById('menu')?.classList.remove('open');
    const burger = document.querySelector('.burger'); if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', T('Menü öffnen', 'Open menu')); burger.querySelector('use')?.setAttribute('href', '/assets/icons.svg#menu'); }
    open(a.dataset.termin);
  }, true);
  $$('[data-service]').forEach(b => b.addEventListener('click', () => { if (service !== b.dataset.service) { service = b.dataset.service; $('[data-details]').innerHTML = ''; } update(); }));
  $$('.bk-services').forEach(group => group.addEventListener('keydown', e => { const list = [...group.querySelectorAll('[data-service]')], i = list.indexOf(document.activeElement), d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d && i >= 0) { e.preventDefault(); const b = list[(i + d + list.length) % list.length]; b.focus(); b.click(); } }));

  /* Schritt 3: Kontakt */
  const check = f => {
    let m = ''; if (!f.checkValidity()) m = f.validity.typeMismatch ? T('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'Please enter a valid email address.') : REQ;
    if (f.required && f.type !== 'checkbox' && !f.value.trim()) m = REQ;
    if (f.type === 'tel' && f.value && !/^[+()\d\s\/-]{6,}$/.test(f.value)) m = T('Bitte geben Sie eine gültige Telefonnummer ein.', 'Please enter a valid phone number.');
    if (f.type === 'checkbox' && !f.checked) m = T('Bitte bestätigen Sie die Datenschutzhinweise.', 'Please confirm the privacy notice.');
    f.setAttribute('aria-invalid', m ? 'true' : 'false'); $(`#${f.id}-err`).textContent = m; return !m;
  };
  const fields = $$('.bk-form input:not([name="website"])');
  fields.forEach(f => f.addEventListener(f.type === 'checkbox' ? 'change' : 'blur', () => { if (f.value || f.getAttribute('aria-invalid') === 'true') check(f); }));
  $('[data-back]').addEventListener('click', () => go(step - 1));
  $('.bk-form').addEventListener('submit', e => { e.preventDefault(); $('[data-next]').click(); });
  $('[data-next]').addEventListener('click', async () => {
    if (sending) return;
    if (step === 1) { if (service) go(2); return; }
    if (step === 2) { if (validDetails()) go(3); return; }
    const bad = fields.filter(f => !check(f)); if (bad.length) { bad[0].focus(); return; }
    const s = svc(), fd = new FormData($('.bk-form'));
    if (fd.get('website')) return;
    const det = {}; s.felder.forEach(k => det[k] = detailValue(k));
    fd.set('art', 'Terminanfrage'); fd.set('sprache', EN ? 'en' : 'de'); fd.set('anliegen', s.id); fd.set('leistung', L(s));
    for (const k of Object.keys(det)) fd.set(k, det[k]);
    fd.set('wunschtermin', (det.wunschtage || '').split(', ')[0] || ''); fd.set('zeit', det.zeit || det.rueckruf_zeit || 'egal');
    if (det.frage) fd.set('nachricht', det.frage + (fd.get('nachricht') ? '\n\n' + fd.get('nachricht') : ''));
    fd.set('ts', String(Math.floor(openedAt / 1000)));
    const btn = $('[data-next]'); const error = $('[data-send-error]'); error.hidden = true;
    if (!PREVIEW && Date.now() - openedAt < 3000) { error.textContent = T('Bitte prüfen Sie Ihre Angaben kurz und senden Sie die Anfrage erneut.', 'Please review your details and send the request again.'); error.hidden = false; return; }
    sending = true; btn.disabled = true; btn.setAttribute('aria-busy', 'true');
    try {
      if (!PREVIEW) { const res = await fetch('/anfrage.php', { method: 'POST', body: fd, headers: { Accept: 'application/json' } }); if (!res.ok || (await res.json()).ok !== true) throw new Error('request failed'); }
      $('#bk-s4').textContent = PREVIEW ? T('Vorschau abgeschlossen', 'Preview complete') : T('Ihre Anfrage wurde gesendet', 'Your request has been sent');
      $('[data-done-lead]').textContent = PREVIEW ? demo : T('Vielen Dank! Wir melden uns zur Kostenklärung und stimmen Ihren Termin persönlich mit Ihnen ab. Es wurde noch kein Termin reserviert.', 'Thank you! We will clarify the cost and arrange the appointment with you personally. No appointment has been reserved yet.');
      const rows = [[T('Anliegen', 'Request'), L(s)]];
      if (det.bisheriger_termin) rows.push([T('Bisheriger Termin', 'Current appointment'), det.bisheriger_termin]);
      if (det.wunschtage) rows.push([T('Wunschtage', 'Preferred days'), det.wunschtage]);
      if (det.zeit) rows.push([T('Tageszeit', 'Time of day'), optLabel('zeit', det.zeit)]);
      if (det.rueckruf_zeit) rows.push([T('Rückruf', 'Call back'), optLabel('rueckruf_zeit', det.rueckruf_zeit)]);
      $('[data-receipt]').innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
      $('.bk-form').reset(); go(4);
    } catch (_) { error.textContent = T('Die Anfrage konnte nicht gesendet werden. Ihre Angaben bleiben erhalten. Bitte versuchen Sie es erneut oder rufen Sie 0221 – 7400 990 an.', 'The request could not be sent. Your details have been kept. Please try again or call +49 221 7400 990.'); error.hidden = false; error.scrollIntoView({ block: 'nearest' }); }
    finally { sending = false; btn.removeAttribute('aria-busy'); if (step !== 4) update(); }
  });
  const qs = new URLSearchParams(location.search);
  if (qs.has('buchen') || ['#termin-buchen', '#book'].includes(location.hash)) open(qs.get('anliegen') || qs.get('buchen') || '');
})();
