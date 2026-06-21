document.addEventListener('DOMContentLoaded', () => {
  if(document.querySelector('link[href="assets/css/meta-compact.css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'assets/css/meta-compact.css';
  document.head.appendChild(link);
});
