const FIELD_KEY = 'etagi-raskleyka-field-task-v1';
const STYLE_ID = 'spnDistributionFieldModeStyles';
const MAX_POINTS = 30;

const defaultFieldState = {
  status: 'planned',
  pointsText: '',
  completedPointKeys: [],
  actualSheets: 0,
  photoReport: false,
  issues: '',
  startedAt: '',
  completedAt: ''
};

window.addEventListener('DOMContentLoaded', () => {
  const task = document.getElementById('spnDistributionTask');
  if(!task || document.getElementById('spnDistributionFieldDialog')) return;

  injectStyles();
  task.insertAdjacentHTML('beforeend', renderLauncher());
  document.body.insertAdjacentHTML('beforeend', renderDialog());
  restoreFieldState();
  bindFieldMode();
  renderPointChecklist();
  updateFieldSummary();
});

function renderLauncher(){
  return `<div class="spn-field-launcher">
    <button type="button" id="openDistributionFieldModeBtn">Открыть режим исполнителя</button>
    <span id="distributionFieldLauncherSummary">полевое выполнение не начато</span>
  </div>`;
}

function renderDialog(){
  return `<dialog class="spn-field-dialog" id="spnDistributionFieldDialog" aria-labelledby="distributionFieldTitle">
    <div class="spn-field-dialog-head">
      <div>
        <b id="distributionFieldTitle">Выполнение расклейки</b>
        <span>Мобильный чек-лист исполнителя: точки, план/факт и результат.</span>
      </div>
      <button type="button" id="closeDistributionFieldModeBtn" aria-label="Закрыть режим исполнителя">Закрыть</button>
    </div>

    <div class="spn-field-status-row">
      <label>Статус
        <select id="distributionFieldStatus">
          <option value="planned">Запланировано</option>
          <option value="in_progress">В работе</option>
          <option value="done">Выполнено</option>
          <option value="problem">Есть проблема</option>
        </select>
      </label>
      <label>Фактически листов
        <input id="distributionFieldActualSheets" type="number" min="0" max="500" step="1" value="0">
      </label>
    </div>

    <div class="spn-field-actions compact">
      <button type="button" id="fillDistributionFieldFromTaskBtn">Заполнить из задания</button>
      <button type="button" id="startDistributionFieldTaskBtn">Начать</button>
      <button type="button" id="completeDistributionFieldTaskBtn">Завершить</button>
    </div>

    <label>Точки расклейки
      <textarea id="distributionFieldPoints" rows="5" maxlength="1200" placeholder="Каждая улица, дом или подъезд с новой строки"></textarea>
    </label>
    <div class="spn-field-points" id="distributionFieldPointChecklist"></div>

    <label class="spn-field-photo-check"><input id="distributionFieldPhotoReport" type="checkbox"> Фотоотчёт сделан и сохранён отдельно</label>
    <label>Проблемы и заметки
      <textarea id="distributionFieldIssues" rows="4" maxlength="600" placeholder="Сорванные объявления, закрытые подъезды, нехватка листов, замечания"></textarea>
    </label>

    <div class="spn-field-result" id="distributionFieldResult"></div>
    <div class="spn-field-actions">
      <button type="button" id="copyDistributionFieldResultBtn">Скопировать итог</button>
      <button type="button" id="sendDistributionFieldToReportBtn">Передать в отчёт</button>
    </div>
    <p>Фотографии не сохраняются в генераторе. Сделайте их камерой телефона и передайте менеджеру привычным способом.</p>
  </dialog>`;
}

