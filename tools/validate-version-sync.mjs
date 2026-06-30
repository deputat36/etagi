import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const statePath = path.join(rootDir, 'assets/js/state.js');
const changelogPath = path.join(rootDir, 'docs/changelog.md');
const errors = [];
const warnings = [];

const packageSource = readRequired(packagePath);
const stateSource = readRequired(statePath);
const changelogSource = readRequired(changelogPath);

const packageVersion = readPackageVersion(packageSource);
const stateVersion = readStateVersion(stateSource);
const changelogVersion = readChangelogVersion(changelogSource);

if (!packageVersion) errors.push('package.json: не удалось прочитать version');
if (!stateVersion) errors.push('assets/js/state.js: не удалось прочитать defaultState.version');
if (!changelogVersion) errors.push('docs/changelog.md: верхняя запись версии не найдена');

if (packageVersion && stateVersion && packageVersion !== stateVersion) {
  errors.push(`Версии package.json и state.js не совпадают: ${packageVersion} !== ${stateVersion}`);
}

if (packageVersion && changelogVersion && packageVersion !== changelogVersion) {
  warnings.push(`docs/changelog.md пока содержит верхнюю запись ${changelogVersion}, а код имеет версию ${packageVersion}. Это допустимо только для малой UX-итерации, если changelog обновляется отдельным безопасным коммитом.`);
}

if (errors.length) {
  console.error('\nОшибки синхронизации версии:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

if (warnings.length) {
  console.warn('\nПредупреждения синхронизации версии:');
  warnings.forEach(warning => console.warn(`- ${warning}`));
}

console.log(`Проверка синхронизации версии пройдена: package/state ${packageVersion}, changelog ${changelogVersion}.`);

function readPackageVersion(source) {
  if (!source) return '';
  try {
    const pkg = JSON.parse(source);
    return String(pkg.version || '').trim();
  }
  catch(e) {
    errors.push('package.json: JSON не читается');
    return '';
  }
}

function readStateVersion(source) {
  if (!source) return '';
  const match = source.match(/version:\s*['"]([^'"]+)['"]/);
  return match ? match[1].trim() : '';
}

function readChangelogVersion(source) {
  if (!source) return '';
  const match = source.match(/^##\s+([0-9]+\.[0-9]+\.[0-9]+)/m);
  return match ? match[1].trim() : '';
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
