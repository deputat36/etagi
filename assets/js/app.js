import { goals, photoModes, printPresets, propertyPresets, layoutModes, scenarioPresets, cloneDefaultState } from './state.js';
import { $, esc, readFileAsDataURL, downloadText, debounce } from './utils.js';
import { loadTemplates, filterTemplates } from './templates.js';
import { applyCss, renderSheet, getGrid } from './render.js';
import { checkQuality } from './quality.js';
import { autoSave, saveNamed, loadNamed, loadAutoSave, saveProfile, loadProfile, listSavedLayouts, saveLayout, loadLayout, deleteLayout, listFavoriteTemplates, toggleFavoriteTemplate } from './storage.js';
import { applyLayoutMode, applyLayoutModePreservingMedia, getLayoutHints } from './layoutRules.js';

let state = cloneDefaultState();
let templates = [];
let lastQuality = null;
let favoriteTemplateIds = new Set();
let selectedScenario = 'all';
const debouncedSave = debounce(()=>autoSave(state), 500);

const profileFields = ['agentName','agentPhone'];
const objectFields = ['area','propertyType','price','params','headline','description','benefits','customBlockTitle','customBlockText'];
const fields = ['layoutName', ...profileFields, ...objectFields, 'qrLink','qrCaption','splitMode','colorMode','pageMargin','pageGap','flyerPadding','radius','headlineScale','phoneScale','layoutDensity','photoFit'];
const blockVisibility = ['showHeadline','showPrice','showDescription','showMeta','showBenefits','showCustomBlock','showPhoto','showQr','showContact'];
const checks = ['tearOffs','showCutLines','safePrintMargins','printCheckMode','showBrand', ...blockVisibility];
const DEFAULT_BLOCK_ORDER = ['headline','price','photo','description','meta','benefits','customBlock','contact'];
const blockOrderLabels = {
  headline: 'Заголовок',
  price: 'Цена / бюджет',
  photo: 'Фото',
  description: 'Описание',
  meta: 'Параметры',
  benefits: 'Преимущества',
  customBlock: 'Доп. блок',
  contact: 'Контакты / телефон'
};
const blockVisibilityMap = {
  headline: 'showHeadline',
  price: 'showPrice',
  photo: 'showPhoto',
  description: 'showDescription',
  meta: 'showMeta',
  benefits: 'showBenefits',
  customBlock: 'showCustomBlock',
  contact: 'showContact'
};

