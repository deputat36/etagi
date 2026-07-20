import { cloneDefaultState } from './state.js';
import { createLayoutFilePayload } from './layoutFile.js';

export const DESTRUCTIVE_SNAPSHOT_KEY = 'etagi-raskleyka-destructive-snapshot-v1';
export const DESTRUCTIVE_SNAPSHOT_VERSION = 1;

const AUTO_SAVE_KEY = 'etagi-raskleyka-state-v1';
const LAST_LAYOUT_KEY = 'etagi-raskleyka-saved-v1';
const FIELD_IDS = [
  'layoutName','agentName','agentPhone','area','propertyType','price','params','headline','description','benefits',
  'customBlockTitle','customBlockText','qrLink','qrCaption','splitMode','colorMode','pageMargin','pageGap',
  'flyerPadding','radius','headlineScale','phoneScale','layoutDensity','photoFit'
];
const CHECK_IDS = [
  'tearOffs','showCutLines','safePrintMargins','printCheckMode','showBrand','showHeadline','showPrice',
  'showDescription','showMeta','showBenefits','showCustomBlock','showPhoto','showQr','showContact'
];
const EXTRA_FIELDS = {
  contactCtaText:'contactCta',
  tearOffLabel:'tearOffLabel',
  brandNameText:'brandName',
  brandSideText:'brandSideText'
};
const REASONS = {
  'clear-object':'Перед очисткой данных объекта',
  'load-named-layout':'Перед загрузкой именованного макета',
  'load-last-layout':'Перед загрузкой последнего макета',
  'import-layout-file':'Перед импортом JSON-макета'
};
const UNDO_LABELS = {
  'clear-object':'очистку объекта',
  'load-named-layout':'загрузку именованного макета',
  'load-last-layout':'загрузку последнего макета',
  'import-layout-file':'импорт JSON-макета'
};
const IMPORT_FAILURE_MARKERS = [
  'Файл повреждён',
  'В файле должен находиться',
  'Этот JSON относится',
  'Версия формата файла указана неверно',
  'Файл создан в более новой версии',
  'Файл не похож на макет',
  'Файл макета содержит неверные данные',
  'Браузер не смог прочитать'
];

let pendingImportSnapshot = null;
let pendingRestoreSnapshot = null;
let restoringSnapshot = false;
let restoreTimeout = 0;
let statusObserver = null;

document.addEventListener('DOMContentLoaded', initDestructiveSnapshots);

export function initDestructiveSnapshots(){
  if(document.body?.dataset.destructiveSnapshotBound === 'true') return;
  document.body.dataset.destructiveSnapshotBound = 'true';

  ensureUndoUi();
  document.addEventListener('click', handleDestructiveClick, true);
  document.getElementById('uploadFile')?.addEventListener('change', prepareImportSnapshot, true);
  observeImportResult();
  updateSnapshotIndicator(readLatestDestructiveSnapshot());
}

