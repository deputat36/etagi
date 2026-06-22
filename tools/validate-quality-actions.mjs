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
  const actionTitles = [...actionsSource.matchAll(/title:\s*['"]([^'"]+)['"]/g)].map(match => match[1]);

  if (!actionTitles.length) {
    errors.push('assets/js/qualityExtraActions.js: не найдены заголовки быстрых исправлений');
  }

  for (const title of actionTitles) {
    if (!qualitySource.includes(`title:'${title}'`) && !qualitySource.includes(`title: '${title}'`)) {
      errors.push(`assets/js/qualityExtraActions.js: заголовок не найден в quality.js — ${title}`);
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
