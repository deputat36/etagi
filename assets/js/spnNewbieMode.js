const NEWBIE_QUERY = 'офис новичку';

window.addEventListener('DOMContentLoaded', () => {
  observeMode();
  bindTemplateList();
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

function applyNewbieMode(){
  const isNewbie = document.body.dataset.spnUiMode === 'newbie';
  document.body.classList.toggle('spn-newbie-mode', isNewbie);
  if(!isNewbie) return;

  const search = document.getElementById('templateSearch');
  if(search && !isNewbieQuery(search.value)){
    search.value = NEWBIE_QUERY;
    search.dispatchEvent(new Event('input', { bubbles: true }));
    search.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const density = document.getElementById('templateDensityFilter');
  if(density && density.value !== 'all'){
    density.value = 'all';
    density.dispatchEvent(new Event('change', { bubbles: true }));
  }

  window.setTimeout(() => {
    markUnsafeCards();
    status('Режим новичка: показаны безопасные рекомендованные шаблоны.');
  }, 100);
}

function markUnsafeCards(){
  const isNewbie = document.body.dataset.spnUiMode === 'newbie';
  document.querySelectorAll('.tpl-card').forEach(card => {
    const text = card.textContent.toLowerCase().replace(/ё/g, 'е');
    const unsafe = text.includes('менеджер') || text.includes('пустой') || text.includes('с нуля') || text.includes('нестандартный');
    card.classList.toggle('spn-newbie-hidden-template', isNewbie && unsafe);
  });
}

function isNewbieQuery(value){
  const clean = String(value || '').toLowerCase().replace(/ё/g, 'е').trim();
  return clean.includes('офис') && clean.includes('новичку');
}

function status(text){
  const el = document.getElementById('statusLine');
  if(el) el.textContent = text;
}
