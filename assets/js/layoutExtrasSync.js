const LAYOUT_EXTRA_FIELDS = [
  { stateKey:'contactCta', inputId:'contactCtaText', storageKey:'etagi-raskleyka-contact-cta-v1' },
  { stateKey:'tearOffLabel', inputId:'tearOffLabel', storageKey:'etagi-raskleyka-tear-label-v1' },
  { stateKey:'brandName', inputId:'brandNameText', storageKey:'etagi-raskleyka-brand-name-v1' },
  { stateKey:'brandSideText', inputId:'brandSideText', storageKey:'etagi-raskleyka-brand-side-v1' }
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('uploadFile')?.addEventListener('change', syncImportedLayoutExtras, true);
});

function syncImportedLayoutExtras(event){
  const file = event.target?.files?.[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try{
      const state = JSON.parse(reader.result);
      applyLayoutExtras(state);
      window.setTimeout(refreshPreview, 160);
    } catch(e){}
  };
  reader.readAsText(file);
}

function applyLayoutExtras(state){
  if(!state || typeof state !== 'object') return;

  for(const field of LAYOUT_EXTRA_FIELDS){
    const value = String(state[field.stateKey] || '').trim();
    if(!value) continue;

    try{ localStorage.setItem(field.storageKey, value); } catch(e){}

    const input = document.getElementById(field.inputId);
    if(input){
      input.value = value;
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
    }
  }
}

function refreshPreview(){
  const trigger = document.getElementById('agentPhone') || document.getElementById('headline') || document.getElementById('showBrand');
  if(!trigger) return;
  const eventName = trigger.type === 'checkbox' ? 'change' : 'input';
  trigger.dispatchEvent(new Event(eventName, {bubbles:true}));
}
