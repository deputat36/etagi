const KEY = 'etagi-raskleyka-state-v1';
const SAVED_KEY = 'etagi-raskleyka-saved-v1';
const PROFILE_KEY = 'etagi-raskleyka-profile-v1';
const LAYOUTS_KEY = 'etagi-raskleyka-layouts-v1';
const FAVORITE_TEMPLATES_KEY = 'etagi-raskleyka-favorite-templates-v1';

export function autoSave(state){
  try { localStorage.setItem(KEY, JSON.stringify(stripHeavyFields(state))); }
  catch(e) { console.warn('autosave failed', e); }
}
export function loadAutoSave(){
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
  catch(e) { return null; }
}
export function saveNamed(state){
  localStorage.setItem(SAVED_KEY, JSON.stringify(stripHeavyFields(state)));
}
export function loadNamed(){
  return JSON.parse(localStorage.getItem(SAVED_KEY) || 'null');
}
export function saveProfile(profile){
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
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
  const cleanName = String(name || state.headline || 'Макет без названия').trim() || 'Макет без названия';
  const layouts = listSavedLayouts();
  const now = new Date().toISOString();
  const id = makeLayoutId(cleanName, layouts);
  const cleanState = {...stripHeavyFields(state), layoutName: cleanName};
  const existingByName = layouts.findIndex(item => item.name.toLowerCase() === cleanName.toLowerCase());
  const item = { id: existingByName >= 0 ? layouts[existingByName].id : id, name: cleanName, updatedAt: now, state: cleanState };

  if(existingByName >= 0) layouts[existingByName] = item;
  else layouts.unshift(item);

  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts.slice(0, 50)));
  return item;
}
export function loadLayout(id){
  return listSavedLayouts().find(item => item.id === id) || null;
}
export function deleteLayout(id){
  const next = listSavedLayouts().filter(item => item.id !== id);
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(next));
  return next;
}
export function listFavoriteTemplates(){
  try { return JSON.parse(localStorage.getItem(FAVORITE_TEMPLATES_KEY) || '[]'); }
  catch(e) { return []; }
}
export function isFavoriteTemplate(templateId){
  return listFavoriteTemplates().includes(templateId);
}
export function toggleFavoriteTemplate(templateId){
  const id = String(templateId || '').trim();
  if(!id) return listFavoriteTemplates();
  const favorites = new Set(listFavoriteTemplates());
  if(favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  const next = [...favorites];
  localStorage.setItem(FAVORITE_TEMPLATES_KEY, JSON.stringify(next));
  return next;
}
export function clearAll(){
  localStorage.removeItem(KEY);
  localStorage.removeItem(SAVED_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LAYOUTS_KEY);
  localStorage.removeItem(FAVORITE_TEMPLATES_KEY);
}
function stripHeavyFields(state){
  return {...state, photoOne:'', photoTwo:''};
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
