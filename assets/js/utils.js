export const $ = (id) => document.getElementById(id);
export const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
export const nl = (value='') => String(value).split(/\n+/).map(v=>v.trim()).filter(Boolean);

const layoutExtraFields = [
  { stateKey:'contactCta', inputId:'contactCtaText', storageKey:'etagi-raskleyka-contact-cta-v1', fallback:'Позвоните — подскажу по объекту и условиям' },
  { stateKey:'tearOffLabel', inputId:'tearOffLabel', storageKey:'etagi-raskleyka-tear-label-v1', fallback:'Недвижимость' },
  { stateKey:'brandName', inputId:'brandNameText', storageKey:'etagi-raskleyka-brand-name-v1', fallback:'Этажи' },
  { stateKey:'brandSideText', inputId:'brandSideText', storageKey:'etagi-raskleyka-brand-side-v1', fallback:'etagi.com' }
];

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
    const state = JSON.parse(text);
    for(const field of layoutExtraFields){
      state[field.stateKey] = readLayoutExtra(field, state[field.stateKey]);
    }
    return JSON.stringify(state, null, 2);
  } catch(e){
    return text;
  }
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
