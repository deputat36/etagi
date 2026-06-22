import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const errors = [];
const packageSource = readRequired(packagePath);
const pkg = readPackage(packageSource);

if (pkg) {
  const scripts = pkg.scripts || {};
  const validateScript = String(scripts.validate || '');
  const validateNames = Object.keys(scripts)
    .filter(name => name.startsWith('validate:'))
    .sort();

  if (!validateScript) {
    errors.push('package.json: отсутствует общий скрипт validate');
  }

  if (!validateNames.length) {
    errors.push('package.json: не найдены отдельные validate:* скрипты');
  }

  for (const scriptName of validateNames) {
    const command = String(scripts[scriptName] || '').trim();
    if (!validateScript.includes(`npm run ${scriptName}`)) {
      errors.push(`package.json: ${scriptName} не включён в общий npm run validate`);
    }

    const nodeTarget = getNodeTarget(command);
    if (!nodeTarget) {
      errors.push(`package.json: ${scriptName} должен запускать node tools/*.mjs`);
      continue;
    }

    const fullTarget = path.join(rootDir, nodeTarget);
    if (!nodeTarget.startsWith('tools/') || !nodeTarget.endsWith('.mjs')) {
      errors.push(`package.json: ${scriptName} должен ссылаться на файл tools/*.mjs — ${nodeTarget}`);
    }
    if (!fs.existsSync(fullTarget)) {
      errors.push(`package.json: ${scriptName} ссылается на несуществующий файл — ${nodeTarget}`);
    }
  }
}

if (errors.length) {
  console.error('\nОшибки validate-скриптов package.json:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка validate-скриптов package.json пройдена.');

function getNodeTarget(command) {
  const match = command.match(/^node\s+([^\s]+)$/);
  return match ? match[1].trim() : '';
}

function readPackage(source) {
  if (!source) return null;
  try {
    return JSON.parse(source);
  }
  catch(e) {
    errors.push('package.json: JSON не читается');
    return null;
  }
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
