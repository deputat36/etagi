import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const source = read('assets/js/qualityExtraActions.js');
const errors = [];

const requiredSnippets = [
  'setInputValue(input, shorten(input.value, getCustomBlockLimit()))',
  'function getCustomBlockLimit() {',
  'const count = getPrintCount()',
  'if (count >= 6) return 70',
  'if (count >= 4) return 120',
  'return Number.POSITIVE_INFINITY',
  'function getPrintCount() {'
];

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует плотностное сокращение дополнительного блока — ${snippet}`);
  }
}

if (source.includes('shorten(input.value, 70)')) {
  errors.push('qualityExtraActions.js: фиксированный предел 70 удаляет лишний текст при четырёх макетах на А4');
}

if (errors.length) {
  console.error('\nОшибки сокращения дополнительного блока:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка плотностного сокращения дополнительного блока пройдена.');

function read(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}
