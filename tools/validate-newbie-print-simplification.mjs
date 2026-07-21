import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  index: 'index.html',
  uiMode: 'assets/js/spnUiMode.js',
  uiModeCss: 'assets/css/spn-ui-mode.css',
  checklist: 'docs/newbie-mode-regression-checklist.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.index, sources.index, [
  'id="splitMode"',
  'id="colorMode"',
  'id="printCheckMode"',
  'id="showCutLines"',
  'id="safePrintMargins"'
]);

requireSnippets(files.uiMode, sources.uiMode, [
  'markModeSpecificControls();',
  'function markModeSpecificControls()',
  "['splitMode', 'printCheckMode']",
  "classList.add('spn-newbie-advanced-print')",
  'проверка перед печатью'
]);

forbidSnippets(files.uiMode, sources.uiMode, [
  "['splitMode', 'colorMode', 'printCheckMode']",
  "['colorMode']"
]);

requireSnippets(files.uiModeCss, sources.uiModeCss, [
  'body[data-spn-ui-mode="newbie"] .spn-newbie-advanced-print{display:none!important}'
]);

forbidSnippets(files.uiModeCss, sources.uiModeCss, [
  'body[data-spn-ui-mode="quick"] .spn-newbie-advanced-print',
  'body[data-spn-ui-mode="advanced"] .spn-newbie-advanced-print'
]);

requireSnippets(files.checklist, sources.checklist, [
  'Деление листа',
  'Режим проверки печати',
  'Цветность остаётся доступной',
  'линии реза и безопасные поля остаются доступными'
]);

if(errors.length){
  console.error('\nОшибки упрощения печати для новичка:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Упрощение шага печати для новичка проверено.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный фрагмент — ${snippet}`);
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
