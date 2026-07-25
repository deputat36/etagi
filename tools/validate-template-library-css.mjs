import fs from 'node:fs';

const files = {
  index: 'index.html',
  css: 'assets/css/template-library.css',
  menu: 'assets/js/spnTemplateMenuCompact.js',
  filters: 'assets/js/spnOfficeTemplateFilters.js',
  badges: 'assets/js/spnTemplateCardBadges.js'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);
const errors = [];

requireSnippets(files.index, sources.index, [
  'href="assets/css/print.css?v=3.85.0" media="print"',
  'href="assets/css/template-library.css?v=3.85.0"',
  'href="assets/css/template-keyboard.css?v=3.85.0"',
  'href="assets/css/quality-runtime.css?v=3.85.0"'
]);

checkStylesheetOrder();

requireSnippets(files.css, sources.css, [
  '.spn-office-template-filters{',
  '.spn-office-template-filter-grid{',
  '.spn-office-template-card.active{',
  '.template-menu-controls{',
  'body[data-template-menu-mode="compact"] .tpl-mini{display:none!important}',
  'body[data-template-menu-mode="compact"] .favorite-template-btn{',
  '.tpl-card-office-badges{',
  '.tpl-office-badge{',
  '.tpl-card-office-reason{',
  '.tpl-card.active .tpl-card-office-reason{',
  '@media(max-width:520px)',
  '@media print{'
]);

for (const key of ['menu', 'filters', 'badges']) {
  forbidSnippets(files[key], sources[key], [
    "createElement('style')",
    'createElement("style")',
    'function injectStyles(',
    'injectStyles();'
  ]);
}

forbidSnippets(files.menu, sources.menu, ['templateMenuCompactStyles']);
forbidSnippets(files.filters, sources.filters, ['spnOfficeTemplateFiltersStyles']);
forbidSnippets(files.badges, sources.badges, ['spnTemplateCardBadgesStyle']);

requireSnippets(files.menu, sources.menu, [
  "const TEMPLATE_MENU_KEY = 'etagi-raskleyka-template-menu-mode-v1';",
  "document.body.dataset.templateMenuMode = next;",
  "localStorage.setItem(TEMPLATE_MENU_KEY, mode)"
]);

requireSnippets(files.filters, sources.filters, [
  'id="spnOfficeTemplateFilters"',
  'data-office-query',
  "search.dispatchEvent(new Event('input', {bubbles:true}))"
]);

requireSnippets(files.badges, sources.badges, [
  "import { loadTemplates } from './templates.js';",
  'new MutationObserver(() => enhanceTemplateCards()).observe(list, { childList: true });',
  'tpl-card-office-badges',
  'tpl-card-office-reason'
]);

if (errors.length) {
  console.error('\nОшибки CSS библиотеки шаблонов:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка CSS библиотеки шаблонов пройдена.');

function checkStylesheetOrder() {
  const printIndex = sources.index.indexOf('assets/css/print.css?v=3.85.0');
  const libraryIndex = sources.index.indexOf('assets/css/template-library.css?v=3.85.0');
  const keyboardIndex = sources.index.indexOf('assets/css/template-keyboard.css?v=3.85.0');
  const qualityIndex = sources.index.indexOf('assets/css/quality-runtime.css?v=3.85.0');

  if (!(printIndex >= 0 && libraryIndex > printIndex && keyboardIndex > libraryIndex && qualityIndex > keyboardIndex)) {
    errors.push('index.html: ожидается порядок print.css → template-library.css → template-keyboard.css → quality-runtime.css');
  }
}

function requireSnippets(file, source, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets) {
  for (const snippet of snippets) {
    if (source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}

function readRequired(file) {
  if (!fs.existsSync(file)) {
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}
