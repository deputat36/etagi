const REPORT_HISTORY_KEY = 'etagi-raskleyka-distribution-report-history-v1';
const MIN_GROUP_REPORTS = 2;

let enhanceFrame = 0;
let initAttempts = 0;

document.addEventListener('DOMContentLoaded', () => {
  window.setTimeout(initReportHistoryEnhancements, 0);
});

function initReportHistoryEnhancements(){
  const historyBox = document.getElementById('distributionReportHistory');
  if(!historyBox){
    if(initAttempts++ < 12) window.setTimeout(initReportHistoryEnhancements, 120);
    return;
  }
  if(historyBox.dataset.enhancementsBound === 'true') return;

  historyBox.dataset.enhancementsBound = 'true';
  injectStyles();
  bindHistoryActions(historyBox);
  new MutationObserver(scheduleEnhanceHistory).observe(historyBox, {childList:true, subtree:true});

  document.getElementById('distributionReportHistorySearch')?.addEventListener('input', scheduleEnhanceHistory);
  document.getElementById('distributionReportHistoryFilter')?.addEventListener('click', () => window.setTimeout(scheduleEnhanceHistory, 0));
  scheduleEnhanceHistory();
}

function bindHistoryActions(historyBox){
  historyBox.addEventListener('click', event => {
    const button = event.target.closest('[data-delete-report]');
    if(!button) return;

    const id = button.dataset.deleteReport;
    const history = readReportHistory();
    const report = history.find(item => String(item.id) === String(id));
    if(!report) return;

    const label = `${report.date || 'без даты'} · ${report.place || 'локация не указана'}`;
    if(!window.confirm(`Удалить ошибочный отчёт?\n${label}`)) return;

    writeReportHistory(history.filter(item => String(item.id) !== String(id)));
    setStatus('Ошибочный отчёт удалён из истории.');
    refreshBaseHistory();
  });
}

function scheduleEnhanceHistory(){
  window.cancelAnimationFrame(enhanceFrame);
  enhanceFrame = window.requestAnimationFrame(() => {
    enhanceFrame = 0;
    enhanceHistory();
  });
}

function enhanceHistory(){
  const historyBox = document.getElementById('distributionReportHistory');
  if(!historyBox) return;

  historyBox.querySelectorAll('.spn-report-history-item').forEach(item => {
    if(item.querySelector('[data-delete-report]')) return;
    const repeatButton = item.querySelector('[data-repeat-report]');
    const id = repeatButton?.dataset.repeatReport;
    if(!id) return;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'spn-report-delete-btn';
    deleteButton.dataset.deleteReport = id;
    deleteButton.textContent = 'Удалить';
    deleteButton.setAttribute('aria-label', 'Удалить ошибочный отчёт из истории');
    item.appendChild(deleteButton);
  });

  renderGroupedAnalytics(historyBox);
}

function renderGroupedAnalytics(historyBox){
  historyBox.querySelector('#spnReportGroupedAnalytics')?.remove();

  const filteredHistory = filterHistory(readReportHistory());
  const groups = groupHistory(filteredHistory)
    .filter(group => group.reportCount >= MIN_GROUP_REPORTS)
    .sort(compareGroupsBest);

  const panel = document.createElement('div');
  panel.id = 'spnReportGroupedAnalytics';
  panel.className = 'spn-report-grouped-analytics';

  if(!groups.length){
    panel.innerHTML = '<b>Устойчивость связок</b><span>Для сравнения одной связки нужны минимум 2 отчёта с одинаковыми шаблоном и местом.</span>';
  } else {
    const best = groups[0];
    const weak = [...groups].sort(compareGroupsWeak)[0];
    panel.innerHTML = [
      '<b>Устойчивость связок</b>',
      '<span>Расчёт объединяет повторные расклейки одного шаблона в одном месте.</span>',
      renderGroupRow('Стабильно лучше', best, 'best'),
      weak && weak.key !== best.key ? renderGroupRow('Стабильно слабее', weak, 'weak') : ''
    ].filter(Boolean).join('');
  }

  const baseAnalytics = historyBox.querySelector('.spn-report-history-analytics');
  if(baseAnalytics) baseAnalytics.insertAdjacentElement('afterend', panel);
  else historyBox.querySelector(':scope > b')?.insertAdjacentElement('afterend', panel);
}

function groupHistory(history){
  const groups = new Map();

  history.forEach(report => {
    if((Number(report.totalAds) || 0) <= 0) return;
    const templateKey = normalizeText(report.templateId || report.templateTitle || report.headline || 'unknown-template');
    const placeKey = normalizePlace(report.place);
    const key = `${templateKey}::${placeKey}`;
    const current = groups.get(key) || {
      key,
      templateId: report.templateId || '',
      templateTitle: report.templateTitle || report.headline || report.templateId || 'макет без названия',
      place: report.place || 'локация не указана',
      officeScenario: report.officeScenario || '',
      reportCount: 0,
      ads: 0,
      calls: 0,
      leads: 0,
      qualityTotal: 0,
      qualityCount: 0
    };

    current.reportCount += 1;
    current.ads += Number(report.totalAds) || 0;
    current.calls += Number(report.calls) || 0;
    current.leads += Number(report.leads) || 0;
    if(Number(report.qualityScore) > 0){
      current.qualityTotal += Number(report.qualityScore);
      current.qualityCount += 1;
    }
    groups.set(key, current);
  });

  return [...groups.values()].map(group => ({
    ...group,
    callRate: group.ads ? roundRate(group.calls, group.ads) : 0,
    leadRate: group.ads ? roundRate(group.leads, group.ads) : 0,
    averageQuality: group.qualityCount ? Math.round(group.qualityTotal / group.qualityCount) : 0
  }));
}

