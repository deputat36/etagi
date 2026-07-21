import fs from 'node:fs';

const files = {
  module:'assets/js/spnDensePrintPolicy.js',
  entry:'assets/js/spnUiMode.js',
  harness:'tools/print-screenshot.html',
  guide:'docs/print-format-policy.md'
};
const sources = Object.fromEntries(Object.entries(files).map(([key,file]) => [key, fs.readFileSync(file,'utf8')]));
const errors = [];

requireSnippets(files.module, sources.module, [
  'const DENSE_PRINT_COUNTS = new Set([6, 8]);',
  "document.addEventListener('DOMContentLoaded', initDensePrintPolicy)",
  'export function initDensePrintPolicy()',
  "row.addEventListener('click'",
  'const observer = new MutationObserver(applyDensePrintPolicy);',
  "observer.observe(row, {subtree:true, attributes:true, attributeFilter:['class']})",
  'export function applyDensePrintPolicy()',
  'checkbox.disabled = dense;',
  'checkbox.checked = false;',
  "checkbox.dispatchEvent(new Event('change', {bubbles:true}))",
  'Для ${count} на A4 отрывные полосы выключены, чтобы сохранить читаемость.',
  "hint.id = 'densePrintTearOffHint';"
]);
requireSnippets(files.entry, sources.entry, ["import './spnDensePrintPolicy.js';"]);
requireSnippets(files.harness, sources.harness, [
  "scenario === 'six-economy'",
  'формат 6 на А4 неожиданно содержит отрывные полосы',
  'экономный макет 6 на А4 содержит отрывные полосы'
]);
requireSnippets(files.guide, sources.guide, [
  'сценарий 6 на A4',
  'отсутствие отрывных полос'
]);

if(errors.length){
  console.error('\nОшибки политики плотной печати:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка политики плотной печати пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}