function bindFieldMode(){
  const dialog = document.getElementById('spnDistributionFieldDialog');
  document.getElementById('openDistributionFieldModeBtn')?.addEventListener('click', () => openDialog(dialog));
  document.getElementById('closeDistributionFieldModeBtn')?.addEventListener('click', () => closeDialog(dialog));
  document.getElementById('fillDistributionFieldFromTaskBtn')?.addEventListener('click', fillFromTask);
  document.getElementById('startDistributionFieldTaskBtn')?.addEventListener('click', startTask);
  document.getElementById('completeDistributionFieldTaskBtn')?.addEventListener('click', completeTask);
  document.getElementById('copyDistributionFieldResultBtn')?.addEventListener('click', copyFieldResult);
  document.getElementById('sendDistributionFieldToReportBtn')?.addEventListener('click', sendToReport);

  for(const id of ['distributionFieldStatus','distributionFieldActualSheets','distributionFieldPoints','distributionFieldPhotoReport','distributionFieldIssues']){
    const element = document.getElementById(id);
    if(!element) continue;
    element.addEventListener('input', handleFieldInput);
    element.addEventListener('change', handleFieldInput);
  }

  document.getElementById('distributionFieldPointChecklist')?.addEventListener('change', event => {
    const checkbox = event.target.closest('[data-field-point-key]');
    if(!checkbox) return;
    const state = readFieldState();
    const completed = new Set(state.completedPointKeys || []);
    if(checkbox.checked) completed.add(checkbox.dataset.fieldPointKey);
    else completed.delete(checkbox.dataset.fieldPointKey);
    state.completedPointKeys = [...completed];
    writeFieldState(state);
    updateFieldSummary();
  });

  document.getElementById('distributionSheets')?.addEventListener('input', updateFieldSummary);
  document.getElementById('distributionPlace')?.addEventListener('input', updateFieldSummary);
}

function handleFieldInput(event){
  saveFieldForm();
  if(event.target.id === 'distributionFieldPoints') renderPointChecklist();
  updateFieldSummary();
}

function restoreFieldState(){
  const state = readFieldState();
  setValue('distributionFieldStatus', state.status || defaultFieldState.status);
  setValue('distributionFieldActualSheets', Number(state.actualSheets) || 0);
  setValue('distributionFieldPoints', state.pointsText || '');
  setChecked('distributionFieldPhotoReport', Boolean(state.photoReport));
  setValue('distributionFieldIssues', state.issues || '');
}

function saveFieldForm(){
  const previous = readFieldState();
  const next = {
    ...previous,
    status: value('distributionFieldStatus') || 'planned',
    actualSheets: Number(value('distributionFieldActualSheets')) || 0,
    pointsText: value('distributionFieldPoints'),
    photoReport: checked('distributionFieldPhotoReport'),
    issues: value('distributionFieldIssues')
  };
  const allowedKeys = new Set(getPoints(next.pointsText).map(point => point.key));
  next.completedPointKeys = (previous.completedPointKeys || []).filter(key => allowedKeys.has(key));
  writeFieldState(next);
}

function fillFromTask(){
  const taskPlace = value('distributionPlace') || value('area');
  const currentPoints = value('distributionFieldPoints');
  if(!currentPoints && taskPlace) setValue('distributionFieldPoints', taskPlace.replace(/\s*;\s*/g, '\n'));
  if(!Number(value('distributionFieldActualSheets'))) setValue('distributionFieldActualSheets', 0);
  saveFieldForm();
  renderPointChecklist();
  updateFieldSummary();
  setStatus(taskPlace ? 'Режим исполнителя заполнен данными из задания.' : 'Сначала укажите место расклейки в задании или добавьте точки вручную.');
}

function startTask(){
  const state = readFieldState();
  state.status = 'in_progress';
  if(!state.startedAt) state.startedAt = new Date().toISOString();
  writeFieldState(state);
  setValue('distributionFieldStatus', 'in_progress');
  updateFieldSummary();
  setStatus('Расклейка отмечена как начатая.');
}

function completeTask(){
  saveFieldForm();
  const actualSheets = Number(value('distributionFieldActualSheets')) || 0;
  if(actualSheets <= 0){
    document.getElementById('distributionFieldActualSheets')?.focus();
    setStatus('Перед завершением укажите фактическое количество расклеенных листов.');
    return;
  }
  const state = readFieldState();
  state.status = 'done';
  state.completedAt = new Date().toISOString();
  writeFieldState(state);
  setValue('distributionFieldStatus', 'done');
  updateFieldSummary();
  setStatus('Расклейка завершена. Скопируйте итог или передайте его в отчёт.');
}

function renderPointChecklist(){
  const box = document.getElementById('distributionFieldPointChecklist');
  if(!box) return;
  const state = readFieldState();
  const points = getPoints(value('distributionFieldPoints'));
  const completed = new Set(state.completedPointKeys || []);

  if(!points.length){
    box.innerHTML = '<span>Добавьте улицы, дома или подъезды — по одной точке в строке.</span>';
    return;
  }

  box.innerHTML = points.map((point, index) => `
    <label class="spn-field-point">
      <input type="checkbox" data-field-point-key="${escapeHtml(point.key)}" ${completed.has(point.key) ? 'checked' : ''}>
      <span><b>${index + 1}.</b> ${escapeHtml(point.text)}</span>
    </label>`).join('');
}