function renderGroupRow(title, group, type){
  const scenario = group.officeScenario ? ` · ${group.officeScenario}` : '';
  const quality = group.averageQuality ? ` · качество ${group.averageQuality}/100` : '';
  return `<div class="spn-report-group-row spn-report-group-${type}">
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(group.templateTitle)} · ${escapeHtml(group.place)}${escapeHtml(scenario)}</span>
    <small>${group.reportCount} расклеек · ${group.ads} объявл. · ${group.calls} откл. · ${group.leads} целевых · ${group.callRate}% / ${group.leadRate}%${escapeHtml(quality)}</small>
  </div>`;
}

function filterHistory(history){
  const search = normalizeText(document.getElementById('distributionReportHistorySearch')?.value || '');
  const filter = document.querySelector('[data-report-history-filter].active')?.dataset.reportHistoryFilter || 'all';

  return history.filter(item => {
    const text = normalizeText([
      item.date,
      item.place,
      item.headline,
      item.templateId,
      item.templateTitle,
      item.goal,
      item.officeScenario,
      item.officeLevel,
      item.officeRisk,
      item.qualityStatus,
      ...(item.qualityWarnings || []),
      item.notes,
      item.nextStep,
      item.insight
    ].filter(Boolean).join(' '));

    if(search && !text.includes(search)) return false;
    if(filter === 'best') return classifyReport(item) === 'best';
    if(filter === 'weak') return classifyReport(item) === 'weak';
    return true;
  });
}

function classifyReport(item){
  const leads = Number(item.leads) || 0;
  const calls = Number(item.calls) || 0;
  const leadRate = Number(item.leadRate) || 0;
  if(leads >= 2 || leadRate >= 1) return 'best';
  if(calls <= 0 || leads <= 0) return 'weak';
  return 'neutral';
}

function compareGroupsBest(a, b){
  return (groupScore(b) - groupScore(a)) || (b.reportCount - a.reportCount) || (b.leadRate - a.leadRate);
}

function compareGroupsWeak(a, b){
  return (groupScore(a) - groupScore(b)) || (a.callRate - b.callRate) || (b.reportCount - a.reportCount);
}

function groupScore(group){
  return group.leads * 100 + group.leadRate * 10 + group.calls * 3 + group.callRate + Math.min(group.reportCount, 5) * 5;
}

function refreshBaseHistory(){
  const search = document.getElementById('distributionReportHistorySearch');
  if(search) search.dispatchEvent(new Event('input', {bubbles:true}));
  else scheduleEnhanceHistory();
}

function readReportHistory(){
  try{
    const parsed = JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){
    return [];
  }
}

function writeReportHistory(history){
  try{
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(history));
  } catch(e){
    setStatus('Не удалось обновить историю отчётов. Проверьте свободное место браузера.');
  }
}

function normalizePlace(place){
  return normalizeText(place)
    .replace(/\b(дом|дома|подъезд|подъезды)\b/g, '')
    .replace(/[^a-zа-яё0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'локация не указана';
}

function normalizeText(value){
  return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

function roundRate(value, total){
  return Math.round((value / total) * 1000) / 10;
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function injectStyles(){
  if(document.getElementById('spnReportHistoryEnhancementStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnReportHistoryEnhancementStyles';
  style.textContent = `
    .spn-report-history-item{grid-template-columns:minmax(0,1fr) auto auto!important}
    .spn-report-history-item .spn-report-delete-btn{grid-row:1/3;grid-column:3;padding:6px 8px;border:1px solid #fecaca;border-radius:9px;background:#fff7f7;color:#b91c1c;font-size:10px;font-weight:900;box-shadow:none}
    .spn-report-history-item .spn-report-delete-btn:hover{background:#fee2e2;transform:none;box-shadow:none}
    .spn-report-grouped-analytics{display:grid;gap:6px;padding:8px;border:1px solid #c7d2fe;border-radius:12px;background:#eef2ff}
    .spn-report-grouped-analytics>b{font-size:11px;font-weight:900;color:#312e81}
    .spn-report-grouped-analytics>span{font-size:10px;line-height:1.25;color:#475569;font-weight:800}
    .spn-report-group-row{display:grid;gap:2px;padding:7px;border:1px solid #e2e8f0;border-radius:10px;background:#fff}
    .spn-report-group-row strong{font-size:10.5px;font-weight:900;color:#172554}
    .spn-report-group-row span{font-size:9.8px;line-height:1.22;color:#334155;font-weight:800}
    .spn-report-group-row small{font-size:9.3px;line-height:1.22;color:#64748b;font-weight:800}
    .spn-report-group-best{border-color:#bbf7d0;background:#f0fdf4}
    .spn-report-group-weak{border-color:#fed7aa;background:#fff7ed}
    @media(max-width:520px){.spn-report-history-item{grid-template-columns:1fr auto!important}.spn-report-history-item .spn-report-delete-btn{grid-row:auto;grid-column:auto}}
    @media print{.spn-report-grouped-analytics,.spn-report-delete-btn{display:none!important}}
  `;
  document.head.appendChild(style);
}
