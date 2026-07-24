import fs from 'node:fs';

const mapSource = read('docs/quality-helper-map.md');
const errors = [];

check(mapSource, 'docs/quality-helper-map.md', [
  '# Карта помощников качества',
  '`index.html` подключает основные модули качества напрямую',
  'включая прямой переход к полю ссылки для пустого QR, к полям загрузки для пустых фото и к безопасной настройке канала отклика',
  '## Единый канал обновлений списка качества',
  '`assets/js/qualityListUpdates.js` создаёт один `MutationObserver` для `#qualityList`',
  '`subscribeQualityListUpdates()`',
  '`data-quality-suppressed`',
  'Атрибут `hidden` намеренно не наблюдается',
  '`qualityQrDeduplicate.js` — сначала подавляет мягкий QR-дубль',
  '`spnInkEfficiency.js` — добавляет или удаляет подсказку расхода чернил',
  '`qualityLevelLabels.js` — добавляет метки `Ошибка / Важно / Совет`',
  '`spnPhotoLayoutQualityActions.js` — добавляет действия для фото-компоновок',
  '`qualityIssueFilters.js` — применяет фильтры и скрывает подавленные замечания',
  '`qualityIssueSummary.js` — пересчитывает сводку',
  '`qualityPriorityHint.js` — выбирает первое активное исправление',
  '`qualityPrintGuardHint.js` — обновляет состояние кнопки печати',
  '`preprintSummary.js` импортирует `layoutExtrasSync.js`',
  '`layoutExtrasSync.js` импортирует',
  '`qrSizeHint.js` импортирует',
  '`qualityQrDeduplicate.js` импортирует',
  '`qualityListUpdates.js`',
  '## Документация и проверки',
  '`tools/validate-quality-helper-imports.mjs`',
  '`tools/validate-quality-helper-map.mjs`',
  '`tools/validate-readme-quality-docs.mjs`',
  '`tools/validate-photo-intent-action.mjs`',
  'штатные фото-замечания сразу ведут к полям загрузки, а не выключают фото',
  '`tools/validate-qr-empty-direct-action.mjs`',
  'штатное действие пустого QR сразу ведёт к ссылке, а не выключает QR',
  '`tools/validate-response-channel-action.mjs`',
  'замечание без канала отклика обрабатывается прямым действием `responseChannel`, а не старым `showContact`',
  '`tools/quality-list-updates-smoke.html`',
  '`.github/workflows/validate.yml`',
  '`docs/**` и `README.md`',
  '`tools/validate-changelog.mjs`',
  '`docs/maintenance-guide.md`',
  '`responseChannelPhoneGuard.js` удалён',
  'канал отклика теперь безопасно обрабатывается напрямую в `qualityExtraActions.js` через действие `responseChannel`',
  '`photoIntentFix.js` удалён',
  'пустые фото теперь безопасно обрабатываются напрямую в `qualityExtraActions.js`',
  '`qrIntentFix.js` удалён',
  'пустой QR теперь безопасно обрабатывается напрямую в `qualityExtraActions.js`',
  '`qualitySuppressedPriority.js` удалён',
  'Файл, который лежит в `assets/js`, но не подключён ожидаемым импортом, считается нерабочим',
  'не должен создавать собственный `MutationObserver`',
  'нужно обновить не только эту карту, но и `docs/maintenance-guide.md`'
]);

if (mapSource.includes('- `responseChannelPhoneGuard.js` —')) {
  errors.push('docs/quality-helper-map.md: responseChannelPhoneGuard.js не должен оставаться в рабочей цепочке helper-модулей');
}

if (mapSource.includes('- `photoIntentFix.js` —')) {
  errors.push('docs/quality-helper-map.md: photoIntentFix.js не должен оставаться в рабочей цепочке helper-модулей');
}

if (mapSource.includes('- `qrIntentFix.js` —')) {
  errors.push('docs/quality-helper-map.md: qrIntentFix.js не должен оставаться в рабочей цепочке helper-модулей');
}

if (errors.length) {
  console.error('\nОшибки карты помощников качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка карты помощников качества пройдена.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
