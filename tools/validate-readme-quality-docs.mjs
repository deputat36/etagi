import fs from 'node:fs';

const readmeSource = read('README.md');
const packageSource = read('package.json');
const workflowSource = read('.github/workflows/validate.yml');
const errors = [];

check(readmeSource, 'README.md', [
  'прямые безопасные действия для пустого QR и фото',
  'выбранный блок остаётся включённым, а пользователь переходит к нужному полю',
  'безопасный помощник канала отклика',
  'подавление дублирующих QR-замечаний',
  'assets/js/qrSizeHint.js',
  'assets/js/qualityQrDeduplicate.js',
  'assets/js/responseChannelPhoneGuard.js',
  'assets/js/qualityExtraActions.js        быстрые исправления контроля качества, включая пустые QR и фото',
  'docs/quality-helper-map.md',
  'docs/quality-regression-checklist.md',
  'tools/validate-photo-intent-action.mjs',
  'tools/validate-response-channel-action.mjs',
  'tools/validate-suppressed-quality-items.mjs',
  'tools/validate-quality-helper-imports.mjs',
  'tools/validate-quality-regression-checklist.mjs',
  'tools/validate-quality-helper-map.mjs',
  'tools/validate-readme-quality-docs.mjs',
  'tools/validate-qr-empty-direct-action.mjs',
  'npm run validate:photo-intent-action',
  'npm run validate:response-channel-action',
  'npm run validate:suppressed-quality-items',
  'npm run validate:quality-helper-imports',
  'npm run validate:quality-regression-checklist',
  'npm run validate:quality-helper-map',
  'npm run validate:readme-quality-docs',
  'npm run validate:qr-empty-direct-action'
]);

if (readmeSource.includes('assets/js/qrIntentFix.js')) {
  errors.push('README.md: удалённый qrIntentFix.js не должен оставаться в структуре проекта');
}

if (readmeSource.includes('assets/js/photoIntentFix.js')) {
  errors.push('README.md: удалённый photoIntentFix.js не должен оставаться в структуре проекта');
}

check(packageSource, 'package.json', [
  '"validate:readme-quality-docs": "node tools/validate-readme-quality-docs.mjs"',
  '"validate:qr-empty-direct-action": "node tools/validate-qr-empty-direct-action.mjs"',
  'npm run validate:readme-quality-docs',
  'npm run validate:qr-empty-direct-action'
]);

check(workflowSource, '.github/workflows/validate.yml', [
  "- 'docs/**'",
  "- 'README.md'",
  'run: npm run validate'
]);

if (errors.length) {
  console.error('\nОшибки README, документации и workflow по helper-модулям качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('README, документация и workflow по helper-модулям качества актуальны.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
