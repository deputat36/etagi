const HELPERS_KEY = 'etagi-raskleyka-show-helper-panels-v1';
let currentTarget = '.start-card';

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const anchor = document.getElementById('spnUiMode') || document.querySelector('.app-header');
  if(!anchor || document.getElementById('spnClarityPanel')) return;
  anchor.insertAdjacentHTML('afterend', renderPanel());
  bindPanel();
  applyHelperVisibility(readHelperVisibility());
  updateClarityPanel();
});

function renderPanel(){
  return `<section class="spn-clarity-panel" id="spnClarityPanel" aria-label="Понятный маршрут работы">
    <div class="spn-clarity-head">
      <div>
        <b>Маршрут работы</b>
        <span id="spnClarityProgress">—</span>
      </div>
      <button type="button" id="toggleHelperPanelsBtn">Подсказки</button>
    </div>
    <div class="spn-clarity-steps">
      <button type="button" data-clarity-target=".start-card">1 Задача</button>
      <button type="button" data-clarity-target="#templateList">2 Шаблон</button>
      <button type="button" data-clarity-target="#agentName">3 Данные</button>
      <button type="button" data-clarity-target=".media-card">4 Фото/QR</button>
      <button type="button" data-clarity-target=".print-card">5 Печать</button>
      <button type="button" data-clarity-target=".quality-card">6 Проверка</button>
    </div>
    <div class="spn-next-action">
      <span id="spnNextActionText">Заполните макет по шагам.</span>
      <button type="button" id="spnGoNextActionBtn">Перейти</button>
    </div>
  </section>`;
}

function bindPanel(){
  document.getElementById('spnClarityPanel')?.addEventListener('click', event => {
    const step = event.target.closest('[data-clarity-target]');
    const next = event.target.closest('#spnGoNextActionBtn');
    const toggle = event.target.closest('#toggleHelperPanelsBtn');
    if(step) scrollToTarget(step.dataset.clarityTarget);
    if(next) scrollToTarget(currentTarget);
    if(toggle) toggleHelpers();
  });
  ['input','change','click'].forEach(eventName => {
    document.addEventListener(eventName, () => window.setTimeout(updateClarityPanel, 90));
  });
}

function updateClarityPanel(){
  const progress = document.getElementById('spnClarityProgress');
  const nextText = document.getElementById('spnNextActionText');
  if(!progress || !nextText) return;
  const checks = getChecks();
  const done = checks.filter(item => item.ok).length;
  progress.textContent = `${done}/${checks.length} шагов готово`;
  document.querySelectorAll('[data-clarity-target]').forEach((btn, index) => {
    btn.classList.toggle('done', Boolean(checks[index]?.ok));
  });
  const next = checks.find(item => !item.ok) || { text:'Макет готов. Проверьте печать и сформируйте задание.', target:'.print-card' };
  currentTarget = next.target;
  nextText.textContent = next.text;
}

function getChecks(){
  const hasGoal = Boolean(document.querySelector('.goal-btn.active'));
  const hasTemplate = Boolean(document.querySelector('.tpl-card.active'));
  const hasPhone = Boolean(value('agentPhone'));
  const hasHeadline = Boolean(value('headline'));
  const hasPrint = Boolean(document.querySelector('[data-count].active'));
  const quality = Number(String(document.getElementById('qualityScore')?.textContent || '').replace(/\D/g, '')) || 0;
  return [
    { ok: hasGoal, text:'Выберите задачу: кого нужно привлечь.', target:'.start-card' },
    { ok: hasTemplate, text:'Выберите подходящий шаблон.', target:'#templateList' },
    { ok: hasPhone && hasHeadline, text: hasPhone ? 'Заполните или проверьте заголовок.' : 'Введите телефон для отклика.', target: hasPhone ? '#headline' : '#agentPhone' },
    { ok: true, text:'Фото и QR можно оставить выключенными или заполнить по задаче.', target:'.media-card' },
    { ok: hasPrint, text:'Выберите сценарий печати или количество на А4.', target:'.print-card' },
    { ok: quality >= 70, text:'Нажмите «Проверить» и устраните важные замечания.', target:'#qualityBtn' }
  ];
}

function toggleHelpers(){
  const next = !readHelperVisibility();
  applyHelperVisibility(next);
  try{ localStorage.setItem(HELPERS_KEY, next ? '1' : '0'); } catch(e){}
}

function readHelperVisibility(){
  try{
    return localStorage.getItem(HELPERS_KEY) !== '0';
  } catch(e){
    return true;
  }
}

function applyHelperVisibility(show){
  document.body.classList.toggle('spn-hide-helper-panels', !show);
  const btn = document.getElementById('toggleHelperPanelsBtn');
  if(btn) btn.textContent = show ? 'Скрыть подсказки' : 'Показать подсказки';
}

function scrollToTarget(selector){
  const el = document.querySelector(selector)?.closest?.('.card') || document.querySelector(selector);
  if(!el) return;
  el.scrollIntoView({behavior:'smooth', block:'start'});
  el.classList.add('spn-focus-pulse');
  window.setTimeout(() => el.classList.remove('spn-focus-pulse'), 900);
  if(el.matches('input, textarea, select, button')) el.focus();
}

function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}

function injectStyles(){
  if(document.getElementById('spnClarityPanelStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnClarityPanelStyles';
  style.textContent = `.spn-clarity-panel{position:sticky;top:8px;z-index:30;margin:0 0 12px;padding:10px;border:1px solid #fee2e2;border-radius:16px;background:linear-gradient(135deg,#fff,#fff7f7);box-shadow:0 8px 20px rgba(15,23,42,.08)}.spn-clarity-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}.spn-clarity-head b{display:block;font-size:13px;font-weight:900;color:#111827}.spn-clarity-head span{display:block;margin-top:2px;font-size:10.5px;font-weight:800;color:#64748b}.spn-clarity-head button,.spn-next-action button{padding:7px 9px;border-radius:10px;border:1px solid #fecaca;background:#fff;color:#b91c1c;font-size:10.5px;font-weight:900;box-shadow:none}.spn-clarity-steps{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:8px}.spn-clarity-steps button{padding:7px 6px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:10px;font-weight:900;box-shadow:none}.spn-clarity-steps button.done{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.spn-next-action{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;border:1px dashed #fecaca;border-radius:12px;background:#fff;padding:8px}.spn-next-action span{font-size:11px;line-height:1.3;font-weight:850;color:#111827}.spn-clarity-panel button:hover{transform:none;box-shadow:none;background:#fff1f2}.spn-focus-pulse{outline:3px solid rgba(239,68,68,.3);outline-offset:3px;transition:outline-color .3s}.spn-hide-helper-panels .spn-tear-editor,.spn-hide-helper-panels .spn-brand-editor,.spn-hide-helper-panels .spn-contact-editor,.spn-hide-helper-panels .spn-qr-editor,.spn-hide-helper-panels .spn-price-helper,.spn-hide-helper-panels .spn-params-helper,.spn-hide-helper-panels .spn-area-helper,.spn-hide-helper-panels .spn-phone-helper,.spn-hide-helper-panels .spn-agent-helper,.spn-hide-helper-panels .spn-print-campaign-helper,.spn-hide-helper-panels .spn-distribution-task,.spn-hide-helper-panels .spn-distribution-report{display:none!important}@media(max-width:520px){.spn-clarity-panel{top:0;border-radius:0 0 16px 16px}.spn-clarity-steps{grid-template-columns:1fr 1fr}.spn-next-action{grid-template-columns:1fr}}@media print{.spn-clarity-panel{display:none!important}}`;
  document.head.appendChild(style);
}
