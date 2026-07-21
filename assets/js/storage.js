import { enrichLayoutExtras, syncLayoutExtras } from './layoutExtras.js';
import { normalizePrintCount } from './state.js';

const KEY = 'etagi-raskleyka-state-v1';
const SAVED_KEY = 'etagi-raskleyka-saved-v1';
const PROFILE_KEY = 'etagi-raskleyka-profile-v1';
const LAYOUTS_KEY = 'etagi-raskleyka-layouts-v1';
const FAVORITE_TEMPLATES_KEY = 'etagi-raskleyka-favorite-templates-v1';
const MAX_SAVED_LAYOUTS = 50;

export function autoSave(state){
  try { localStorage.setItem(KEY, JSON.stringify(stripHeavyFields(state))); }
  catch(e) { console.warn('autosave failed', e); }
}
export function loadAutoSave(){
  try { return normalizeStoredState(JSON.parse(localStorage.getItem(KEY) || 'null')); }
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
  try { return normalizeStoredState(JSON.parse(localStorage.getItem(SAVED_KEY) || 'null')); }
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

    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts.slice(0, MAX_SAVED_LAYOUTS)));
    return item;
  }
  catch(e) {
    console.warn('save named layout failed', e);
    return null;
  }
}
export function loadLayout(id){
  const item = listSavedLayouts().find(item => item.id === id) || null;
  if(item?.state) item.state = normalizeStoredState(item.state);
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
export function restoreLayout(item){
  try {
    if(!item || typeof item !== 'object' || !item.state) return null;
    const layouts = listSavedLayouts();
    if(layouts.length >= MAX_SAVED_LAYOUTS) return null;
    const originalName = String(item.name || item.state.layoutName || 'Восстановленный макет').trim() || 'Восстановленный макет';
    const name = makeRestoredLayoutName(originalName, layouts);
    const originalId = String(item.id || '').trim();
    const id = originalId && !layouts.some(layout => layout.id === originalId) ? originalId : makeLayoutId(name, layouts);
    const restored = {
      id,
      name,
      updatedAt:new Date().toISOString(),
      state:{...stripHeavyFields(item.state), layoutName:name}
    };
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify([restored, ...layouts]));
    return restored;
  }
  catch(e) {
    console.warn('restore named layout failed', e);
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
function normalizeStoredState(state){
  if(!state || typeof state !== 'object') return state;
  state.printCount = normalizePrintCount(state.printCount);
  syncLayoutExtras(state);
  return state;
}
function stripHeavyFields(state){
  return enrichLayoutExtras({...state, printCount:normalizePrintCount(state?.printCount), photoOne:'', photoTwo:''});
}
function makeRestoredLayoutName(name, layouts){
  const taken = new Set(layouts.map(item => String(item.name || '').trim().toLowerCase()));
  if(!taken.has(name.toLowerCase())) return name;

  const base = `${name} (восстановлен)`;
  let candidate = base;
  let index = 2;
  while(taken.has(candidate.toLowerCase())) candidate = `${base} ${index++}`;
  return candidate;
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