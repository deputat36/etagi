const STATUS_PANEL_ID = 'spnWizardProgressSummary';
const STATUS_CLASS = 'spn-wizard-step-status';
const STYLE_ID = 'spnWizardStepStatusStyles';
const REPORT_HISTORY_KEY = 'etagi-raskleyka-distribution-report-history-v1';

let initAttempts = 0;
let updateFrame = 0;

window.addEventListener('DOMContentLoaded', () => {
  window.setTimeout(initWizardStepStatus, 0);
});

function initWizardStepStatus(){
  const wizard = document.getElementById('spnWizardFlow');
  const sidebar = document.querySelector('.sidebar');
  if(!wizard || !sidebar){
    if(initAttempts++ < 20) window.setTimeout(initWizardStepStatus, 100);
    return;
  }
  if(wizard.dataset.stepStatusBound === 'true') return;

  wizard.dataset.stepStatusBound = 'true';
  injectStyles();
  ensureStatusPanel(wizard);
  ensureStepBadges(wizard);
  bindStatusSources(sidebar, wizard);
  observeStatusSources();
  scheduleStatusUpdate();
}

function ensureStatusPanel(wizard){
  if(document.getElementById(STATUS_PANEL_ID)) return;
  const steps = wizard.querySelector('.spn-wizard-steps');
  steps?.insertAdjacentHTML('afterend', `<div class="spn-wizard-progress-summary" id="${STATUS_PANEL_ID}" aria-live="polite"></div>`);
}

function ensureStepBadges(wizard){
  wizard.querySelectorAll('[data-wizard-step]').forEach(button => {
    if(button.querySelector(`.${STATUS_CLASS}`)) return;
    const badge = document.createElement('em');
    badge.className = STATUS_CLASS;
    badge.textContent = '—';
    button.appendChild(badge);
  });
}

function bindStatusSources(sidebar, wizard){
  if(sidebar.dataset.stepStatusSourcesBound === 'true') return;
  sidebar.dataset.stepStatusSourcesBound = 'true';

  sidebar.addEventListener('input', scheduleStatusUpdate);
  sidebar.addEventListener('change', scheduleStatusUpdate);
  sidebar.addEventListener('click', event => {
    if(!event.target.closest('[data-goal], .tpl-card, [data-count], [data-wizard-print-count], #qualityBtn, #saveNamedLayoutBtn, #saveLocalBtn, #saveDistributionReportHistoryBtn, [data-manager-review]')) return;
    window.setTimeout(scheduleStatusUpdate, 100);
  });

  wizard.addEventListener('click', () => window.setTimeout(scheduleStatusUpdate, 0));
}

function observeStatusSources(){
  const targets = [
    document.getElementById('goalGrid'),
    document.getElementById('templateList'),
    document.getElementById('printPresetRow')
  ].filter(Boolean);

  targets.forEach(target => {
    new MutationObserver(scheduleStatusUpdate).observe(target, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class']
    });
  });

  const qualityScore = document.getElementById('qualityScore');
  if(qualityScore){
    new MutationObserver(scheduleStatusUpdate).observe(qualityScore, {
      childList:true,
      subtree:true,
      characterData:true
    });
  }
}

function scheduleStatusUpdate(){
  window.cancelAnimationFrame(updateFrame);
  updateFrame = window.requestAnimationFrame(() => {
    updateFrame = 0;
    updateWizardStepStatus();
  });
}

function updateWizardStepStatus(){
  const statuses = {
    goal: getGoalStatus(),
    template: getTemplateStatus(),
    content: getContentStatus(),
    media: getMediaStatus(),
    check: getCheckStatus(),
    save: getSaveStatus(),
    task: getTaskStatus(),
    report: getReportStatus()
  };

  document.querySelectorAll('[data-wizard-step]').forEach(button => {
    const status = statuses[button.dataset.wizardStep];
    const badge = button.querySelector(`.${STATUS_CLASS}`);
    if(!status || !badge) return;
    button.dataset.stepStatus = status.state;
    badge.textContent = status.label;
    badge.title = status.detail;
  });

  renderProgressSummary(statuses);
}

