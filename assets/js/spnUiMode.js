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
import './spnReportHistoryEnhancements.js';
import './spnManagerPeriodSummary.js';
import './spnTemplateMenuCompact.js';
import './spnOfficeTemplateFilters.js';
import './spnOfficeFilterSync.js';
import './spnTemplateCardBadges.js';
import './spnManagerTemplateNotice.js';
import './spnTextStepChecklist.js';
import './spnNewbieMode.js';
import './spnNewbieModeNotice.js';
import './spnNewbieEmptyState.js';
import './spnNewbiePrintGuide.js';
import './spnNewbieFinalCheck.js';
import './spnNewbiePrintGuardNotice.js';
import './spnNewbiePrintGuard.js';
import './spnPhotoLayoutStyle.js';
import './spnPhotoLayoutQualityActions.js';
import './spnAgentBrandModeGuard.js';
import './spnLayoutModeAccessibility.js';
import './spnWizardFlow.js';
import './spnNewbieWizardPatch.js';
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
      <span id="spnUiModeHint">Выберите режим под свой опыт и текущую задачу.</span>
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
  document.querySelectorAll('[data-spn-ui-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.spnUiMode === next);
  });
  document.body.classList.toggle('spn-mode-newbie', next === 'newbie');
  document.body.classList.toggle('spn-mode-quick', next === 'quick');
  document.body.classList.toggle('spn-mode-advanced', next === 'advanced');
  const hint = document.getElementById('spnUiModeHint');
  if(hint) hint.textContent = hintText(next);
  const status = document.getElementById('statusLine');
  if(status) status.textContent = `Режим: ${modeTitle(next)}.`;
}

function hintText(mode){
  if(mode === 'newbie') return 'Новичок: пошаговый мастер, безопасные шаблоны и проверка перед печатью.';
  if(mode === 'advanced') return 'Расширенно: все настройки, сохранение, отчёты и контроль качества.';
  return 'Быстро: основные настройки и готовые сценарии без перегрузки.';
}

function modeTitle(mode){
  if(mode === 'newbie') return 'Новичок';
  if(mode === 'advanced') return 'Расширенно';
  return 'Быстро';
}
