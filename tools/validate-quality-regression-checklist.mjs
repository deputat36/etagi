import fs from 'node:fs';

const checklistSource = read('docs/quality-regression-checklist.md');
const errors = [];

check(checklistSource, 'docs/quality-regression-checklist.md', [
  '# Чек-лист регрессионной проверки качества',
  'QR включён, но ссылка пустая',
  'штатное действие в `qualityExtraActions.js` сразу использует `focusQrLink`, а не старое `disableQr`',
  'временный helper `qrIntentFix.js` не возвращается',
  'validate:qr-empty-direct-action',
  'validate:quality-helper-imports',
  'Фото включено, но файл не загружен',
  'штатные действия `noPhoto` и `onePhoto` не создаются в `quality.js`',
  'временный helper `photoIntentFix.js` не возвращается',
  'validate:photo-intent-action',
  'Нет канала отклика',
  'замечание показывает прямое действие «Настроить отклик»',
  '`quality.js` не создаёт старое действие `showContact` для этого замечания',
  'прямое действие в `qualityExtraActions.js` использует `responseChannel`',
  'если телефон корректный, действие включает контакты',
  'временный helper `responseChannelPhoneGuard.js` не возвращается',
  'validate:response-channel-action',
  'validate:quality-issue-actions',
  'Дублирующиеся QR-замечания',
  'при 4 макетах на А4 может появляться мягкий совет',
  'при 6–8 макетах на А4 мягкий совет не должен создаваться в `quality.js`',
  'UI-подавление дубля остаётся страховкой',
  'подавленное замечание не учитывается в сводке перед печатью',
  'подавленное замечание не выбирается как первое исправление в `qualityPriorityHint.js`',
  '`qualityPriorityHint.js` подключён в `index.html` выше `preprintSummary.js`',
  '`preprintSummary.js` подключён в `index.html` выше `qualityExtraActions.js`',
  '`layoutExtrasSync.js` не импортирует удалённые `qrIntentFix.js`, `photoIntentFix.js` и `responseChannelPhoneGuard.js`',
  '`qrSizeHint.js` явно импортирует `qualityQrDeduplicate.js`',
  'ключевые helper-файлы качества не должны лежать в `assets/js` без ожидаемого импорта',
  'устаревшие helper-файлы после переноса логики не должны возвращаться в `assets/js`',
  'Порядок загрузки помощников',
  'Перед печатью',
  'сводка перед печатью не должна считать подавленные замечания активными ошибками или предупреждениями',
  'Автоподстройка макета',
  'обычная кнопка «Подстроить автоматически» сохраняет прежнее поведение',
  'отдельная кнопка «Подстроить, сохранив фото и QR» использует `applyLayoutModePreservingMedia`',
  'мягкая автоподстройка сохраняет уже включённый QR',
  'мягкая автоподстройка сохраняет уже включённое фото и текущий `photoMode`',
  'быстрое исправление `autoFix` в контроле качества остаётся на старом `applyLayoutMode`',
  'validate:layout-media-preservation',
  'disableQr',
  'noPhoto',
  'onePhoto',
  'showContact',
  'autoFix',
  'applyLayoutMode',
  'validate:quality-helper-imports',
  'validate:response-channel-action'
]);

if (checklistSource.includes('даже ранний клик по старой кнопке `disableQr`')) {
  errors.push('docs/quality-regression-checklist.md: устаревшее требование перехвата старой кнопки disableQr после удаления qrIntentFix.js');
}

if (checklistSource.includes('даже ранний клик по штатным действиям `noPhoto` или `onePhoto`')) {
  errors.push('docs/quality-regression-checklist.md: устаревшее требование перехвата старых фото-действий после удаления photoIntentFix.js');
}

if (checklistSource.includes('Нажать «Вернуть контакты»')) {
  errors.push('docs/quality-regression-checklist.md: устаревшая кнопка «Вернуть контакты» после переноса действия в responseChannel');
}

if (checklistSource.includes('До отдельного решения не менять это поведение автоматически')) {
  errors.push('docs/quality-regression-checklist.md: автоподстройка уже получила отдельное мягкое действие, старый спорный блок нужно убрать');
}

if (checklistSource.includes('Подстроить без отключения фото и QR')) {
  errors.push('docs/quality-regression-checklist.md: используйте фактическую подпись кнопки «Подстроить, сохранив фото и QR»');
}

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
