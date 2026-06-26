import fs from 'node:fs';

const checklistSource = read('docs/quality-regression-checklist.md');
const errors = [];

check(checklistSource, 'docs/quality-regression-checklist.md', [
  '# Чек-лист регрессионной проверки качества',
  'QR включён, но ссылка пустая',
  'Фото включено, но файл не загружен',
  'Нет канала отклика',
  'Дублирующиеся QR-замечания',
  'при 4 макетах на А4 может появляться мягкий совет',
  'при 6–8 макетах на А4 мягкий совет не должен создаваться в `quality.js`',
  'UI-подавление дубля остаётся страховкой',
  'подавленное замечание не учитывается в сводке перед печатью',
  'подавленное замечание не выбирается как первое исправление в `qualityPriorityHint.js`',
  '`qualityPriorityHint.js` подключён в `index.html` выше `preprintSummary.js`',
  '`preprintSummary.js` подключён в `index.html` выше `qualityExtraActions.js`',
  '`qrSizeHint.js` явно импортирует `qualityQrDeduplicate.js`',
  'ключевые helper-файлы качества не должны лежать в `assets/js` без ожидаемого импорта',
  'Порядок загрузки помощников',
  'Перед печатью',
  'сводка перед печатью не должна считать подавленные замечания активными ошибками или предупреждениями',
  'Автоподстройка макета',
  'disableQr',
  'noPhoto',
  'onePhoto',
  'autoFix',
  'applyLayoutMode',
  'Подстроить без отключения фото и QR',
  'validate:quality-helper-imports',
  'validate:response-channel-action'
]);

if (checklistSource.includes('страховочном модуле')) {
  errors.push('docs/quality-regression-checklist.md: устаревшее упоминание страховочного приоритета после переноса логики в qualityPriorityHint.js');
}

if (errors.length) {
  console.error('\nОшибки чек-листа регрессионной проверки качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка чек-листа регрессионной проверки качества пройдена.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
