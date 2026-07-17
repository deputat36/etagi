const FIT_MIN_PERCENT = 20;
const FIT_MAX_PERCENT = 100;
const FIT_SAFETY_PX = 2;

let fitActive = false;
let resizeFrame = 0;

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('fitPreviewBtn');
  const zoom = document.getElementById('zoom');
  const scale = document.getElementById('sheetScale');
  const sheet = document.getElementById('printSheet');
  const wrap = document.querySelector('.sheet-wrap');
  if(!button || !zoom || !scale || !sheet || !wrap) return;

  zoom.min = String(FIT_MIN_PERCENT);
  zoom.max = String(FIT_MAX_PERCENT);
  zoom.setAttribute('aria-label', 'Масштаб предпросмотра');
  button.setAttribute('aria-pressed', 'false');
  button.title = 'Вписать лист A4 в доступную рабочую область';

  const output = ensureZoomOutput(zoom);
  syncZoomOutput(output, zoom.value);

  button.onclick = () => {
    fitActive = true;
    syncFitState(button);
    const fitted = applyFittedZoom({wrap, sheet, scale, zoom, output});
    const status = document.getElementById('statusLine');
    if(status) status.textContent = fitted === null
      ? 'Не удалось определить размер рабочей области.'
      : `Предпросмотр вписан в рабочую область: ${fitted}%.`;
  };

  zoom.oninput = () => {
    fitActive = false;
    syncFitState(button);
    applyZoomValue(scale, zoom, output, Number(zoom.value));
  };

  const scheduleFit = () => {
    if(!fitActive) return;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      applyFittedZoom({wrap, sheet, scale, zoom, output});
    });
  };

  window.addEventListener('resize', scheduleFit, {passive:true});
  if(typeof window.ResizeObserver === 'function'){
    const observer = new window.ResizeObserver(scheduleFit);
    observer.observe(wrap);
    observer.observe(sheet);
  }
});

function applyFittedZoom({wrap, sheet, scale, zoom, output}){
  const fitted = calculateFitPercent(wrap, sheet, zoom);
  if(fitted === null) return null;
  applyZoomValue(scale, zoom, output, fitted);
  return fitted;
}

function calculateFitPercent(wrap, sheet, zoom){
  const style = window.getComputedStyle(wrap);
  const horizontalPadding = toPixels(style.paddingLeft) + toPixels(style.paddingRight);
  const verticalPadding = toPixels(style.paddingTop) + toPixels(style.paddingBottom);
  const availableWidth = Math.max(0, wrap.clientWidth - horizontalPadding - FIT_SAFETY_PX);
  const availableHeight = Math.max(0, wrap.clientHeight - verticalPadding - FIT_SAFETY_PX);
  const sheetWidth = sheet.offsetWidth;
  const sheetHeight = sheet.offsetHeight;
  if(!availableWidth || !availableHeight || !sheetWidth || !sheetHeight) return null;

  const rawPercent = Math.floor(Math.min(
    availableWidth / sheetWidth,
    availableHeight / sheetHeight,
    1
  ) * 100);
  const min = Number(zoom.min) || FIT_MIN_PERCENT;
  const max = Number(zoom.max) || FIT_MAX_PERCENT;
  return Math.max(min, Math.min(max, rawPercent));
}

function applyZoomValue(scale, zoom, output, value){
  const min = Number(zoom.min) || FIT_MIN_PERCENT;
  const max = Number(zoom.max) || FIT_MAX_PERCENT;
  const percent = Math.max(min, Math.min(max, Math.round(Number(value) || 64)));
  zoom.value = String(percent);
  scale.style.transform = `scale(${percent / 100})`;
  syncZoomOutput(output, percent);
}

function ensureZoomOutput(zoom){
  const existing = document.getElementById('zoomValue');
  if(existing) return existing;
  const output = document.createElement('output');
  output.id = 'zoomValue';
  output.className = 'zoom-value';
  output.setAttribute('for', zoom.id);
  output.setAttribute('aria-live', 'polite');
  zoom.insertAdjacentElement('afterend', output);
  return output;
}

function syncZoomOutput(output, value){
  if(!output) return;
  const text = `${Math.round(Number(value) || 64)}%`;
  output.value = text;
  output.textContent = text;
}

function syncFitState(button){
  button.setAttribute('aria-pressed', String(fitActive));
  button.classList.toggle('active', fitActive);
}

function toPixels(value){
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}
