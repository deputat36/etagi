import fs from 'node:fs';

const readmeSource = read('README.md');
const packageSource = read('package.json');
const errors = [];

check(readmeSource, 'README.md', [
  'безопасные помощники качества для QR, фото и канала отклика',
  'подавление дублирующих QR-замечаний',
  'assets/js/qrIntentFix.js',
  'assets/js/photoIntentFix.js',
  'assets/js/qrSizeHint.js',
  'assets/js/qualityQrDeduplicate.js',
  'assets/js/responseChannelPhoneGuard.js',
  'docs/quality-helper-map.md',
  'docs/quality-regression-checklist.md',
  'tools/validate-photo-intent-action.mjs',
  'tools/validate-response-channel-action.mjs',
  'tools/validate-suppressed-quality-items.mjs',
  'tools/validate-quality-helper-imports.mjs',
  'tools/validate-quality-regression-checklist.mjs',
  'tools/validate-quality-helper-map.mjs',
  'tools/validate-readme-quality-docs.mjs',
  'npm run validate:photo-intent-action',
  'npm run validate:response-channel-action',
  'npm run validate:suppressed-quality-items',
  'npm run validate:quality-helper-imports',
  'npm run validate:quality-regression-checklist',
  'npm run validate:quality-helper-map',
  'npm run validate:readme-quality-docs'
]);

check(packageSource, 'package.json', [
  '"validate:readme-quality-docs": "node tools/validate-readme-quality-docs.mjs"',
  'npm run validate:readme-quality-docs'
]);

if (errors.length) {
  console.error('\nОшибки README по helper-документации:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('README по helper-документации актуален.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
