/* Load the requested Elfsight widget only after reviews consent and near the
 * viewport. The iframe confines its scripts and styles to the review section. */
(() => {
  const box=document.querySelector('[data-testimonials]');if(!box)return;
  const EN=document.documentElement.lang.startsWith('en');
  const placeholder=box.querySelector('[data-reviews-placeholder]');
  const status=box.querySelector('[data-reviews-status]');

  /* Statischer Bewertungsblock aus /assets/data/bewertungen.json (selbst gehostet, ohne Drittanbieter).
   * Live-Domain: nur mit vollständigen echten Daten. Staging: Platzhalter, solange Daten fehlen. */
  const staticBox=box.querySelector('[data-reviews-static]');
  const LIVE=/^(www\.)?schornsteinfeger\.koeln$/.test(location.hostname);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v).toLocaleString(EN?'en-GB':'de-DE',{minimumFractionDigits:1,maximumFractionDigits:1});
  const date=v=>{const d=new Date(v);return isNaN(d)?'':d.toLocaleDateString(EN?'en-GB':'de-DE',{month:'long',year:'numeric'});};
  const stars=n=>'<span class="rv-stars" aria-hidden="true">'+'★'.repeat(Math.round(n||0))+'☆'.repeat(5-Math.round(n||0))+'</span>';
  const ph=t=>`<span class="ph">${t}</span>`;
  if(staticBox) fetch('/assets/data/bewertungen.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(d=>{
    if(!d)return;
    const list=(d.rezensionen||[]).filter(r=>r&&r.text&&r.name).slice(0,3);
    const complete=d.gesamtnote&&d.anzahl&&list.length>0;
    if(!complete&&(LIVE||!new URLSearchParams(location.search).has('platzhalter')))return;
    const link=d.profilUrl?`<a class="rv-all" href="${esc(d.profilUrl)}" target="_blank" rel="noopener">${EN?'All reviews on Google':'Alle Bewertungen auf Google'}<span class="sr-only"> ${EN?'(external website, new window)':'(externe Website, neues Fenster)'}</span></a>`:ph(EN?'[add link to Google profile]':'[Link zum Google-Profil ergänzen]');
    const head=complete
      ?`<p class="rv-score"><b>${num(d.gesamtnote)}</b>${stars(d.gesamtnote)}<span>${EN?`out of 5 · ${esc(d.anzahl)} reviews on ${esc(d.quelle||'Google')}`:`von 5 · ${esc(d.anzahl)} Bewertungen bei ${esc(d.quelle||'Google')}`}</span></p>`
      :`<p class="rv-score">${ph(EN?'[rating]':'[Gesamtnote]')} ${ph(EN?'[number of reviews]':'[Anzahl Bewertungen]')}</p>`;
    const cards=(complete?list:[0,1,2].map(()=>null)).map(r=>r
      ?`<figure class="rv-card">${stars(r.sterne)}<blockquote><p>${esc(r.text)}</p></blockquote><figcaption><b>${esc(r.name)}</b>${date(r.datum)?` · ${date(r.datum)}`:''} · ${esc(d.quelle||'Google')}</figcaption></figure>`
      :`<figure class="rv-card">${ph(EN?'[review text from Google, shortened if needed]':'[Rezension aus Google, ggf. gekürzt]')}<figcaption>${ph(EN?'[first name/initial · date · Google]':'[Vorname/Initial · Datum · Google]')}</figcaption></figure>`).join('');
    staticBox.innerHTML=head+`<div class="rv-grid">${cards}</div>`+link;
    staticBox.hidden=false;
  }).catch(()=>{});

  let near=false,frame=null;
  const sync=()=>{
    const consent=document.documentElement.dataset.consentReviews==='ja';
    if(!consent){frame?.remove();frame=null;placeholder.hidden=false;status.textContent='';return;}
    if(!near||frame)return;
    frame=document.createElement('iframe');frame.src='/widgets/reviews.html';
    frame.title=EN?'Google reviews via Elfsight':'Google-Bewertungen über Elfsight';
    frame.className='reviews-frame';frame.loading='lazy';
    frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');
    frame.referrerPolicy='strict-origin-when-cross-origin';
    placeholder.hidden=true;status.textContent=EN?'Loading customer reviews …':'Kundenbewertungen werden geladen …';
    frame.addEventListener('load',()=>status.textContent='');
    box.querySelector('[data-reviews-host]').append(frame);
  };
  addEventListener('message',e=>{
    if(!frame||e.source!==frame.contentWindow)return;
    if(e.data?.type==='ritters:reviews-height'&&Number.isFinite(e.data.height))frame.style.height=Math.max(120,Math.min(7000,e.data.height))+'px';
    if(e.data?.type==='ritters:reviews-error'){frame.remove();frame=null;placeholder.hidden=false;status.textContent=EN?'Reviews could not be loaded. Please try again.':'Die Bewertungen konnten nicht geladen werden. Bitte versuchen Sie es erneut.';}
  });
  addEventListener('sr:consent',sync);
  box.querySelector('[data-reviews-load]').addEventListener('click',()=>{near=true;sync();});
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){near=true;io.disconnect();sync();}},{rootMargin:'300px'});io.observe(box);}else{near=true;}
  sync();
})();
