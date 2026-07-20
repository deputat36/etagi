import { cloneDefaultState } from './state.js';

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

let pendingImportSnapshot = null;
let statusObserver = null;

document.addEventListener('DOMContentLoaded', initDestructiveSnapshots);

export function initDestructiveSnapshots(){
  if(document.body?.dataset.destructiveSnapshotBound === 'true') return;
  document.body.dataset.destructiveSnapshotBound = 'true';

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

function handleDestructiveClick(event){
  const button = event.target.closest('button');
  if(!button) return;

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
  if(!event.target?.files?.length) return;
  pendingImportSnapshot = createDestructiveSnapshot('import-layout-file');
}

function observeImportResult(){
  const status = document.getElementById('statusLine');
  if(!status || statusObserver) return;

  statusObserver = new MutationObserver(() => {
    if(!pendingImportSnapshot) return;
    const text = status.textContent || '';
    if(text.includes('Файл макета открыт без смешивания')){
      const snapshot = pendingImportSnapshot;
      pendingImportSnapshot = null;
      saveDestructiveSnapshot('import-layout-file', {snapshot});
      return;
    }
    if(text.includes('Файл повреждён') || text.includes('не похож на макет') || text.includes('неверные данные') || text.includes('другому типу файла') || text.includes('более новой версии') || text.includes('не смог прочитать')){
      pendingImportSnapshot = null;
    }
  });
  statusObserver.observe(status, {childList:true, subtree:true, characterData:true});
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
  persistSnapshot({...latest, photosOmitted:false});
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
  }
}

function readJsonStorage(key){
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch(error){ return null; }
}
