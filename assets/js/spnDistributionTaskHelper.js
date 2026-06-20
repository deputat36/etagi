const STORAGE_KEY = 'etagi-raskleyka-distribution-task-v1';

const defaultTask = {
  sheets: 10,
  place: '',
  responsible: '',
  deadline: ''
};

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const printCampaign = document.getElementById('spnPrintCampaignHelper');
  const printRow = document.getElementById('printPresetRow');
  const anchor = printCampaign || printRow;
  if(!anchor || document.getElementById('spnDistributionTask')) return;
  anchor.insertAdjacentHTML('afterend', renderTaskHelper());
  bindTaskHelper();
  restoreTask();
  updateTaskPreview();
});

function renderTaskHelper(){
  return `<div class="spn-distribution-task" id="spnDistributionTask">
    <div class="spn-distribution-head">
      <div>
        <b>Задание на расклейку</b>
        <span>короткий текст для СПН или помощника</span>
      </div>
      <button type="button" id="copyDistributionTaskBtn">Скопировать</button>
    </div>
    <div class="spn-distribution-grid">
      <label>Листов<input id="distributionSheets" type="number" min="1" max="500" step="1" value="10"></label>
      <label>Где клеить<input id="distributionPlace" type="text" maxlength="80" placeholder="подъезды, район, улица, ЖК"></label>
      <label>Ответственный<input id="distributionResponsible" type="text" maxlength="60" placeholder="кто клеит"></label>
      <label>Срок<input id="distributionDeadline" type="text" maxlength="60" placeholder="сегодня / до вечера / дата"></label>
    </div>
    <div class="spn-distribution-preview" id="distributionTaskPreview"></div>
    <p>После печати можно скопировать задание и отправить его исполнителю или сохранить себе в план работ.</p>
  </div>`;
}

function bindTaskHelper(){
  ['distributionSheets','distributionPlace','distributionResponsible','distributionDeadline'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', () => {
      saveTask();
      updateTaskPreview();
    });
    el.addEventListener('change', () => {
      saveTask();
      updateTaskPreview();
    });
  });
  document.getElementById('copyDistributionTaskBtn')?.addEventListener('click', copyTaskText);
  document.addEventListener('input', event => {
    if(event.target?.id && isSourceField(event.target.id)) window.setTimeout(updateTaskPreview, 80);
  });
  document.addEventListener('change', event => {
    if(event.target?.id && isSourceField(event.target.id)) window.setTimeout(updateTaskPreview, 80);
    if(event.target?.closest?.('[data-count]')) window.setTimeout(updateTaskPreview, 80);
  });
  document.addEventListener('click', event => {
    if(event.target.closest('[data-count]') || event.target.closest('[data-print-campaign]')) window.setTimeout(updateTaskPreview, 120);
  });
}

function isSourceField(id){
  return ['headline','area','propertyType','agentName','agentPhone','showContact','tearOffs','showQr','showPhoto','showCutLines','safePrintMargins','printCheckMode'].includes(id);
}

function restoreTask(){
  const saved = readSavedTask();
  setRawValue('distributionSheets', saved.sheets || defaultTask.sheets);
  setRawValue('distributionPlace', saved.place || '');
  setRawValue('distributionResponsible', saved.responsible || '');
  setRawValue('distributionDeadline', saved.deadline || '');
}

function saveTask(){
  const task = {
    sheets: Number(value('distributionSheets')) || defaultTask.sheets,
    place: value('distributionPlace'),
    responsible: value('distributionResponsible'),
    deadline: value('distributionDeadline')
  };
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(task)); } catch(e){}
}

function readSavedTask(){
  try{
    return {...defaultTask, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')};
  } catch(e){
    return {...defaultTask};
  }
}

function updateTaskPreview(){
  const box = document.getElementById('distributionTaskPreview');
  if(!box) return;
  const text = buildTaskText();
  box.textContent = text;
}

async function copyTaskText(){
  const text = buildTaskText();
  try{
    await navigator.clipboard.writeText(text);
    setStatus('Задание на расклейку скопировано.');
  } catch(e){
    fallbackCopy(text);
    setStatus('Задание выделено для копирования.');
  }
}

function buildTaskText(){
  const sheets = Number(value('distributionSheets')) || defaultTask.sheets;
  const perSheet = getPrintCount();
  const totalAds = sheets * perSheet;
  const headline = value('headline') || 'макет без заголовка';
  const area = value('area') || value('distributionPlace') || 'локация не указана';
  const property = value('propertyType') || 'недвижимость';
  const place = value('distributionPlace') || area;
  const responsible = value('distributionResponsible') || 'не назначен';
  const deadline = value('distributionDeadline') || 'срок не указан';
  const contact = value('agentPhone') || 'телефон не заполнен';
  const flags = [
    checked('tearOffs') ? 'отрывные телефоны' : '',
    checked('showQr') ? 'QR' : '',
    checked('showPhoto') ? 'фото' : '',
    checked('showCutLines') ? 'линии реза' : '',
    checked('safePrintMargins') ? 'безопасные поля' : '',
    checked('printCheckMode') ? 'режим проверки' : ''
  ].filter(Boolean).join(', ') || 'без дополнительных отметок';

  return [
    'ЗАДАНИЕ НА РАСКЛЕЙКУ',
    `Макет: ${headline.replace(/\s+/g, ' ')}`,
    `Локация: ${place}`,
    `Тип объекта/задачи: ${property}`,
    `Печать: ${sheets} листов, ${perSheet} объявл. на А4, всего примерно ${totalAds} объявл.`,
    `Настройки: ${flags}`,
    `Телефон для отклика: ${contact}`,
    `Ответственный: ${responsible}`,
    `Срок: ${deadline}`,
    'После расклейки: зафиксировать адреса/подъезды, количество листов и первые отклики.'
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
function checked(id){
  return Boolean(document.getElementById(id)?.checked);
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
  if(document.getElementById('spnDistributionTaskStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnDistributionTaskStyles';
  style.textContent = `.spn-distribution-task{margin:8px 0 10px;padding:10px;border:1px solid #d9f99d;border-radius:14px;background:#f7fee7}.spn-distribution-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}.spn-distribution-head b{display:block;font-size:12px;font-weight:900;color:#365314}.spn-distribution-head span{display:block;margin-top:2px;font-size:10.5px;line-height:1.2;color:#4d7c0f;font-weight:700}.spn-distribution-head button{padding:7px 9px;border-radius:10px;border:1px solid #bef264;background:#fff;color:#3f6212;font-size:10.5px;font-weight:900;box-shadow:none}.spn-distribution-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.spn-distribution-grid label{display:grid;gap:5px;font-size:10.5px;font-weight:900;color:#365314}.spn-distribution-grid input{background:#fff}.spn-distribution-preview{margin-top:8px;white-space:pre-wrap;border:1px dashed #a3e635;border-radius:12px;background:#fff;padding:8px;color:#26350b;font-size:10.5px;line-height:1.32;font-weight:750}.spn-distribution-task p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-distribution-head{flex-direction:column}.spn-distribution-grid{grid-template-columns:1fr}}@media print{.spn-distribution-task{display:none!important}}`;
  document.head.appendChild(style);
}
