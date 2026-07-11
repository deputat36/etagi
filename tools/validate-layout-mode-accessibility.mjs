import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  helper: 'assets/js/spnLayoutModeAccessibility.js',
  entry: 'assets/js/spnUiMode.js',
  smoke: 'tools/browser-smoke.html',
  checklist: 'docs/layout-mode-accessibility-checklist.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.helper, sources.helper, [
  "grid.setAttribute('role', 'radiogroup')",
  "button.setAttribute('role', 'radio')",
  "button.setAttribute('aria-checked'",
  'button.tabIndex = selected ? 0 : -1',
  "event.key === 'ArrowRight'",
  "event.key === 'ArrowLeft'",
  "event.key === 'Home'",
  "event.key === 'End'",
  'window.cancelAnimationFrame(syncFrame)',
  'window.requestAnimationFrame',
  "new MutationObserver(() => scheduleSync(grid)).observe(grid",
  ':focus-visible'
]);

forbidSnippets(files.helper, sources.helper, [
  "document.addEventListener('keydown'",
  "window.addEventListener('keydown'"
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnLayoutModeAccessibility.js';"
]);

requireSnippets(files.smoke, sources.smoke, [
  'keyboard: End выбрал последнюю компоновку',
  'keyboard: Home вернул первую компоновку',
  'keyboard: ArrowRight выбрал следующую компоновку',
  'aria-checked="true"'
]);

requireSnippets(files.checklist, sources.checklist, [
  '# Чек-лист keyboard/focus для выбора компоновки',
  'ArrowRight',
  'ArrowLeft',
  'Home',
  'End',
  'tabindex="0"',
  'aria-checked="true"',
  'глобальные сочетания клавиш вне'
]);

if(errors.length){
  console.error('\nОшибки доступности выбора компоновки:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка keyboard/focus выбора компоновки пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден глобальный обработчик — ${snippet}`);
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
