const REPORT_KEY = 'etagi-raskleyka-distribution-report-v1';

const defaultReport = {
  date: '',
  place: '',
  sheets: 10,
  calls: 0,
  leads: 0,
  notes: '',
  nextStep: ''
};

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const task = document.getElementById('spnDistributionTask');
  const anchor = task || document.getElementById('spnPrintCampaignHelper') || document.getElementById('printPresetRow');
  if(!anchor || document.getElementById('spnDistributionReport')) return;
  anchor.insertAdjacentHTML('afterend', renderReportHelper());
  bindReportHelper();
  restoreReport();
  updateReportPreview();
});

function renderReportHelper(){
  return `<div class="spn-distribution-report" id="spnDistributionReport">
    <div class="spn-report-head">
      <div>
        <b>Отчёт после расклейки</b>
        <span>зафиксировать, где клеили и что получилось</span>
      </div>
      <div class="spn-report-actions">
        <button type="button" id="fillReportFromTaskBtn">Из задания</button>
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
    <div class="spn-report-preview" id="distributionReportPreview"></div>
    <p>Короткий отчёт помогает понять, какой макет работает, а какой нужно изменить перед следующей печатью.</p>
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
  document.addEventListener('click', event => {
    if(event.target.closest('[data-count]') || event.target.closest('[data-print-campaign]')) window.setTimeout(updateReportPreview, 120);
  });
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

function saveReport(){
  const report = {
    date: value('distributionReportDate'),
    place: value('distributionReportPlace'),
    sheets: Number(value('distributionReportSheets')) || 0,
    calls: Number(value('distributionReportCalls')) || 0,
    leads: Number(value('distributionReportLeads')) || 0,
    nextStep: value('distributionReportNext'),
    notes: value('distributionReportNotes')
  };
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
  const preview = document.getElementById('distributionReportPreview');
  const metrics = document.getElementById('distributionReportMetrics');
  if(preview) preview.textContent = buildReportText();
  if(metrics) metrics.innerHTML = renderMetrics();
}

function renderMetrics(){
  const sheets = Number(value('distributionReportSheets')) || 0;
  const calls = Number(value('distributionReportCalls')) || 0;
  const leads = Number(value('distributionReportLeads')) || 0;
  const perSheet = getPrintCount();
  const totalAds = sheets * perSheet;
  const callRate = totalAds ? Math.round((calls / totalAds) * 1000) / 10 : 0;
  const leadRate = totalAds ? Math.round((leads / totalAds) * 1000) / 10 : 0;
  return [
    ['Объявлений', totalAds],
    ['Отклик', `${callRate}%`],
    ['Целевые', `${leadRate}%`]
  ].map(([label, value]) => `<div><b>${escapeHtml(String(value))}</b><span>${escapeHtml(label)}</span></div>`).join('');
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

function buildReportText(){
  const sheets = Number(value('distributionReportSheets')) || 0;
  const perSheet = getPrintCount();
  const totalAds = sheets * perSheet;
  const calls = Number(value('distributionReportCalls')) || 0;
  const leads = Number(value('distributionReportLeads')) || 0;
  const headline = value('headline') || 'макет без заголовка';
  const date = value('distributionReportDate') || 'дата не указана';
  const place = value('distributionReportPlace') || value('area') || 'локация не указана';
  const notes = value('distributionReportNotes') || 'заметок нет';
  const next = value('distributionReportNext') || 'следующий шаг не указан';
  const callRate = totalAds ? Math.round((calls / totalAds) * 1000) / 10 : 0;

  return [
    'ОТЧЁТ ПО РАСКЛЕЙКЕ',
    `Дата: ${date}`,
    `Макет: ${headline.replace(/\s+/g, ' ')}`,
    `Локация: ${place}`,
    `Расклеено: ${sheets} листов, примерно ${totalAds} объявл.`,
    `Отклики: ${calls} звонков/сообщений, ${leads} целевых обращений`,
    `Примерный отклик: ${callRate}%`,
    `Заметки: ${notes}`,
    `Следующий шаг: ${next}`
  ].join('\n');
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
function injectStyles(){
  if(document.getElementById('spnDistributionReportStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnDistributionReportStyles';
  style.textContent = `.spn-distribution-report{margin:8px 0 10px;padding:10px;border:1px solid #bfdbfe;border-radius:14px;background:#eff6ff}.spn-report-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}.spn-report-head b{display:block;font-size:12px;font-weight:900;color:#1e3a8a}.spn-report-head span{display:block;margin-top:2px;font-size:10.5px;line-height:1.2;color:#1d4ed8;font-weight:700}.spn-report-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.spn-report-actions button{padding:7px 9px;border-radius:10px;border:1px solid #bfdbfe;background:#fff;color:#1d4ed8;font-size:10.5px;font-weight:900;box-shadow:none}.spn-report-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.spn-report-grid label,.spn-report-notes-label{display:grid;gap:5px;font-size:10.5px;font-weight:900;color:#1e3a8a}.spn-report-grid input,.spn-report-notes-label textarea{background:#fff}.spn-report-notes-label{margin-top:7px}.spn-report-metrics{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:8px}.spn-report-metrics div{border:1px solid #bfdbfe;border-radius:11px;background:#fff;padding:7px;text-align:center}.spn-report-metrics b{display:block;font-size:13px;font-weight:900;color:#1e3a8a}.spn-report-metrics span{font-size:9.5px;font-weight:800;color:#64748b}.spn-report-preview{margin-top:8px;white-space:pre-wrap;border:1px dashed #93c5fd;border-radius:12px;background:#fff;padding:8px;color:#172554;font-size:10.5px;line-height:1.32;font-weight:750}.spn-distribution-report p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-report-head{flex-direction:column}.spn-report-grid,.spn-report-metrics{grid-template-columns:1fr}}@media print{.spn-distribution-report{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
