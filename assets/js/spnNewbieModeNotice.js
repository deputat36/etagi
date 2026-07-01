const STYLE_ID = 'spnNewbieModeNoticeStyle';

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  renderNotice();
});

function renderNotice(){
  const anchor = document.getElementById('spnOfficeTemplateFilters');
  if(!anchor || document.getElementById('spnNewbieModeNotice')) return;
  anchor.insertAdjacentHTML('afterbegin', `<div class="spn-newbie-mode-notice" id="spnNewbieModeNotice">
    <b>Безопасный выбор для новичка</b>
    <span>Показаны простые заготовки. Сложные, пустые и менеджерские макеты скрыты. Для полного списка переключитесь в режим «Быстро» или «Расширенно».</span>
  </div>`);
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-newbie-mode-notice{display:none;margin:0 0 9px;padding:9px;border:1px solid #bbf7d0;border-radius:13px;background:#f0fdf4;color:#166534}
    body[data-spn-ui-mode="newbie"] .spn-newbie-mode-notice{display:grid;gap:3px}
    .spn-newbie-mode-notice b{font-size:12px;line-height:1.15;font-weight:900;color:#047857}
    .spn-newbie-mode-notice span{font-size:11px;line-height:1.3;font-weight:750;color:#166534}
    @media print{.spn-newbie-mode-notice{display:none!important}}
  `;
  document.head.appendChild(style);
}