function updateFieldSummary(){
  const state = readFieldState();
  const points = getPoints(state.pointsText);
  const completed = new Set(state.completedPointKeys || []);
  const completedCount = points.filter(point => completed.has(point.key)).length;
  const plannedSheets = Number(value('distributionSheets')) || 0;
  const actualSheets = Number(state.actualSheets) || 0;
  const label = statusLabel(state.status);
  const launcher = document.getElementById('distributionFieldLauncherSummary');
  const result = document.getElementById('distributionFieldResult');

  if(launcher) launcher.textContent = `${label} · точки ${completedCount}/${points.length} · листы ${actualSheets}/${plannedSheets || '—'}`;
  if(result) result.textContent = buildFieldResultText();
}

function buildFieldResultText(){
  const state = readFieldState();
  const points = getPoints(state.pointsText);
  const completed = new Set(state.completedPointKeys || []);
  const plannedSheets = Number(value('distributionSheets')) || 0;
  const actualSheets = Number(state.actualSheets) || 0;
  const responsible = value('distributionResponsible') || 'не назначен';
  const deadline = value('distributionDeadline') || 'не указан';
  const place = value('distributionPlace') || value('area') || 'не указано';
  const pointLines = points.length
    ? points.map(point => `${completed.has(point.key) ? '☑' : '☐'} ${point.text}`)
    : ['точки не заполнены'];

  return [
    'ИТОГ РАСКЛЕЙКИ',
    `Статус: ${statusLabel(state.status)}`,
    `Локация: ${place}`,
    `Ответственный: ${responsible}`,
    `Срок: ${deadline}`,
    `Листы: план ${plannedSheets || '—'}, факт ${actualSheets || '—'}`,
    `Фотоотчёт: ${state.photoReport ? 'сделан' : 'не отмечен'}`,
    'Точки:',
    ...pointLines,
    `Проблемы: ${state.issues || 'не указаны'}`,
    state.startedAt ? `Начато: ${formatDateTime(state.startedAt)}` : '',
    state.completedAt ? `Завершено: ${formatDateTime(state.completedAt)}` : ''
  ].filter(Boolean).join('\n');
}

async function copyFieldResult(){
  const text = buildFieldResultText();
  try{
    await navigator.clipboard.writeText(text);
    setStatus('Итог расклейки скопирован.');
  } catch(error){
    fallbackCopy(text);
    setStatus('Итог выделен для копирования.');
  }
}

function sendToReport(){
  const reportPlace = document.getElementById('distributionReportPlace');
  const reportSheets = document.getElementById('distributionReportSheets');
  const reportNotes = document.getElementById('distributionReportNotes');
  const reportDate = document.getElementById('distributionReportDate');
  if(!reportPlace || !reportSheets || !reportNotes){
    setStatus('Блок отчёта пока не найден. Перейдите к шагу «Отчёт» и повторите.');
    return;
  }

  const state = readFieldState();
  const points = getPoints(state.pointsText);
  const completed = new Set(state.completedPointKeys || []);
  const completedPoints = points.filter(point => completed.has(point.key)).map(point => point.text);
  const place = completedPoints.join('; ') || value('distributionPlace') || value('area');
  const actualSheets = Number(state.actualSheets) || Number(value('distributionSheets')) || 0;
  const note = [
    `Полевой статус: ${statusLabel(state.status)}.`,
    `Точки выполнены: ${completedPoints.length}/${points.length}.`,
    `Фотоотчёт: ${state.photoReport ? 'сделан' : 'не отмечен'}.`,
    state.issues ? `Проблемы: ${state.issues}` : ''
  ].filter(Boolean).join(' ');

  if(reportDate && !reportDate.value) reportDate.value = new Date().toLocaleDateString('ru-RU');
  reportPlace.value = place;
  reportSheets.value = actualSheets;
  reportNotes.value = [reportNotes.value.trim(), note].filter(Boolean).join('\n');
  [reportDate, reportPlace, reportSheets, reportNotes].filter(Boolean).forEach(element => {
    element.dispatchEvent(new Event('input', {bubbles:true}));
    element.dispatchEvent(new Event('change', {bubbles:true}));
  });
  setStatus('Полевой итог перенесён в отчёт после расклейки.');
}

