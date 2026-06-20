import './spnTearOffEditor.js';
import './spnBlockControls.js';
import './spnQrStandaloneStyle.js';
import './spnContactEditor.js';
import './spnBrandEditor.js';
import './spnQrEditor.js';
import './spnPriceHelper.js';
import './spnParamsHelper.js';
import './spnAreaHelper.js';
import './spnPhoneHelper.js';
import './spnAgentHelper.js';
import './spnPrintCampaignHelper.js';
import './spnDistributionTaskHelper.js';
import './spnDistributionReportHelper.js';
import './spnClarityPanel.js';

const MODE_KEY = 'etagi-raskleyka-ui-mode-v1';

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.app-header');
  if(!header || document.getElementById('spnUiMode')) return;
  header.insertAdjacentHTML('afterend', renderModePanel());
  const savedMode = localStorage.getItem(MODE_KEY) || 'quick';
  setMode(savedMode === 'advanced' ? 'advanced' : 'quick');
  document.getElementById('spnUiMode')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-spn-ui-mode]');
    if(!btn) return;
    setMode(btn.dataset.spnUiMode);
  });
});

function renderModePanel(){
  return `<section class="spn-ui-mode" id="spnUiMode" aria-label="Режим интерфейса">
    <div>
      <b>Режим работы</b>
      <span id="spnUiModeHint">Быстрый режим показывает главное для печати.</span>
    </div>
    <div class="spn-ui-mode-actions">
      <button type="button" data-spn-ui-mode="quick">Быстро</button>
      <button type="button" data-spn-ui-mode="advanced">Расширенно</button>
    </div>
  </section>`;
}

function setMode(mode){
  const next = mode === 'advanced' ? 'advanced' : 'quick';
  document.body.dataset.spnUiMode = next;
  localStorage.setItem(MODE_KEY, next);
  document.querySelectorAll('[data-spn-ui-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.spnUiMode === next));
  const hint = document.getElementById('spnUiModeHint');
  if(hint){
    hint.textContent = next === 'quick'
      ? 'Главное для СПН: ситуация, шаблон, данные, печать и проверка.'
      : 'Показаны все настройки, сохранение, аналитика и инструменты после расклейки.';
  }
  const status = document.getElementById('statusLine');
  if(status) status.textContent = next === 'quick' ? 'Включён быстрый режим.' : 'Включён расширенный режим.';
}
