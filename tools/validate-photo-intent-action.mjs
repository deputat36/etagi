import fs from 'node:fs';

const photoSource = read('assets/js/photoIntentFix.js');
const qrSource = read('assets/js/qrIntentFix.js');
const qualitySource = read('assets/js/quality.js');
const errors = [];

const requiredPhotoSnippets = [
  "const FIRST_PHOTO_TITLE = 'Фото включено, но не загружено'",
  "const SECOND_PHOTO_TITLE = 'Второе фото не загружено'",
  "markPhotoButton(item, 'noPhoto', 'photoOne'",
  "markPhotoButton(item, 'onePhoto', 'photoTwo'",
  "button.dataset.photoIntentFix = inputId",
  "event.stopImmediatePropagation?.()",
  "Фото оставлено включённым"
];

for (const snippet of requiredPhotoSnippets) {
  if (!photoSource.includes(snippet)) {
    errors.push(`photoIntentFix.js: отсутствует защита намерения пользователя — ${snippet}`);
  }
}

if (!qrSource.includes("import './photoIntentFix.js';")) {
  errors.push('qrIntentFix.js: photoIntentFix.js не подключён через существующую цепочку модулей');
}

const requiredQualitySnippets = [
  "title:'Фото включено, но не загружено'",
  "action:'noPhoto'",
  "title:'Второе фото не загружено'",
  "action:'onePhoto'"
];

for (const snippet of requiredQualitySnippets) {
  if (!qualitySource.includes(snippet)) {
    errors.push(`quality.js: не найдено исходное замечание для фото — ${snippet}`);
  }
}

if (errors.length) {
  console.error('\nОшибки безопасного сценария фото:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка безопасного сценария фото пройдена.');

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
