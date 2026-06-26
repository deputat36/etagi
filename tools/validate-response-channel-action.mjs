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
  'Сначала укажите полный телефон для отклика',
  "button.dataset.fix === 'showContact' && !hasLikelyPhoneValue()",
  'function hasLikelyPhoneValue()'
]);

check(qualitySource, 'quality.js', [
  "title:'Нет канала отклика'",
  "Добавьте канал отклика: контакты, отрывные листки или QR.",
  "action:null"
]);

forbid(qualitySource, 'quality.js', ["title:'Нет канала отклика', text:'В макете нет контактов, отрывных телефонов и QR. Для расклейки это почти всегда ошибка.', action:'showContact'"]);
forbid(layoutSyncSource, 'layoutExtrasSync.js', ["import './responseChannelPhoneGuard.js';"]);
forbid(actionsSource, 'qualityExtraActions.js', ['function hasPhoneValue()']);

if (guardSource) {
  errors.push('assets/js/responseChannelPhoneGuard.js: файл должен быть удалён после переноса логики в qualityExtraActions.js');
}

if (errors.length) {
  console.error('\nОшибки безопасного канала отклика:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка безопасного канала отклика пройдена.');

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

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
