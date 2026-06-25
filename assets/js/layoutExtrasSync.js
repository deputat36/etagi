import './qrIntentFix.js';
import { syncLayoutExtras } from './layoutExtras.js';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('uploadFile')?.addEventListener('change', syncImportedLayoutExtras, true);
});

function syncImportedLayoutExtras(event){
  const file = event.target?.files?.[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try{
      syncLayoutExtras(JSON.parse(reader.result));
      window.setTimeout(refreshPreview, 160);
    } catch(e){}
  };
  reader.readAsText(file);
}

function refreshPreview(){
  const trigger = document.getElementById('agentPhone') || document.getElementById('headline') || document.getElementById('showBrand');
  if(!trigger) return;
  const eventName = trigger.type === 'checkbox' ? 'change' : 'input';
  trigger.dispatchEvent(new Event(eventName, {bubbles:true}));
}