function getGoalStatus(){
  const hasGoal = Boolean(document.querySelector('#goalGrid [data-goal].active, [data-goal].active'));
  const hasPrintCount = Boolean(document.querySelector('#printPresetRow [data-count].active, [data-wizard-print-count].active'));
  const missing = [];
  if(!hasGoal) missing.push('цель');
  if(!hasPrintCount) missing.push('формат А4');
  return missing.length
    ? status('attention', 'проверить', `Не выбрано: ${missing.join(', ')}.`, true)
    : status('ready', 'готово', 'Цель и формат А4 выбраны.', true);
}

function getTemplateStatus(){
  const active = document.querySelector('.tpl-card.active');
  if(!active) return status('attention', 'выбрать', 'Выберите конкретный шаблон.', true);
  if(active.querySelector('.tpl-office-badge-deprecated')) {
    return status('attention', 'заменить', 'Выбран устаревший шаблон. Используйте рекомендованную замену.', true);
  }
  return status('ready', 'готово', 'Шаблон выбран.', true);
}

function getContentStatus(){
  const phoneDigits = fieldValue('agentPhone').replace(/\D/g, '');
  const missing = [];
  if(phoneDigits.length < 10) missing.push('телефон');
  if(!fieldValue('headline')) missing.push('заголовок');
  if(!fieldValue('description')) missing.push('описание');
  return missing.length
    ? status('attention', `${3 - missing.length}/3`, `Нужно заполнить: ${missing.join(', ')}.`, true)
    : status('ready', 'готово', 'Телефон, заголовок и описание заполнены.', true);
}

function getMediaStatus(){
  const photoEnabled = Boolean(document.getElementById('showPhoto')?.checked);
  const qrEnabled = Boolean(document.getElementById('showQr')?.checked || fieldValue('qrLink'));
  if(!photoEnabled && !qrEnabled) return status('optional', 'необязательно', 'Фото и QR для этого макета не включены.', false);

  const missing = [];
  if(photoEnabled && !hasSelectedPhoto()) missing.push('загрузить фото');
  if(qrEnabled && !fieldValue('qrLink')) missing.push('добавить ссылку QR');
  if(fieldValue('qrLink') && !fieldValue('qrCaption')) missing.push('подписать QR');
  return missing.length
    ? status('attention', 'проверить', missing.join(' · '), true)
    : status('ready', 'готово', 'Включённые фото и QR заполнены.', true);
}

function getCheckStatus(){
  const quality = readQualityScore();
  const cutLines = Boolean(document.getElementById('showCutLines')?.checked);
  const safeMargins = Boolean(document.getElementById('safePrintMargins')?.checked);
  const missing = [];
  if(quality < 70) missing.push('качество от 70');
  if(!cutLines) missing.push('линии реза');
  if(!safeMargins) missing.push('безопасные поля');
  return missing.length
    ? status('attention', quality ? `${quality}/100` : 'проверить', `Нужно: ${missing.join(', ')}.`, true)
    : status('ready', `${quality}/100`, 'Контроль качества и настройки печати готовы.', true);
}

function getSaveStatus(){
  const hasName = Boolean(fieldValue('layoutName'));
  const hasSavedLayout = (document.getElementById('savedLayouts')?.options?.length || 0) > 1;
  if(hasName || hasSavedLayout) return status('ready', 'есть макет', 'Макет назван или уже сохранён.', false);
  return status('optional', 'по желанию', 'Сохранение не блокирует печать, но ускоряет повторную работу.', false);
}

function getTaskStatus(){
  const place = fieldValue('distributionPlace');
  const sheets = Number(fieldValue('distributionSheets')) || 0;
  if(place && sheets > 0) return status('ready', 'готово', 'Место и количество листов указаны.', true);
  return status('later', 'после печати', 'После печати укажите место и количество листов.', true);
}

