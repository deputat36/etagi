const KEY = 'etagi-raskleyka-state-v1';
const SAVED_KEY = 'etagi-raskleyka-saved-v1';

export function autoSave(state){
  try { localStorage.setItem(KEY, JSON.stringify({...state, photoOne:'', photoTwo:''})); }
  catch(e) { console.warn('autosave failed', e); }
}
export function loadAutoSave(){
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
  catch(e) { return null; }
}
export function saveNamed(state){
  localStorage.setItem(SAVED_KEY, JSON.stringify(state));
}
export function loadNamed(){
  return JSON.parse(localStorage.getItem(SAVED_KEY) || 'null');
}
export function clearAll(){
  localStorage.removeItem(KEY);
  localStorage.removeItem(SAVED_KEY);
}