export function createDestructiveSnapshot(reason, doc = document){
  const state = collectCurrentLayoutState(doc);
  return {
    snapshotVersion:DESTRUCTIVE_SNAPSHOT_VERSION,
    id:`${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt:new Date().toISOString(),
    reason,
    reasonLabel:REASONS[reason] || 'Перед изменением макета',
    state,
    ui:{
      savedLayoutId:doc.getElementById('savedLayouts')?.value || '',
      scenario:doc.querySelector('[data-scenario].active')?.dataset.scenario || 'all'
    },
    photosOmitted:false
  };
}

export function saveDestructiveSnapshot(reason, options = {}){
  const snapshot = options.snapshot || createDestructiveSnapshot(reason, options.document || document);
  const saved = persistSnapshot(snapshot);
  if(saved){
    updateSnapshotIndicator(saved);
    window.dispatchEvent(new CustomEvent('etagi:destructive-snapshot-saved', {detail:{id:saved.id, reason:saved.reason}}));
    enrichSnapshotFromSelectedFiles(saved, options.document || document);
  }
  return saved;
}

export function readLatestDestructiveSnapshot(){
  try{
    const parsed = JSON.parse(localStorage.getItem(DESTRUCTIVE_SNAPSHOT_KEY) || 'null');
    return parsed && parsed.snapshotVersion === DESTRUCTIVE_SNAPSHOT_VERSION ? parsed : null;
  } catch(error){
    return null;
  }
}

export function restoreLatestDestructiveSnapshot(){
  if(restoringSnapshot) return false;
  const snapshot = readLatestDestructiveSnapshot();
  const input = document.getElementById('uploadFile');
  if(!snapshot?.state || !input){
    updateSnapshotIndicator(null);
    setStatus('Резервная точка для отмены не найдена.');
    return false;
  }

  try{
    const transfer = new DataTransfer();
    const payload = createLayoutFilePayload(snapshot.state);
    transfer.items.add(new File([JSON.stringify(payload)], 'etagi-raskleyka-undo.json', {type:'application/json'}));
    input.files = transfer.files;
    pendingRestoreSnapshot = snapshot;
    restoringSnapshot = true;
    updateUndoUi(snapshot);
    input.dispatchEvent(new Event('change', {bubbles:true}));
    restoreTimeout = window.setTimeout(() => failSnapshotRestore('Восстановление не завершилось вовремя. Резервная точка сохранена.'), 7000);
    return true;
  } catch(error){
    pendingRestoreSnapshot = null;
    restoringSnapshot = false;
    updateUndoUi(snapshot);
    setStatus('Не удалось подготовить восстановление. Резервная точка сохранена.');
    return false;
  }
}

export function collectCurrentLayoutState(doc = document){
  const defaults = cloneDefaultState();
  const autoSaved = readJsonStorage(AUTO_SAVE_KEY) || {};
  const state = {...defaults, ...autoSaved};

  for(const id of FIELD_IDS){
    const input = doc.getElementById(id);
    if(!input) continue;
    state[id] = input.type === 'number' || input.type === 'range' ? Number(input.value) : input.value;
  }
  for(const id of CHECK_IDS){
    const input = doc.getElementById(id);
    if(input) state[id] = Boolean(input.checked);
  }
  for(const [inputId, stateKey] of Object.entries(EXTRA_FIELDS)){
    const input = doc.getElementById(inputId);
    if(input) state[stateKey] = input.value;
  }

  state.goal = doc.querySelector('[data-goal].active')?.dataset.goal || state.goal;
  state.templateId = doc.querySelector('.tpl-card.active[data-template]')?.dataset.template || state.templateId;
  state.layoutMode = doc.querySelector('[data-layout-mode].active')?.dataset.layoutMode || state.layoutMode;
  state.photoMode = doc.querySelector('[data-photo].active')?.dataset.photo || state.photoMode;
  state.printCount = Number(doc.querySelector('[data-count].active')?.dataset.count || state.printCount);

  const blockOrder = [...doc.querySelectorAll('#blockOrderList [data-block-id]')].map(node => node.dataset.blockId).filter(Boolean);
  if(blockOrder.length) state.blockOrder = blockOrder;

  const firstFlyer = doc.querySelector('#printSheet .flyer');
  const photoOne = firstFlyer?.querySelector('img[alt="Фото 1"]')?.getAttribute('src') || '';
  const photoTwo = firstFlyer?.querySelector('img[alt="Фото 2"]')?.getAttribute('src') || '';
  if(photoOne) state.photoOne = photoOne;
  if(photoTwo) state.photoTwo = photoTwo;

  return state;
}

function ensureUndoUi(){
  const actions = document.querySelector('.profile-actions');
  if(!actions || document.getElementById('undoDestructiveActionBtn')) return;

  const button = document.createElement('button');
  button.id = 'undoDestructiveActionBtn';
  button.type = 'button';
  button.disabled = true;
  button.setAttribute('aria-describedby', 'destructiveSnapshotHint');
  button.textContent = 'Отменить последнее действие';
  button.addEventListener('click', restoreLatestDestructiveSnapshot);
  actions.append(button);

  const hint = document.createElement('p');
  hint.id = 'destructiveSnapshotHint';
  hint.className = 'hint-text';
  hint.setAttribute('aria-live', 'polite');
  actions.insertAdjacentElement('afterend', hint);
}

function handleDestructiveClick(event){
  const button = event.target.closest('button');
  if(!button || button.id === 'undoDestructiveActionBtn') return;

  if(button.id === 'clearObjectBtn'){
    saveDestructiveSnapshot('clear-object');
    return;
  }
  if(button.id === 'loadNamedLayoutBtn'){
    if(document.getElementById('savedLayouts')?.value) saveDestructiveSnapshot('load-named-layout');
    return;
  }
  if(button.id === 'loadLocalBtn'){
    if(localStorage.getItem(LAST_LAYOUT_KEY)) saveDestructiveSnapshot('load-last-layout');
  }
}

function prepareImportSnapshot(event){
  if(restoringSnapshot || !event.target?.files?.length) return;
  pendingImportSnapshot = createDestructiveSnapshot('import-layout-file');
}

function observeImportResult(){
  const status = document.getElementById('statusLine');
  if(!status || statusObserver) return;

  statusObserver = new MutationObserver(() => {
    const text = status.textContent || '';
    if(pendingRestoreSnapshot){
      if(text.includes('Файл макета открыт без смешивания')) finishSnapshotRestore();
      else if(IMPORT_FAILURE_MARKERS.some(marker => text.includes(marker))) failSnapshotRestore('Не удалось восстановить резервную точку. Она сохранена для повторной попытки.');
      return;
    }
    if(!pendingImportSnapshot) return;
    if(text.includes('Файл макета открыт без смешивания')){
      const snapshot = pendingImportSnapshot;
      pendingImportSnapshot = null;
      saveDestructiveSnapshot('import-layout-file', {snapshot});
      return;
    }
    if(IMPORT_FAILURE_MARKERS.some(marker => text.includes(marker))) pendingImportSnapshot = null;
  });
  statusObserver.observe(status, {childList:true, subtree:true, characterData:true});
}

function finishSnapshotRestore(){
  const snapshot = pendingRestoreSnapshot;
  pendingRestoreSnapshot = null;
  restoringSnapshot = false;
  window.clearTimeout(restoreTimeout);

  restoreSnapshotUi(snapshot);
  localStorage.removeItem(DESTRUCTIVE_SNAPSHOT_KEY);
  updateSnapshotIndicator(null);
  const photoNote = snapshot.photosOmitted ? ' Фотографии не входили в облегчённый снимок.' : '';
  setStatus(`Последнее разрушительное действие отменено: ${UNDO_LABELS[snapshot.reason] || 'изменение макета'}.${photoNote}`);
  window.dispatchEvent(new CustomEvent('etagi:destructive-snapshot-restored', {detail:{id:snapshot.id, reason:snapshot.reason}}));
}

function failSnapshotRestore(message){
  window.clearTimeout(restoreTimeout);
  pendingRestoreSnapshot = null;
  restoringSnapshot = false;
  updateUndoUi(readLatestDestructiveSnapshot());
  setStatus(message);
}

function restoreSnapshotUi(snapshot){
  const select = document.getElementById('savedLayouts');
  if(select && snapshot.ui?.savedLayoutId && [...select.options].some(option => option.value === snapshot.ui.savedLayoutId)){
    select.value = snapshot.ui.savedLayoutId;
  }
  const scenario = snapshot.ui?.scenario;
  const scenarioButton = scenario ? document.querySelector(`[data-scenario="${CSS.escape(scenario)}"]`) : null;
  scenarioButton?.click();
}

function persistSnapshot(snapshot){
  try{
    localStorage.setItem(DESTRUCTIVE_SNAPSHOT_KEY, JSON.stringify(snapshot));
    document.body.dataset.destructiveSnapshotStatus = 'saved';
    return snapshot;
  } catch(error){
    const lightweight = {
      ...snapshot,
      state:{...snapshot.state, photoOne:'', photoTwo:''},
      photosOmitted:true
    };
    try{
      localStorage.setItem(DESTRUCTIVE_SNAPSHOT_KEY, JSON.stringify(lightweight));
      document.body.dataset.destructiveSnapshotStatus = 'saved-without-photos';
      return lightweight;
    } catch(secondError){
      document.body.dataset.destructiveSnapshotStatus = 'failed';
      return null;
    }
  }
}

async function enrichSnapshotFromSelectedFiles(snapshot, doc){
  const current = readLatestDestructiveSnapshot();
  if(!current || current.id !== snapshot.id) return;

  const [photoOne, photoTwo] = await Promise.all([
    readSelectedFile(doc.getElementById('photoOne')?.files?.[0]),
    readSelectedFile(doc.getElementById('photoTwo')?.files?.[0])
  ]);
  if(!photoOne && !photoTwo) return;

  const latest = readLatestDestructiveSnapshot();
  if(!latest || latest.id !== snapshot.id) return;
  if(photoOne) latest.state.photoOne = photoOne;
  if(photoTwo) latest.state.photoTwo = photoTwo;
  const enriched = persistSnapshot({...latest, photosOmitted:false});
  if(enriched) updateSnapshotIndicator(enriched);
}

function readSelectedFile(file){
  if(!file) return Promise.resolve('');
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function updateSnapshotIndicator(snapshot){
  if(!document.body) return;
  document.body.dataset.destructiveSnapshotAvailable = snapshot ? 'true' : 'false';
  if(snapshot){
    document.body.dataset.destructiveSnapshotReason = snapshot.reason;
    document.body.dataset.destructiveSnapshotAt = snapshot.createdAt;
  } else {
    delete document.body.dataset.destructiveSnapshotReason;
    delete document.body.dataset.destructiveSnapshotAt;
  }
  updateUndoUi(snapshot);
}

function updateUndoUi(snapshot){
  const button = document.getElementById('undoDestructiveActionBtn');
  const hint = document.getElementById('destructiveSnapshotHint');
  if(!button || !hint) return;

  button.disabled = !snapshot || restoringSnapshot;
  if(restoringSnapshot){
    button.textContent = 'Восстанавливаю…';
    hint.textContent = 'Применяется последняя резервная точка.';
    return;
  }
  if(!snapshot){
    button.textContent = 'Отменить последнее действие';
    hint.textContent = 'Резервная точка появится после очистки, загрузки или импорта макета.';
    return;
  }

  button.textContent = `Отменить: ${UNDO_LABELS[snapshot.reason] || 'последнее изменение'}`;
  const date = new Date(snapshot.createdAt);
  const time = Number.isNaN(date.getTime()) ? '' : ` · ${date.toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}`;
  const photoNote = snapshot.photosOmitted ? ' · без фотографий' : '';
  hint.textContent = `${snapshot.reasonLabel}${time}${photoNote}.`;
}

function setStatus(message){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = message;
}

function readJsonStorage(key){
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch(error){ return null; }
}