function getReportStatus(){
  const date = fieldValue('distributionReportDate');
  const place = fieldValue('distributionReportPlace');
  const sheets = Number(fieldValue('distributionReportSheets')) || 0;
  if(date && place && sheets > 0) return status('ready', 'заполнен', 'Текущий отчёт заполнен и готов к сохранению в историю.', true);
  const historyCount = readReportHistoryCount();
  return status('later', historyCount ? `история: ${historyCount}` : 'после расклейки', 'После расклейки заполните дату, место, листы и результат.', true);
}

function renderProgressSummary(statuses){
  const panel = document.getElementById(STATUS_PANEL_ID);
  if(!panel) return;

  const beforePrint = ['goal', 'template', 'content', 'media', 'check']
    .map(id => statuses[id])
    .filter(item => item.required);
  const afterPrint = ['task', 'report'].map(id => statuses[id]);
  const beforeReady = beforePrint.filter(item => item.state === 'ready').length;
  const afterReady = afterPrint.filter(item => item.state === 'ready').length;

  panel.innerHTML = `<span data-progress-phase="before"><b>До печати</b>${beforeReady}/${beforePrint.length}</span><span data-progress-phase="after"><b>После печати</b>${afterReady}/${afterPrint.length}</span>`;
  panel.dataset.beforeReady = beforeReady === beforePrint.length ? 'true' : 'false';
  panel.dataset.afterReady = afterReady === afterPrint.length ? 'true' : 'false';
}

function status(state, label, detail, required){
  return {state, label, detail, required};
}

function fieldValue(id){
  return String(document.getElementById(id)?.value || '').trim();
}

function hasSelectedPhoto(){
  return Boolean(
    document.getElementById('photoOne')?.files?.length ||
    document.getElementById('photoTwo')?.files?.length
  );
}

function readQualityScore(){
  const match = String(document.getElementById('qualityScore')?.textContent || '').match(/\d+/);
  return match ? Number(match[0]) || 0 : 0;
}

function readReportHistoryCount(){
  try{
    const history = JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY) || '[]');
    return Array.isArray(history) ? history.length : 0;
  } catch(error){
    return 0;
  }
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-wizard-steps button{position:relative;padding-right:74px}
    .spn-wizard-step-status{position:absolute;top:7px;right:7px;max-width:66px;padding:3px 5px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:9px;line-height:1;font-weight:900;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    [data-wizard-step][data-step-status="ready"] .spn-wizard-step-status{background:#dcfce7;color:#166534}
    [data-wizard-step][data-step-status="attention"] .spn-wizard-step-status{background:#fef3c7;color:#92400e}
    [data-wizard-step][data-step-status="optional"] .spn-wizard-step-status{background:#eff6ff;color:#1d4ed8}
    [data-wizard-step][data-step-status="later"] .spn-wizard-step-status{background:#f1f5f9;color:#64748b}
    .spn-wizard-progress-summary{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
    .spn-wizard-progress-summary span{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:7px 8px;border:1px solid #e2e8f0;border-radius:11px;background:#fff;color:#475569;font-size:10.5px;font-weight:900}
    .spn-wizard-progress-summary span b{font-size:10.5px;color:#334155}
    .spn-wizard-progress-summary[data-before-ready="true"] [data-progress-phase="before"],
    .spn-wizard-progress-summary[data-after-ready="true"] [data-progress-phase="after"]{border-color:#bbf7d0;background:#f0fdf4;color:#166534}
    @media(max-width:520px){.spn-wizard-progress-summary{grid-template-columns:1fr}.spn-wizard-steps button{padding-right:70px}}
    @media print{.spn-wizard-progress-summary,.spn-wizard-step-status{display:none!important}}
  `;
  document.head.appendChild(style);
}
