const REPORT_HISTORY_KEY = 'etagi-raskleyka-distribution-report-history-v1';
const PERIODS = [
  {id:'7', title:'7 дней', days:7},
  {id:'30', title:'30 дней', days:30},
  {id:'all', title:'Вся история', days:0}
];

let activePeriod = '30';
let initAttempts = 0;
let updateFrame = 0;

document.addEventListener('DOMContentLoaded', () => {
  window.setTimeout(initManagerPeriodSummary, 0);
});

function initManagerPeriodSummary(){
  const report = document.getElementById('spnDistributionReport');
  const history = document.getElementById('distributionReportHistory');
  const filter = document.getElementById('distributionReportHistoryFilter');
  if(!report || !history || !filter){
    if(initAttempts++ < 12) window.setTimeout(initManagerPeriodSummary, 120);
    return;
  }
  if(document.getElementById('spnManagerPeriodSummary')) return;

  injectStyles();
  filter.insertAdjacentHTML('beforebegin', renderSummaryPanel());
  bindSummaryPanel();
  new MutationObserver(scheduleSummaryUpdate).observe(history, {childList:true, subtree:true});
  scheduleSummaryUpdate();
}

function renderSummaryPanel(){
  return `<section class="spn-manager-period-summary" id="spnManagerPeriodSummary" aria-label="Сводка менеджеру по расклейке">
    <div class="spn-manager-period-head">
      <div>
        <b>Сводка менеджеру</b>
        <span>результаты расклейки за выбранный период</span>
      </div>
      <button type="button" id="copyManagerPeriodSummaryBtn">Скопировать</button>
    </div>
    <div class="spn-manager-period-controls" aria-label="Период сводки">
      ${PERIODS.map(period => `<button type="button" data-manager-report-period="${period.id}"${period.id === activePeriod ? ' class="active"' : ''}>${period.title}</button>`).join('')}
    </div>
    <div class="spn-manager-period-content" id="spnManagerPeriodSummaryContent"></div>
  </section>`;
}

function bindSummaryPanel(){
  document.getElementById('spnManagerPeriodSummary')?.addEventListener('click', event => {
    const periodButton = event.target.closest('[data-manager-report-period]');
    if(periodButton){
      activePeriod = periodButton.dataset.managerReportPeriod;
      document.querySelectorAll('[data-manager-report-period]').forEach(button => {
        button.classList.toggle('active', button === periodButton);
      });
      scheduleSummaryUpdate();
      return;
    }

    if(event.target.closest('#copyManagerPeriodSummaryBtn')) copyManagerPeriodSummary();
  });
}

function scheduleSummaryUpdate(){
  window.cancelAnimationFrame(updateFrame);
  updateFrame = window.requestAnimationFrame(() => {
    updateFrame = 0;
    updateManagerPeriodSummary();
  });
}

function updateManagerPeriodSummary(){
  const content = document.getElementById('spnManagerPeriodSummaryContent');
  if(!content) return;

  const reports = getPeriodReports(readReportHistory(), activePeriod);
  if(!reports.length){
    content.innerHTML = '<span class="spn-manager-period-empty">За выбранный период отчётов нет.</span>';
    return;
  }

  const summary = buildPeriodSummary(reports, activePeriod);
  content.innerHTML = `
    <div class="spn-manager-period-metrics">
      ${renderMetric(summary.reportCount, 'отчётов')}
      ${renderMetric(summary.sheets, 'листов')}
      ${renderMetric(summary.calls, 'откликов')}
      ${renderMetric(summary.leads, 'целевых')}
      ${renderMetric(`${summary.callRate}%`, 'отклик')}
      ${renderMetric(summary.averageQuality ? `${summary.averageQuality}/100` : '—', 'качество')}
    </div>
    <div class="spn-manager-period-details">
      <span>Проверено менеджером: <b>${summary.managerReviewed}/${summary.reportCount}</b></span>
      <span>Средний/высокий риск: <b>${summary.riskyReports}</b></span>
      <span>Без проверки качества: <b>${summary.notChecked}</b></span>
    </div>
    ${renderStableGroup('Лучшая устойчивая связка', summary.bestStableGroup, 'best')}
    ${renderStableGroup('Слабая устойчивая связка', summary.weakStableGroup, 'weak')}
    ${summary.bestSingle ? `<div class="spn-manager-period-single"><b>Лучший отдельный отчёт</b><span>${escapeHtml(reportLabel(summary.bestSingle))}</span><small>${Number(summary.bestSingle.calls) || 0} откл. · ${Number(summary.bestSingle.leads) || 0} целевых · ${Number(summary.bestSingle.callRate) || 0}%</small></div>` : ''}
  `;
}

