/* Keep the third-party widget in its own sandboxed document and report its full height to the parent. */
(() => {
  const height = () => Math.ceil(Math.max(document.body.scrollHeight, document.body.getBoundingClientRect().height));
  let last = -1;
  const report = () => { const h = height(); if (h === last) return; last = h; parent.postMessage({type:'ritters:reviews-height',height:h}, '*'); };
  const ro = new ResizeObserver(report);
  ro.observe(document.body);
  addEventListener('load', report);
  document.querySelector('script[src="https://elfsightcdn.com/platform.js"]').addEventListener('error',()=>parent.postMessage({type:'ritters:reviews-error'}, '*'));
})();
