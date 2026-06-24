import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const source = read('assets/js/qualityExtraActions.js');
const errors = [];

const requiredSnippets = [
  'if (!hasCallToAction(current)) return QUICK_FIX_CTA',
  'return shorten(current, getContactCtaLimit())',
  'function getContactCtaLimit() {',
  'const count = getPrintCount()',
  'if (count >= 6) return 60',
  'if (count >= 4) return 85',
  'return Number.POSITIVE_INFINITY'
];

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует плотностное сокращение контактного призыва — ${snippet}`);
  }
}

const destructiveSnippets = [
  'if (!hasCallToAction(current) || current.length > 60) return QUICK_FIX_CTA',
  'return shorten(current, 58)'
];

for (const snippet of destructiveSnippets) {
  if (source.includes(snippet)) {
    errors.push(`qualityExtraActions.js: исправление не должно заменять или чрезмерно сокращать осмысленный призыв — ${snippet}`);
  }
}

if (errors.length) {
  console.error('\nОшибки сокращения контактного призыва:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка плотностного сокращения контактного призыва пройдена.');

function read(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}
