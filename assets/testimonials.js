/* Google-Bewertungen über Elfsight (Vorgabe Kilian, 25.11.: immer laden, ohne Einwilligung).
 * Geladen wird, sobald die Sektion in die Nähe des sichtbaren Bereichs kommt. Das Widget läuft in einem
 * eigenen Iframe-Dokument (/widgets/reviews.html) mit eigener strenger CSP. */
(() => {
  const box=document.querySelector('[data-testimonials]');if(!box)return;
  const EN=document.documentElement.lang.startsWith('en');
  const status=box.querySelector('[data-reviews-status]');
  const host=box.querySelector('[data-reviews-host]');
  const PROFILE='https://www.google.com/maps?cid=10133031009173695460';
  let frame=null;

  const load=()=>{
    if(frame)return;
    frame=document.createElement('iframe');frame.src='/widgets/reviews.html';
    frame.title=EN?'Google reviews via Elfsight':'Google-Bewertungen über Elfsight';
    frame.className='reviews-frame';
    /* allow-same-origin ist nötig (Freigabe Kilian, 25.11.): Ohne eigene Herkunft/Storage bricht Elfsights
       platform.js im Iframe still ab (leere weiße Fläche). Die Widget-Seite behält ihre eigene strenge CSP. */
    frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    frame.referrerPolicy='strict-origin-when-cross-origin';
    status.textContent=EN?'Loading customer reviews …':'Kundenbewertungen werden geladen …';
    frame.addEventListener('load',()=>status.textContent='');
    host.append(frame);
  };
  addEventListener('message',e=>{
    if(!frame||e.source!==frame.contentWindow)return;
    if(e.data?.type==='ritters:reviews-height'&&Number.isFinite(e.data.height))frame.style.height=Math.max(120,Math.min(7000,e.data.height))+'px';
    if(e.data?.type==='ritters:reviews-error'){
      frame.remove();
      status.innerHTML=(EN?'Reviews could not be loaded. ':'Die Bewertungen konnten nicht geladen werden. ')+
        `<a href="${PROFILE}" target="_blank" rel="noopener">${EN?'View all reviews on Google':'Alle Bewertungen auf Google ansehen'}<span class="sr-only"> ${EN?'(external website, new window)':'(externe Website, neues Fenster)'}</span></a>`;
    }
  });
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();load();}},{rootMargin:'600px'});
    io.observe(box);
  }else load();
})();
