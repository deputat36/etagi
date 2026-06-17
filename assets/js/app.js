import { goals, photoModes, printPresets, areaPresets, propertyPresets, cloneDefaultState } from './state.js';
import { $, esc, readFileAsDataURL, downloadText, debounce } from './utils.js';
import { loadTemplates, filterTemplates } from './templates.js';
import { applyCss, renderSheet, getGrid } from './render.js';
import { checkQuality } from './quality.js';
import { autoSave, saveNamed, loadNamed, loadAutoSave, saveProfile, loadProfile } from './storage.js';

let state = cloneDefaultState();
let templates = [];
let lastQuality = null;
const debouncedSave = debounce(()=>autoSave(state), 500);

const profileFields = ['agentName','agentPhone'];
const objectFields = ['area','propertyType','price','params','headline','description','benefits'];
const fields = [...profileFields, ...objectFields, 'qrLink','qrCaption','splitMode','colorMode','pageMargin','pageGap','flyerPadding','radius','headlineScale','phoneScale','layoutDensity','photoFit'];
const checks = ['tearOffs','showBrand','showBenefits','showMeta'];

async function init(){
  bindStaticUi();
  renderGoals();
  renderPhotoModes();
  renderPrintPresets();
  renderPresetChips();
  templates = await loadTemplates();
  const saved = loadAutoSave();
  if(saved && saved.version === state.version){ state = {...state, ...saved}; }
  if(!state.templateId){
    const first = templates.find(t=>t.goal === state.goal) || templates[0];
    applyTemplate(first);
  } else {
    syncFormFromState();
  }
  renderAll();
  setStatus('Готово. Выберите задачу и шаблон.');
}

