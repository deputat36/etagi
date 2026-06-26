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
  'подавленное замечание не выбирается как первое исправление ни в `qualityPriorityHint.js`',
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
