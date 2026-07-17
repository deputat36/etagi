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
  wrapper: 'tools/validate-preview-controls.mjs',
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
requireSnippets(files.guide, sources.guide, [
  '# Вычисляемое «Вписать»',
  'доступную ширину `.sheet-wrap`',
  'доступную высоту `.sheet-wrap`',
  '`ResizeObserver`',
  'ручное переопределение',
  'npm run validate:preview-quickbar',
  '`Fit preview smoke`'
]);
requireSnippets(files.wrapper, sources.wrapper, [
  "import './validate-preview-quickbar.mjs';",
  "import './validate-fit-preview.mjs';"
]);

const registry = readJson(files.registry, sources.registry);
const fitAction = registry?.actions?.find(action => action?.id === 'preview.fit');
if(!fitAction){
  errors.push(`${files.registry}: действие preview.fit не найдено`);
} else {
  if(fitAction.owner !== 'assets/js/spnFitPreview.js') errors.push(`${files.registry}: preview.fit должен принадлежать assets/js/spnFitPreview.js`);
  if(fitAction.verification?.type !== 'browser') errors.push(`${files.registry}: preview.fit должен иметь browser-проверку`);
  if(fitAction.verification?.source !== 'tools/fit-preview-smoke.html') errors.push(`${files.registry}: preview.fit должен ссылаться на tools/fit-preview-smoke.html`);
  if(fitAction.verification?.marker !== 'Вписать: рассчитан фактический масштаб') errors.push(`${files.registry}: preview.fit содержит неверный marker`);
}

const pkg = readJson(files.package, sources.package);
if(String(pkg?.scripts?.['validate:preview-quickbar'] || '').trim() !== 'node tools/validate-preview-controls.mjs'){
  errors.push(`${files.package}: validate:preview-quickbar должен запускать node tools/validate-preview-controls.mjs`);
}
if(Object.hasOwn(pkg?.scripts || {}, 'validate:fit-preview')){
  errors.push(`${files.package}: отдельный validate:fit-preview не нужен — проверка должна входить в validate:preview-quickbar`);
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
