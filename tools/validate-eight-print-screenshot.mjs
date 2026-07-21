import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  harness:'tools/eight-print-screenshot.html',
  runner:'tools/run-eight-print-screenshot.mjs',
  workflow:'.github/workflows/validate-eight-print.yml',
  densePolicy:'assets/js/spnDensePrintPolicy.js',
  formatGuide:'docs/print-format-policy.md',
  screenshotGuide:'docs/print-screenshot-regression.md'
};
const sources = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readRequired(file)]));

requireSnippets(files.harness, sources.harness, [
  'id="captureStatus"',
  'data-status="pending"',
  "click(doc, '[data-count=\"8\"]')",
  "click(doc, '[data-layout-mode=\"economy\"]')",
  "click(doc, '[data-photo=\"none\"]')",
  "querySelectorAll('#printSheet .flyer.color-economy.count-8.no-photo').length === 8",
  'function assertEightEconomy(win, doc)',
  'обнаружен overflow макета 8 на А4',
  'карточка 8 на А4 вышла за границы листа',
  'контакты выходят за границы макета 8 на А4',
  'формат 8 на А4 содержит отрывные полосы',
  'формат 8 на А4 содержит фотографии',
  "phone.textContent.trim() !== '+7 960 125-18-77'",
  "contact.textContent.includes('Анна Качкина')",
  'fontSize) < 16',
  'fontSize) < 12',
  'контактная зона 8 на А4 содержит большую тёмную заливку',
  "status.dataset.status = 'passed'",
  'prepareCaptureView(doc)'
]);
forbidSnippets(files.harness, sources.harness, [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'localStorage.setItem'
]);

requireSnippets(files.runner, sources.runner, [
  "path.join(rootDir, 'artifacts', 'eight-print-screenshot')",
  "path.join(outputDir, 'eight-economy.png')",
  "path.join(outputDir, 'eight-economy.json')",
  "path.join(rootDir, 'eight-print-screenshot-failure.log')",
  'for(let attempt = 1; attempt <= 2; attempt += 1)',
  "'--window-size=794,1123'",
  "'--remote-debugging-pipe'",
  "cdp.send('Runtime.evaluate'",
  "cdp.send('Page.captureScreenshot'",
  'waitForCaptureStatus',
  'attachCdpPipeErrorHandlers(input, output, failAll)',
  "captureMethod:'cdp-pipe'",
  "id:'eight-economy'",
  'sizeBytes < 10000',
  'fs.writeFileSync(failureLogPath'
]);
forbidSnippets(files.runner, sources.runner, [
  "'--virtual-time-budget=",
  "'--dump-dom'",
  '`--screenshot=${screenshotPath}`'
]);

requireSnippets(files.workflow, sources.workflow, [
  'name: Validate 8 on A4',
  'eight-print-screenshot:',
  'run: node tools/validate-eight-print-screenshot.mjs',
  'run: node tools/run-eight-print-screenshot.mjs',
  'name: print-screenshot-eight-economy',
  'path: artifacts/eight-print-screenshot/',
  'name: print-screenshot-failure-eight-economy',
  'path: eight-print-screenshot-failure.log'
]);
const contractStep = sources.workflow.indexOf('run: node tools/validate-eight-print-screenshot.mjs');
const screenshotStep = sources.workflow.indexOf('run: node tools/run-eight-print-screenshot.mjs');
if(contractStep < 0 || screenshotStep < 0 || contractStep > screenshotStep){
  errors.push(`${files.workflow}: статический контракт должен выполняться до запуска Chrome`);
}

requireSnippets(files.densePolicy, sources.densePolicy, [
  'const DENSE_PRINT_COUNTS = new Set([6, 8]);',
  'checkbox.disabled = dense;',
  'checkbox.checked = false;',
  'Для ${count} на A4 отрывные полосы выключены, чтобы сохранить читаемость.'
]);
requireSnippets(files.formatGuide, sources.formatGuide, [
  'сценарий 8 на A4',
  'восемь карточек 2×4',
  'минимальный размер телефона 16 px',
  'минимальный размер заголовка 12 px'
]);
requireSnippets(files.screenshotGuide, sources.screenshotGuide, [
  '`eight-economy.png`',
  '8 компактных макетов 2×4',
  'ровно восемь макетов',
  'минимальный размер телефона 16 px',
  'минимальный размер заголовка 12 px',
  'print-screenshot-eight-economy'
]);

if(errors.length){
  console.error('\nОшибки screenshot-проверки 8 на А4:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка screenshot-сценария 8 на А4 пройдена.');

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
function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
