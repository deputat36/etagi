export const layoutExtraFields = [
  { stateKey:'contactCta', inputId:'contactCtaText', storageKey:'etagi-raskleyka-contact-cta-v1', fallback:'Позвоните — подскажу по объекту и условиям' },
  { stateKey:'tearOffLabel', inputId:'tearOffLabel', storageKey:'etagi-raskleyka-tear-label-v1', fallback:'Недвижимость' },
  { stateKey:'brandName', inputId:'brandNameText', storageKey:'etagi-raskleyka-brand-name-v1', fallback:'Этажи' },
  { stateKey:'brandSideText', inputId:'brandSideText', storageKey:'etagi-raskleyka-brand-side-v1', fallback:'etagi.com' }
];

export function getLayoutExtra(state, stateKey, options = {}){
  const field = getLayoutExtraField(stateKey);
  if(!field) return String(state?.[stateKey] || '').trim();
  return readLayoutExtra(field, state?.[stateKey], options);
}

export function getRawLayoutExtra(stateKey){
  const field = getLayoutExtraField(stateKey);
  if(!field) return '';
  return readLayoutExtra({...field, fallback:''}, '', { ignoreInputFallback:false });
}

export function setLayoutExtraValue(stateKey, value, options = {}){
  const field = getLayoutExtraField(stateKey);
  if(!field) return '';

  const clean = String(value || field.fallback || '').trim() || field.fallback || '';
  try{ localStorage.setItem(field.storageKey, clean); } catch(e){}

  const input = typeof document !== 'undefined' ? document.getElementById(field.inputId) : null;
  if(input && options.syncInput !== false){
    input.value = clean;
    if(options.emitEvents !== false){
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
    }
    if(options.reveal) revealLayoutExtraInput(input);
  }

  return clean;
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
    setLayoutExtraValue(field.stateKey, value);
  }
}

export function getLayoutExtraField(stateKey){
  return layoutExtraFields.find(item => item.stateKey === stateKey) || null;
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

function revealLayoutExtraInput(input){
  const details = input.closest('details');
  if(details && !details.open) details.open = true;

  window.setTimeout(() => {
    input.focus({ preventScroll:true });
    input.scrollIntoView({ behavior:'smooth', block:'center' });
  }, 60);
}
