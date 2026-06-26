import fs from 'node:fs';

const actionsSource = read('assets/js/qualityExtraActions.js');
const layoutExtrasSyncSource = read('assets/js/layoutExtrasSync.js');
const qualitySource = read('assets/js/quality.js');
const errors = [];

const requiredActionSnippets = [
  "{ title: 'Фото включено, но не загружено', action: 'focusPhotoOne', label: 'Перейти к фото' }",
  "{ title: 'Второе фото не загружено', action: 'focusPhotoTwo', label: 'Перейти ко второму фото' }",
  "if (action === 'focusPhotoOne') focusPhotoField('photoOne', 'Фото оставлено включённым. Выберите файл в поле Фото 1.');",
  "if (action === 'focusPhotoTwo') focusPhotoField('photoTwo', 'Фото оставлено включённым. Выберите второе фото или переключите режим на одно фото.');",
  'function focusPhotoField(inputId, statusText)',
  "const input = document.getElementById(inputId)",
  'input.scrollIntoView?.({ block: \'center\', behavior: \'smooth\' })',
  'input.focus?.()',
  'Фото оставлено включённым'
];

for (const snippet of requiredActionSnippets) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует прямое безопасное действие фото — ${snippet}`);
  }
}

const requiredQualitySnippets = [
  "title:'Фото включено, но не загружено'",
  "title:'Второе фото не загружено'",
  "action:null"
];

for (const snippet of requiredQualitySnippets) {
  if (!qualitySource.includes(snippet)) {
    errors.push(`quality.js: не найдено безопасное замечание для фото — ${snippet}`);
  }
}

const forbiddenSnippets = [
  "import './photoIntentFix.js';",
  "action:'noPhoto'",
  "action:'onePhoto'",
  "data-fix=\"noPhoto\"",
  "data-fix=\"onePhoto\""
];

for (const snippet of forbiddenSnippets) {
  if (layoutExtrasSyncSource.includes(snippet) || qualitySource.includes(snippet) || actionsSource.includes(snippet)) {
    errors.push(`найдено устаревшее действие фото — ${snippet}`);
  }
}

if (fs.existsSync('assets/js/photoIntentFix.js')) {
  errors.push('assets/js/photoIntentFix.js: временный helper должен оставаться удалённым');
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
