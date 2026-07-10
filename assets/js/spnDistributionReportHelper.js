import { loadTemplates } from './templates.js';

const REPORT_KEY = 'etagi-raskleyka-distribution-report-v1';
const REPORT_HISTORY_KEY = 'etagi-raskleyka-distribution-report-history-v1';
const REPORT_HISTORY_LIMIT = 30;

const defaultReport = {
  date: '',
  place: '',
  sheets: 10,
  calls: 0,
  leads: 0,
  notes: '',
  nextStep: ''
};

let templateMap = new Map();

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const task = document.getElementById('spnDistributionTask');
  const anchor = task || document.getElementById('spnPrintCampaignHelper') || document.getElementById('printPresetRow');
  if(!anchor || document.getElementById('spnDistributionReport')) return;
  anchor.insertAdjacentHTML('afterend', renderReportHelper());
  bindReportHelper();
  restoreReport();
  updateReportPreview();
  renderReportHistory();
  loadReportTemplateMetadata();
});

async function loadReportTemplateMetadata(){
  try{
    const templates = await loadTemplates();
    templateMap = new Map(templates.map(template => [template.id, template]));
  } catch(e){
    templateMap = new Map();
  }
  updateReportPreview();
  renderReportHistory();
}

function renderReportHelper(){
  return `<div class="spn-distribution-report" id="spnDistributionReport">
    <div class="spn-report-head">
      <div>
        <b>Отчёт после расклейки</b>
        <span>зафиксировать, где клеили и что получилось</span>
      </div>
      <div class="spn-report-actions">
        <button type="button" id="fillReportFromTaskBtn">Из задания</button>
        <button type="button" id="saveDistributionReportHistoryBtn">В историю</button>
        <button type="button" id="exportDistributionReportHistoryBtn">CSV</button>
        <button type="button" id="copyDistributionReportBtn">Скопировать</button>
      </div>
    </div>
    <div class="spn-report-grid">
      <label>Дата<input id="distributionReportDate" type="text" maxlength="40" placeholder="сегодня / дата"></label>
      <label>Где клеили<input id="distributionReportPlace" type="text" maxlength="90" placeholder="адреса, подъезды, район"></label>
      <label>Листов расклеено<input id="distributionReportSheets" type="number" min="0" max="500" step="1" value="10"></label>
      <label>Звонков / сообщений<input id="distributionReportCalls" type="number" min="0" max="999" step="1" value="0"></label>
      <label>Целевых обращений<input id="distributionReportLeads" type="number" min="0" max="999" step="1" value="0"></label>
      <label>Следующий шаг<input id="distributionReportNext" type="text" maxlength="90" placeholder="повторить, заменить текст, обзвонить"></label>
    </div>
    <label class="spn-report-notes-label">Что заметили<textarea id="distributionReportNotes" rows="3" maxlength="400" placeholder="где сорвали, где хороший трафик, какие вопросы задавали"></textarea></label>
    <div class="spn-report-metrics" id="distributionReportMetrics"></div>
    <div class="spn-report-insight" id="distributionReportInsight"></div>
    <div class="spn-report-preview" id="distributionReportPreview"></div>
    <div class="spn-report-history-filter" id="distributionReportHistoryFilter">
      <input id="distributionReportHistorySearch" type="search" maxlength="80" placeholder="найти по месту, шаблону, сценарию или заметке">
      <div>
        <button type="button" data-report-history-filter="all" class="active">Все</button>
        <button type="button" data-report-history-filter="best">Рабочие</button>
        <button type="button" data-report-history-filter="weak">Слабые</button>
      </div>
    </div>
    <div class="spn-report-history" id="distributionReportHistory"></div>
    <p>Короткий отчёт помогает понять, какой шаблон, сценарий и район работают, а что нужно изменить перед следующей печатью.</p>
  </div>`;
}

