const STYLE_ID = 'spnNewbieEmptyStateStyle';
const EMPTY_ID = 'spnNewbieEmptyState';
let updateTimer = 0;

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  bindEmptyState();
  scheduleEmptyStateUpdate();
});

function bindEmptyState(){
  ['click', 'input', 'change'].forEach(eventName => {
    document.addEventListener(eventName, scheduleEmptyStateUpdate);
  });

  document.addEventListener('click', event => {
    const mode = event.target.closest('[data-newbie-empty-mode]');
    const search = event.target.closest('[data-newbie-empty-search]');
    if(mode) switchMode(mode.dataset.newbieEmptyMode);
    if(search) applySearch(search.dataset.newbieEmptySearch);
  });
}

function scheduleEmptyStateUpdate(){
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(updateEmptyState, 120);
}

function updateEmptyState(){
  const list = document.getElementById('templateList');
  if(!list) return;

  const isNewbie = document.body.dataset.spnUiMode === 'newbie';
  const cards = [...list.querySelectorAll('.tpl-card')];
  const visibleCards = cards.filter(card => getComputedStyle(card).display !== 'none');
  const shouldShow = isNewbie && cards.length > 0 && visibleCards.length === 0;

  let box = document.getElementById(EMPTY_ID);
  if(!shouldShow){
    box?.remove();
    return;
  }

  if(!box){
    list.insertAdjacentHTML('afterbegin', renderEmptyState());
  }
}

function renderEmptyState(){
  return `<div class="spn-newbie-empty-state" id="${EMPTY_ID}">
    <b>Безопасных заготовок не найдено</b>
    <span>В режиме новичка скрыты пустые, нестандартные и менеджерские макеты. Можно вернуться к безопасному фильтру или открыть больше вариантов.</span>
    <div>
      <button type="button" data-newbie-empty-search="новичку">Показать новичку</button>
      <button type="button" data-newbie-empty-search="рекомендовано">Рекомендовано</button>
      <button type="button" data-newbie-empty-mode="quick">Открыть больше</button>
    </div>
  </div>`;
}

function applySearch(query){
  const search = document.getElementById('templateSearch');
  if(!search) return;
  search.value = query;
  search.dispatchEvent(new Event('input', { bubbles: true }));
  search.dispatchEvent(new Event('change', { bubbles: true }));
}

function switchMode(mode){
  const button = document.querySelector(`[data-spn-ui-mode="${mode}"]`);
  button?.click();
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-newbie-empty-state{display:grid;gap:7px;margin:8px 0;padding:11px;border:1px solid #fed7aa;border-radius:14px;background:#fff7ed;color:#9a3412}
    .spn-newbie-empty-state b{font-size:12px;line-height:1.15;font-weight:900;color:#c2410c}
    .spn-newbie-empty-state span{font-size:11px;line-height:1.3;font-weight:750;color:#9a3412}
    .spn-newbie-empty-state div{display:flex;flex-wrap:wrap;gap:6px}
    .spn-newbie-empty-state button{padding:7px 9px;border:1px solid #fed7aa;border-radius:10px;background:#fff;color:#c2410c;font-size:11px;font-weight:900;box-shadow:none}
    .spn-newbie-empty-state button:hover{transform:none;box-shadow:0 7px 16px rgba(15,23,42,.08)}
    @media print{.spn-newbie-empty-state{display:none!important}}
  `;
  document.head.appendChild(style);
}
