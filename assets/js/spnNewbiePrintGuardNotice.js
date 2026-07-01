const STYLE_ID = 'spnNewbiePrintGuardNoticeStyle';
const NOTICE_ID = 'spnNewbiePrintGuardNotice';

const checks = [
  { id: 'quality', title: 'Проверить макет', target: '#qualityBtn' },
  { id: 'phone', title: 'Заполнить телефон', target: '#agentPhone' },
  { id: 'count', title: 'Выбрать 2 на А4', target: '[data-count="2"]' },
  { id: 'cut', title: 'Включить линии реза', target: '#showCutLines' },
  { id: 'safe', title: 'Включить безопасные поля', target: '#safePrintMargins' }
];

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  renderNotice();
  bindNotice();
  updateNotice();
});

function renderNotice(){
  const anchor = document.querySelector('.print-card .step-title') || document.querySelector('.print-card');
  if(!anchor || document.getElementById(NOTICE_ID)) return;
  anchor.insertAdjacentHTML('afterend', `<div class="spn-newbie-print-guard-notice" id="${NOTICE_ID}">
    <b id="spnNewbiePrintGuardTitle">Печать пока закрыта</b>
    <span id="spnNewbiePrintGuardText">Завершите проверку перед печатью.</span>
    <button type="button" id="spnNewbiePrintGuardFix">Исправить первое</button>
  </div>`);
}

function bindNotice(){
  document.getElementById('spnNewbiePrintGuardFix')?.addEventListener('click', () => {
    const first = getItems().find(item => !item.ok);
    if(first) go(first.target);
  });

  ['click', 'input', 'change'].forEach(eventName => {
    document.addEventListener(eventName, () => window.setTimeout(updateNotice, 90));
  });
}

function updateNotice(){
  const box = document.getElementById(NOTICE_ID);
  const title = document.getElementById('spnNewbiePrintGuardTitle');
  const text = document.getElementById('spnNewbiePrintGuardText');
  const button = document.getElementById('spnNewbiePrintGuardFix');
  if(!box || !title || !text || !button) return;

  const items = getItems();
  const missing = items.filter(item => !item.ok);
  const ready = missing.length === 0;

  box.classList.toggle('ready', ready);
  title.textContent = ready ? 'Печать готова' : 'Печать пока закрыта';
  text.textContent = ready
    ? 'Все обязательные пункты выполнены. Можно печатать или сохранять PDF.'
    : `Осталось: ${missing.map(item => item.title).join(', ')}.`;
  button.hidden = ready;
}

function getItems(){
  const quality = Number(String(document.getElementById('qualityScore')?.textContent || '').replace(/\D/g, '')) || 0;
  const phone = Boolean(String(document.getElementById('agentPhone')?.value || '').trim());
  const countTwo = Boolean(document.querySelector('[data-count="2"].active'));
  const cutLines = Boolean(document.getElementById('showCutLines')?.checked);
  const safeMargins = Boolean(document.getElementById('safePrintMargins')?.checked);
  const state = { quality: quality >= 70, phone, count: countTwo, cut: cutLines, safe: safeMargins };
  return checks.map(item => ({ ...item, ok: Boolean(state[item.id]) }));
}

function go(selector){
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
    .spn-newbie-print-guard-notice{display:none;margin:0 0 11px;padding:10px;border:1px solid #fed7aa;border-radius:15px;background:#fff7ed;color:#9a3412}
    body[data-spn-ui-mode="newbie"] .spn-newbie-print-guard-notice{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center}
    .spn-newbie-print-guard-notice b{display:block;font-size:12px;line-height:1.15;font-weight:900;color:#c2410c}
    .spn-newbie-print-guard-notice span{display:block;margin-top:3px;font-size:11px;line-height:1.25;font-weight:750;color:#9a3412}
    .spn-newbie-print-guard-notice button{padding:7px 9px;border:1px solid #fed7aa;border-radius:10px;background:#fff;color:#c2410c;font-size:11px;font-weight:900;box-shadow:none}
    .spn-newbie-print-guard-notice.ready{border-color:#86efac;background:#ecfdf5;color:#047857}
    .spn-newbie-print-guard-notice.ready b,.spn-newbie-print-guard-notice.ready span{color:#047857}
    @media(max-width:520px){body[data-spn-ui-mode="newbie"] .spn-newbie-print-guard-notice{grid-template-columns:1fr}}
    @media print{.spn-newbie-print-guard-notice{display:none!important}}
  `;
  document.head.appendChild(style);
}
