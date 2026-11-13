/* Keep the third-party widget in its own sandboxed document. */
(() => {
  const report = () => parent.postMessage({type:'ritters:reviews-height',height:Math.ceil(document.body.getBoundingClientRect().height)}, '*');
  new ResizeObserver(report).observe(document.body);
  addEventListener('load', report);
  document.querySelector('script[src="https://elfsightcdn.com/platform.js"]').addEventListener('error',()=>parent.postMessage({type:'ritters:reviews-error'}, '*'));
})();
