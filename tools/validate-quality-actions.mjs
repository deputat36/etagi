import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const qualityPath = path.join(rootDir, 'assets/js/quality.js');
const actionsPath = path.join(rootDir, 'assets/js/qualityExtraActions.js');
const indexPath = path.join(rootDir, 'index.html');
const errors = [];

const qualitySource = readRequired(qualityPath);
const actionsSource = readRequired(actionsPath);
const indexSource = readRequired(indexPath);

if (qualitySource && actionsSource) {
  const quickActions = [...actionsSource.matchAll(/\{\s*title:\s*['"]([^'"]+)['"]\s*,\s*action:\s*['"]([^'"]+)['"]\s*,\s*label:\s*['"]([^'"]+)['"]\s*\}/g)]
    .map(match => ({ title: match[1], action: match[2], label: match[3] }));
  const actionTitles = quickActions.map(item => item.title);
  const actionNames = quickActions.map(item => item.action);

  if (!quickActions.length) {
    errors.push('assets/js/qualityExtraActions.js: не найдены быстрые исправления с title/action/label');
  }

  const titleCounts = countItems(actionTitles);
  for (const [title, count] of titleCounts) {
    if (count > 1) {
      errors.push(`assets/js/qualityExtraActions.js: дублируется заголовок быстрого исправления — ${title}`);
    }
  }

  for (const item of quickActions) {
    if (!item.title.trim()) {
      errors.push('assets/js/qualityExtraActions.js: у быстрого исправления пустой title');
    }
    if (!/^[a-z][a-zA-Z0-9]*$/.test(item.action)) {
      errors.push(`assets/js/qualityExtraActions.js: небезопасное имя действия — ${item.action}`);
    }
    if (!item.label.trim()) {
      errors.push(`assets/js/qualityExtraActions.js: пустая подпись кнопки для действия — ${item.action}`);
    }
    if (item.label.length > 32) {
      errors.push(`assets/js/qualityExtraActions.js: слишком длинная подпись кнопки — ${item.label}`);
    }
  }

  for (const title of actionTitles) {
    if (!qualitySource.includes(`title:'${title}'`) && !qualitySource.includes(`title: '${title}'`)) {
      errors.push(`assets/js/qualityExtraActions.js: заголовок не найден в quality.js — ${title}`);
    }
  }

  for (const actionName of [...new Set(actionNames)]) {
    if (!actionsSource.includes(`action === '${actionName}'`) && !actionsSource.includes(`action === "${actionName}"`)) {
      errors.push(`assets/js/qualityExtraActions.js: действие не обработано в handleClick — ${actionName}`);
    }
  }
}

if (indexSource) {
  const requiredScripts = [
    'assets/js/spnContactEditor.js',
    'assets/js/spnTearOffEditor.js',
    'assets/js/spnBrandEditor.js',
    'assets/js/qualityExtraActions.js'
  ];

  for (const script of requiredScripts) {
    if (!indexSource.includes(`src="${script}"`)) {
      errors.push(`index.html: не подключён ${script}`);
    }
  }

  const brandIndex = indexSource.indexOf('src="assets/js/spnBrandEditor.js"');
  const actionsIndex = indexSource.indexOf('src="assets/js/qualityExtraActions.js"');
  if (brandIndex >= 0 && actionsIndex >= 0 && actionsIndex < brandIndex) {
    errors.push('index.html: qualityExtraActions.js должен подключаться после spnBrandEditor.js');
  }
}

if (errors.length) {
  console.error('\nОшибки быстрых исправлений контроля качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка быстрых исправлений контроля качества пройдена.');

function countItems(items) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return counts;
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
