import fs from 'node:fs';

const files = {
  module:'assets/js/spnDensePrintPolicy.js',
  entry:'assets/js/spnUiMode.js',
  harness:'tools/print-screenshot.html',
  eightHarness:'tools/eight-print-screenshot.html',
  guide:'docs/print-format-policy.md'
};
const sources = Object.fromEntries(Object.entries(files).map(([key,file]) => [key, fs.readFileSync(file,'utf8')]));
const errors = [];

requireSnippets(files.module, sources.module, [
  'const DENSE_PRINT_COUNTS = new Set([6, 8]);',
  "const STYLE_ID = 'spnDensePrintStyles';",
  "document.addEventListener('DOMContentLoaded', initDensePrintPolicy)",
  'export function initDensePrintPolicy()',
  'ensureDensePrintStyles();',
  "row.addEventListener('click'",
  'const observer = new MutationObserver(applyDensePrintPolicy);',
  "observer.observe(row, {subtree:true, attributes:true, attributeFilter:['class']})",
  'export function applyDensePrintPolicy()',
  'checkbox.disabled = dense;',
  'checkbox.checked = false;',
  "checkbox.dispatchEvent(new Event('change', {bubbles:true}))",
  'Для ${count} на A4 отрывные полосы выключены, чтобы сохранить читаемость.',
  "hint.id = 'densePrintTearOffHint';",
  'function ensureDensePrintStyles()',
  '.flyer.count-8{',
  '--flyer-pad:2.2mm;',
  '.flyer.count-8 .headline{font-size:calc(12pt * var(--headline-scale))',
  '.flyer.count-8 .phone{font-size:calc(12pt * var(--phone-scale))',
  '.flyer.count-8 .benefit:nth-child(n+3){display:none}',
  'document.head.appendChild(style);'
]);
requireSnippets(files.entry, sources.entry, ["import './spnDensePrintPolicy.js';"]);
requireSnippets(files.harness, sources.harness, [
  "scenario === 'six-economy'",
  'формат 6 на А4 неожиданно содержит отрывные полосы',
  'экономный макет 6 на А4 содержит отрывные полосы'
]);
requireSnippets(files.eightHarness, sources.eightHarness, [
  "click(doc, '[data-count=\"8\"]')",
  'формат 8 на А4 содержит отрывные полосы',
  'обнаружен overflow макета 8 на А4',
  'телефон в формате 8 на А4 недостаточно читаемый',
  'заголовок в формате 8 на А4 недостаточно читаемый'
]);
requireSnippets(files.guide, sources.guide, [
  'сценарий 6 на A4',
  'сценарий 8 на A4',
  'отсутствие фото и отрывных полос',
  'минимальный размер телефона 16 px',
  'минимальный размер заголовка 12 px'
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
