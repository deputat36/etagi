import fs from 'node:fs';

const actionsSource = read('assets/js/qualityExtraActions.js');
const guardSource = read('assets/js/responseChannelPhoneGuard.js');
const layoutSyncSource = read('assets/js/layoutExtrasSync.js');
const qualitySource = read('assets/js/quality.js');
const errors = [];

check(actionsSource, 'qualityExtraActions.js', [
  "import { cleanPhoneValue, getPhoneInfo } from './phone.js';",
  "{ title: 'Нет канала отклика', action: 'responseChannel', label: 'Настроить отклик' }",
  "if (action === 'responseChannel') setResponseChannel();",
  'function setResponseChannel()',
  'getPhoneInfo(getPhoneValue())',
  "enableCheckbox('showContact');",
  'Контакты включены',
  'Сначала укажите полный телефон для отклика'
]);

check(qualitySource, 'quality.js', [
  "title:'Нет канала отклика'",
  "Добавьте канал отклика: контакты, отрывные листки или QR."
]);

checkIssueAction('Нет канала отклика', 'null', "'showContact'", 'замечание без канала отклика должно исправляться прямой кнопкой responseChannel, а не старым showContact');
forbid(layoutSyncSource, 'layoutExtrasSync.js', ["import './responseChannelPhoneGuard.js';"]);
forbid(actionsSource, 'qualityExtraActions.js', [
  'function hasPhoneValue()',
  "button.dataset.fix === 'showContact'",
  'function hasLikelyPhoneValue()'
]);

if (guardSource) {
  errors.push('assets/js/responseChannelPhoneGuard.js: файл должен быть удалён после переноса логики в qualityExtraActions.js');
}

if (errors.length) {
  console.error('\nОшибки безопасного канала отклика:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка безопасного канала отклика пройдена.');

function checkIssueAction(title, expectedAction, forbiddenAction, message) {
  if (!hasIssueAction(title, expectedAction)) {
    errors.push(`quality.js: ${message}`);
  }
  if (hasIssueAction(title, forbiddenAction)) {
    errors.push(`quality.js: у замечания «${title}» найдено запрещённое действие ${forbiddenAction}`);
  }
}

function hasIssueAction(title, actionValue) {
  const pattern = new RegExp(`issues\\.push\\(\\{[^}]*title\\s*:\\s*['\"]${escapeRegExp(title)}['\"][^}]*action\\s*:\\s*${escapeRegExp(actionValue)}[^}]*\\}\\)`);
  return pattern.test(qualitySource);
}

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function forbid(source, file, snippets) {
  for (const snippet of snippets) {
    if (source.includes(snippet)) errors.push(`${file}: найдено устаревшее поведение ${snippet}`);
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