function buildPeriodSummary(reports, periodId){
  const totals = reports.reduce((acc, report) => {
    acc.sheets += Number(report.sheets) || 0;
    acc.ads += Number(report.totalAds) || 0;
    acc.calls += Number(report.calls) || 0;
    acc.leads += Number(report.leads) || 0;
    if(Number(report.qualityScore) > 0){
      acc.qualityTotal += Number(report.qualityScore);
      acc.qualityCount += 1;
    }
    if(report.managerReviewed) acc.managerReviewed += 1;
    if(report.officeRisk === 'medium' || report.officeRisk === 'high') acc.riskyReports += 1;
    if(!Number(report.qualityScore)) acc.notChecked += 1;
    return acc;
  }, {sheets:0, ads:0, calls:0, leads:0, qualityTotal:0, qualityCount:0, managerReviewed:0, riskyReports:0, notChecked:0});

  const stableGroups = groupReports(reports).filter(group => group.reportCount >= 2);
  return {
    periodId,
    reportCount: reports.length,
    ...totals,
    callRate: totals.ads ? roundRate(totals.calls, totals.ads) : 0,
    leadRate: totals.ads ? roundRate(totals.leads, totals.ads) : 0,
    averageQuality: totals.qualityCount ? Math.round(totals.qualityTotal / totals.qualityCount) : 0,
    bestStableGroup: [...stableGroups].sort(compareGroupsBest)[0] || null,
    weakStableGroup: [...stableGroups].sort(compareGroupsWeak)[0] || null,
    bestSingle: [...reports].sort((a, b) => scoreReport(b) - scoreReport(a))[0] || null
  };
}

function groupReports(reports){
  const groups = new Map();

  reports.forEach(report => {
    if((Number(report.totalAds) || 0) <= 0) return;
    const templateKey = normalizeText(report.templateId || report.templateTitle || report.headline || 'unknown-template');
    const placeKey = normalizePlace(report.place);
    const key = `${templateKey}::${placeKey}`;
    const group = groups.get(key) || {
      key,
      templateTitle: report.templateTitle || report.headline || report.templateId || 'макет без названия',
      place: report.place || 'локация не указана',
      reportCount: 0,
      ads: 0,
      calls: 0,
      leads: 0
    };
    group.reportCount += 1;
    group.ads += Number(report.totalAds) || 0;
    group.calls += Number(report.calls) || 0;
    group.leads += Number(report.leads) || 0;
    groups.set(key, group);
  });

  return [...groups.values()].map(group => ({
    ...group,
    callRate: group.ads ? roundRate(group.calls, group.ads) : 0,
    leadRate: group.ads ? roundRate(group.leads, group.ads) : 0
  }));
}

function renderStableGroup(title, group, type){
  if(!group) return '';
  return `<div class="spn-manager-period-group spn-manager-period-group-${type}">
    <b>${escapeHtml(title)}</b>
    <span>${escapeHtml(group.templateTitle)} · ${escapeHtml(group.place)}</span>
    <small>${group.reportCount} расклеек · ${group.ads} объявл. · ${group.calls} откл. · ${group.leads} целевых · ${group.callRate}% / ${group.leadRate}%</small>
  </div>`;
}

function renderMetric(metricValue, label){
  return `<div><b>${escapeHtml(String(metricValue))}</b><span>${escapeHtml(label)}</span></div>`;
}

async function copyManagerPeriodSummary(){
  const reports = getPeriodReports(readReportHistory(), activePeriod);
  if(!reports.length){
    setStatus('За выбранный период нет отчётов для сводки.');
    return;
  }

  const summary = buildPeriodSummary(reports, activePeriod);
  const text = buildSummaryText(summary);
  try{
    await navigator.clipboard.writeText(text);
    setStatus('Сводка менеджеру скопирована.');
  } catch(e){
    fallbackCopy(text);
    setStatus('Сводка выделена для копирования.');
  }
}

function buildSummaryText(summary){
  return [
    'СВОДКА ПО РАСКЛЕЙКЕ',
    `Период: ${periodTitle(summary.periodId)}`,
    `Отчётов: ${summary.reportCount}`,
    `Объём: ${summary.sheets} листов, примерно ${summary.ads} объявлений`,
    `Результат: ${summary.calls} откликов, ${summary.leads} целевых`,
    `Отклик: ${summary.callRate}%; целевые: ${summary.leadRate}%`,
    `Среднее качество: ${summary.averageQuality ? `${summary.averageQuality}/100` : 'не проверено'}`,
    `Проверено менеджером: ${summary.managerReviewed}/${summary.reportCount}`,
    `Средний/высокий риск: ${summary.riskyReports}`,
    `Без проверки качества: ${summary.notChecked}`,
    summary.bestStableGroup ? `Лучшая устойчивая связка: ${groupText(summary.bestStableGroup)}` : 'Лучшая устойчивая связка: пока недостаточно повторов',
    summary.weakStableGroup ? `Слабая устойчивая связка: ${groupText(summary.weakStableGroup)}` : '',
    summary.bestSingle ? `Лучший отдельный отчёт: ${reportLabel(summary.bestSingle)}` : ''
  ].filter(Boolean).join('\n');
}

