import fs from 'node:fs';

const mapSource = read('docs/quality-helper-map.md');
const errors = [];

check(mapSource, 'docs/quality-helper-map.md', [
  '# Карта помощников качества',
  '`index.html` подключает основные модули качества напрямую',
  '`preprintSummary.js` импортирует `layoutExtrasSync.js`',
  '`layoutExtrasSync.js` импортирует',
  '`qrSizeHint.js` импортирует',
  '`qualityQrDeduplicate.js`',
  '`qrIntentFix.js`',
  '`photoIntentFix.js`',
  '`responseChannelPhoneGuard.js`',
  '`qualityIssueFilters.js`',
  '`qualityIssueSummary.js`',
  '`qualityPriorityHint.js`',
  '`qualityPrintGuardHint.js`',
  '`preprintSummary.js`',
  '## Документация и проверки',
  '`tools/validate-quality-helper-imports.mjs`',
  '`tools/validate-quality-helper-map.mjs`',
  '`tools/validate-readme-quality-docs.mjs`',
  '`tools/validate-qr-empty-direct-action.mjs`',
  'штатное действие пустого QR сразу ведёт к ссылке, а не выключает QR',
  '`.github/workflows/validate.yml`',
  '`docs/**` и `README.md`',
  '`tools/validate-changelog.mjs`',
  '`qualitySuppressedPriority.js` удалён',
  'data-quality-suppressed',
  'Файл, который лежит в `assets/js`, но не подключён ожидаемым импортом, считается нерабочим'
]);

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
