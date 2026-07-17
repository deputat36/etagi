import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  module: 'assets/js/spnFitPreview.js',
  entry: 'assets/js/spnUiMode.js',
  runner: 'tools/run-ui-actions-smoke.mjs',
  smoke: 'tools/fit-preview-smoke.html',
  registry: 'data/ui-actions.json',
  guide: 'docs/fit-preview.md',
  package: 'package.json'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.module, sources.module, [
  'const FIT_MIN_PERCENT = 20',
  'const FIT_MAX_PERCENT = 100',
  "document.querySelector('.sheet-wrap')",
  'wrap.clientWidth - horizontalPadding',
  'wrap.clientHeight - verticalPadding',
  'sheet.offsetWidth',
  'sheet.offsetHeight',
  'Math.floor(Math.min(',
  "button.setAttribute('aria-pressed', 'false')",
  "button.setAttribute('aria-pressed', String(fitActive))",
  "zoom.setAttribute('aria-label', 'Масштаб предпросмотра')",
  "output.setAttribute('aria-live', 'polite')",
  "window.addEventListener('resize', scheduleFit",
  "typeof window.ResizeObserver === 'function'",
  'observer.observe(wrap)',
  'observer.observe(sheet)',
  'fitActive = false',
  'applyZoomValue(scale, zoom, output, Number(zoom.value))'
]);
forbidSnippets(files.module, sources.module, [
  "zoom.value = '64'",
  'zoom.value = 64',
  "document.addEventListener('resize'",
  "document.addEventListener('keydown'",
  'localStorage',
  'sessionStorage'
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnFitPreview.js';"
]);
requireSnippets(files.runner, sources.runner, [
  "label:'Fit preview smoke'",
  "path:'tools/fit-preview-smoke.html'"
]);
requireSnippets(files.smoke, sources.smoke, [
  'id="uiActionsSmokeResult"',
  "zoom.min === '20' && zoom.max === '100'",
  "button.getAttribute('aria-pressed') === 'true'",
  'expectedFit(win, wrap, sheet, zoom)',
  'assertFits(win, wrap, sheet)',
  "frame.style.height = '520px'",
  "zoom.value = '80'",
  'resize изменил ручной масштаб после отключения Вписать',
  'повторное Вписать: вычисляемый режим восстановлен'
]);
requireSnippets(files.registry, sources.registry, [
  '"id": "preview.fit"',
  '"type": "browser"',
  '"source": "tools/fit-preview-smoke.html"',
  '"marker": "Вписать: рассчитан фактический масштаб"'
]);
requireSnippets(files.guide, sources.guide, [
  '# Вычисляемое «Вписать»',
  'доступную ширину `.sheet-wrap`',
  'доступную высоту `.sheet-wrap`',
  '`ResizeObserver`',
  'ручную переопределение',
  'npm run validate:fit-preview',
  '`Fit preview smoke`'
]);

const pkg = readJson(files.package, sources.package);
if(String(pkg?.scripts?.['validate:fit-preview'] || '').trim() !== 'node tools/validate-fit-preview.mjs'){
  errors.push(`${files.package}: validate:fit-preview должен запускать node tools/validate-fit-preview.mjs`);
}

if(errors.length){
  console.error('\nОшибки вычисляемого вписывания предпросмотра:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка вычисляемого вписывания предпросмотра пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}

function readJson(file, source){
  try{
    return JSON.parse(source || '{}');
  } catch(error){
    errors.push(`${file}: JSON не читается — ${error.message}`);
    return null;
  }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
