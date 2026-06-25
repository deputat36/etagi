import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const changelogPath = path.join(rootDir, 'docs/changelog.md');
const errors = [];
const source = readRequired(changelogPath);
const requiredHistoricalVersions = ['3.84.0', '3.60.0', '2.0.0', '1.0.0'];
const minimumVersionCount = 35;

if (source) {
  const versions = [...source.matchAll(/^##\s+([0-9]+\.[0-9]+\.[0-9]+)\s*$/gm)].map(match => match[1]);

  if (!versions.length) {
    errors.push('docs/changelog.md: не найдены записи версий вида ## X.Y.Z');
  }

  if (versions.length < minimumVersionCount) {
    errors.push(`docs/changelog.md: найдено только ${versions.length} версий, возможно история изменений случайно обрезана`);
  }

  for (const version of requiredHistoricalVersions) {
    if (!versions.includes(version)) {
      errors.push(`docs/changelog.md: отсутствует ключевая историческая версия ${version}`);
    }
  }

  const seen = new Set();
  for (const version of versions) {
    if (seen.has(version)) errors.push(`docs/changelog.md: версия повторяется — ${version}`);
    seen.add(version);
  }

  for (let index = 1; index < versions.length; index += 1) {
    const previous = versions[index - 1];
    const current = versions[index];
    if (compareVersions(previous, current) <= 0) {
      errors.push(`docs/changelog.md: версии должны идти по убыванию — ${previous} перед ${current}`);
    }
  }
}

if (errors.length) {
  console.error('\nОшибки истории изменений:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка истории изменений пройдена.');

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return 1;
    if (a[index] < b[index]) return -1;
  }
  return 0;
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