function getPeriodReports(history, periodId){
  const period = PERIODS.find(item => item.id === periodId) || PERIODS[1];
  if(!period.days) return history;

  const threshold = Date.now() - period.days * 24 * 60 * 60 * 1000;
  return history.filter(report => {
    const timestamp = reportTimestamp(report);
    return timestamp > 0 && timestamp >= threshold;
  });
}

function reportTimestamp(report){
  const created = Date.parse(report.createdAt || '');
  if(Number.isFinite(created)) return created;

  const value = String(report.date || '').trim();
  const ruDate = value.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if(ruDate){
    const timestamp = new Date(Number(ruDate[3]), Number(ruDate[2]) - 1, Number(ruDate[1])).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readReportHistory(){
  try{
    const parsed = JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){
    return [];
  }
}

function compareGroupsBest(a, b){
  return (groupScore(b) - groupScore(a)) || (b.reportCount - a.reportCount);
}

function compareGroupsWeak(a, b){
  return (groupScore(a) - groupScore(b)) || (b.reportCount - a.reportCount);
}

function groupScore(group){
  return group.leads * 100 + group.leadRate * 10 + group.calls * 3 + group.callRate + Math.min(group.reportCount, 5) * 5;
}

function scoreReport(report){
  return (Number(report.leads) || 0) * 100 + (Number(report.leadRate) || 0) * 10 + (Number(report.calls) || 0) * 3 + (Number(report.callRate) || 0);
}

function reportLabel(report){
  const template = report.templateTitle || report.headline || report.templateId || 'макет без названия';
  const place = report.place || 'локация не указана';
  return `${template} · ${place}`;
}

function groupText(group){
  return `${group.templateTitle} · ${group.place} · ${group.reportCount} расклеек · ${group.calls}/${group.leads} · ${group.callRate}%`;
}

function periodTitle(periodId){
  return PERIODS.find(item => item.id === periodId)?.title || '30 дней';
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

function fallbackCopy(text){
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.focus();
  area.select();
  try{ document.execCommand('copy'); } catch(e){}
  area.remove();
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function injectStyles(){
  if(document.getElementById('spnManagerPeriodSummaryStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnManagerPeriodSummaryStyles';
  style.textContent = `
    .spn-manager-period-summary{display:grid;gap:8px;margin-top:9px;padding:9px;border:1px solid #c4b5fd;border-radius:13px;background:#f5f3ff}
    .spn-manager-period-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
    .spn-manager-period-head b{display:block;font-size:11.5px;font-weight:900;color:#4c1d95}
    .spn-manager-period-head span{display:block;margin-top:2px;font-size:10px;line-height:1.2;color:#6d28d9;font-weight:750}
    .spn-manager-period-head button{padding:7px 9px;border:1px solid #c4b5fd;border-radius:9px;background:#fff;color:#5b21b6;font-size:10px;font-weight:900;box-shadow:none}
    .spn-manager-period-controls{display:flex;gap:5px;flex-wrap:wrap}
    .spn-manager-period-controls button{padding:6px 8px;border:1px solid #c4b5fd;border-radius:9px;background:#fff;color:#5b21b6;font-size:10px;font-weight:900;box-shadow:none}
    .spn-manager-period-controls button.active{background:#6d28d9;border-color:#6d28d9;color:#fff}
    .spn-manager-period-content{display:grid;gap:7px}
    .spn-manager-period-empty{font-size:10.5px;color:#64748b;font-weight:800}
    .spn-manager-period-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
    .spn-manager-period-metrics div{padding:6px;border:1px solid #ddd6fe;border-radius:10px;background:#fff;text-align:center}
    .spn-manager-period-metrics b{display:block;font-size:12px;font-weight:900;color:#4c1d95}
    .spn-manager-period-metrics span{font-size:9px;color:#64748b;font-weight:800}
    .spn-manager-period-details{display:flex;gap:5px;flex-wrap:wrap}
    .spn-manager-period-details span{padding:5px 7px;border-radius:999px;background:#fff;color:#475569;font-size:9.5px;font-weight:800}
    .spn-manager-period-details b{color:#4c1d95;font-weight:900}
    .spn-manager-period-group,.spn-manager-period-single{display:grid;gap:2px;padding:7px;border:1px solid #ddd6fe;border-radius:10px;background:#fff}
    .spn-manager-period-group b,.spn-manager-period-single b{font-size:10.5px;font-weight:900;color:#312e81}
    .spn-manager-period-group span,.spn-manager-period-single span{font-size:9.8px;line-height:1.2;color:#334155;font-weight:800}
    .spn-manager-period-group small,.spn-manager-period-single small{font-size:9.2px;line-height:1.2;color:#64748b;font-weight:800}
    .spn-manager-period-group-best{border-color:#bbf7d0;background:#f0fdf4}
    .spn-manager-period-group-weak{border-color:#fed7aa;background:#fff7ed}
    @media(max-width:520px){.spn-manager-period-head{flex-direction:column}.spn-manager-period-metrics{grid-template-columns:1fr 1fr}.spn-manager-period-head button{width:100%}}
    @media print{.spn-manager-period-summary{display:none!important}}
  `;
  document.head.appendChild(style);
}
