/* Load the requested Elfsight widget only after reviews consent and near the
 * viewport. The iframe confines its scripts and styles to the review section. */
(() => {
  const box=document.querySelector('[data-testimonials]');if(!box)return;
  const EN=document.documentElement.lang.startsWith('en');
  const placeholder=box.querySelector('[data-reviews-placeholder]');
  const status=box.querySelector('[data-reviews-status]');
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