async function init(){
  bindStaticUi();
  renderGoals();
  renderPhotoModes();
  renderPrintPresets();
  renderPresetChips();
  renderLayoutModes();
  renderSavedLayouts();
  renderBlockOrderControls();
  renderTemplateFavoriteToolbar();
  renderScenarioFilters();
  favoriteTemplateIds = new Set(listFavoriteTemplates());
  templates = await loadTemplates();
  const saved = loadAutoSave();
  if(saved){ state = {...state, ...saved, version: state.version}; }
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
  $('blockOrderList').addEventListener('click', handleBlockOrderClick);
  $('resetBlockOrderBtn').onclick = resetBlockOrder;
  $('photoOne').addEventListener('change', async e => { state.photoOne = await readFileAsDataURL(e.target.files[0]); if(state.photoMode==='none') state.photoMode='one'; state.showPhoto = true; state.layoutMode='manual'; syncFormFromState(); renderAll(); });
  $('photoTwo').addEventListener('change', async e => { state.photoTwo = await readFileAsDataURL(e.target.files[0]); if(state.photoMode!=='two') state.photoMode='two'; state.showPhoto = true; state.layoutMode='manual'; syncFormFromState(); renderAll(); });
  $('qualityBtn').onclick = () => runQuality(true);
  $('printBtn').onclick = printFlow;
  $('cancelPrintBtn').onclick = () => $('printDialog').close();
  $('confirmPrintBtn').onclick = () => { $('printDialog').close(); setTimeout(()=>window.print(), 80); };
  $('fitPreviewBtn').onclick = () => { $('zoom').value = 64; applyZoom(); };
  $('zoom').oninput = applyZoom;
  $('makeShortBtn').onclick = shortenDescription;
  $('makeStrongerBtn').onclick = strengthenText;
  $('saveProfileBtn').onclick = saveCurrentProfile;
  $('loadProfileBtn').onclick = loadSavedProfile;
  $('clearObjectBtn').onclick = clearObjectData;
  $('autoLayoutBtn').onclick = () => applyMode('auto');
  if($('preserveMediaLayoutBtn')) $('preserveMediaLayoutBtn').onclick = () => applyModePreservingMedia('auto');
  $('saveNamedLayoutBtn').onclick = saveCurrentNamedLayout;
  $('loadNamedLayoutBtn').onclick = loadSelectedLayout;
  $('deleteNamedLayoutBtn').onclick = deleteSelectedLayout;
  $('saveLocalBtn').onclick = () => {
    const saved = saveNamed(state);
    setStatus(saved ? 'Последний макет сохранён в этом браузере.' : 'Не удалось сохранить последний макет. Возможно, в браузере закончилось место.');
  };
  $('loadLocalBtn').onclick = () => {
    const s = loadNamed();
    if(s){
      state = cleanLoadedState(s);
      if($('savedLayouts')) $('savedLayouts').value='';
      syncFormFromState(); renderAll();
      setStatus('Последний макет загружен без смешивания с текущим макетом.');
    } else setStatus('Последний сохранённый макет не найден.');
  };
  $('downloadBtn').onclick = () => downloadText(`etagi-raskleyka-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state,null,2));
  $('uploadBtn').onclick = () => $('uploadFile').click();
  $('uploadFile').onchange = loadFromFile;
}

function renderGoals(){
  $('goalGrid').innerHTML = goals.map(g=>`<button type="button" class="goal-btn" data-goal="${g.id}"><b>${esc(g.title)}</b><span>${esc(g.hint)}</span></button>`).join('');
  $('goalGrid').querySelectorAll('[data-goal]').forEach(btn=>btn.onclick=()=>{
    state.goal = btn.dataset.goal;
    selectedScenario = 'all';
    const first = filterTemplates(templates, state.goal)[0];
    if(first) applyTemplate(first);
    renderAll();
  });
}
function renderPhotoModes(){
  $('photoModeRow').innerHTML = photoModes.map(m=>`<button type="button" data-photo="${m.id}">${esc(m.title)}</button>`).join('');
  $('photoModeRow').querySelectorAll('[data-photo]').forEach(btn=>btn.onclick=()=>{ state.photoMode=btn.dataset.photo; state.showPhoto = state.photoMode !== 'none'; state.layoutMode='manual'; if(state.photoMode==='none'){state.photoOne='';state.photoTwo='';} renderAll(); });
}
function renderPrintPresets(){
  $('printPresetRow').innerHTML = printPresets.map(p=>`<button type="button" data-count="${p.count}">${esc(p.title)}</button>`).join('');
  $('printPresetRow').querySelectorAll('[data-count]').forEach(btn=>btn.onclick=()=>{ state.printCount=Number(btn.dataset.count); state.layoutMode='manual'; renderAll(); });
}
function renderPresetChips(){
  $('propertyPresets').innerHTML = propertyPresets.map(x=>`<button type="button" class="chip-btn" data-property="${esc(x)}">${esc(x)}</button>`).join('');
  $('propertyPresets').querySelectorAll('[data-property]').forEach(btn=>btn.onclick=()=>{ state.propertyType = btn.dataset.property; state.showMeta = true; state.layoutMode='manual'; syncFormFromState(); renderAll(); });
}
function renderLayoutModes(){
  $('layoutModeGrid').innerHTML = layoutModes.map(m=>`<button type="button" class="layout-mode-btn" data-layout-mode="${m.id}"><b>${esc(m.title)}</b><span>${esc(m.hint)}</span></button>`).join('');
  $('layoutModeGrid').querySelectorAll('[data-layout-mode]').forEach(btn=>btn.onclick=()=>applyMode(btn.dataset.layoutMode));
}
function renderTemplateFavoriteToolbar(){
  const toolbar = $('templateSearch').closest('.toolbar-row');
  if(!toolbar || $('showFavoriteTemplatesOnly')) return;
  toolbar.insertAdjacentHTML('beforeend', '<label class="favorite-filter"><input id="showFavoriteTemplatesOnly" type="checkbox"> Избранные</label>');
  $('showFavoriteTemplatesOnly').addEventListener('change', renderTemplates);
}
function renderScenarioFilters(){
  const toolbar = $('templateSearch').closest('.toolbar-row');
  if(!toolbar || $('scenarioFilterRow')) return;
  toolbar.insertAdjacentHTML('afterend', '<div class="chip-row scenario-filter-row" id="scenarioFilterRow"></div><div class="template-count-line" id="templateCountLine"></div>');
  $('scenarioFilterRow').addEventListener('click', event => {
    const btn = event.target.closest('[data-scenario]');
    if(!btn || btn.disabled) return;
    selectedScenario = btn.dataset.scenario;
    renderTemplates();
  });
  updateScenarioFilters();
}
function getBaseTemplateList(){
  let list = filterTemplates(templates, state.goal, $('templateSearch').value, $('templateDensityFilter').value);
  const favoritesOnly = $('showFavoriteTemplatesOnly')?.checked;
  if(favoritesOnly) list = list.filter(t => favoriteTemplateIds.has(t.id));
  return list;
}
function updateScenarioFilters(baseList = getBaseTemplateList()){
  const row = $('scenarioFilterRow');
  if(!row) return;
  const counts = Object.fromEntries(scenarioPresets.map(item => [item.id, countScenario(baseList, item.id)]));
  row.innerHTML = scenarioPresets.map(item => {
    const count = counts[item.id] || 0;
    const active = selectedScenario === item.id;
    const disabled = item.id !== 'all' && count === 0;
    return `<button type="button" class="chip-btn scenario-chip ${active ? 'active' : ''}" data-scenario="${item.id}" ${disabled ? 'disabled' : ''}>${esc(item.title)} <span class="chip-count">${count}</span></button>`;
  }).join('');
}
function countScenario(list, scenario){
  if(!scenario || scenario === 'all') return list.length;
  return list.filter(t => matchScenario(t, scenario)).length;
}
function updateTemplateCountLine(visibleCount, baseCount){
  const el = $('templateCountLine');
  if(!el) return;
  const scenarioTitle = scenarioPresets.find(item => item.id === selectedScenario)?.title || 'Все';
  const favoriteText = $('showFavoriteTemplatesOnly')?.checked ? ' · только избранные' : '';
  el.textContent = `Найдено шаблонов: ${visibleCount} из ${baseCount}. Сценарий: ${scenarioTitle}${favoriteText}.`;
}
function renderSavedLayouts(selectedId = ''){
  const select = $('savedLayouts');
  const layouts = listSavedLayouts();
  select.innerHTML = '<option value="">Сохранённые макеты</option>' + layouts.map(item => `<option value="${esc(item.id)}">${esc(item.name)} — ${new Date(item.updatedAt).toLocaleDateString('ru-RU')}</option>`).join('');
  if(selectedId) select.value = selectedId;
}
function renderBlockOrderControls(){
  state.blockOrder = normalizeBlockOrder(state.blockOrder);
  $('blockOrderList').innerHTML = state.blockOrder.map((id, index) => {
    const visibilityKey = blockVisibilityMap[id];
    const isVisible = visibilityKey ? state[visibilityKey] !== false : true;
    return `<div class="block-order-item ${isVisible ? '' : 'muted-block'}" data-block-id="${id}">
      <span class="block-order-name">${index + 1}. ${esc(blockOrderLabels[id] || id)}${isVisible ? '' : ' — скрыт'}</span>
      <span class="block-order-actions">
        <button type="button" data-block-move="up" data-block-id="${id}" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-block-move="down" data-block-id="${id}" ${index === state.blockOrder.length - 1 ? 'disabled' : ''}>↓</button>
      </span>
    </div>`;
  }).join('');
}
function handleBlockOrderClick(event){
  const btn = event.target.closest('[data-block-move]');
  if(!btn) return;
  moveBlock(btn.dataset.blockId, btn.dataset.blockMove);
}
function moveBlock(blockId, direction){
  const order = normalizeBlockOrder(state.blockOrder);
  const index = order.indexOf(blockId);
  if(index < 0) return;
  const target = direction === 'up' ? index - 1 : index + 1;
  if(target < 0 || target >= order.length) return;
  [order[index], order[target]] = [order[target], order[index]];
  state.blockOrder = order;
  state.layoutMode = 'manual';
  renderAll();
  setStatus(`Порядок блока «${blockOrderLabels[blockId] || blockId}» изменён.`);
}
function resetBlockOrder(){
  state.blockOrder = [...DEFAULT_BLOCK_ORDER];
  state.layoutMode = 'manual';
  renderAll();
  setStatus('Порядок блоков сброшен.');
}
function normalizeBlockOrder(order){
  const safe = Array.isArray(order) ? order.filter(id => DEFAULT_BLOCK_ORDER.includes(id)) : [];
  return [...new Set([...safe, ...DEFAULT_BLOCK_ORDER])];
}
function saveCurrentNamedLayout(){
  const name = (state.layoutName || state.headline || state.goal || 'Макет без названия').trim();
  if(!name){ setStatus('Укажите название макета.'); $('layoutName').focus(); return; }
  state.layoutName = name;
  const item = saveLayout(name, state);
  if(!item){ setStatus('Не удалось сохранить макет. Возможно, в браузере закончилось место.'); return; }
  renderSavedLayouts(item.id);
  syncFormFromState();
  setStatus(`Макет «${name}» сохранён.`);
}
function loadSelectedLayout(){
  const id = $('savedLayouts').value;
  if(!id){ setStatus('Сначала выберите сохранённый макет.'); return; }
  const item = loadLayout(id);
  if(!item){ setStatus('Сохранённый макет не найден.'); renderSavedLayouts(); return; }
  state = cleanLoadedState(item.state);
  syncFormFromState();
  renderAll();
  renderSavedLayouts(id);
  setStatus(`Макет «${item.name}» загружен без смешивания с текущим макетом.`);
}
function cleanLoadedState(source){
  const currentVersion = state.version;
  const nextState = {...cloneDefaultState(), ...(source || {}), version:currentVersion};
  return {...nextState, blockOrder: normalizeBlockOrder(nextState.blockOrder)};
}
function deleteSelectedLayout(){
  const id = $('savedLayouts').value;
  if(!id){ setStatus('Сначала выберите макет для удаления.'); return; }
  const next = deleteLayout(id);
  if(!next){ setStatus('Не удалось удалить макет. Возможно, браузер запретил изменение сохранений.'); return; }
  renderSavedLayouts();
  setStatus('Сохранённый макет удалён.');
}
function applyMode(mode){
  state = applyLayoutMode(state, mode);
  state.blockOrder = normalizeBlockOrder(state.blockOrder);
  syncFormFromState();
  renderAll();
  setStatus(mode === 'auto' ? 'Макет подстроен автоматически.' : `Применён режим: ${layoutModes.find(m=>m.id===mode)?.title || mode}.`);
}
function applyModePreservingMedia(mode){
  state = applyLayoutModePreservingMedia(state, mode);
  state.blockOrder = normalizeBlockOrder(state.blockOrder);
  syncFormFromState();
  renderAll();
  setStatus('Макет подстроен без отключения включённых фото и QR. Проверьте подсказки по читаемости.');
}
function renderTemplates(){
  const baseList = getBaseTemplateList();
  updateScenarioFilters(baseList);
  const list = baseList.filter(t => matchScenario(t, selectedScenario));
  updateTemplateCountLine(list.length, baseList.length);
  const favoritesOnly = $('showFavoriteTemplatesOnly')?.checked;
  const emptyText = favoritesOnly ? 'В этой задаче пока нет избранных шаблонов' : selectedScenario !== 'all' ? 'В этом сценарии пока нет шаблонов' : 'Под эту задачу ничего не найдено';
  $('templateList').innerHTML = list.length ? list.map(t=>templateCard(t)).join('') : `<div class="empty">${emptyText}</div>`;
  $('templateList').querySelectorAll('[data-favorite-template]').forEach(btn=>btn.onclick=(event)=>{
    event.stopPropagation();
    const favorites = toggleFavoriteTemplate(btn.dataset.favoriteTemplate);
    if(!favorites){ setStatus('Не удалось изменить избранное. Возможно, в браузере закончилось место.'); return; }
    favoriteTemplateIds = new Set(favorites);
    renderTemplates();
    setStatus(favoriteTemplateIds.has(btn.dataset.favoriteTemplate) ? 'Шаблон добавлен в избранное.' : 'Шаблон убран из избранного.');
  });
  $('templateList').querySelectorAll('[data-template]').forEach(el=>el.onclick=()=>{ const t=templates.find(x=>x.id===el.dataset.template); applyTemplate(t); renderAll(); });
}
function matchScenario(t, scenario){
  if(!scenario || scenario === 'all') return true;
  const tags = (t.tags || []).map(x => String(x).toLowerCase());
  const text = `${t.title || ''} ${t.note || ''} ${tags.join(' ')}`.toLowerCase();
  if(scenario === 'entrance') return Number(t.printCount) >= 4 || tags.includes('подъезд') || text.includes('подъезд') || text.includes('сосед');
  if(scenario === 'owner') return t.goal === 'seller' || text.includes('собствен') || text.includes('продав');
  if(scenario === 'buyer') return t.goal === 'buyer' || text.includes('покупател');
  if(scenario === 'object') return t.goal === 'object' || text.includes('объект') || text.includes('продам');
  if(scenario === 'newbuild') return t.goal === 'newbuild' || text.includes('новострой');
  if(scenario === 'private') return t.goal === 'private' || t.data?.colorMode === 'private' || text.includes('частное');
  if(scenario === 'photo') return t.photo && t.photo !== 'none';
  if(scenario === 'economy') return Number(t.printCount) >= 4 || t.density === 'dense' || text.includes('эконом');
  return true;
}
function templateCard(t){
  const miniClass = t.photo === 'two' ? 'two-photo' : (t.photo && t.photo !== 'none' ? 'has-photo' : '');
  const isFavorite = favoriteTemplateIds.has(t.id);
  return `<div class="tpl-card ${state.templateId===t.id?'active':''}" data-template="${t.id}">
    <button type="button" class="favorite-template-btn ${isFavorite ? 'active' : ''}" data-favorite-template="${t.id}" title="${isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}">${isFavorite ? '★' : '☆'}</button>
    <div class="tpl-mini ${miniClass}"><div class="mh"></div><div class="ml"></div><div class="ml"></div><div class="mp"></div></div>
    <div><b>${esc(t.title)}</b><p>${esc(t.note || '')}</p><div class="badges">${(t.tags||[]).slice(0,5).map(x=>`<span class="badge">${esc(x)}</span>`).join('')}</div></div>
  </div>`;
}
function applyTemplate(t){
  if(!t) return;
  const keepProfile = pickProfile(state);
  const keepPhotos = { photoOne: state.photoOne || '', photoTwo: state.photoTwo || '' };
  const base = cloneDefaultState();
  state = {
    ...base,
    version: state.version,
    ...t.data,
    ...keepProfile,
    ...keepPhotos,
    goal: t.goal,
    templateId: t.id,
    layoutName: t.title || t.data?.layoutName || '',
    layoutMode: 'manual'
  };
  state.blockOrder = normalizeBlockOrder(t.data?.blockOrder || base.blockOrder);
  state.photoMode = t.photo || state.photoMode || 'none';
  if(t.printCount) state.printCount = t.printCount;
  if(t.density) state.layoutDensity = t.density;
  if(state.photoMode === 'none') state.showPhoto = false;
  if(state.showPhoto && state.photoMode !== 'none' && (state.photoOne || state.photoTwo)) state.showPhoto = true;
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
  document.querySelectorAll('[data-property]').forEach(b=>b.classList.toggle('active', b.dataset.property===state.propertyType));
  document.querySelectorAll('[data-layout-mode]').forEach(b=>b.classList.toggle('active', b.dataset.layoutMode===state.layoutMode));
}
function readFormAndRender(){
  fields.forEach(id => { state[id] = $(id).type === 'number' || $(id).type === 'range' ? Number($(id).value) : $(id).value; });
  checks.forEach(id => { state[id] = $(id).checked; });
  if(!state.showPhoto) state.photoMode = 'none';
  state.blockOrder = normalizeBlockOrder(state.blockOrder);
  state.layoutMode = 'manual';
  renderAll();
}
function renderAll(){
  syncFormFromState();
  renderBlockOrderControls();
  renderLayoutHints();
  applyCss(state);
  renderTemplates();
  const grid = renderSheet($('printSheet'), state);
  updatePreviewStatus(grid);
  debouncedSave();
  setTimeout(()=>runQuality(false), 80);
  applyZoom();
}
function renderLayoutHints(){
  const hints = getLayoutHints(state);
  $('layoutHints').innerHTML = hints.length ? hints.map(h=>`<div class="layout-hint">${esc(h)}</div>`).join('') : '<div class="layout-hint good">Состав макета выглядит логично.</div>';
}
function updatePreviewStatus(grid = getGrid(state.printCount, state.splitMode)){
  const photo = state.showPhoto && state.photoMode !== 'none' ? (state.photoMode === 'two' ? '2 фото' : 'с фото') : 'без фото';
  const color = state.colorMode === 'private' ? 'частное' : state.colorMode === 'bw' ? 'ч/б' : 'цвет';
  const blocks = blockVisibility.filter(id=>state[id]).length;
  const modeTitle = state.layoutMode && state.layoutMode !== 'manual' ? layoutModes.find(m=>m.id===state.layoutMode)?.title || 'авто' : 'ручной';
  const scenarioTitle = scenarioPresets.find(item => item.id === selectedScenario)?.title || 'Все';
  const printHelpers = [state.showCutLines ? 'рез' : '', state.safePrintMargins ? 'поля' : '', state.printCheckMode ? 'проверка' : ''].filter(Boolean).join(' / ');
  const score = lastQuality?.score;
  $('previewStatus').innerHTML = `<span class="stat">${state.printCount} на А4</span><span class="stat">${grid.label}</span><span class="stat">${photo}</span><span class="stat">${color}</span><span class="stat">сценарий: ${esc(scenarioTitle)}</span><span class="stat">режим: ${esc(modeTitle)}</span><span class="stat">блоков ${blocks}/${blockVisibility.length}</span>${printHelpers ? `<span class="stat">печать: ${esc(printHelpers)}</span>` : ''}${state.layoutName ? `<span class="stat">${esc(state.layoutName)}</span>` : ''}${state.area ? `<span class="stat">${esc(state.area)}</span>` : ''}${score ? `<span class="stat ${score>=80?'good':score<60?'warn':''}">качество ${score}/100</span>` : ''}`;
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
  const labels = {phone:'Ввести телефон', bigPhone:'Увеличить телефон', shortHeadline:'Сократить заголовок', shortDesc:'Сократить описание', twoOnPage:'Сделать 2 на А4', cleanBrand:'Убрать фирменность', showHeadline:'Вернуть заголовок', showCutLines:'Включить линии реза', showSafeMargins:'Включить безопасные поля', autoFix:'Исправить автоматически'};
  const label = labels[i.action];
  const ariaLabel = label ? `Исправить: ${i.title}` : '';
  return `<div class="qitem ${i.level}"><b>${esc(i.title)}</b>${esc(i.text)}${label?`<br><button type="button" class="quality-fix-btn" data-fix="${i.action}" aria-label="${esc(ariaLabel)}">${esc(label)}</button>`:''}</div>`;
}
function applyFix(action){
  if(action === 'phone') $('agentPhone').focus();
  if(action === 'bigPhone') state.phoneScale = 1.45;
  if(action === 'shortHeadline') state.headline = shorten(state.headline, 44);
  if(action === 'shortDesc') state.description = shorten(state.description, 190);
  if(action === 'twoOnPage') state.printCount = 2;
  if(action === 'showHeadline') state.showHeadline = true;
  if(action === 'showCutLines') state.showCutLines = true;
  if(action === 'showSafeMargins') state.safePrintMargins = true;
  if(action === 'cleanBrand') {
    state.colorMode = 'private';
    state.showBrand = false;
    state.headline = cleanBrandText(state.headline);
    state.description = cleanBrandText(state.description);
    state.benefits = cleanBrandText(state.benefits);
    state.customBlockTitle = cleanBrandText(state.customBlockTitle);
    state.customBlockText = cleanBrandText(state.customBlockText);
  }
  if(action === 'autoFix') state = applyLayoutMode(state, 'auto');
  state.blockOrder = normalizeBlockOrder(state.blockOrder);
  state.layoutMode = action === 'autoFix' ? 'auto' : 'manual';
  renderAll();
}
function shortenDescription(){
  const current = String(state.description || '').trim();
  if(!current){
    setStatus('Сначала добавьте описание объекта — сокращать пока нечего.');
    $('description').focus();
    return;
  }
  const next = shorten(current, 190);
  if(next === current){
    setStatus('Описание уже короче 190 символов. Заголовок и преимущества не изменены.');
    $('description').focus();
    return;
  }
  state.description = next;
  state.showDescription = true;
  state.layoutMode='manual';
  syncFormFromState(); renderAll();
  setStatus('Описание сокращено до 190 символов. Заголовок и преимущества не изменены.');
}
function strengthenText(){
  if(!String(state.description || '').trim()){
    setStatus('Сначала добавьте описание объекта — пустой текст усилить нельзя.');
    $('description').focus();
    return;
  }
  if(!/позвон|напишите|подскажу/i.test(state.description)) state.description += ' Позвоните — подскажу детали и помогу разобраться.';
  if(!state.benefits) state.benefits = 'Безопасное сопровождение\nПомощь с документами\nКонсультация по цене';
  state.showDescription = true;
  state.showBenefits = true;
  state.layoutMode='manual';
  syncFormFromState(); renderAll();
  setStatus('Текст усилен: добавлены призыв и базовые преимущества. Проверьте формулировки перед печатью.');
}
function saveCurrentProfile(){
  const profile = pickProfile(state);
  if(!profile.agentName && !profile.agentPhone){ setStatus('Сначала заполните имя и телефон СПН.'); return; }
  const saved = saveProfile(profile);
  if(!saved){ setStatus('Не удалось сохранить профиль СПН. Возможно, в браузере закончилось место.'); return; }
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
  state.layoutName='';
  state.photoOne='';
  state.photoTwo='';
  state.qrLink='';
  state.qrCaption='';
  state.photoMode='none';
  state.showPhoto=false;
  state.showCustomBlock=false;
  state.blockOrder = [...DEFAULT_BLOCK_ORDER];
  state.layoutMode='manual';
  if($('savedLayouts')) $('savedLayouts').value='';
  syncFormFromState(); renderAll();
  setStatus('Данные объекта очищены. Имя, телефон и настройки контактов сохранены.');
}
function shorten(text, max){
  const s = String(text || '').trim();
  if(s.length <= max) return s;
  return s.slice(0, max-3).replace(/[\s,.;:!-]+$/,'') + '...';
}
function cleanBrandText(text){
  return String(text || '')
    .replace(/(^|[\s,.;:!—-]+)(этажи|etagi)(?=$|[\s,.;:!—-]+)/ig, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/^[\s,.;:!—-]+|[\s,.;:!—-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
function printFlow(){
  const q = runQuality(true);
  if(q.issues.some(i=>i.level==='error')){ setStatus('Есть критичные ошибки. Исправьте перед печатью.'); return; }
  if(state.printCheckMode) setStatus('Режим проверки: перед печатью проверьте масштаб 100%, фоновые изображения и QR.');
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
    try {
      const imported = JSON.parse(reader.result);
      state = cleanLoadedState(imported);
      if($('savedLayouts')) $('savedLayouts').value='';
      syncFormFromState(); renderAll(); setStatus('Файл макета открыт без смешивания с предыдущим макетом.');
    }
    catch(err){ setStatus('Не удалось открыть файл.'); }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', init);
