import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = process.cwd();
const jsDir = path.join(rootDir, 'assets/js');
const phoneHelperPath = path.join(jsDir, 'phone.js');
const errors = [];
const requiredConsumers = [
  'assets/js/quality.js',
  'assets/js/preprintSummary.js',
  'assets/js/qualityExtraActions.js'
];
const extensionMarkers = [
  'доб\\.?',
  'добавочн\\S*',
  'доп\\.?',
  'вн\\.?',
  'ext\\.?',
  'extension'
];

const phoneSource = readRequired(phoneHelperPath);
if (phoneSource) {
  if (!/export\s+function\s+getPhoneInfo\s*\(/.test(phoneSource)) {
    errors.push('assets/js/phone.js: не найден экспорт getPhoneInfo');
  }
  if (!/export\s+function\s+cleanPhoneValue\s*\(/.test(phoneSource)) {
    errors.push('assets/js/phone.js: не найден экспорт cleanPhoneValue');
  }
  if (!phoneSource.includes('isLikelyPhone')) {
    errors.push('assets/js/phone.js: не найден признак isLikelyPhone');
  }
  if (!phoneSource.includes('hasExtensionText')) {
    errors.push('assets/js/phone.js: не найден признак hasExtensionText');
  }
}

if (phoneSource) {
  await validatePhoneBehavior();
}

for (const relativePath of requiredConsumers) {
  const filePath = path.join(rootDir, relativePath);
  const source = readRequired(filePath);
  if (!source) continue;

  if (relativePath !== 'assets/js/qualityExtraActions.js' && !source.includes("import { getPhoneInfo } from './phone.js';")) {
    errors.push(`${relativePath}: getPhoneInfo должен импортироваться из assets/js/phone.js`);
  }
  if (
    relativePath === 'assets/js/qualityExtraActions.js'
    && !/import\s*\{[^}]*\bcleanPhoneValue\b[^}]*\}\s*from\s*['"]\.\/phone\.js['"]/.test(source)
  ) {
    errors.push('assets/js/qualityExtraActions.js: cleanPhoneValue должен импортироваться из assets/js/phone.js');
  }
}

for (const filePath of collectJsFiles(jsDir)) {
  const relativePath = toProjectPath(filePath);
  if (relativePath === 'assets/js/phone.js') continue;

  const source = fs.readFileSync(filePath, 'utf8');
  if (/function\s+getPhoneInfo\s*\(/.test(source)) {
    errors.push(`${relativePath}: локальная функция getPhoneInfo запрещена, используйте assets/js/phone.js`);
  }
  if (/function\s+cleanPhoneValue\s*\(/.test(source)) {
    errors.push(`${relativePath}: локальная функция cleanPhoneValue запрещена, используйте assets/js/phone.js`);
  }
  for (const marker of extensionMarkers) {
    if (source.includes(marker)) {
      errors.push(`${relativePath}: правила удаления добавочного номера должны храниться только в assets/js/phone.js`);
      break;
    }
  }
}

if (errors.length) {
  console.error('\nОшибки общего helper телефона:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка общего helper телефона пройдена.');

async function validatePhoneBehavior() {
  let getPhoneInfo;
  let cleanPhoneValue;
  try {
    ({ getPhoneInfo, cleanPhoneValue } = await import(pathToFileURL(phoneHelperPath).href));
  }
  catch (error) {
    errors.push(`assets/js/phone.js: не удалось импортировать helper — ${error.message}`);
    return;
  }

  if (typeof getPhoneInfo !== 'function') {
    errors.push('assets/js/phone.js: getPhoneInfo должен быть функцией');
    return;
  }
  if (typeof cleanPhoneValue !== 'function') {
    errors.push('assets/js/phone.js: cleanPhoneValue должен быть функцией');
    return;
  }

  const infoCases = [
    {
      value: '+7 900 000-00-00',
      expected: { digits: '79000000000', isLikelyPhone: true, hasExtensionText: false }
    },
    {
      value: '900',
      expected: { digits: '900', isLikelyPhone: false, hasExtensionText: false }
    },
    {
      value: '+7 900 000-00-00 доб. 12',
      expected: { digits: '7900000000012', isLikelyPhone: true, hasExtensionText: true }
    }
  ];

  for (const item of infoCases) {
    const info = getPhoneInfo(item.value);
    for (const [key, expectedValue] of Object.entries(item.expected)) {
      if (info?.[key] !== expectedValue) {
        errors.push(`assets/js/phone.js: для "${item.value}" ожидалось ${key}=${expectedValue}, получено ${info?.[key]}`);
      }
    }
  }

  const cleanupCases = [
    { value: '+7 900 000-00-00 доб. 12', expected: '+7 900 000-00-00' },
    { value: 'Телефон: +7 (900) 000-00-00', expected: '+7 (900) 000-00-00' },
    { value: '+7 900 000-00-00 ext 45', expected: '+7 900 000-00-00' }
  ];

  for (const item of cleanupCases) {
    const cleaned = cleanPhoneValue(item.value);
    if (cleaned !== item.expected) {
      errors.push(`assets/js/phone.js: очистка "${item.value}" ожидалась "${item.expected}", получено "${cleaned}"`);
    }
  }
}

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