function bindStaticUi(){
  fields.forEach(id => $(id).addEventListener('input', readFormAndRender));
  fields.forEach(id => $(id).addEventListener('change', readFormAndRender));
  checks.forEach(id => $(id).addEventListener('change', readFormAndRender));
  $('templateSearch').addEventListener('input', renderTemplates);
  $('templateDensityFilter').addEventListener('change', renderTemplates);
  $('photoOne').addEventListener('change', async e => { state.photoOne = await readFileAsDataURL(e.target.files[0]); if(state.photoMode==='none') state.photoMode='one'; syncFormFromState(); renderAll(); });
  $('photoTwo').addEventListener('change', async e => { state.photoTwo = await readFileAsDataURL(e.target.files[0]); if(state.photoMode!=='two') state.photoMode='two'; syncFormFromState(); renderAll(); });
  $('qualityBtn').onclick = () => runQuality(true);
  $('printBtn').onclick = printFlow;
  $('cancelPrintBtn').onclick = () => $('printDialog').close();
  $('confirmPrintBtn').onclick = () => { $('printDialog').close(); setTimeout(()=>window.print(), 80); };
  $('fitPreviewBtn').onclick = () => { $('zoom').value = 64; applyZoom(); };
  $('zoom').oninput = applyZoom;
  $('makeShortBtn').onclick = () => { state.description = shorten(state.description, 190); syncFormFromState(); renderAll(); };
  $('makeStrongerBtn').onclick = strengthenText;
  $('saveProfileBtn').onclick = saveCurrentProfile;
  $('loadProfileBtn').onclick = loadSavedProfile;
  $('clearObjectBtn').onclick = clearObjectData;
  $('saveLocalBtn').onclick = () => { saveNamed(state); setStatus('Макет сохранён в этом браузере.'); };
  $('loadLocalBtn').onclick = () => { const s = loadNamed(); if(s){ state={...state,...s}; syncFormFromState(); renderAll(); setStatus('Макет загружен.'); } else setStatus('Сохранённый макет не найден.'); };
  $('downloadBtn').onclick = () => downloadText(`etagi-raskleyka-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state,null,2));
  $('uploadBtn').onclick = () => $('uploadFile').click();
  $('uploadFile').onchange = loadFromFile;
}

function renderGoals(){
  $('goalGrid').innerHTML = goals.map(g=>`<button type="button" class="goal-btn" data-goal="${g.id}"><b>${esc(g.title)}</b><span>${esc(g.hint)}</span></button>`).join('');
  $('goalGrid').querySelectorAll('[data-goal]').forEach(btn=>btn.onclick=()=>{
    state.goal = btn.dataset.goal;
    const first = filterTemplates(templates, state.goal)[0];
    if(first) applyTemplate(first);
    renderAll();
  });
}
function renderPhotoModes(){
  $('photoModeRow').innerHTML = photoModes.map(m=>`<button type="button" data-photo="${m.id}">${esc(m.title)}</button>`).join('');
  $('photoModeRow').querySelectorAll('[data-photo]').forEach(btn=>btn.onclick=()=>{ state.photoMode=btn.dataset.photo; if(state.photoMode==='none'){state.photoOne='';state.photoTwo='';} renderAll(); });
}
function renderPrintPresets(){
  $('printPresetRow').innerHTML = printPresets.map(p=>`<button type="button" data-count="${p.count}">${esc(p.title)}</button>`).join('');
  $('printPresetRow').querySelectorAll('[data-count]').forEach(btn=>btn.onclick=()=>{ state.printCount=Number(btn.dataset.count); renderAll(); });
}
function renderPresetChips(){
  $('areaPresets').innerHTML = areaPresets.map(x=>`<button type="button" class="chip-btn" data-area="${esc(x)}">${esc(x)}</button>`).join('');
  $('propertyPresets').innerHTML = propertyPresets.map(x=>`<button type="button" class="chip-btn" data-property="${esc(x)}">${esc(x)}</button>`).join('');
  $('areaPresets').querySelectorAll('[data-area]').forEach(btn=>btn.onclick=()=>{ state.area = btn.dataset.area; syncFormFromState(); renderAll(); });
  $('propertyPresets').querySelectorAll('[data-property]').forEach(btn=>btn.onclick=()=>{ state.propertyType = btn.dataset.property; syncFormFromState(); renderAll(); });
}
function renderTemplates(){
  const list = filterTemplates(templates, state.goal, $('templateSearch').value, $('templateDensityFilter').value);
  $('templateList').innerHTML = list.length ? list.map(t=>templateCard(t)).join('') : '<div class="empty">Под эту задачу ничего не найдено</div>';
  $('templateList').querySelectorAll('[data-template]').forEach(el=>el.onclick=()=>{ const t=templates.find(x=>x.id===el.dataset.template); applyTemplate(t); renderAll(); });
}
function templateCard(t){
  const miniClass = t.photo === 'two' ? 'two-photo' : (t.photo && t.photo !== 'none' ? 'has-photo' : '');
  return `<div class="tpl-card ${state.templateId===t.id?'active':''}" data-template="${t.id}">
    <div class="tpl-mini ${miniClass}"><div class="mh"></div><div class="ml"></div><div class="ml"></div><div class="mp"></div></div>
    <div><b>${esc(t.title)}</b><p>${esc(t.note || '')}</p><div class="badges">${(t.tags||[]).slice(0,5).map(x=>`<span class="badge">${esc(x)}</span>`).join('')}</div></div>
  </div>`;
}
function applyTemplate(t){
  if(!t) return;
  const keepProfile = pickProfile(state);
  state = {...state, ...t.data, ...keepProfile, goal:t.goal, templateId:t.id};
  state.photoMode = t.photo || state.photoMode || 'none';
  if(t.printCount) state.printCount = t.printCount;
  if(t.density) state.layoutDensity = t.density;
  syncFormFromState();
}
function pickProfile(source){
  return Object.fromEntries(profileFields.map(id=>[id, source[id] || '']));
}
function syncFormFromState(){
  fields.forEach(id => { if($(id)) $(id).value = state[id] ?? ''; });
  checks.forEach(id => { if($(id)) $(id).checked = !!state[id]; });
  document.querySelectorAll('[data-goal]').forEach(b=>b.classList.toggle('active', b.dataset.goal===state.goal));
  document.querySelectorAll('[data-photo]').forEach(b=>b.classList.toggle('active', b.dataset.photo===state.photoMode));
  document.querySelectorAll('[data-count]').forEach(b=>b.classList.toggle('active', Number(b.dataset.count)===Number(state.printCount)));
  document.querySelectorAll('[data-area]').forEach(b=>b.classList.toggle('active', b.dataset.area===state.area));
  document.querySelectorAll('[data-property]').forEach(b=>b.classList.toggle('active', b.dataset.property===state.propertyType));
}
function readFormAndRender(){
  fields.forEach(id => { state[id] = $(id).type === 'number' || $(id).type === 'range' ? Number($(id).value) : $(id).value; });
  checks.forEach(id => { state[id] = $(id).checked; });
  renderAll();
}
function renderAll(){
  syncFormFromState();
  applyCss(state);
  renderTemplates();
  const grid = renderSheet($('printSheet'), state);
  updatePreviewStatus(grid);
  debouncedSave();
  setTimeout(()=>runQuality(false), 80);
  applyZoom();
}
function updatePreviewStatus(grid = getGrid(state.printCount, state.splitMode)){
  const photo = state.photoMode === 'none' ? 'без фото' : state.photoMode === 'two' ? '2 фото' : 'с фото';
  const color = state.colorMode === 'private' ? 'частное' : state.colorMode === 'bw' ? 'ч/б' : 'цвет';
  const score = lastQuality?.score;
  $('previewStatus').innerHTML = `<span class="stat">${state.printCount} на А4</span><span class="stat">${grid.label}</span><span class="stat">${photo}</span><span class="stat">${color}</span>${state.area ? `<span class="stat">${esc(state.area)}</span>` : ''}${score ? `<span class="stat ${score>=80?'good':score<60?'warn':''}">качество ${score}/100</span>` : ''}`;
}
function runQuality(show){
  lastQuality = checkQuality(state, $('printSheet'));
  $('qualityScore').textContent = `${lastQuality.score}/100`;
  $('qualityScore').className = lastQuality.score>=80 ? 'score-good' : lastQuality.score>=60 ? 'score-mid' : 'score-bad';
  $('qualityList').innerHTML = lastQuality.issues.length ? lastQuality.issues.map(issueHtml).join('') : '<div class="qitem tip"><b>Макет готов</b>Критичных замечаний нет. Проверьте телефон и печатайте.</div>';
  $('qualityList').querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>applyFix(b.dataset.fix));
  updatePreviewStatus();
  if(show) setStatus(lastQuality.issues.length ? 'Есть замечания. Исправьте важные перед печатью.' : 'Проверка пройдена.');
  return lastQuality;
}
function issueHtml(i){
  const labels = {phone:'Ввести телефон', bigPhone:'Увеличить телефон', shortHeadline:'Сократить заголовок', shortDesc:'Сократить описание', noPhoto:'Убрать фото', onePhoto:'Оставить 1 фото', twoOnPage:'Сделать 2 на А4', cleanBrand:'Убрать фирменность', autoFix:'Исправить автоматически'};
  return `<div class="qitem ${i.level}"><b>${esc(i.title)}</b>${esc(i.text)}${labels[i.action]?`<br><button type="button" data-fix="${i.action}">${labels[i.action]}</button>`:''}</div>`;
}
function applyFix(action){
  if(action === 'phone') $('agentPhone').focus();
  if(action === 'bigPhone') state.phoneScale = 1.45;
  if(action === 'shortHeadline') state.headline = shorten(state.headline, 44);
  if(action === 'shortDesc') state.description = shorten(state.description, 190);
  if(action === 'noPhoto') state.photoMode = 'none';
  if(action === 'onePhoto') state.photoMode = 'one';
  if(action === 'twoOnPage') state.printCount = 2;
  if(action === 'cleanBrand') { state.colorMode='private'; state.showBrand=false; state.headline=state.headline.replace(/этажи/ig,'').trim(); state.description=state.description.replace(/этажи/ig,'').trim(); }
  if(action === 'autoFix') autoFix();
  renderAll();
}
function autoFix(){
  if(Number(state.printCount) >= 4 && state.description.length > 220) state.description = shorten(state.description, 190);
  if(Number(state.printCount) >= 6 && state.photoMode !== 'none') state.printCount = 2;
  if(state.phoneScale < 1.3) state.phoneScale = 1.35;
}
function strengthenText(){
  if(!state.description) return;
  if(!/позвон|напишите|подскажу/i.test(state.description)) state.description += ' Позвоните — подскажу детали и помогу разобраться.';
  if(!state.benefits) state.benefits = 'Безопасное сопровождение\nПомощь с документами\nКонсультация по цене';
  syncFormFromState(); renderAll();
}
function saveCurrentProfile(){
  const profile = pickProfile(state);
  if(!profile.agentName && !profile.agentPhone){ setStatus('Сначала заполните имя и телефон СПН.'); return; }
  saveProfile(profile);
  setStatus('Профиль СПН сохранён. Теперь можно менять шаблоны без потери имени и телефона.');
}
function loadSavedProfile(){
  const profile = loadProfile();
  if(!profile){ setStatus('Сохранённый профиль СПН не найден.'); return; }
  state = {...state, ...profile};
  syncFormFromState(); renderAll();
  setStatus('Профиль СПН загружен.');
}
function clearObjectData(){
  objectFields.forEach(id=>state[id]='');
  state.photoOne='';
  state.photoTwo='';
  state.qrLink='';
  state.qrCaption='';
  state.photoMode='none';
  syncFormFromState(); renderAll();
  setStatus('Данные объекта очищены. Имя и телефон СПН сохранены.');
}
function shorten(text, max){
  const s = String(text || '').trim();
  if(s.length <= max) return s;
  return s.slice(0, max-3).replace(/[\s,.;:!-]+$/,'') + '...';
}
function printFlow(){
  const q = runQuality(true);
  if(q.issues.some(i=>i.level==='error')){ setStatus('Есть критичные ошибки. Исправьте перед печатью.'); return; }
  $('printDialog').showModal();
}
function applyZoom(){
  $('sheetScale').style.transform = `scale(${$('zoom').value/100})`;
}
function setStatus(text){ $('statusLine').textContent = text; }
function loadFromFile(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { state = {...state, ...JSON.parse(reader.result)}; syncFormFromState(); renderAll(); setStatus('Файл макета открыт.'); }
    catch(err){ setStatus('Не удалось открыть файл.'); }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', init);
