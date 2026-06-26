import fs from 'node:fs';

const source = read('assets/js/qualityExtraActions.js');
const errors = [];

check(source, 'assets/js/qualityExtraActions.js', [
  "{ title: 'QR включён, но ссылки нет', action: 'focusQrLink', label: 'Добавить ссылку' }",
  "if (action === 'focusQrLink') focusQrField('QR оставлен включённым. Вставьте ссылку, которую человек откроет после сканирования.');",
  "function focusQrField(statusText = 'Вставьте короткую ссылку для QR: длинные ссылки встроенный QR не печатает надёжно.')"
]);

forbid(source, 'assets/js/qualityExtraActions.js', [
  "{ title: 'QR включён, но ссылки нет', action: 'disableQr'",
  'function disableQr()'
]);

if (errors.length) {
  console.error('\nОшибки прямого действия пустого QR:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Прямое действие пустого QR безопасно.');

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

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
