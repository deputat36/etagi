import fs from 'node:fs';

const readmeSource = read('README.md');
const packageSource = read('package.json');
const workflowSource = read('.github/workflows/validate.yml');
const errors = [];

check(readmeSource, 'README.md', [
  'прямые безопасные действия для пустого QR, фото и отсутствующего канала отклика',
  'выбранные блоки не выключаются автоматически, а пользователь переходит к нужному полю или включает контакты только при корректном телефоне',
  'подавление дублирующих QR-замечаний',
  'дублей HTML-ассетов',
  'мягкая автоподстройка, которая сохраняет включённые фото и QR в `auto` и явных режимах подстройки',
  'assets/js/qrSizeHint.js',
  'assets/js/qualityQrDeduplicate.js',
  'assets/js/qualityExtraActions.js        быстрые исправления контроля качества, включая канал отклика, пустые QR и фото',
  'docs/quality-helper-map.md',
  'docs/quality-regression-checklist.md',
  'tools/validate-asset-duplicates.mjs',
  'tools/validate-layout-media-preservation.mjs',
  'tools/validate-photo-intent-action.mjs',
  'tools/validate-response-channel-action.mjs',
  'tools/validate-suppressed-quality-items.mjs',
  'tools/validate-quality-helper-imports.mjs',
  'tools/validate-quality-regression-checklist.mjs',
  'tools/validate-quality-helper-map.mjs',
  'tools/validate-readme-quality-docs.mjs',
  'tools/validate-qr-empty-direct-action.mjs',
  'npm run validate:asset-duplicates',
  'npm run validate:layout-media-preservation',
  'npm run validate:photo-intent-action',
  'npm run validate:response-channel-action',
  'npm run validate:suppressed-quality-items',
  'npm run validate:quality-helper-imports',
  'npm run validate:quality-regression-checklist',
  'npm run validate:quality-helper-map',
  'npm run validate:readme-quality-docs',
  'npm run validate:qr-empty-direct-action'
]);

if (readmeSource.includes('мягкая автоподстройка, которая сохраняет включённые фото и QR;')) {
  errors.push('README.md: описание мягкой автоподстройки должно уточнять auto и явные режимы');
}

if (readmeSource.includes('assets/js/qrIntentFix.js')) {
  errors.push('README.md: удалённый qrIntentFix.js не должен оставаться в структуре проекта');
}

if (readmeSource.includes('assets/js/photoIntentFix.js')) {
  errors.push('README.md: удалённый photoIntentFix.js не должен оставаться в структуре проекта');
}

if (readmeSource.includes('assets/js/responseChannelPhoneGuard.js')) {
  errors.push('README.md: удалённый responseChannelPhoneGuard.js не должен оставаться в структуре проекта');
}

check(packageSource, 'package.json', [
  '"validate:asset-duplicates": "node tools/validate-asset-duplicates.mjs"',
  '"validate:layout-media-preservation": "node tools/validate-layout-media-preservation.mjs"',
  '"validate:readme-quality-docs": "node tools/validate-readme-quality-docs.mjs"',
  '"validate:qr-empty-direct-action": "node tools/validate-qr-empty-direct-action.mjs"',
  'npm run validate:asset-duplicates',
  'npm run validate:layout-media-preservation',
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