function bindReportHelper(){
  reportFieldIds().forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', () => {
      saveReport();
      updateReportPreview();
    });
    el.addEventListener('change', () => {
      saveReport();
      updateReportPreview();
    });
  });
  document.getElementById('fillReportFromTaskBtn')?.addEventListener('click', fillFromTask);
  document.getElementById('copyDistributionReportBtn')?.addEventListener('click', copyReportText);
  document.getElementById('saveDistributionReportHistoryBtn')?.addEventListener('click', saveReportToHistory);
  document.getElementById('exportDistributionReportHistoryBtn')?.addEventListener('click', exportReportHistoryCsv);
  document.getElementById('distributionReportHistorySearch')?.addEventListener('input', renderReportHistory);
  document.getElementById('distributionReportHistoryFilter')?.addEventListener('click', event => {
    const filter = event.target.closest('[data-report-history-filter]');
    if(!filter) return;
    document.querySelectorAll('[data-report-history-filter]').forEach(button => button.classList.toggle('active', button === filter));
    renderReportHistory();
  });
  document.getElementById('distributionReportHistory')?.addEventListener('click', event => {
    const repeat = event.target.closest('[data-repeat-report]');
    if(!repeat) return;
    repeatHistoryReport(repeat.dataset.repeatReport);
  });
  document.addEventListener('click', event => {
    if(event.target.closest('[data-count], [data-print-campaign], .tpl-card, [data-goal], #qualityBtn, [data-spn-ui-mode], [data-manager-review]')) {
      window.setTimeout(updateReportPreview, 120);
    }
  });
  document.getElementById('managerReviewComment')?.addEventListener('input', updateReportPreview);
}

function reportFieldIds(){
  return ['distributionReportDate','distributionReportPlace','distributionReportSheets','distributionReportCalls','distributionReportLeads','distributionReportNext','distributionReportNotes'];
}

function restoreReport(){
  const saved = readSavedReport();
  setRawValue('distributionReportDate', saved.date || '');
  setRawValue('distributionReportPlace', saved.place || '');
  setRawValue('distributionReportSheets', saved.sheets ?? defaultReport.sheets);
  setRawValue('distributionReportCalls', saved.calls ?? defaultReport.calls);
  setRawValue('distributionReportLeads', saved.leads ?? defaultReport.leads);
  setRawValue('distributionReportNext', saved.nextStep || '');
  setRawValue('distributionReportNotes', saved.notes || '');
}

function getCurrentReport(){
  const sheets = Number(value('distributionReportSheets')) || 0;
  const perSheet = getPrintCount();
  const totalAds = sheets * perSheet;
  const calls = Number(value('distributionReportCalls')) || 0;
  const leads = Number(value('distributionReportLeads')) || 0;
  const callRate = totalAds ? Math.round((calls / totalAds) * 1000) / 10 : 0;
  const leadRate = totalAds ? Math.round((leads / totalAds) * 1000) / 10 : 0;
  const context = getReportContext();

  return {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    date: value('distributionReportDate'),
    place: value('distributionReportPlace'),
    sheets,
    perSheet,
    totalAds,
    calls,
    leads,
    callRate,
    leadRate,
    headline: value('headline') || 'макет без заголовка',
    nextStep: value('distributionReportNext'),
    notes: value('distributionReportNotes'),
    ...context
  };
}

function getReportContext(){
  const templateId = document.querySelector('.tpl-card.active')?.dataset.template || '';
  const template = templateId ? templateMap.get(templateId) : null;
  const office = template?.office || {};
  const qualityScore = readQualityScore();
  const reviewChecks = [...document.querySelectorAll('[data-manager-review]')];
  const reviewDone = reviewChecks.filter(item => item.checked).length;
  const reviewTotal = reviewChecks.length;

  return {
    templateId,
    templateTitle: template?.title || value('layoutName') || '',
    goal: template?.goal || document.querySelector('[data-goal].active')?.dataset.goal || '',
    officeScenario: office.scenario || '',
    officeLevel: office.level || '',
    officeRisk: office.risk || '',
    officeRecommended: typeof office.recommended === 'boolean' ? office.recommended : null,
    qualityScore,
    qualityStatus: qualityStatus(qualityScore),
    qualityWarnings: getQualityWarnings(),
    uiMode: document.body.dataset.spnUiMode || 'quick',
    managerReviewProgress: reviewTotal ? `${reviewDone}/${reviewTotal}` : '',
    managerReviewed: reviewTotal ? reviewDone === reviewTotal : false,
    managerComment: value('managerReviewComment')
  };
}

function readQualityScore(){
  const match = String(document.getElementById('qualityScore')?.textContent || '').match(/\d+/);
  return match ? Number(match[0]) || 0 : 0;
}

function qualityStatus(score){
  if(!score) return 'not_checked';
  if(score >= 80) return 'good';
  if(score >= 60) return 'needs_attention';
  return 'critical';
}

