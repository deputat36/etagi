import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const statePath = path.join(rootDir, 'assets/js/state.js');
const changelogPath = path.join(rootDir, 'docs/changelog.md');
const releaseDir = path.join(rootDir, 'docs/releases');
const errors = [];

const packageSource = readRequired(packagePath);
const stateSource = readRequired(statePath);
const changelogSource = readRequired(changelogPath);

const packageVersion = readPackageVersion(packageSource);
const stateVersion = readStateVersion(stateSource);
const changelogVersion = readChangelogVersion(changelogSource);
const releaseNotePath = packageVersion ? path.join(releaseDir, `${packageVersion}.md`) : '';
const releaseNoteVersion = readReleaseNoteVersion(releaseNotePath, packageVersion);

if (!packageVersion) errors.push('package.json: не удалось прочитать version');
if (!stateVersion) errors.push('assets/js/state.js: не удалось прочитать defaultState.version');
if (!changelogVersion) errors.push('docs/changelog.md: верхняя запись версии не найдена');

if (packageVersion && stateVersion && packageVersion !== stateVersion) {
  errors.push(`Версии package.json и state.js не совпадают: ${packageVersion} !== ${stateVersion}`);
}

if (packageVersion && changelogVersion && packageVersion !== changelogVersion) {
  errors.push(`Версии package.json и верхней записи docs/changelog.md не совпадают: ${packageVersion} !== ${changelogVersion}`);
}

if (packageVersion && releaseNoteVersion && packageVersion !== releaseNoteVersion) {
  errors.push(`Версии package.json и docs/releases/${packageVersion}.md не совпадают: ${packageVersion} !== ${releaseNoteVersion}`);
}

if (errors.length) {
  console.error('\nОшибки синхронизации версии:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Проверка синхронизации версии пройдена: package/state/changelog ${packageVersion}, release ${releaseNoteVersion || 'нет'}.`);

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

function readReleaseNoteVersion(filePath, expectedVersion) {
  if (!expectedVersion || !filePath || !fs.existsSync(filePath)) return '';
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/^#\s+([0-9]+\.[0-9]+\.[0-9]+)/m);
  const version = match ? match[1].trim() : '';
  if (!version) errors.push(`${toProjectPath(filePath)}: заголовок версии не найден`);
  return version;
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
