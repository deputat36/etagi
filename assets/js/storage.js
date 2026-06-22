const KEY = 'etagi-raskleyka-state-v1';
const SAVED_KEY = 'etagi-raskleyka-saved-v1';
const PROFILE_KEY = 'etagi-raskleyka-profile-v1';
const LAYOUTS_KEY = 'etagi-raskleyka-layouts-v1';
const FAVORITE_TEMPLATES_KEY = 'etagi-raskleyka-favorite-templates-v1';

const LAYOUT_EXTRA_FIELDS = [
  { stateKey:'contactCta', inputId:'contactCtaText', storageKey:'etagi-raskleyka-contact-cta-v1', fallback:'Позвоните — подскажу по объекту и условиям' },
  { stateKey:'tearOffLabel', inputId:'tearOffLabel', storageKey:'etagi-raskleyka-tear-label-v1', fallback:'Недвижимость' },
  { stateKey:'brandName', inputId:'brandNameText', storageKey:'etagi-raskleyka-brand-name-v1', fallback:'Этажи' },
  { stateKey:'brandSideText', inputId:'brandSideText', storageKey:'etagi-raskleyka-brand-side-v1', fallback:'etagi.com' }
];

export function autoSave(state){
  try { localStorage.setItem(KEY, JSON.stringify(stripHeavyFields(state))); }
  catch(e) { console.warn('autosave failed', e); }
}
export function loadAutoSave(){
  try {
    const state = JSON.parse(localStorage.getItem(KEY) || 'null');
    syncLayoutExtras(state);
    return state;
  }
  catch(e) { return null; }
}
export function saveNamed(state){
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(stripHeavyFields(state)));
    return true;
  }
  catch(e) {
    console.warn('save last layout failed', e);
    return false;
  }
}
export function loadNamed(){
  try {
    const state = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null');
    syncLayoutExtras(state);
    return state;
  }
  catch(e) { return null; }
}
export function saveProfile(profile){
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  }
  catch(e) {
    console.warn('save profile failed', e);
    return false;
  }
}
export function loadProfile(){
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); }
  catch(e) { return null; }
}
export function listSavedLayouts(){
  try { return JSON.parse(localStorage.getItem(LAYOUTS_KEY) || '[]'); }
  catch(e) { return []; }
}
export function saveLayout(name, state){
  try {
    const cleanName = String(name || state.headline || 'Макет без названия').trim() || 'Макет без названия';
    const layouts = listSavedLayouts();
    const now = new Date().toISOString();
    const id = makeLayoutId(cleanName, layouts);
    const cleanState = {...stripHeavyFields(state), layoutName: cleanName};
    const existingByName = layouts.findIndex(item => String(item.name || '').toLowerCase() === cleanName.toLowerCase());
    const item = { id: existingByName >= 0 ? layouts[existingByName].id : id, name: cleanName, updatedAt: now, state: cleanState };

    if(existingByName >= 0) layouts[existingByName] = item;
    else layouts.unshift(item);

    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts.slice(0, 50)));
    return item;
  }
  catch(e) {
    console.warn('save named layout failed', e);
    return null;
  }
}
export function loadLayout(id){
  const item = listSavedLayouts().find(item => item.id === id) || null;
  if(item?.state) syncLayoutExtras(item.state);
  return item;
}
export function deleteLayout(id){
  try {
    const next = listSavedLayouts().filter(item => item.id !== id);
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(next));
    return next;
  }
  catch(e) {
    console.warn('delete named layout failed', e);
    return null;
  }
}
export function listFavoriteTemplates(){
  try { return JSON.parse(localStorage.getItem(FAVORITE_TEMPLATES_KEY) || '[]'); }
  catch(e) { return []; }
}
export function isFavoriteTemplate(templateId){
  return listFavoriteTemplates().includes(templateId);
}
export function toggleFavoriteTemplate(templateId){
  try {
    const id = String(templateId || '').trim();
    if(!id) return listFavoriteTemplates();
    const favorites = new Set(listFavoriteTemplates());
    if(favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    const next = [...favorites];
    localStorage.setItem(FAVORITE_TEMPLATES_KEY, JSON.stringify(next));
    return next;
  }
  catch(e) {
    console.warn('toggle favorite template failed', e);
    return null;
  }
}
export function clearAll(){
  localStorage.removeItem(KEY);
  localStorage.removeItem(SAVED_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LAYOUTS_KEY);
  localStorage.removeItem(FAVORITE_TEMPLATES_KEY);
}
function stripHeavyFields(state){
  const next = {...state, photoOne:'', photoTwo:''};
  for(const field of LAYOUT_EXTRA_FIELDS){
    next[field.stateKey] = readLayoutExtra(field, next[field.stateKey]);
  }
  return next;
}
function readLayoutExtra(field, currentValue){
  const fromInput = typeof document !== 'undefined' ? String(document.getElementById(field.inputId)?.value || '').trim() : '';
  if(fromInput) return fromInput;
  const fromState = String(currentValue || '').trim();
  if(fromState) return fromState;
  try{
    return localStorage.getItem(field.storageKey) || field.fallback;
  } catch(e){
    return field.fallback;
  }
}
function syncLayoutExtras(state){
  if(!state) return;
  for(const field of LAYOUT_EXTRA_FIELDS){
    const value = String(state[field.stateKey] || '').trim();
    if(!value) continue;
    try{ localStorage.setItem(field.storageKey, value); } catch(e){}
    const input = typeof document !== 'undefined' ? document.getElementById(field.inputId) : null;
    if(input) input.value = value;
  }
}
function makeLayoutId(name, layouts){
  const base = String(name || 'layout')
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'layout';
  let id = base;
  let i = 2;
  while(layouts.some(item => item.id === id)){
    id = `${base}-${i++}`;
  }
  return id;
}
