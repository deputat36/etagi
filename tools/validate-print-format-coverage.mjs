import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  harness:'tools/print-format-coverage-smoke.html',
  runner:'tools/run-print-format-coverage-smoke.mjs',
  workflow:'.github/workflows/validate-print-format-coverage.yml',
  densePolicy:'assets/js/spnDensePrintPolicy.js',
  docs:'docs/print-format-coverage.md'
};
const sources = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readRequired(file)]));

requireSnippets(files.harness, sources.harness, [
  'id="printFormatCoverageResult"',
  'const supportedCounts = [1, 2, 3, 4, 6, 8];',
  'const phoneThresholds = {1:30, 2:28, 3:24, 4:20, 6:18, 8:16};',
  'for(const count of supportedCounts)',
  'prepareTearOffFormat(win, doc, count)',
  'prepareDenseFormat(win, doc, count)',
  'verifyFormat(win, doc, count)',
  "click(doc, '[data-layout-mode=\"entrance\"]')",
  "click(doc, '[data-layout-mode=\"economy\"]')",
  "flyer.querySelectorAll('.tear').length === 8",
  'плотная политика не отключила полосы',
  'обнаружен overflow',
  'контакты вышли за карточку',
  'потерян полный телефон',
  'потеряно имя СПН',
  'телефон меньше ${phoneThresholds[count]} px',
  'ожидалось 8 полос',
  'полоса потеряла телефон',
  "result.dataset.status = 'passed'",
  'Последнее действие:',
  'Состояние:'
]);
forbidSnippets(files.harness, sources.harness, [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'localStorage.setItem'
]);

requireSnippets(files.runner, sources.runner, [
  "path.join(rootDir, 'print-format-coverage-failure.log')",
  'for(let attempt = 1; attempt <= 2; attempt += 1)',
  "'--virtual-time-budget=55000'",
  "'--dump-dom'",
  'printFormatCoverageResult',
  'status === \'passed\'',
  'fs.writeFileSync(failureLogPath',
  "path:'tools/print-format-coverage-smoke.html'"
]);

requireSnippets(files.workflow, sources.workflow, [
  'name: Validate print format coverage',
  'print-format-coverage:',
  'run: node tools/validate-print-format-coverage.mjs',
  'run: node tools/run-print-format-coverage-smoke.mjs',
  'name: print-format-coverage-failure',
  'path: print-format-coverage-failure.log'
]);
const contractStep = sources.workflow.indexOf('run: node tools/validate-print-format-coverage.mjs');
const browserStep = sources.workflow.indexOf('run: node tools/run-print-format-coverage-smoke.mjs');
if(contractStep < 0 || browserStep < 0 || contractStep > browserStep){
  errors.push(`${files.workflow}: статический контракт должен выполняться до browser smoke`);
}

requireSnippets(files.densePolicy, sources.densePolicy, [
  'const DENSE_PRINT_COUNTS = new Set([6, 8]);',
  'checkbox.disabled = dense;',
  'checkbox.checked = false;',
  "checkbox.dispatchEvent(new Event('change', {bubbles:true}))"
]);

requireSnippets(files.docs, sources.docs, [
  '1, 2, 3, 4, 6 и 8 макетов на A4',
  'полный телефон `+7 960 125-18-77`',
  'имя специалиста `Анна Качкина`',
  'ровно восемь полос в каждой карточке',
  'Форматы 6 и 8 считаются плотными',
  'print-format-coverage-failure',
  'не заменяет физическую печать issue #40'
]);

if(errors.length){
  console.error('\nОшибки единого покрытия форматов A4:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка единого покрытия форматов A4 пройдена.');

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
