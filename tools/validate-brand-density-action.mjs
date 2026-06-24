import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const source = read('assets/js/qualityExtraActions.js');
const errors = [];

const requiredSnippets = [
  'const values = getShortBrandValues()',
  "setLayoutExtra('brandName', values.name)",
  "setLayoutExtra('brandSideText', values.side)",
  'function getShortBrandValues() {',
  "getLayoutExtra(null, 'brandName') || DEFAULT_BRAND_NAME",
  "getLayoutExtra(null, 'brandSideText') || DEFAULT_BRAND_SIDE",
  'const maxSide = getPrintCount() >= 6 ? 8 : 9',
  'const nameLimit = Math.max(4, limit - sideLimit - 1)',
  'return { name, side }',
  'function getBrandLimit() {',
  'return getPrintCount() >= 6 ? 26 : 34'
];

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует безопасное сокращение брендовой строки — ${snippet}`);
  }
}

const destructiveSnippets = [
  "setLayoutExtra('brandName', DEFAULT_BRAND_NAME)",
  "setLayoutExtra('brandSideText', DEFAULT_BRAND_SIDE)"
];

for (const snippet of destructiveSnippets) {
  if (source.includes(snippet)) {
    errors.push(`qualityExtraActions.js: исправление не должно заменять пользовательскую брендовую строку стандартным текстом — ${snippet}`);
  }
}

if (errors.length) {
  console.error('\nОшибки сокращения брендовой строки:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка безопасного сокращения брендовой строки пройдена.');

function read(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}