function getPoints(text){
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, MAX_POINTS)
    .map((point, index) => ({text:point, key:`${index}:${normalize(point)}`}));
}

function readFieldState(){
  try{
    const parsed = JSON.parse(localStorage.getItem(FIELD_KEY) || '{}');
    return {...defaultFieldState, ...(parsed && typeof parsed === 'object' ? parsed : {})};
  } catch(error){
    return {...defaultFieldState};
  }
}

function writeFieldState(state){
  try{ localStorage.setItem(FIELD_KEY, JSON.stringify(state)); } catch(error){}
}

function statusLabel(status){
  return ({planned:'Запланировано', in_progress:'В работе', done:'Выполнено', problem:'Есть проблема'})[status] || 'Запланировано';
}

function formatDateTime(value){
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ru-RU');
}

function openDialog(dialog){
  if(!dialog) return;
  if(typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  updateFieldSummary();
}

function closeDialog(dialog){
  if(!dialog) return;
  if(typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

function fallbackCopy(text){
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.focus();
  area.select();
  try{ document.execCommand('copy'); } catch(error){}
  area.remove();
}

function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function checked(id){
  return Boolean(document.getElementById(id)?.checked);
}
function setValue(id, next){
  const element = document.getElementById(id);
  if(element) element.value = next;
}
function setChecked(id, next){
  const element = document.getElementById(id);
  if(element) element.checked = Boolean(next);
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
function normalize(text){
  return String(text || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}
function escapeHtml(text){
  return String(text || '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-field-launcher{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;padding-top:8px;border-top:1px solid #d9f99d}
    .spn-field-launcher button{background:#365314;color:#fff;box-shadow:none}
    .spn-field-launcher span{font-size:10px;line-height:1.2;color:#4d7c0f;font-weight:900;text-align:right}
    .spn-field-dialog{width:min(680px,calc(100vw - 24px));max-height:calc(100vh - 24px);border:0;border-radius:20px;padding:14px;background:#fff;box-shadow:0 24px 90px rgba(15,23,42,.35);overflow:auto}
    .spn-field-dialog::backdrop{background:rgba(15,23,42,.58)}
    .spn-field-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;position:sticky;top:-14px;z-index:3;margin:-14px -14px 10px;padding:14px;background:#f7fee7;border-bottom:1px solid #d9f99d}
    .spn-field-dialog-head b{display:block;font-size:16px;font-weight:900;color:#365314}
    .spn-field-dialog-head span{display:block;margin-top:3px;font-size:11px;line-height:1.25;color:#4d7c0f;font-weight:700}
    .spn-field-status-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .spn-field-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .spn-field-actions.compact{grid-template-columns:repeat(3,1fr)}
    .spn-field-actions button{background:#365314;color:#fff;box-shadow:none}
    .spn-field-points{display:grid;gap:6px;margin-top:7px;padding:8px;border:1px solid #d9f99d;border-radius:12px;background:#f7fee7}
    .spn-field-points>span{font-size:11px;color:#4d7c0f;font-weight:700}
    .spn-field-point{display:flex;align-items:flex-start;gap:8px;margin:0;padding:8px;border-radius:10px;background:#fff;color:#26350b}
    .spn-field-point input{width:auto;margin-top:2px}
    .spn-field-point span{font-size:13px;line-height:1.3;font-weight:800}
    .spn-field-photo-check{display:flex;align-items:center;gap:8px;margin-top:10px;padding:9px;border-radius:12px;background:#eff6ff;color:#1e3a8a}
    .spn-field-photo-check input{width:auto}
    .spn-field-result{margin-top:10px;white-space:pre-wrap;padding:10px;border:1px dashed #84cc16;border-radius:12px;background:#f8fafc;font-size:11px;line-height:1.4;color:#26350b;font-weight:750}
    .spn-field-dialog>p{font-size:10.5px;line-height:1.3;color:#64748b;font-weight:700}
    @media(max-width:640px){.spn-field-dialog{width:100vw;height:100dvh;max-height:100dvh;margin:0;border-radius:0}.spn-field-status-row,.spn-field-actions,.spn-field-actions.compact{grid-template-columns:1fr}.spn-field-launcher{align-items:flex-start;flex-direction:column}.spn-field-launcher span{text-align:left}}
    @media print{.spn-field-launcher,.spn-field-dialog{display:none!important}}
  `;
  document.head.appendChild(style);
}
