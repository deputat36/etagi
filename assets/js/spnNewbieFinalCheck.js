const STYLE_ID = 'spnNewbieFinalCheckStyle';

const finalActions = [
  { id: 'quality', title: 'Проверить макет', hint: 'Нажмите проверку и исправьте красные замечания', target: '#qualityBtn' },
  { id: 'phone', title: 'Проверить телефон', hint: 'Сверьте номер до печати', target: '#agentPhone' },
  { id: 'count', title: '2 на А4', hint: 'Самый частый формат для расклейки', target: '[data-count="2"]' },
  { id: 'cut', title: 'Линии реза', hint: 'Удобно разрезать лист после печати', target: '#showCutLines' },
  { id: 'print', title: 'Печать / PDF', hint: 'Печатайте только после проверки', target: '#printBtn' }
];

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  renderFinalCheck();
  bindFinalCheck();
  updateFinalCheck();
});

function renderFinalCheck(){
  const anchor = document.querySelector('.quality-card .step-title') || document.querySelector('.quality-card');
  if(!anchor || document.getElementById('spnNewbieFinalCheck')) return;
  anchor.insertAdjacentHTML('afterend', `<div class="spn-newbie-final-check" id="spnNewbieFinalCheck">
    <div class="spn-newbie-final-head">
      <div>
        <b>Перед печатью</b>
        <span id="spnNewbieFinalProgress">Проверьте макет по короткому списку.</span>
      </div>
      <button type="button" id="spnNewbieFinalNext">Следующее</button>
    </div>
    <div class="spn-newbie-final-items" id="spnNewbieFinalItems"></div>
  </div>`);
}

function bindFinalCheck(){
  document.getElementById('spnNewbieFinalCheck')?.addEventListener('click', event => {
    const item = event.target.closest('[data-final-target]');
    const next = event.target.closest('#spnNewbieFinalNext');
    if(item) goToTarget(item.dataset.finalTarget);
    if(next) goToNextTodo();
  });

  ['input', 'change', 'click'].forEach(eventName => {
    document.addEventListener(eventName, () => window.setTimeout(updateFinalCheck, 90));
  });
}

function updateFinalCheck(){
  const box = document.getElementById('spnNewbieFinalItems');
  const progress = document.getElementById('spnNewbieFinalProgress');
  if(!box || !progress) return;
  const items = getItems();
  const done = items.filter(item => item.ok).length;
  progress.textContent = `${done}/${items.length} пунктов готово`;
  box.innerHTML = items.map(item => `<button type="button" class="${item.ok ? 'done' : 'todo'}" data-final-target="${item.target}">
    <span>${item.ok ? '✓' : '•'} ${item.title}</span>
    <small>${item.ok ? 'готово' : item.hint}</small>
  </button>`).join('');
}

function getItems(){
  const quality = Number(String(document.getElementById('qualityScore')?.textContent || '').replace(/\D/g, '')) || 0;
  const phone = Boolean(String(document.getElementById('agentPhone')?.value || '').trim());
  const countTwo = Boolean(document.querySelector('[data-count="2"].active'));
  const cutLines = Boolean(document.getElementById('showCutLines')?.checked);
  const printReady = quality >= 70 && phone && countTwo;
  const state = { quality: quality >= 70, phone, count: countTwo, cut: cutLines, print: printReady };
  return finalActions.map(item => ({ ...item, ok: Boolean(state[item.id]) }));
}

function goToNextTodo(){
  const next = getItems().find(item => !item.ok) || finalActions.at(-1);
  goToTarget(next.target);
}

function goToTarget(selector){
  const target = document.querySelector(selector);
  if(!target) return;
  if(target.matches('button')) target.click();
  if(target.matches('input[type="checkbox"]') && !target.checked){
    target.checked = true;
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.focus?.();
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-newbie-final-check{display:none;margin:0 0 11px;padding:10px;border:1px solid #bfdbfe;border-radius:15px;background:#eff6ff}
    body[data-spn-ui-mode="newbie"] .spn-newbie-final-check{display:block}
    .spn-newbie-final-head{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-bottom:8px}
    .spn-newbie-final-head b{display:block;font-size:12px;font-weight:900;color:#111827}
    .spn-newbie-final-head span{display:block;margin-top:3px;font-size:11px;line-height:1.2;color:#1d4ed8;font-weight:800}
    .spn-newbie-final-head button{padding:7px 9px;border:1px solid #bfdbfe;border-radius:10px;background:#fff;color:#1d4ed8;font-size:11px;font-weight:900;box-shadow:none}
    .spn-newbie-final-items{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .spn-newbie-final-items button{padding:8px;text-align:left;border:1px solid #dbeafe;border-radius:12px;background:#fff;color:#334155;box-shadow:none}
    .spn-newbie-final-items button:hover{transform:none;box-shadow:0 7px 16px rgba(15,23,42,.08)}
    .spn-newbie-final-items button.done{border-color:#86efac;background:#ecfdf5;color:#047857}
    .spn-newbie-final-items button.todo{border-color:#fed7aa;background:#fff7ed;color:#c2410c}
    .spn-newbie-final-items span{display:block;font-size:11px;line-height:1.1;font-weight:900}
    .spn-newbie-final-items small{display:block;margin-top:4px;font-size:10px;line-height:1.15;font-weight:700;opacity:.75}
    @media(max-width:520px){.spn-newbie-final-head,.spn-newbie-final-items{grid-template-columns:1fr}}
    @media print{.spn-newbie-final-check{display:none!important}}
  `;
  document.head.appendChild(style);
}
