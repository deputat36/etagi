import fs from 'node:fs';

const readmeSource = read('README.md');
const packageSource = read('package.json');
const workflowSource = read('.github/workflows/validate.yml');
const errors = [];
const pkg = readPackage(packageSource);

check(readmeSource, 'README.md', [
  '# Генератор расклеек СПН «Этажи»',
  '## Актуальный аудит и план',
  'docs/full-project-audit-and-roadmap-2026-07-10.md',
  '### Контроль качества',
  'безопасные прямые действия без самовольного отключения фото и QR',
  'подавление дублирующих QR-замечаний',
  'мягкая автоподстройка с сохранением фото и QR',
  '## Автоматические проверки',
  'npm run validate',
  'assets/js/quality.js',
  'tools/validate-runtime-architecture.mjs'
]);

for (const file of [
  'assets/js/qualityExtraActions.js',
  'assets/js/qualityQrDeduplicate.js',
  'assets/js/qrSizeHint.js',
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
  'tools/validate-qr-empty-direct-action.mjs'
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: файл не найден`);
}

if (pkg) {
  const expectedScripts = {
    'validate:asset-duplicates': 'node tools/validate-asset-duplicates.mjs',
    'validate:layout-media-preservation': 'node tools/validate-layout-media-preservation.mjs',
    'validate:photo-intent-action': 'node tools/validate-photo-intent-action.mjs',
    'validate:response-channel-action': 'node tools/validate-response-channel-action.mjs',
    'validate:suppressed-quality-items': 'node tools/validate-suppressed-quality-items.mjs',
    'validate:quality-helper-imports': 'node tools/validate-quality-helper-imports.mjs',
    'validate:quality-regression-checklist': 'node tools/validate-quality-regression-checklist.mjs',
    'validate:quality-helper-map': 'node tools/validate-quality-helper-map.mjs',
    'validate:readme-quality-docs': 'node tools/validate-readme-quality-docs.mjs',
    'validate:qr-empty-direct-action': 'node tools/validate-qr-empty-direct-action.mjs'
  };

  for (const [name, command] of Object.entries(expectedScripts)) {
    if (String(pkg.scripts?.[name] || '').trim() !== command) {
      errors.push(`package.json: ${name} должен быть ${command}`);
    }
  }
}

check(workflowSource, '.github/workflows/validate.yml', [
  "- 'docs/**'",
  "- 'README.md'",
  'run: npm run validate'
]);

for (const removed of [
  'assets/js/qrIntentFix.js',
  'assets/js/photoIntentFix.js',
  'assets/js/responseChannelPhoneGuard.js'
]) {
  if (readmeSource.includes(removed)) errors.push(`README.md: удалённый модуль не должен упоминаться — ${removed}`);
}

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

function readPackage(source) {
  try { return JSON.parse(source || '{}'); }
  catch(e) {
    errors.push('package.json: JSON не читается');
    return null;
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