function getQualityWarnings(){
  return [...document.querySelectorAll('#qualityList .qitem.error b, #qualityList .qitem.warn b')]
    .map(item => item.textContent?.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function saveReport(){
  const report = getCurrentReport();
  try{ localStorage.setItem(REPORT_KEY, JSON.stringify(report)); } catch(e){}
}

function readSavedReport(){
  try{
    return {...defaultReport, ...JSON.parse(localStorage.getItem(REPORT_KEY) || '{}')};
  } catch(e){
    return {...defaultReport};
  }
}

function fillFromTask(){
  const taskPlace = value('distributionPlace') || value('area');
  const taskSheets = Number(value('distributionSheets')) || 0;
  if(taskPlace) setRawValue('distributionReportPlace', taskPlace);
  if(taskSheets) setRawValue('distributionReportSheets', taskSheets);
  if(!value('distributionReportDate')) setRawValue('distributionReportDate', new Date().toLocaleDateString('ru-RU'));
  saveReport();
  updateReportPreview();
  setStatus('Отчёт заполнен данными из задания.');
}

function updateReportPreview(){
  const report = getCurrentReport();
  const preview = document.getElementById('distributionReportPreview');
  const metrics = document.getElementById('distributionReportMetrics');
  const insight = document.getElementById('distributionReportInsight');
  if(preview) preview.textContent = buildReportText(report);
  if(metrics) metrics.innerHTML = renderMetrics(report);
  if(insight) insight.textContent = getReportInsight(report);
}

function renderMetrics(report = getCurrentReport()){
  return [
    ['Объявлений', report.totalAds],
    ['Отклик', `${report.callRate}%`],
    ['Целевые', `${report.leadRate}%`],
    ['Качество', report.qualityScore ? `${report.qualityScore}/100` : 'не проверено']
  ].map(([label, metricValue]) => `<div><b>${escapeHtml(String(metricValue))}</b><span>${escapeHtml(label)}</span></div>`).join('');
}

async function copyReportText(){
  const text = buildReportText();
  try{
    await navigator.clipboard.writeText(text);
    setStatus('Отчёт после расклейки скопирован.');
  } catch(e){
    fallbackCopy(text);
    setStatus('Отчёт выделен для копирования.');
  }
}

function buildReportText(report = getCurrentReport()){
  const date = report.date || 'дата не указана';
  const place = report.place || value('area') || 'локация не указана';
  const notes = report.notes || 'заметок нет';
  const next = report.nextStep || 'следующий шаг не указан';
  const template = report.templateTitle || report.headline.replace(/\s+/g, ' ');
  const quality = report.qualityScore ? `${report.qualityScore}/100 (${qualityStatusLabel(report.qualityStatus)})` : 'не проверено';

  return [
    'ОТЧЁТ ПО РАСКЛЕЙКЕ',
    `Дата: ${date}`,
    `Шаблон: ${template}${report.templateId ? ` [${report.templateId}]` : ''}`,
    report.goal ? `Цель: ${goalLabel(report.goal)}` : '',
    report.officeScenario ? `Офисный сценарий: ${report.officeScenario}` : '',
    report.officeRisk ? `Уровень / риск: ${report.officeLevel || '—'} / ${report.officeRisk}` : '',
    `Качество макета: ${quality}`,
    report.managerReviewProgress ? `Проверка менеджера: ${report.managerReviewProgress}${report.managerReviewed ? ' — завершена' : ''}` : '',
    `Локация: ${place}`,
    `Расклеено: ${report.sheets} листов, примерно ${report.totalAds} объявл.`,
    `Отклики: ${report.calls} звонков/сообщений, ${report.leads} целевых обращений`,
    `Примерный отклик: ${report.callRate}%`,
    report.qualityWarnings?.length ? `Замечания качества: ${report.qualityWarnings.join('; ')}` : '',
    `Вывод: ${getReportInsight(report)}`,
    `Заметки: ${notes}`,
    `Следующий шаг: ${next}`
  ].filter(Boolean).join('\n');
}

function getReportInsight(report){
  if(!report.totalAds) return 'Сначала укажите количество листов и формат печати.';
  if(report.calls <= 0) return 'Откликов нет: проверьте место расклейки, заголовок, шаблон и читаемость телефона.';
  if(report.calls > 0 && report.leads <= 0) return 'Отклики есть, но целевых нет: уточните текст, аудиторию и office-сценарий.';
  if(report.leads >= 2 || report.leadRate >= 1) return 'Связка выглядит рабочей: повторите этот шаблон и сценарий в похожих домах.';
  return 'Есть первые целевые обращения: повторите тест и сравните результат с другой локацией или шаблоном.';
}

function saveReportToHistory(){
  const report = getCurrentReport();
  report.insight = getReportInsight(report);
  if(!report.date) report.date = new Date().toLocaleDateString('ru-RU');
  if(!report.place && value('area')) report.place = value('area');
  const history = readReportHistory();
  history.unshift(report);
  writeReportHistory(history.slice(0, REPORT_HISTORY_LIMIT));
  renderReportHistory();
  setStatus('Отчёт добавлен в историю расклеек с данными шаблона и качества.');
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
  try{ localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(history)); } catch(e){}
}

function renderReportHistory(){
  const box = document.getElementById('distributionReportHistory');
  if(!box) return;
  const history = readReportHistory();
  if(!history.length){
    box.innerHTML = '<b>История отчётов</b><span>Пока пусто. Сохраните первый отчёт после расклейки.</span>';
    return;
  }

  const filteredHistory = filterReportHistory(history);
  if(!filteredHistory.length){
    box.innerHTML = '<b>История отчётов</b><span>По текущему фильтру ничего не найдено.</span>';
    return;
  }

  box.innerHTML = `<b>История отчётов</b>${renderHistoryAnalytics(filteredHistory)}${filteredHistory.slice(0, 6).map(item => `
    <div class="spn-report-history-item">
      <span>${escapeHtml(item.date || 'без даты')} · ${escapeHtml(item.place || 'локация не указана')}</span>
      <small>${escapeHtml(reportTemplateLabel(item))} · ${escapeHtml(goalLabel(item.goal))} · ${Number(item.calls) || 0}/${Number(item.leads) || 0} · ${Number(item.callRate) || 0}%${item.qualityScore ? ` · качество ${Number(item.qualityScore)}/100` : ''}</small>
      <button type="button" data-repeat-report="${escapeHtml(item.id)}">Повторить</button>
    </div>`).join('')}`;
}

function filterReportHistory(history){
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

function renderHistoryAnalytics(history){
  const valid = history.filter(item => Number(item.totalAds) > 0);
  if(valid.length < 2){
    return '<div class="spn-report-history-analytics"><b>Аналитика связок</b><span>Сохраните минимум 2 отчёта, чтобы сравнить места, шаблоны, сценарии и форматы.</span></div>';
  }

  const best = [...valid].sort(compareBestReport)[0];
  const weak = [...valid].sort(compareWeakReport)[0];
  const totals = valid.reduce((acc, item) => {
    acc.ads += Number(item.totalAds) || 0;
    acc.calls += Number(item.calls) || 0;
    acc.leads += Number(item.leads) || 0;
    return acc;
  }, {ads:0, calls:0, leads:0});
  const callRate = totals.ads ? Math.round((totals.calls / totals.ads) * 1000) / 10 : 0;
  const leadRate = totals.ads ? Math.round((totals.leads / totals.ads) * 1000) / 10 : 0;

  return `<div class="spn-report-history-analytics">
    <b>Аналитика связок</b>
    <span>Всего: ${totals.ads} объявл. · ${totals.calls} откл. · ${totals.leads} целевых · ${callRate}% / ${leadRate}%</span>
    ${renderAnalyticsRow('Лучше повторить', best, 'best')}
    ${renderAnalyticsRow('Нужно изменить', weak, 'weak')}
  </div>`;
}

function renderAnalyticsRow(title, item, type){
  if(!item) return '';
  const template = reportTemplateLabel(item);
  const place = item.place || 'локация не указана';
  const format = `${Number(item.perSheet) || 2} на А4`;
  const scenario = item.officeScenario ? ` · ${item.officeScenario}` : '';
  const quality = item.qualityScore ? ` · качество ${Number(item.qualityScore)}/100` : '';
  const rates = `${Number(item.callRate) || 0}% отклик · ${Number(item.leadRate) || 0}% целевые${quality}`;
  return `<div class="spn-report-history-analytics-row spn-report-history-analytics-${type}">
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(template)} · ${escapeHtml(place)} · ${escapeHtml(format)}${escapeHtml(scenario)}</span>
    <small>${escapeHtml(rates)}</small>
  </div>`;
}

function compareBestReport(a, b){
  return (scoreReport(b) - scoreReport(a)) || ((Number(b.leadRate) || 0) - (Number(a.leadRate) || 0)) || ((Number(b.callRate) || 0) - (Number(a.callRate) || 0));
}

function compareWeakReport(a, b){
  return (scoreReport(a) - scoreReport(b)) || ((Number(a.callRate) || 0) - (Number(b.callRate) || 0));
}

function scoreReport(item){
  const leads = Number(item.leads) || 0;
  const calls = Number(item.calls) || 0;
  const leadRate = Number(item.leadRate) || 0;
  const callRate = Number(item.callRate) || 0;
  return leads * 100 + leadRate * 10 + calls * 3 + callRate;
}

function repeatHistoryReport(id){
  const item = readReportHistory().find(report => String(report.id) === String(id));
  if(!item) return;
  setRawValue('distributionReportDate', new Date().toLocaleDateString('ru-RU'));
  setRawValue('distributionReportPlace', item.place || '');
  setRawValue('distributionReportSheets', item.sheets || defaultReport.sheets);
  setRawValue('distributionReportCalls', 0);
  setRawValue('distributionReportLeads', 0);
  setRawValue('distributionReportNext', item.nextStep || '');
  setRawValue('distributionReportNotes', item.notes || '');
  saveReport();
  updateReportPreview();
  setStatus('Отчёт повторён как новая расклейка. Заполните свежие отклики после выполнения.');
}

function exportReportHistoryCsv(){
  const history = readReportHistory();
  if(!history.length){
    setStatus('История отчётов пуста, экспортировать нечего.');
    return;
  }
  const rows = [
    ['date','place','template_id','template_title','goal','office_scenario','office_level','office_risk','ui_mode','quality_score','quality_status','quality_warnings','manager_review','manager_reviewed','headline','sheets','ads','calls','leads','call_rate','lead_rate','insight','next_step','notes'],
    ...history.map(item => [
      item.date,
      item.place,
      item.templateId,
      item.templateTitle,
      item.goal,
      item.officeScenario,
      item.officeLevel,
      item.officeRisk,
      item.uiMode,
      item.qualityScore,
      item.qualityStatus,
      (item.qualityWarnings || []).join(' | '),
      item.managerReviewProgress,
      item.managerReviewed,
      item.headline,
      item.sheets,
      item.totalAds,
      item.calls,
      item.leads,
      item.callRate,
      item.leadRate,
      item.insight || getReportInsight(item),
      item.nextStep,
      item.notes
    ])
  ];
  const csv = rows.map(row => row.map(csvCell).join(';')).join('\n');
  downloadText(`raskleyka-report-history-${new Date().toISOString().slice(0,10)}.csv`, csv);
  setStatus('История отчётов с шаблонами и качеством выгружена в CSV.');
}

function reportTemplateLabel(item){
  return item.templateTitle || item.headline || item.templateId || 'макет без названия';
}

function goalLabel(goal){
  return ({
    seller:'собственники / продавцы',
    buyer:'покупатели',
    object:'продажа объекта',
    newbuild:'новостройки',
    service:'услуги / консультация',
    rent:'аренда',
    brand:'личный бренд',
    private:'частное объявление',
    all:'универсальный'
  })[goal] || goal || 'цель не указана';
}

function qualityStatusLabel(status){
  return ({
    good:'готово',
    needs_attention:'нужно проверить',
    critical:'есть критичные замечания',
    not_checked:'не проверено'
  })[status] || status || 'не проверено';
}

function csvCell(cellValue){
  return `"${String(cellValue ?? '').replaceAll('"', '""')}"`;
}

function downloadText(filename, text){
  const blob = new Blob([text], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function getPrintCount(){
  return Number(document.querySelector('[data-count].active')?.dataset.count || 2);
}
function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function setRawValue(id, next){
  const el = document.getElementById(id);
  if(el) el.value = next;
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
function normalizeText(textValue){
  return String(textValue || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}
function injectStyles(){
  if(document.getElementById('spnDistributionReportStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnDistributionReportStyles';
  style.textContent = `.spn-distribution-report{margin:8px 0 10px;padding:10px;border:1px solid #bfdbfe;border-radius:14px;background:#eff6ff}.spn-report-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}.spn-report-head b{display:block;font-size:12px;font-weight:900;color:#1e3a8a}.spn-report-head span{display:block;margin-top:2px;font-size:10.5px;line-height:1.2;color:#1d4ed8;font-weight:700}.spn-report-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.spn-report-actions button{padding:7px 9px;border-radius:10px;border:1px solid #bfdbfe;background:#fff;color:#1d4ed8;font-size:10.5px;font-weight:900;box-shadow:none}.spn-report-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.spn-report-grid label,.spn-report-notes-label{display:grid;gap:5px;font-size:10.5px;font-weight:900;color:#1e3a8a}.spn-report-grid input,.spn-report-notes-label textarea{background:#fff}.spn-report-notes-label{margin-top:7px}.spn-report-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:8px}.spn-report-metrics div{border:1px solid #bfdbfe;border-radius:11px;background:#fff;padding:7px;text-align:center}.spn-report-metrics b{display:block;font-size:13px;font-weight:900;color:#1e3a8a}.spn-report-metrics span{font-size:9.5px;font-weight:800;color:#64748b}.spn-report-insight{margin-top:8px;border:1px solid #bae6fd;border-radius:12px;background:#f8fafc;padding:8px;color:#0f172a;font-size:10.5px;line-height:1.25;font-weight:900}.spn-report-preview{margin-top:8px;white-space:pre-wrap;border:1px dashed #93c5fd;border-radius:12px;background:#fff;padding:8px;color:#172554;font-size:10.5px;line-height:1.32;font-weight:750}.spn-report-history-filter{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;margin-top:8px}.spn-report-history-filter input{background:#fff;border:1px solid #bfdbfe;border-radius:10px;padding:8px;font-size:10.5px;font-weight:800}.spn-report-history-filter div{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.spn-report-history-filter button{padding:7px 8px;border-radius:10px;border:1px solid #bfdbfe;background:#fff;color:#1d4ed8;font-size:10px;font-weight:900;box-shadow:none}.spn-report-history-filter button.active{background:#1d4ed8;border-color:#1d4ed8;color:#fff}.spn-report-history{display:grid;gap:6px;margin-top:8px;border:1px solid #bfdbfe;border-radius:12px;background:#fff;padding:8px}.spn-report-history>b{font-size:11px;font-weight:900;color:#1e3a8a}.spn-report-history>span{font-size:10.5px;color:#64748b;font-weight:700}.spn-report-history-analytics{display:grid;gap:6px;margin:2px 0 4px;padding:8px;border:1px solid #bae6fd;border-radius:12px;background:#f8fafc}.spn-report-history-analytics>b{font-size:11px;font-weight:900;color:#0f172a}.spn-report-history-analytics>span{font-size:10px;line-height:1.2;color:#475569;font-weight:800}.spn-report-history-analytics-row{display:grid;gap:2px;padding:6px;border-radius:10px;border:1px solid #e2e8f0;background:#fff}.spn-report-history-analytics-row strong{font-size:10.5px;font-weight:900;color:#172554}.spn-report-history-analytics-row span{font-size:9.8px;line-height:1.2;color:#334155;font-weight:800}.spn-report-history-analytics-row small{font-size:9.3px;color:#64748b;font-weight:800}.spn-report-history-analytics-best{border-color:#bbf7d0;background:#f0fdf4}.spn-report-history-analytics-weak{border-color:#fed7aa;background:#fff7ed}.spn-report-history-item{display:grid;grid-template-columns:1fr auto;gap:3px 6px;border-top:1px solid #e0f2fe;padding-top:6px}.spn-report-history-item span{font-size:10.5px;font-weight:900;color:#172554}.spn-report-history-item small{font-size:9.5px;line-height:1.2;color:#475569;font-weight:750}.spn-report-history-item button{grid-row:1/3;grid-column:2;padding:6px 8px;border-radius:9px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;font-size:10px;font-weight:900;box-shadow:none}.spn-distribution-report p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-report-head{flex-direction:column}.spn-report-grid,.spn-report-metrics,.spn-report-history-filter{grid-template-columns:1fr}.spn-report-history-filter div{justify-content:stretch}.spn-report-history-filter button{flex:1}.spn-report-history-item{grid-template-columns:1fr}.spn-report-history-item button{grid-row:auto;grid-column:auto}}@media print{.spn-distribution-report{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(unsafeValue){
  return String(unsafeValue || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
