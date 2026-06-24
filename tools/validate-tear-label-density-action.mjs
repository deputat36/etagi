import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const source = read('assets/js/qualityExtraActions.js');
const errors = [];

const requiredSnippets = [
  'if (!current) return DEFAULT_TEAR_LABEL',
  'return shorten(current, getTearLabelLimit())',
  'function getTearLabelLimit() {',
  'const count = getPrintCount()',
  'if (count >= 6) return 16',
  'if (count >= 4) return 24',
  'return Number.POSITIVE_INFINITY'
];

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует плотностное сокращение подписи отрывных листков — ${snippet}`);
  }
}

if (source.includes('if (!current || current.length > 16) return DEFAULT_TEAR_LABEL')) {
  errors.push('qualityExtraActions.js: длинная пользовательская подпись не должна полностью заменяться стандартным текстом');
}

if (errors.length) {
  console.error('\nОшибки сокращения подписи отрывных листков:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка плотностного сокращения подписи отрывных листков пройдена.');

function read(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}
