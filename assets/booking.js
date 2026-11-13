/* Guided, non-binding appointment request. Uses the existing PHP handler on
 * production; preview hosts never send data. No calendar availability is claimed. */
(() => {
  const EN = document.documentElement.lang.startsWith('en');
  const T = (de, en) => EN ? en : de;
  const ICON = id => `<svg class="ic" aria-hidden="true"><use href="/assets/icons.svg#${id}"/></svg>`;
  const HOME = EN ? '/en/' : '/';
  const PREVIEW = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /(^|\.)(vercel\.app|meindigitalerbetrieb\.de)$/.test(location.hostname);
  const SERVICES = [
    {id:'bescheid', name:T('Arbeiten laut Feuerstättenbescheid','Work listed in my notice'), note:T('Wir klären, welche Arbeiten anstehen.','We help identify which work is due.'), icon:'s-clip'},
    {id:'ofen', name:T('Neuer Kaminofen / Abnahme','New stove / acceptance inspection'), note:T('Anschluss und nächste Schritte besprechen.','Discuss installation and next steps.'), icon:'s-flame'},
    {id:'brandschutz', name:T('Brandschutz & Rauchwarnmelder','Fire safety & smoke alarms'), note:T('Montage, Prüfung oder Wartung.','Fitting, inspection or maintenance.'), icon:'s-alarm'},
    {id:'energie', name:T('Energieberatung','Energy consulting'), note:T('Einsparpotenziale und Förderung besprechen.','Discuss potential savings and subsidies.'), icon:'s-leaf'},
    {id:'klaerung', name:T('Ich bin unsicher / Beratung','I’m not sure / advice'), note:T('Philipp hilft bei der passenden Auswahl.','Philipp helps you choose the right service.'), icon:'msg'},
    {id:'arbeiten', name:T('Schornsteinfegerarbeiten','Chimney sweeping'), note:T('Kehren & Überprüfen','Sweeping & inspection'), icon:'s-flame'},
    {id:'schau', name:T('Feuerstättenschau','Fireplace inspection'), note:T('Alle Feuerstätten im Gebäude','All heating appliances in the building'), icon:'s-clip'},
    {id:'messung', name:T('Prüfungen & Messungen','Inspections & measurements'), note:T('Abgasweg, CO, Emissionen','Flue, CO, emissions'), icon:'s-gauge'},
    {id:'reinigung', name:T('Reinigung','Cleaning'), note:T('Kaminofen, Ofen, Lüftung','Wood stove, stove, ventilation'), icon:'s-brush'}
  ];
  const COST = T('Die Kosten hängen von Anlage, Anzahl der Feuerstätten und Aufwand ab. Mit dieser Anfrage beauftragen Sie keine kostenpflichtige Leistung. Wir klären den Leistungsumfang und nennen Ihnen den Preis vor Ihrer Beauftragung.', 'The cost depends on your system, number of appliances and the work involved. This request does not place a paid order. We clarify the scope and price before you commit.');
  const demo = T('Vorschau: Hier wird nichts versendet und kein Termin reserviert. Für eine echte Anfrage rufen Sie bitte 0221 – 7400 990 an.', 'Preview: nothing is sent and no appointment is reserved. For a real request, please call +49 221 7400 990.');
  const dlg = document.createElement('dialog');
  dlg.className = 'booking';
  dlg.setAttribute('aria-labelledby', 'bk-title');
  const choices = (list, label) => `<div class="bk-services" role="radiogroup" aria-label="${label}">${list.map(s => `<button type="button" class="bk-service" role="radio" aria-checked="false" data-service="${s.id}">${ICON(s.icon)}<span><b>${s.name}</b><small>${s.note}</small></span></button>`).join('')}</div>`;
  dlg.innerHTML = `<div class="bk-head"><div class="bk-head-top"><div class="bk-person"><img src="/assets/schornsteinfegermeister-philipp-ritters-koeln.jpg" alt="" width="48" height="48"><div><h2 id="bk-title">${T('Termin anfragen','Request appointment')}</h2><p>${T('bei Schornsteinfegermeister Philipp Ritters','with master chimney sweep Philipp Ritters')}</p></div></div><button type="button" class="bk-close" data-bk-close aria-label="${T('Terminanfrage schließen','Close appointment request')}">${ICON('close')}</button></div><ol class="bk-progress" aria-label="${T('Fortschritt','Progress')}"><li data-step-ind="1">${T('Anliegen','Request')}</li><li data-step-ind="2">${T('Wunschtermin','Preferred date')}</li><li data-step-ind="3">${T('Ihre Daten','Your details')}</li></ol></div>
  <div class="bk-body">
    ${PREVIEW ? `<p class="bk-notice">${demo}</p>` : ''}
    <section class="bk-step" data-step="1" aria-labelledby="bk-s1"><h3 class="bk-h" id="bk-s1">${T('Was steht bei Ihnen an?','What can we help you with?')}</h3><p class="bk-hint">${T('Wählen Sie Ihr Anliegen. Sie müssen die Fachbegriffe nicht kennen.','Choose your situation. No technical knowledge needed.')}</p>${choices(SERVICES.slice(0,5),T('Ihr Anliegen','Your situation'))}<details class="bk-expert"><summary>${T('Ich kenne die gewünschte Leistung','I know which service I need')}</summary>${choices(SERVICES.slice(5),T('Weitere Leistungen','More services'))}</details><div class="bk-cost"><h4>${T('Kosten vorab klären','Clarify the cost first')}</h4><p>${COST}</p></div></section>
    <section class="bk-step" data-step="2" aria-labelledby="bk-s2" hidden><h3 class="bk-h" id="bk-s2">${T('Wann passt es Ihnen?','When would suit you?')}</h3><p>${T('Wählen Sie einen Wunschtermin. Die Auswahl zeigt keine Kalenderverfügbarkeit. Wir prüfen die Planung und bestätigen den Termin persönlich.','Choose a preferred date. This does not show calendar availability. We check our schedule and confirm the appointment personally.')}</p><div class="field bk-date-field"><label for="bk-date">${T('Wunschdatum (optional)','Preferred date (optional)')}</label><input id="bk-date" type="date" aria-describedby="bk-date-hint bk-date-err"><p class="bk-hint" id="bk-date-hint">${T('Montag bis Freitag. Ohne Datum stimmen wir einen Termin mit Ihnen ab.','Monday to Friday. Leave blank to arrange a date with us.')}</p><p class="err" id="bk-date-err" aria-live="polite"></p></div><fieldset class="field"><legend>${T('Bevorzugte Tageszeit','Preferred time of day')}</legend><div class="radios"><label><input type="radio" name="bk-time" value="egal" checked>${T('Flexibel','Flexible')}</label><label><input type="radio" name="bk-time" value="vormittags">${T('Vormittags','Morning')}</label><label><input type="radio" name="bk-time" value="nachmittags">${T('Nachmittags','Afternoon')}</label></div></fieldset></section>
    <section class="bk-step" data-step="3" aria-labelledby="bk-s3" hidden><h3 class="bk-h" id="bk-s3">${T('Wie erreichen wir Sie?','How can we reach you?')}</h3><div class="bk-cost"><h4>${T('Ihre Anfrage ist unverbindlich','Your request is non-binding')}</h4><p>${COST}</p></div><form class="bk-form" novalidate><div class="hp" aria-hidden="true"><label for="bk-website">Website</label><input id="bk-website" name="website" tabindex="-1" autocomplete="off"></div>
    <div class="field full"><label for="bk-name">Name *</label><input id="bk-name" name="name" required autocomplete="name" aria-describedby="bk-name-err"><p class="err" id="bk-name-err"></p></div>
    <div class="field"><label for="bk-tel">${T('Telefon','Phone')} *</label><input id="bk-tel" name="telefon" type="tel" required autocomplete="tel" inputmode="tel" aria-describedby="bk-tel-err"><p class="err" id="bk-tel-err"></p></div>
    <div class="field"><label for="bk-mail">${T('E-Mail (optional)','Email (optional)')}</label><input id="bk-mail" name="email" type="email" autocomplete="email" aria-describedby="bk-mail-err"><p class="err" id="bk-mail-err"></p></div>
    <div class="field full"><label for="bk-adr">${T('Adresse des Objekts','Property address')} *</label><input id="bk-adr" name="adresse" required autocomplete="street-address" placeholder="${T('Straße, Hausnummer, PLZ, Ort','Street, number, postcode, town')}" aria-describedby="bk-adr-err"><p class="err" id="bk-adr-err"></p></div>
    <div class="field full"><label for="bk-note">${T('Hinweise (optional)','Notes (optional)')}</label><textarea id="bk-note" name="nachricht" rows="3" placeholder="${T('z. B. Art und Anzahl der Feuerstätten, Frist im Bescheid oder Fragen zum Preis','e.g. appliance type and number, deadline in your notice or questions about cost')}"></textarea></div>
    <div class="field full"><label class="checkbox"><input type="checkbox" id="bk-ds" name="datenschutz" value="ja" required aria-describedby="bk-ds-err"><span>${T('Ich habe die','I have read the')} <a href="${EN ? '/en/privacy#forms' : '/datenschutz#formulare'}" target="_blank" rel="noopener">${T('Datenschutzerklärung','privacy policy')}</a> ${T('zur Kenntnis genommen und bin mit der Verarbeitung meiner Angaben zur Bearbeitung dieser Anfrage einverstanden.','and agree to my details being processed to handle this request.')} *</span></label><p class="err" id="bk-ds-err"></p></div><p class="privacy full">${T('Pflichtfelder sind mit * markiert. Wir melden uns zur Kostenklärung und Terminbestätigung.','Required fields are marked *. We will get in touch to clarify the cost and confirm a date.')}</p><p class="bk-warn full" data-send-error role="alert" hidden></p></form></section>
    <section class="bk-step bk-done" data-step="4" aria-labelledby="bk-s4" hidden tabindex="-1"><h3 id="bk-s4"></h3><p data-done-lead></p><dl class="bk-receipt" data-receipt></dl><button type="button" class="btn btn-gold" data-bk-close>${T('Schließen','Close')}</button></section>
  </div><div class="bk-foot"><div class="bk-summary" data-summary aria-live="polite"></div><div class="bk-foot-actions"><button type="button" class="btn btn-outline btn-sm bk-back" data-back hidden>${T('Zurück','Back')}</button><button type="button" class="btn btn-gold bk-cta" data-next disabled>${T('Weiter','Continue')}${ICON('arrow')}</button></div><p class="bk-alt">${T('Lieber persönlich?','Prefer to speak to us?')} <a href="tel:+492217400990">${T('0221 – 7400 990','+49 221 7400 990')}</a></p></div>`;
  const fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'book-fab'; fab.setAttribute('aria-haspopup','dialog');
  fab.innerHTML = `<span class="book-fab-tab">${ICON('cal')}<span class="book-fab-label">${T('Termin anfragen','Request appointment')}</span></span>`;
  document.body.append(fab,dlg);
  const $ = s => dlg.querySelector(s), $$ = s => [...dlg.querySelectorAll(s)];
  const localDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  $('#bk-date').min = localDate(new Date());
  let step=1, service=null, lastFocus=null, sending=false, openedAt=0;
  const svc = () => SERVICES.find(s => s.id === service);
  const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const update = () => {
    $$('[data-step]').forEach(s=>s.hidden=+s.dataset.step!==step);
    $$('[data-step-ind]').forEach(li=>{const i=+li.dataset.stepInd;li.classList.toggle('done',i<step);li.classList.toggle('active',i===step);i===step?li.setAttribute('aria-current','step'):li.removeAttribute('aria-current');});
    $$('[data-service]').forEach(b=>b.setAttribute('aria-checked',b.dataset.service===service));
    $('[data-back]').hidden=step===1;
    $('.bk-foot').hidden=step===4;
    dlg.classList.toggle('is-done',step===4);
    $('[data-summary]').textContent=svc()?svc().name+(step===3?' · '+($('#bk-date').value||T('Datum flexibel','Flexible date'))+' · '+$('[name="bk-time"]:checked').parentElement.textContent:''):T('Bitte wählen Sie ein Anliegen.','Please choose a request.');
    $('[data-next]').disabled=step===1&&!service;
    $('[data-next]').innerHTML=step===3 ? T(PREVIEW?'Anfrage testen (ohne Versand)':'Unverbindlich anfragen',PREVIEW?'Test request (nothing sent)':'Send non-binding request') : T('Weiter','Continue')+ICON('arrow');
  };
  const go = n => {step=n;update();$('.bk-body').scrollTop=0;const h=$(`#bk-s${n}`);h.tabIndex=-1;if(dlg.open)h.focus({preventScroll:true});};
  const close = () => {if(sending)return;dlg.classList.remove('in');dlg.close();document.documentElement.classList.remove('bk-open');lastFocus?.focus();};
  const open = value => {
    lastFocus=document.activeElement;
    if(step===4){step=1;service=null;$('.bk-form').reset();$('#bk-date').value='';$$('[name="bk-time"]')[0].checked=true;}
    const pre=SERVICES.find(s=>s.id===value||s.name===value);
    if(pre){service=pre.id;step=2;}
    // Keep all service options discoverable when returning from a preselected page.
    $('.bk-expert').open=!!service&&SERVICES.slice(5).some(s=>s.id===service);
    openedAt=Date.now();update();dlg.showModal();document.documentElement.classList.add('bk-open');dlg.classList.add('in');
  };
  fab.addEventListener('click',()=>open());
  dlg.addEventListener('cancel',e=>{e.preventDefault();close();});
  dlg.addEventListener('click',e=>{if(e.target===dlg||e.target.closest('[data-bk-close]'))close();});
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-termin]');if(!a||dlg.contains(a)||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    e.preventDefault();e.stopPropagation();document.getElementById('menu')?.classList.remove('open');
    const burger=document.querySelector('.burger');if(burger){burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label',T('Menü öffnen','Open menu'));burger.querySelector('use')?.setAttribute('href','/assets/icons.svg#menu');}
    open(a.dataset.termin);
  },true);
  $$('[data-service]').forEach(b=>b.addEventListener('click',()=>{service=b.dataset.service;update();}));
  $$('.bk-services').forEach(group=>group.addEventListener('keydown',e=>{const list=[...group.querySelectorAll('[data-service]')],i=list.indexOf(document.activeElement),d={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];if(d&&i>=0){e.preventDefault();const b=list[(i+d+list.length)%list.length];b.focus();b.click();}}));
  const validDate = () => {
    const f=$('#bk-date'),d=new Date(f.value+'T12:00:00');
    const bad=!f.checkValidity()||(f.value&&[0,6].includes(d.getDay()));
    $('#bk-date-err').textContent=bad?T('Bitte wählen Sie Montag bis Freitag ab heute oder lassen Sie das Datum offen.','Choose a weekday from today onwards, or leave the date blank.'):'';
    f.setAttribute('aria-invalid',bad?'true':'false');return !bad;
  };
  $('#bk-date').addEventListener('change',validDate);
  const check = f => {
    let m='';if(!f.checkValidity())m=f.validity.typeMismatch?T('Bitte geben Sie eine gültige E-Mail-Adresse ein.','Please enter a valid email address.'):T('Bitte füllen Sie dieses Feld aus.','Please fill in this field.');
    if(f.required&&f.type!=='checkbox'&&!f.value.trim())m=T('Bitte füllen Sie dieses Feld aus.','Please fill in this field.');
    if(f.type==='tel'&&f.value&&!/^[+()\d\s\/-]{6,}$/.test(f.value))m=T('Bitte geben Sie eine gültige Telefonnummer ein.','Please enter a valid phone number.');
    if(f.type==='checkbox'&&!f.checked)m=T('Bitte bestätigen Sie die Datenschutzhinweise.','Please confirm the privacy notice.');
    f.setAttribute('aria-invalid',m?'true':'false');$(`#${f.id}-err`).textContent=m;return !m;
  };
  const fields=$$('.bk-form input:not([name="website"])');
  fields.forEach(f=>f.addEventListener(f.type==='checkbox'?'change':'blur',()=>{if(f.value||f.getAttribute('aria-invalid')==='true')check(f);}));
  $('[data-back]').addEventListener('click',()=>go(step-1));
  $('.bk-form').addEventListener('submit',e=>{e.preventDefault();$('[data-next]').click();});
  $('[data-next]').addEventListener('click',async()=>{
    if(sending)return;
    if(step===1){if(service)go(2);return;}
    if(step===2){if(validDate())go(3);else $('#bk-date').focus();return;}
    const bad=fields.filter(f=>!check(f));if(bad.length){bad[0].focus();return;}
    const fd=new FormData($('.bk-form'));
    if(fd.get('website'))return;
    fd.set('art','Terminanfrage');fd.set('sprache',EN?'en':'de');fd.set('leistung',svc().name);fd.set('wunschtermin',$('#bk-date').value);fd.set('zeit',$('[name="bk-time"]:checked').value);fd.set('ts',String(Math.floor(openedAt/1000)));
    const btn=$('[data-next]');const error=$('[data-send-error]');error.hidden=true;
    if(!PREVIEW&&Date.now()-openedAt<3000){error.textContent=T('Bitte prüfen Sie Ihre Angaben kurz und senden Sie die Anfrage erneut.','Please review your details and send the request again.');error.hidden=false;return;}
    sending=true;btn.disabled=true;btn.setAttribute('aria-busy','true');
    try{
      if(!PREVIEW){const res=await fetch('/anfrage.php',{method:'POST',body:fd,headers:{Accept:'application/json'}});if(!res.ok||(await res.json()).ok!==true)throw new Error('request failed');}
      $('#bk-s4').textContent=PREVIEW?T('Vorschau abgeschlossen','Preview complete'):T('Ihre Anfrage wurde gesendet','Your request has been sent');
      $('[data-done-lead]').textContent=PREVIEW?demo:T('Vielen Dank! Wir melden uns zur Kostenklärung und stimmen Ihren Termin persönlich mit Ihnen ab. Es wurde noch kein Termin reserviert.','Thank you! We will clarify the cost and arrange the appointment with you personally. No appointment has been reserved yet.');
      $('[data-receipt]').innerHTML=`<dt>${T('Anliegen','Request')}</dt><dd>${esc(svc().name)}</dd><dt>${T('Wunschdatum','Preferred date')}</dt><dd>${esc($('#bk-date').value||T('Flexibel','Flexible'))}</dd><dt>${T('Tageszeit','Time of day')}</dt><dd>${esc($('[name="bk-time"]:checked').parentElement.textContent)}</dd>`;
      $('.bk-form').reset();go(4);
    }catch(_){error.textContent=T('Die Anfrage konnte nicht gesendet werden. Ihre Angaben bleiben erhalten. Bitte versuchen Sie es erneut oder rufen Sie 0221 – 7400 990 an.','The request could not be sent. Your details have been kept. Please try again or call +49 221 7400 990.');error.hidden=false;error.scrollIntoView({block:'nearest'});}
    finally{sending=false;btn.removeAttribute('aria-busy');if(step!==4)update();}
  });
  if(new URLSearchParams(location.search).has('buchen')||['#termin-buchen','#book'].includes(location.hash))open();
})();
