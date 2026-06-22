export const layoutExtraFields = [
  { stateKey:'contactCta', inputId:'contactCtaText', storageKey:'etagi-raskleyka-contact-cta-v1', fallback:'Позвоните — подскажу по объекту и условиям' },
  { stateKey:'tearOffLabel', inputId:'tearOffLabel', storageKey:'etagi-raskleyka-tear-label-v1', fallback:'Недвижимость' },
  { stateKey:'brandName', inputId:'brandNameText', storageKey:'etagi-raskleyka-brand-name-v1', fallback:'Этажи' },
  { stateKey:'brandSideText', inputId:'brandSideText', storageKey:'etagi-raskleyka-brand-side-v1', fallback:'etagi.com' }
];

export function getLayoutExtra(state, stateKey, options = {}){
  const field = layoutExtraFields.find(item => item.stateKey === stateKey);
  if(!field) return String(state?.[stateKey] || '').trim();
  return readLayoutExtra(field, state?.[stateKey], options);
}

export function enrichLayoutExtras(state){
  const next = {...(state || {})};
  for(const field of layoutExtraFields){
    next[field.stateKey] = readLayoutExtra(field, next[field.stateKey]);
  }
  return next;
}

export function syncLayoutExtras(state){
  if(!state) return;
  for(const field of layoutExtraFields){
    const value = String(state[field.stateKey] || '').trim();
    if(!value) continue;
    try{ localStorage.setItem(field.storageKey, value); } catch(e){}
    const input = typeof document !== 'undefined' ? document.getElementById(field.inputId) : null;
    if(input) input.value = value;
  }
}

export function readLayoutExtra(field, currentValue, options = {}){
  const fromInput = typeof document !== 'undefined' ? String(document.getElementById(field.inputId)?.value || '').trim() : '';
  if(fromInput && (!options.ignoreInputFallback || fromInput !== field.fallback)) return fromInput;

  const fromState = String(currentValue || '').trim();
  if(fromState) return fromState;
  if(fromInput) return fromInput;

  try{
    return localStorage.getItem(field.storageKey) || field.fallback;
  } catch(e){
    return field.fallback;
  }
}
