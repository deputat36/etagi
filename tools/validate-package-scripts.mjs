import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const maintenanceGuidePath = path.join(rootDir, 'docs/maintenance-guide.md');
const errors = [];
const packageSource = readRequired(packagePath);
const maintenanceGuideSource = readRequired(maintenanceGuidePath);
const pkg = readPackage(packageSource);

if (pkg) {
  const scripts = pkg.scripts || {};
  const validateScript = String(scripts.validate || '').trim();
  const validateNames = Object.keys(scripts)
    .filter(name => name.startsWith('validate:'));
  const validateCalls = parseValidateCalls(validateScript);
  const guideValidateCalls = parseMaintenanceGuideValidateCalls(maintenanceGuideSource);

  if (!validateScript) {
    errors.push('package.json: отсутствует общий скрипт validate');
  }

  if (!validateNames.length) {
    errors.push('package.json: не найдены отдельные validate:* скрипты');
  }

  if (validateScript && !validateCalls.length) {
    errors.push('package.json: общий скрипт validate должен состоять из команд npm run validate:* через &&');
  }

  for (const segment of splitValidateSegments(validateScript)) {
    if (!/^npm run validate:[^\s]+$/.test(segment)) {
      errors.push(`package.json: общий validate содержит неподдерживаемую команду — ${segment}`);
    }
  }

  const validateCallCounts = countItems(validateCalls);
  const guideValidateCallCounts = countItems(guideValidateCalls);
  for (const scriptName of validateNames) {
    const command = String(scripts[scriptName] || '').trim();
    const count = validateCallCounts.get(scriptName) || 0;
    if (count === 0) {
      errors.push(`package.json: ${scriptName} не включён в общий npm run validate`);
    }
    if (count > 1) {
      errors.push(`package.json: ${scriptName} повторяется в общем npm run validate`);
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

    if (!guideValidateCalls.includes(scriptName)) {
      errors.push(`docs/maintenance-guide.md: отсутствует npm run ${scriptName} в основном списке проверок`);
    }
    if ((guideValidateCallCounts.get(scriptName) || 0) > 1) {
      errors.push(`docs/maintenance-guide.md: npm run ${scriptName} повторяется в основном списке проверок`);
    }
  }

  for (const scriptName of guideValidateCalls) {
    if (!validateNames.includes(scriptName)) {
      errors.push(`docs/maintenance-guide.md: найден лишний validate-скрипт, которого нет в package.json — npm run ${scriptName}`);
    }
  }

  for (const scriptName of validateCalls) {
    if (!Object.hasOwn(scripts, scriptName)) {
      errors.push(`package.json: общий npm run validate вызывает несуществующий скрипт — ${scriptName}`);
    }
  }

  const expectedOrder = validateNames.join(' && ');
  const actualOrder = validateCalls.join(' && ');
  if (expectedOrder && actualOrder && expectedOrder !== actualOrder) {
    errors.push('package.json: порядок команд в общем npm run validate должен совпадать с порядком validate:* скриптов в package.json');
  }
}

if (errors.length) {
  console.error('\nОшибки validate-скриптов package.json:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка validate-скриптов package.json пройдена.');

function parseValidateCalls(command) {
  return splitValidateSegments(command)
    .map(segment => segment.match(/^npm run (validate:[^\s]+)$/)?.[1] || '')
    .filter(Boolean);
}

function parseMaintenanceGuideValidateCalls(source) {
  const block = String(source || '').match(/Она включает все проверки из `package\.json`, включая:\n\n```bash\n([\s\S]*?)\n```/)?.[1] || '';
  return [...block.matchAll(/^npm run (validate:[^\s`]+)$/gm)]
    .map(match => match[1])
    .filter(Boolean);
}

function splitValidateSegments(command) {
  return String(command || '')
    .split(/\s+&&\s+/)
    .map(segment => segment.trim())
    .filter(Boolean);
}

function countItems(items) {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) || 0) + 1);
  return counts;
}

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
