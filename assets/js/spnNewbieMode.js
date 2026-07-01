const NEWBIE_QUERY = 'офис новичку';
const STYLE_ID = 'spnNewbieModeStyle';

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  observeMode();
  bindTemplateList();
  bindSearchGuard();
  bindFilterGuard();
  applyNewbieMode();
});

function observeMode(){
  new MutationObserver(applyNewbieMode).observe(document.body, {
    attributes: true,
    attributeFilter: ['data-spn-ui-mode']
  });
}

function bindTemplateList(){
  const list = document.getElementById('templateList');
  if(!list) return;
  new MutationObserver(markUnsafeCards).observe(list, { childList: true, subtree: true });
}

function bindSearchGuard(){
  const search = document.getElementById('templateSearch');
  if(!search) return;
  ['input', 'change'].forEach(eventName => {
    search.addEventListener(eventName, () => window.setTimeout(guardNewbieSearch, 120));
  });
}

function bindFilterGuard(){
  const filters = document.getElementById('spnOfficeTemplateFilters');
  if(!filters) return;
  new MutationObserver(markUnsafeFilters).observe(filters, { childList: true, subtree: true });
  filters.addEventListener('click', () => window.setTimeout(() => {
    markUnsafeFilters();
    guardNewbieSearch();
  }, 80));
}

function applyNewbieMode(){
  const isNewbie = document.body.dataset.spnUiMode === 'newbie';
  document.body.classList.toggle('spn-newbie-mode', isNewbie);
  markUnsafeFilters();
  markUnsafeCards();
  if(!isNewbie) return;

  guardNewbieSearch();

  const density = document.getElementById('templateDensityFilter');
  if(density && density.value !== 'all'){
    density.value = 'all';
    density.dispatchEvent(new Event('change', { bubbles: true }));
  }

  window.setTimeout(() => {
    markUnsafeFilters();
    markUnsafeCards();
    status('Режим новичка: показаны безопасные рекомендованные шаблоны.');
  }, 100);
}

function guardNewbieSearch(){
  if(document.body.dataset.spnUiMode !== 'newbie') return;
  const search = document.getElementById('templateSearch');
  if(!search) return;
  if(isSafeNewbieQuery(search.value)) return;
  search.value = NEWBIE_QUERY;
  search.dispatchEvent(new Event('input', { bubbles: true }));
  search.dispatchEvent(new Event('change', { bubbles: true }));
}

function markUnsafeCards(){
  const isNewbie = document.body.dataset.spnUiMode === 'newbie';
  document.querySelectorAll('.tpl-card').forEach(card => {
    const text = normalize(card.textContent);
    const unsafe = text.includes('менеджер') || text.includes('пустой') || text.includes('с нуля') || text.includes('нестандартный');
    card.classList.toggle('spn-newbie-hidden-template', isNewbie && unsafe);
  });
}

function markUnsafeFilters(){
  const isNewbie = document.body.dataset.spnUiMode === 'newbie';
  document.querySelectorAll('[data-office-query]').forEach(button => {
    const query = normalize(button.dataset.officeQuery || button.textContent);
    const unsafe = query.includes('менеджер') || query.includes('пустой') || query.includes('с нуля') || query.includes('нестандартный');
    button.classList.toggle('spn-newbie-hidden-filter', isNewbie && unsafe);
  });
  document.querySelectorAll('[data-office-reset]').forEach(button => {
    button.classList.toggle('spn-newbie-hidden-filter', isNewbie);
  });
}

function isSafeNewbieQuery(value){
  const clean = normalize(value);
  if(!clean) return false;
  if(clean.includes('менеджер') || clean.includes('пустой') || clean.includes('с нуля') || clean.includes('нестандартный')) return false;
  return clean.includes('новичку') || clean.includes('рекомендовано') || clean.includes('подъезд') || clean.includes('теллерманов сад') || clean.includes('доверие') || clean.includes('новостройка');
}

function normalize(value){
  return String(value || '').toLowerCase().replace(/ё/g, 'е').trim();
}

function status(text){
  const el = document.getElementById('statusLine');
  if(el) el.textContent = text;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    body[data-spn-ui-mode="newbie"] .spn-newbie-hidden-filter,
    body[data-spn-ui-mode="newbie"] .spn-newbie-hidden-template{display:none!important}
  `;
  document.head.appendChild(style);
}
