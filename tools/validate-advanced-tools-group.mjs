import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  group: 'assets/js/spnAdvancedToolsGroup.js',
  entry: 'assets/js/spnUiMode.js',
  fieldPlan: 'assets/js/spnFieldPlan.js',
  qualification: 'assets/js/spnLeadQualification.js',
  estimator: 'assets/js/spnResultEstimator.js',
  guide: 'docs/advanced-tools-group.md',
  smoke: 'tools/browser-smoke.html'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.group, sources.group, [
  "const GROUP_ID = 'spnAdvancedToolsGroup'",
  "const STORAGE_KEY = 'etagi-raskleyka-advanced-tools-open-v1'",
  "const TOOL_IDS = ['spnFieldPlan', 'spnLeadQualification', 'spnResultEstimator']",
  'const MAX_ATTEMPTS = 6;',
  'window.requestAnimationFrame',
  "group.className = 'card advanced spn-advanced-tools-group'",
  'Планирование и результат',
  '3 инструмента',
  'tools.forEach(tool => content.append(tool))',
  "group.addEventListener('toggle'",
  "localStorage.setItem(STORAGE_KEY, group.open ? '1' : '0')",
  '@media(max-width:640px)',
  '@media print'
]);

forbidSnippets(files.group, sources.group, [
  'setInterval(',
  "document.addEventListener('click'",
  "window.addEventListener('click'",
  'cloneNode(',
  'window.print('
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnAdvancedToolsGroup.js';"
]);

requireSnippets(files.fieldPlan, sources.fieldPlan, [
  'id="spnFieldPlan"'
]);
requireSnippets(files.qualification, sources.qualification, [
  'id="spnLeadQualification"'
]);
requireSnippets(files.estimator, sources.estimator, [
  'id="spnResultEstimator"'
]);

requireSnippets(files.guide, sources.guide, [
  '# Группировка расширенных инструментов',
  'Планирование и результат',
  'режиме `Расширенно`',
  'DOM-узлы перемещаются без пересоздания',
  'не выводится на печать',
  'Ручная проверка'
]);

requireSnippets(files.smoke, sources.smoke, [
  'spnAdvancedToolsGroup',
  'Планирование и результат',
  'расширенные инструменты сгруппированы'
]);

if(errors.length){
  console.error('\nОшибки группировки расширенных инструментов:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка группировки расширенных инструментов пройдена.');

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
