import { getSpnMediaReadiness } from './spnMediaReadiness.js';

window.addEventListener('DOMContentLoaded', () => {
  bindPrintGuard();
});

function bindPrintGuard(){
  const printButton = document.getElementById('printBtn');
  if(!printButton || printButton.dataset.newbiePrintGuardBound === '1') return;
  printButton.dataset.newbiePrintGuardBound = '1';
  printButton.addEventListener('click', handlePrintButtonClick, true);
}

function handlePrintButtonClick(event){
  if(document.body.dataset.spnUiMode !== 'newbie') return;
  if(isReadyToPrint()) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  goToFirstMissing();
  status('Сначала завершите проверку новичка, затем печатайте макет.');
}

function isReadyToPrint(){
  const quality = Number(String(document.getElementById('qualityScore')?.textContent || '').replace(/\D/g, '')) || 0;
  const phone = Boolean(String(document.getElementById('agentPhone')?.value || '').trim());
  const countReady = hasSupportedPrintCount();
  const media = getSpnMediaReadiness();
  const cutLines = Boolean(document.getElementById('showCutLines')?.checked);
  const safeMargins = Boolean(document.getElementById('safePrintMargins')?.checked);
  return quality >= 70 && phone && countReady && media.ready && cutLines && safeMargins;
}

function goToFirstMissing(){
  const quality = Number(String(document.getElementById('qualityScore')?.textContent || '').replace(/\D/g, '')) || 0;
  if(quality < 70) return go('#qualityBtn', { click: true });
  if(!String(document.getElementById('agentPhone')?.value || '').trim()) return go('#agentPhone');
  if(!hasSupportedPrintCount()) return go('#printPresetRow');
  const media = getSpnMediaReadiness();
  if(!media.ready) return go(media.firstTarget);
  if(!document.getElementById('showCutLines')?.checked) return go('#showCutLines', { check: true });
  if(!document.getElementById('safePrintMargins')?.checked) return go('#safePrintMargins', { check: true });
}

function hasSupportedPrintCount(){
  const activeCount = document.querySelector('[data-count].active')?.dataset.count || '';
  return ['1','2','4','6','8'].includes(activeCount);
}

function go(selector, options = {}){
  const target = document.querySelector(selector);
  if(!target) return;
  revealWizardSection(target);
  if(options.click && target.matches('button')) target.click();
  if(options.check && target.matches('input[type="checkbox"]') && !target.checked){
    target.checked = true;
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.focus?.();
}

function revealWizardSection(target){
  if(document.body.dataset.wizardFlow !== 'on') return;
  const section = target.closest?.('[data-wizard-section]');
  const sectionId = String(section?.dataset.wizardSection || '').trim();
  if(!sectionId) return;
  document.dispatchEvent(new CustomEvent('spn:wizard-open-step', {detail:{id:sectionId}}));
}

function status(text){
  const el = document.getElementById('statusLine');
  if(el) el.textContent = text;
}
