import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  helper: 'assets/js/spnLayoutModeAccessibility.js',
  templateHelper: 'assets/js/spnTemplateKeyboard.js',
  entry: 'assets/js/spnUiMode.js',
  smoke: 'tools/browser-smoke.html',
  templateSmoke: 'tools/template-keyboard-smoke.html',
  checklist: 'docs/layout-mode-accessibility-checklist.md',
  templateChecklist: 'docs/template-keyboard-accessibility.md'
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

requireSnippets(files.templateHelper, sources.templateHelper, [
  "list.setAttribute('role', 'listbox')",
  "card.setAttribute('role', 'option')",
  "card.setAttribute('aria-selected'",
  'card.tabIndex = card === tabCard ? 0 : -1',
  "event.key === 'Enter' || event.key === ' '",
  "key === 'ArrowDown' || key === 'ArrowRight'",
  "key === 'ArrowUp' || key === 'ArrowLeft'",
  "key === 'Home'",
  "key === 'End'",
  'card.click()',
  'requestAnimationFrame(() => requestAnimationFrame',
  "event.target.closest(FAVORITE_SELECTOR)",
  "new MutationObserver(() => enhanceCards(list))",
  ":focus-visible"
]);

forbidSnippets(files.templateHelper, sources.templateHelper, [
  "document.addEventListener('keydown'",
  "window.addEventListener('keydown'",
  'localStorage.setItem',
  'applyTemplate('
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnLayoutModeAccessibility.js';",
  "import './spnTemplateKeyboard.js';"
]);

requireSnippets(files.smoke, sources.smoke, [
  'keyboard: End выбрал последнюю компоновку',
  'keyboard: Home вернул первую компоновку',
  'keyboard: ArrowRight выбрал следующую компоновку',
  'aria-checked="true"'
]);

requireSnippets(files.templateSmoke, sources.templateSmoke, [
  'id="uiActionsSmokeResult"',
  "list.getAttribute('role') === 'listbox'",
  "card.getAttribute('role') === 'option'",
  "card.getAttribute('aria-selected') === 'true'",
  "press(win, start, 'End')",
  "press(win, doc.activeElement, 'Home')",
  "press(win, doc.activeElement, 'ArrowRight')",
  "press(win, enterTarget, 'Enter')",
  "press(win, spaceTarget, ' ')",
  'после Enter фокус не вернулся на выбранную карточку',
  'обработчик карточек перехватил клавиши кнопки избранного'
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

requireSnippets(files.templateChecklist, sources.templateChecklist, [
  '# Клавиатурный выбор шаблонов',
  'ArrowDown',
  'ArrowRight',
  'ArrowUp',
  'ArrowLeft',
  '`Home`',
  '`End`',
  '`Enter` или `Space`',
  'role="listbox"',
  'role="option"',
  'aria-selected="true|false"',
  'Кнопка избранного остаётся самостоятельной кнопкой'
]);

if(errors.length){
  console.error('\nОшибки keyboard/focus доступности:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка keyboard/focus выбора компоновки и шаблонов пройдена.');

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
