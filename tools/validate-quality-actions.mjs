import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const actionsSource = readRequired('assets/js/qualityExtraActions.js');
const qualitySource = readRequired('assets/js/quality.js');
const appSource = readRequired('assets/js/app.js');
const indexSource = readRequired('index.html');
const stylesSource = readRequired('assets/css/ui-improvements.css');
const errors = [];

if (actionsSource && qualitySource) {
  const actions = extractQuickActions(actionsSource);
  if (!actions.length) errors.push('assets/js/qualityExtraActions.js: не найдены быстрые исправления');

  const titleCounts = countItems(actions.map(item => item.title));
  for (const [title, count] of titleCounts) {
    if (count > 1) errors.push(`assets/js/qualityExtraActions.js: дублируется заголовок — ${title}`);
  }

  for (const item of actions) {
    if (!item.title || !item.action || !item.label) {
      errors.push(`assets/js/qualityExtraActions.js: неполное описание быстрого исправления — ${JSON.stringify(item)}`);
      continue;
    }
    if (!/^[a-z][a-zA-Z0-9]*$/.test(item.action)) {
      errors.push(`assets/js/qualityExtraActions.js: небезопасное имя действия — ${item.action}`);
    }
    if (item.label.length > 32) {
      errors.push(`assets/js/qualityExtraActions.js: слишком длинная подпись кнопки — ${item.label}`);
    }
    if (!qualitySource.includes(`title:'${item.title}'`) && !qualitySource.includes(`title: '${item.title}'`)) {
      errors.push(`assets/js/qualityExtraActions.js: заголовок не найден в quality.js — ${item.title}`);
    }
    if (!actionsSource.includes(`action === '${item.action}'`)) {
      errors.push(`assets/js/qualityExtraActions.js: действие не обработано — ${item.action}`);
    }
  }
}

const requiredActionSnippets = [
  "document.addEventListener('DOMContentLoaded', init)",
  "list.addEventListener('click', handleBuiltInFixClick, true)",
  "list.addEventListener('click', handleClick)",
  'new MutationObserver(enhanceQualityList)',
  "item.querySelector('[data-extra-quality-fix]')",
  'type="button"',
  'class="quality-extra-fix-btn"',
  'aria-label="${escapeHtml(ariaLabel)}"',
  'escapeHtml(config.label)',
  'function setInputValue(input, value)',
  "input.dispatchEvent(new Event('input', { bubbles: true }))",
  "input.dispatchEvent(new Event('change', { bubbles: true }))",
  'function setCheckboxValue(id, checked)',
  "checkbox.dispatchEvent(new Event('change', { bubbles: true }))",
  'function getPrintCount() {',
  'function shorten(text, max) {'
];

for (const snippet of requiredActionSnippets) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`assets/js/qualityExtraActions.js: отсутствует обязательная часть — ${snippet}`);
  }
}

const requiredDirectPhotoActionSnippets = [
  "{ title: 'Фото включено, но не загружено', action: 'focusPhotoOne', label: 'Перейти к фото' }",
  "{ title: 'Второе фото не загружено', action: 'focusPhotoTwo', label: 'Перейти ко второму фото' }",
  "if (action === 'focusPhotoOne') focusPhotoField('photoOne', 'Фото оставлено включённым. Выберите файл в поле Фото 1.');",
  "if (action === 'focusPhotoTwo') focusPhotoField('photoTwo', 'Фото оставлено включённым. Выберите второе фото или переключите режим на одно фото.');",
  'function focusPhotoField(inputId, statusText)',
  "const input = document.getElementById(inputId)",
  'Фото оставлено включённым'
];

for (const snippet of requiredDirectPhotoActionSnippets) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`assets/js/qualityExtraActions.js: не закреплено прямое безопасное действие фото — ${snippet}`);
  }
}

const requiredDirectQrActionSnippets = [
  "{ title: 'QR включён, но ссылки нет', action: 'focusQrLink', label: 'Добавить ссылку' }",
  "if (action === 'focusQrLink') focusQrField('QR оставлен включённым. Вставьте ссылку, которую человек откроет после сканирования.');",
  "function focusQrField(statusText = 'Вставьте короткую ссылку для QR: длинные ссылки встроенный QR не печатает надёжно.')",
  "const input = document.getElementById('qrLink')",
  'input.select?.()',
  'QR оставлен включённым'
];

for (const snippet of requiredDirectQrActionSnippets) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`assets/js/qualityExtraActions.js: не закреплено прямое безопасное действие пустого QR — ${snippet}`);
  }
}

const forbiddenActionSnippets = [
  "document.getElementById('qualityBtn')?.click()",
  'function rerunQuality()',
  'setInputValue(input, shorten(input.value, 70))',
  "setInputValue(input, '')",
  "setLayoutExtra('brandName', DEFAULT_BRAND_NAME)",
  "setLayoutExtra('brandSideText', DEFAULT_BRAND_SIDE)",
  "{ title: 'QR включён, но ссылки нет', action: 'disableQr'",
  'function disableQr()'
];

for (const snippet of forbiddenActionSnippets) {
  if (actionsSource.includes(snippet)) {
    errors.push(`assets/js/qualityExtraActions.js: найдено устаревшее или разрушающее данные поведение — ${snippet}`);
  }
}

const forbiddenQualitySnippets = [
  "action:'noPhoto'",
  "action:'onePhoto'"
];

for (const snippet of forbiddenQualitySnippets) {
  if (qualitySource.includes(snippet)) {
    errors.push(`assets/js/quality.js: найдено устаревшее действие фото — ${snippet}`);
  }
}

const requiredBuiltInMarkup = [
  'class="quality-fix-btn"',
  'aria-label="${esc(ariaLabel)}"',
  'data-fix="${i.action}"',
  'esc(label)'
];
for (const snippet of requiredBuiltInMarkup) {
  if (!appSource.includes(snippet)) errors.push(`assets/js/app.js: отсутствует разметка штатной кнопки — ${snippet}`);
}

const requiredScripts = [
  'assets/js/app.js',
  'assets/js/qualityLevelLabels.js',
  'assets/js/qualityIssueSummary.js',
  'assets/js/qualityPriorityHint.js',
  'assets/js/qualityPrintGuardHint.js',
  'assets/js/qualityIssueFilters.js',
  'assets/js/qualityExtraActions.js'
];
for (const script of requiredScripts) {
  if (!indexSource.includes(`src="${script}"`)) errors.push(`index.html: не подключён ${script}`);
}

for (const className of ['.quality-fix-btn', '.quality-extra-fix-btn', '#printBtn.print-blocked', '#printBtn.print-has-warnings']) {
  if (!stylesSource.includes(className)) errors.push(`assets/css/ui-improvements.css: не найден стиль ${className}`);
}

if (errors.length) {
  console.error('\nОшибки быстрых исправлений контроля качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка быстрых исправлений контроля качества пройдена.');

function extractQuickActions(source) {
  const block = source.match(/const actions = \[([\s\S]*?)\n  \];/)?.[1] || '';
  return [...block.matchAll(/\{\s*title:\s*['"]([^'"]+)['"],\s*action:\s*['"]([^'"]+)['"],\s*label:\s*['"]([^'"]+)['"]\s*\}/g)]
    .map(match => ({ title: match[1], action: match[2], label: match[3] }));
}

function countItems(items) {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) || 0) + 1);
  return counts;
}

function readRequired(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}
