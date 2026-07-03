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
import './spnTemplateMenuCompact.js';
import './spnOfficeTemplateFilters.js';
import './spnOfficeFilterSync.js';
import './spnTemplateCardBadges.js';
import './spnTextStepChecklist.js';
import './spnNewbieMode.js';
import './spnNewbieModeNotice.js';
import './spnNewbieEmptyState.js';
import './spnNewbiePrintGuide.js';
import './spnNewbieFinalCheck.js';
import './spnNewbiePrintGuardNotice.js';
import './spnNewbiePrintGuard.js';
import './spnPhotoLayoutStyle.js';
import './spnWizardFlow.js';
import './spnManagerReview.js';
import './spnMetaCompactStyle.js';

const MODE_KEY = 'etagi-raskleyka-ui-mode-v1';
const MODES = ['newbie', 'quick', 'advanced'];

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.app-header');
  if(!header || document.getElementById('spnUiMode')) return;
  header.insertAdjacentHTML('afterend', renderModePanel());
  const savedMode = localStorage.getItem(MODE_KEY) || 'quick';
  setMode(MODES.includes(savedMode) ? savedMode : 'quick');
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
      <span id="spnUiModeHint">Стабильный интерфейс. Режим новичка возвращается поэтапно.</span>
    </div>
    <div class="spn-ui-mode-actions">
      <button type="button" data-spn-ui-mode="newbie">Новичок</button>
      <button type="button" data-spn-ui-mode="quick">Быстро</button>
      <button type="button" data-spn-ui-mode="advanced">Расширенно</button>
    </div>
  </section>`;
}

function setMode(mode){
  const next = MODES.includes(mode) ? mode : 'quick';
  document.body.dataset.spnUiMode = next;
  localStorage.setItem(MODE_KEY, next);
  document.querySelectorAll('[data-spn-ui-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.spnUiMode === next));
  const hint = document.getElementById('spnUiModeHint');
  if(hint){
    hint.textContent = next === 'newbie'
      ? 'Новичок: безопасный фильтр, подсказки печати и защита от преждевременной печати.'
      : next === 'quick'
        ? 'Быстро: основной стабильный интерфейс для печати расклеек.'
        : 'Расширенно: все настройки, сохранение, аналитика и инструменты после расклейки.';
  }
  const status = document.getElementById('statusLine');
  if(status){
    status.textContent = next === 'newbie'
      ? 'Включён режим новичка с защитой печати.'
      : next === 'quick'
        ? 'Включён стабильный быстрый режим.'
        : 'Включён расширенный режим.';
  }
}
