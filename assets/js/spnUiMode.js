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
import './spnWizard.js';
import './spnPrintCampaignHelper.js';
import './spnDistributionTaskHelper.js';
import './spnDistributionReportHelper.js';
import './spnClarityPanel.js';
import './spnTemplateMenuCompact.js';
import './spnOfficeTemplateFilters.js';
import './spnOfficeFilterSync.js';
import './spnTemplateCardBadges.js';
import './spnTextStepChecklist.js';
import './spnNewbieMode.js';
import './spnNewbieModeNotice.js';
import './spnNewbieWizardPatch.js';
import './spnNewbieFinalCheck.js';
import './spnManagerReview.js';
import './spnWizardFlow.js';
import './spnPhotoLayoutStyle.js';
import './spnMetaCompactStyle.js';

const MODE_KEY = 'etagi-raskleyka-ui-mode-v1';

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.app-header');
  if(!header || document.getElementById('spnUiMode')) return;
  header.insertAdjacentHTML('afterend', renderModePanel());
  const savedMode = localStorage.getItem(MODE_KEY) || 'newbie';
  setMode(['newbie', 'quick', 'advanced'].includes(savedMode) ? savedMode : 'newbie');
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
      <span id="spnUiModeHint">Режим новичка показывает безопасный пошаговый сценарий.</span>
    </div>
    <div class="spn-ui-mode-actions">
      <button type="button" data-spn-ui-mode="newbie">Новичок</button>
      <button type="button" data-spn-ui-mode="quick">Быстро</button>
      <button type="button" data-spn-ui-mode="advanced">Расширенно</button>
    </div>
  </section>`;
}

function setMode(mode){
  const next = ['newbie', 'quick', 'advanced'].includes(mode) ? mode : 'newbie';
  document.body.dataset.spnUiMode = next;
  localStorage.setItem(MODE_KEY, next);
  document.querySelectorAll('[data-spn-ui-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.spnUiMode === next));
  const hint = document.getElementById('spnUiModeHint');
  if(hint){
    hint.textContent = next === 'newbie'
      ? 'Новичок: безопасные шаблоны, пошаговый сценарий и меньше лишних настроек.'
      : next === 'quick'
        ? 'Быстро: главное для СПН, но без жёсткого ограничения шаблонов.'
        : 'Расширенно: все настройки, сохранение, аналитика и инструменты после расклейки.';
  }
  const status = document.getElementById('statusLine');
  if(status){
    status.textContent = next === 'newbie'
      ? 'Включён режим новичка.'
      : next === 'quick'
        ? 'Включён быстрый режим.'
        : 'Включён расширенный режим.';
  }
}
