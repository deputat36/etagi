import { enrichLayoutExtras } from './layoutExtras.js';

export const $ = (id) => document.getElementById(id);
export const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
export const nl = (value='') => String(value).split(/\n+/).map(v=>v.trim()).filter(Boolean);

export function readFileAsDataURL(file){
  return new Promise((resolve,reject)=>{
    if(!file){ resolve(''); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export function downloadText(filename, text, type='application/json'){
  const output = shouldEnrichLayoutDownload(filename, type) ? addLayoutExtrasToJson(text) : text;
  const blob = new Blob([output], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export function debounce(fn, wait=400){
  let timer;
  return (...args)=>{
    clearTimeout(timer);
    timer=setTimeout(()=>fn(...args), wait);
  };
}

function shouldEnrichLayoutDownload(filename, type){
  return String(type || '').includes('json') && String(filename || '').startsWith('etagi-raskleyka-');
}

function addLayoutExtrasToJson(text){
  try{
    return JSON.stringify(enrichLayoutExtras(JSON.parse(text)), null, 2);
  } catch(e){
    return text;
  }
}
