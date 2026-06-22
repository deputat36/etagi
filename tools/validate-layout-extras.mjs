import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const jsDir = path.join(rootDir, 'assets/js');
const sourcePath = path.join(jsDir, 'layoutExtras.js');
const errors = [];
const storageKeys = [
  'etagi-raskleyka-contact-cta-v1',
  'etagi-raskleyka-tear-label-v1',
  'etagi-raskleyka-brand-name-v1',
  'etagi-raskleyka-brand-side-v1'
];
const requiredExports = [
  'layoutExtraFields',
  'getLayoutExtra',
  'getRawLayoutExtra',
  'setLayoutExtraValue',
  'syncLayoutExtras'
];

const source = readRequired(sourcePath);
if (source) {
  for (const storageKey of storageKeys) {
    if (!source.includes(storageKey)) {
      errors.push(`assets/js/layoutExtras.js: не найден ключ хранения ${storageKey}`);
    }
  }

  for (const exportName of requiredExports) {
    const exportRegex = new RegExp(`export\\s+(?:const|function)\\s+${exportName}\\b`);
    if (!exportRegex.test(source)) {
      errors.push(`assets/js/layoutExtras.js: не найден экспорт ${exportName}`);
    }
  }
}

for (const filePath of collectJsFiles(jsDir)) {
  const relativePath = toProjectPath(filePath);
  if (relativePath === 'assets/js/layoutExtras.js') continue;

  const fileSource = fs.readFileSync(filePath, 'utf8');
  for (const storageKey of storageKeys) {
    if (fileSource.includes(storageKey)) {
      errors.push(`${relativePath}: ключ ${storageKey} должен использоваться только через assets/js/layoutExtras.js`);
    }
  }
}

if (errors.length) {
  console.error('\nОшибки расширенных полей макета:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка расширенных полей макета пройдена.');

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
