const NEWBIE_QUERY = 'новичку';
const STYLE_ID = 'spnNewbieModeStyle';
let updateTimer = 0;

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  observeModeOnly();
  bindSoftGuards();
  scheduleNewbieModeUpdate();
});

function observeModeOnly(){
  new MutationObserver(scheduleNewbieModeUpdate).observe(document.body, {
    attributes: true,
    attributeFilter: ['data-spn-ui-mode']
  });
}

function bindSoftGuards(){
  ['click', 'input', 'change'].forEach(eventName => {
    document.addEventListener(eventName, scheduleNewbieModeUpdate);
  });
}

function scheduleNewbieModeUpdate(){
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(applyNewbieMode, 80);
}

function applyNewbieMode(){
  const isNewbie = document.body.dataset.spnUiMode === 'newbie';
  document.body.classList.toggle('spn-newbie-mode', isNewbie);
  markUnsafeFilters(isNewbie);
  markUnsafeCards(isNewbie);
  if(!isNewbie) return;

  guardNewbieSearch();
  resetDensityFilter();
  status('Режим новичка: показаны простые безопасные заготовки.');
}

function guardNewbieSearch(){
  const search = document.getElementById('templateSearch');
  if(!search) return;
  if(isSafeNewbieQuery(search.value)) return;
  search.value = NEWBIE_QUERY;
  search.dispatchEvent(new Event('input', { bubbles: true }));
  search.dispatchEvent(new Event('change', { bubbles: true }));
}

function resetDensityFilter(){
  const density = document.getElementById('templateDensityFilter');
  if(!density || density.value === 'all') return;
  density.value = 'all';
  density.dispatchEvent(new Event('change', { bubbles: true }));
}

function markUnsafeCards(isNewbie){
  document.querySelectorAll('.tpl-card').forEach(card => {
    const text = normalize(card.textContent);
    const unsafe = hasUnsafeText(text);
    card.classList.toggle('spn-newbie-hidden-template', Boolean(isNewbie && unsafe));
  });
}

function markUnsafeFilters(isNewbie){
  document.querySelectorAll('[data-office-query]').forEach(button => {
    const query = normalize(button.dataset.officeQuery || button.textContent);
    button.classList.toggle('spn-newbie-hidden-filter', Boolean(isNewbie && hasUnsafeText(query)));
  });
  document.querySelectorAll('[data-office-reset]').forEach(button => {
    button.classList.toggle('spn-newbie-hidden-filter', Boolean(isNewbie));
  });
}

function hasUnsafeText(text){
  return text.includes('менеджер') || text.includes('пустой') || text.includes('с нуля') || text.includes('нестандартный');
}

function isSafeNewbieQuery(value){
  const clean = normalize(value);
  if(!clean) return false;
  if(hasUnsafeText(clean)) return false;
  return clean.includes('новичку') || clean.includes('рекомендовано') || clean.includes('подъезд') || clean.includes('теллерманов сад') || clean.includes('доверие') || clean.includes('новостройка');
}

function normalize(value){
  return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
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
