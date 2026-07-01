const STYLE_ID = 'spnNewbiePrintGuideStyle';

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  renderGuide();
  bindGuide();
});

function renderGuide(){
  const anchor = document.querySelector('.print-card .step-title') || document.querySelector('.print-card');
  if(!anchor || document.getElementById('spnNewbiePrintGuide')) return;
  anchor.insertAdjacentHTML('afterend', `<div class="spn-newbie-print-guide" id="spnNewbiePrintGuide">
    <b>Рекомендуемые настройки печати</b>
    <span>Для первой расклейки обычно подходит 2 объявления на А4, линии реза и безопасные поля.</span>
    <div>
      <button type="button" data-newbie-print-count="2">2 на А4</button>
      <button type="button" data-newbie-print-check="showCutLines">Линии реза</button>
      <button type="button" data-newbie-print-check="safePrintMargins">Безопасные поля</button>
    </div>
  </div>`);
}

function bindGuide(){
  document.getElementById('spnNewbiePrintGuide')?.addEventListener('click', event => {
    const count = event.target.closest('[data-newbie-print-count]');
    const check = event.target.closest('[data-newbie-print-check]');
    if(count) applyCount(count.dataset.newbiePrintCount);
    if(check) applyCheck(check.dataset.newbiePrintCheck);
  });
}

function applyCount(value){
  document.querySelector(`#printPresetRow [data-count="${value}"]`)?.click();
}

function applyCheck(id){
  const field = document.getElementById(id);
  if(!field) return;
  field.checked = true;
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-newbie-print-guide{display:none;margin:0 0 11px;padding:10px;border:1px solid #bbf7d0;border-radius:15px;background:#f0fdf4;color:#166534}
    body[data-spn-ui-mode="newbie"] .spn-newbie-print-guide{display:grid;gap:7px}
    .spn-newbie-print-guide b{font-size:12px;line-height:1.15;font-weight:900;color:#047857}
    .spn-newbie-print-guide span{font-size:11px;line-height:1.3;font-weight:750;color:#166534}
    .spn-newbie-print-guide div{display:flex;flex-wrap:wrap;gap:6px}
    .spn-newbie-print-guide button{padding:7px 9px;border:1px solid #86efac;border-radius:10px;background:#fff;color:#047857;font-size:11px;font-weight:900;box-shadow:none}
    .spn-newbie-print-guide button:hover{transform:none;box-shadow:0 7px 16px rgba(15,23,42,.08)}
    @media print{.spn-newbie-print-guide{display:none!important}}
  `;
  document.head.appendChild(style);
}
