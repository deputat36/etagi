import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  helper: 'assets/js/spnAdvancedWorkbench.js',
  entry: 'assets/js/spnUiMode.js',
  index: 'index.html',
  guide: 'docs/advanced-workbench.md'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.helper, sources.helper, [
  "const GROUP_ID = 'spnAdvancedWorkbench'",
  "const GROUP_STATE_KEY = 'etagi-raskleyka-advanced-workbench-open-v1'",
  "const SECTION_IDS = ['spnFieldPlan', 'spnLeadQualification', 'spnResultEstimator']",
  'new MutationObserver(() => organizeSections(sidebar, observer))',
  "observer.observe(sidebar, {childList:true})",
  'window.setTimeout(() => observer.disconnect(), 5000)',
  'observer.disconnect();',
  "details.className = 'card spn-advanced-workbench'",
  "details.open = readOpenState()",
  'Дополнительная аналитика',
  'План расклейки · квалификация отклика · итог теста',
  "sections[0].insertAdjacentElement('beforebegin', details)",
  'sections.forEach(section => body.append(section))',
  "details.addEventListener('toggle'",
  'localStorage.setItem(GROUP_STATE_KEY',
  'body[data-spn-ui-mode="quick"] .spn-advanced-workbench',
  'body[data-spn-ui-mode="newbie"] .spn-advanced-workbench',
  '@media print'
]);

forbidSnippets(files.helper, sources.helper, [
  'cloneNode(',
  'outerHTML',
  'setInterval(',
  "document.addEventListener('click'",
  "window.addEventListener('click'",
  'localStorage.clear('
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnAdvancedWorkbench.js';"
]);

forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnAdvancedWorkbench.js"',
  "src='assets/js/spnAdvancedWorkbench.js'"
]);

requireSnippets(files.guide, sources.guide, [
  '# Дополнительная аналитика',
  '`План расклейки`',
  '`Квалификация отклика`',
  '`Итог теста расклейки`',
  '`После печати`',
  'не создаёт копии секций',
  'etagi-raskleyka-advanced-workbench-open-v1',
  'npm run validate:advanced-workbench'
]);

if(errors.length){
  console.error('\nОшибки блока дополнительной аналитики:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка блока дополнительной аналитики пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
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
