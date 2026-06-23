import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const jsDir = path.join(rootDir, 'assets/js');
const phoneHelperPath = path.join(jsDir, 'phone.js');
const errors = [];
const requiredConsumers = [
  'assets/js/quality.js',
  'assets/js/preprintSummary.js'
];

const phoneSource = readRequired(phoneHelperPath);
if (phoneSource) {
  if (!/export\s+function\s+getPhoneInfo\s*\(/.test(phoneSource)) {
    errors.push('assets/js/phone.js: не найден экспорт getPhoneInfo');
  }
  if (!phoneSource.includes('isLikelyPhone')) {
    errors.push('assets/js/phone.js: не найден признак isLikelyPhone');
  }
  if (!phoneSource.includes('hasExtensionText')) {
    errors.push('assets/js/phone.js: не найден признак hasExtensionText');
  }
}

for (const relativePath of requiredConsumers) {
  const filePath = path.join(rootDir, relativePath);
  const source = readRequired(filePath);
  if (!source) continue;

  if (!source.includes("import { getPhoneInfo } from './phone.js';")) {
    errors.push(`${relativePath}: getPhoneInfo должен импортироваться из assets/js/phone.js`);
  }
}

for (const filePath of collectJsFiles(jsDir)) {
  const relativePath = toProjectPath(filePath);
  if (relativePath === 'assets/js/phone.js') continue;

  const source = fs.readFileSync(filePath, 'utf8');
  if (/function\s+getPhoneInfo\s*\(/.test(source)) {
    errors.push(`${relativePath}: локальная функция getPhoneInfo запрещена, используйте assets/js/phone.js`);
  }
}

if (errors.length) {
  console.error('\nОшибки общего helper телефона:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка общего helper телефона пройдена.');

function collectJsFiles(dir) {
  if (!fs.existsSync(dir)) {
    errors.push(`${toProjectPath(dir)} не найден`);
    return [];
  }

  const result = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...collectJsFiles(fullPath));
    else if (item.isFile() && item.name.endsWith('.js')) result.push(fullPath);
  }
  return result;
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${toProjectPath(filePath)} не найден`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
