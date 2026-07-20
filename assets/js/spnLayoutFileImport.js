import { cloneDefaultState } from './state.js';
import { LayoutFileError, parseLayoutFileText } from './layoutFile.js';

let forwardingValidatedFile = false;

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('uploadFile');
  if(!input || input.dataset.layoutSchemaBound === 'true') return;
  input.dataset.layoutSchemaBound = 'true';
  input.addEventListener('change', validateBeforeImport, true);
});

async function validateBeforeImport(event){
  if(forwardingValidatedFile) return;

  const input = event.currentTarget;
  const file = input?.files?.[0];
  if(!file) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  try {
    const parsed = parseLayoutFileText(await file.text(), cloneDefaultState());
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(parsed.layout)], file.name, {type:'application/json'}));
    input.files = transfer.files;
    input.removeAttribute('aria-invalid');

    const successText = parsed.legacy
      ? 'Файл старого формата проверен и открыт. При следующем скачивании он будет сохранён по схеме v1.'
      : `Файл макета проверен и открыт. Схема v${parsed.metadata.schemaVersion}.`;
    replaceStatusAfterNativeImport(successText);

    forwardingValidatedFile = true;
    input.dispatchEvent(new Event('change', {bubbles:true}));
    forwardingValidatedFile = false;
  } catch(error){
    forwardingValidatedFile = false;
    input.setAttribute('aria-invalid', 'true');
    setStatus(error instanceof LayoutFileError ? error.userMessage : 'Не удалось открыть файл: непредвиденная ошибка проверки.');
    document.getElementById('uploadBtn')?.focus({preventScroll:true});
  }
}

function replaceStatusAfterNativeImport(successText){
  const status = document.getElementById('statusLine');
  if(!status) return;

  const observer = new MutationObserver(() => {
    if(!status.textContent.includes('Файл макета открыт без смешивания')) return;
    observer.disconnect();
    status.textContent = successText;
  });
  observer.observe(status, {childList:true, subtree:true, characterData:true});
  window.setTimeout(() => observer.disconnect(), 5000);
}

function setStatus(message){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = message;
}
