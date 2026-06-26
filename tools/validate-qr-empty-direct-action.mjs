import fs from 'node:fs';

const actionsSource = read('assets/js/qualityExtraActions.js');
const qualitySource = read('assets/js/quality.js');
const layoutExtrasSyncSource = read('assets/js/layoutExtrasSync.js');
const errors = [];

check(actionsSource, 'assets/js/qualityExtraActions.js', [
  "{ title: 'QR включён, но ссылки нет', action: 'focusQrLink', label: 'Добавить ссылку' }",
  "if (action === 'focusQrLink') focusQrField('QR оставлен включённым. Вставьте ссылку, которую человек откроет после сканирования.');",
  "function focusQrField(statusText = 'Вставьте короткую ссылку для QR: длинные ссылки встроенный QR не печатает надёжно.')"
]);

check(qualitySource, 'assets/js/quality.js', [
  "title:'QR включён, но ссылки нет'"
]);

checkIssueAction('QR включён, но ссылки нет', 'null', "'disableQr'", 'пустой QR должен вести к полю ссылки через focusQrLink, а не выключать QR');

forbid(actionsSource, 'assets/js/qualityExtraActions.js', [
  "{ title: 'QR включён, но ссылки нет', action: 'disableQr'",
  'function disableQr()'
]);

forbid(layoutExtrasSyncSource, 'assets/js/layoutExtrasSync.js', [
  "import './qrIntentFix.js';"
]);

if (fs.existsSync('assets/js/qrIntentFix.js')) {
  errors.push('assets/js/qrIntentFix.js: временный helper должен оставаться удалённым');
}

if (errors.length) {
  console.error('\nОшибки прямого действия пустого QR:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Прямое действие пустого QR безопасно.');

function checkIssueAction(title, expectedAction, forbiddenAction, message) {
  if (!hasIssueAction(title, expectedAction)) {
    errors.push(`assets/js/quality.js: ${message}`);
  }
  if (hasIssueAction(title, forbiddenAction)) {
    errors.push(`assets/js/quality.js: у замечания «${title}» найдено запрещённое действие ${forbiddenAction}`);
  }
}

function hasIssueAction(title, actionValue) {
  const pattern = new RegExp(`issues\\.push\\(\\{[^}]*title\\s*:\\s*['\"]${escapeRegExp(title)}['\"][^}]*action\\s*:\\s*${escapeRegExp(actionValue)}[^}]*\\}\\)`);
  return pattern.test(qualitySource);
}

function check(sourceText, file, snippets) {
  for (const snippet of snippets) {
    if (!sourceText.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function forbid(sourceText, file, snippets) {
  for (const snippet of snippets) {
    if (sourceText.includes(snippet)) errors.push(`${file}: найдено опасное поведение ${snippet}`);
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
