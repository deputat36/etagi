window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', handlePrintGuard, true);
});

function handlePrintGuard(event){
  if(document.body.dataset.spnUiMode !== 'newbie') return;

  const finalButton = event.target.closest('#spnNewbieFinalCheck [data-final-target="#printBtn"]');
  const printButton = event.target.closest('#printBtn');
  if(!finalButton && !printButton) return;
  if(isReadyToPrint()) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  goToFirstMissing();
  status('Сначала завершите проверку новичка, затем печатайте макет.');
}

function isReadyToPrint(){
  const quality = Number(String(document.getElementById('qualityScore')?.textContent || '').replace(/\D/g, '')) || 0;
  const phone = Boolean(String(document.getElementById('agentPhone')?.value || '').trim());
  const countTwo = Boolean(document.querySelector('[data-count="2"].active'));
  const cutLines = Boolean(document.getElementById('showCutLines')?.checked);
  const safeMargins = Boolean(document.getElementById('safePrintMargins')?.checked);
  return quality >= 70 && phone && countTwo && cutLines && safeMargins;
}

function goToFirstMissing(){
  const quality = Number(String(document.getElementById('qualityScore')?.textContent || '').replace(/\D/g, '')) || 0;
  if(quality < 70) return go('#qualityBtn');
  if(!String(document.getElementById('agentPhone')?.value || '').trim()) return go('#agentPhone');
  if(!document.querySelector('[data-count="2"].active')) return go('[data-count="2"]');
  if(!document.getElementById('showCutLines')?.checked) return go('#showCutLines');
  if(!document.getElementById('safePrintMargins')?.checked) return go('#safePrintMargins');
}

function go(selector){
  const target = document.querySelector(selector);
  if(!target) return;
  if(target.matches('button')) target.click();
  if(target.matches('input[type="checkbox"]') && !target.checked){
    target.checked = true;
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.focus?.();
}

function status(text){
  const el = document.getElementById('statusLine');
  if(el) el.textContent = text;
}
