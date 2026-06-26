import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const changelogPath = path.join(rootDir, 'docs/changelog.md');
const errors = [];
const source = readRequired(changelogPath);
const requiredHistoricalVersions = ['3.84.0', '3.60.0', '2.0.0', '1.0.0'];
const minimumVersionCount = 35;
const requiredCurrentSnippets = [
  'assets/js/qualityExtraActions.js',
  'безопасные прямые действия для QR, фото и канала отклика',
  'сразу показывает для пустого QR действие «Добавить ссылку»',
  'disableQr',
  'focusPhotoOne',
  'focusPhotoTwo',
  'noPhoto',
  'onePhoto',
  'responseChannel',
  'showContact',
  'assets/js/qrIntentFix.js',
  'пустой QR теперь обрабатывается напрямую в `qualityExtraActions.js`',
  'assets/js/photoIntentFix.js',
  'пустые фото теперь обрабатываются напрямую в `qualityExtraActions.js`',
  'assets/js/responseChannelPhoneGuard.js',
  'канал отклика теперь обрабатывается напрямую в `qualityExtraActions.js`',
  'Мягкая QR-подсказка теперь работает только для 4 макетов',
  'сводке перед печатью',
  'безопасно выделяет только текущий раздел версии',
  'Проверки прямых действий QR, фото и канала отклика теперь связывают `action:null` с конкретным замечанием',
  'Проверка package-скриптов теперь точно разбирает общий `npm run validate`',
  'Проверка связей файлов теперь ловит повторное подключение локальных `script` и `stylesheet`-ассетов в HTML',
  'Добавлена проверка `validate:asset-duplicates`',
  'Проверка README теперь контролирует описание `validate:asset-duplicates`',
  'docs/quality-helper-map.md',
  'docs/quality-regression-checklist.md',
  'docs/**',
  'README.md',
  'validate:asset-duplicates',
  'validate:photo-intent-action',
  'validate:response-channel-action',
  'validate:qr-empty-direct-action',
  'validate:quality-helper-map',
  'validate:quality-regression-checklist',
  'validate:readme-quality-docs'
];

if (source) {
  const versions = [...source.matchAll(/^##\s+([0-9]+\.[0-9]+\.[0-9]+)\s*$/gm)].map(match => match[1]);
  const currentSection = getSection(source, '3.84.0');

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

  if (!currentSection) {
    errors.push('docs/changelog.md: не найден текущий раздел 3.84.0');
  }

  if (currentSection.includes('\n## ')) {
    errors.push('docs/changelog.md: текущий раздел 3.84.0 захватил следующий заголовок версии');
  }

  for (const snippet of requiredCurrentSnippets) {
    if (!currentSection.includes(snippet)) {
      errors.push(`docs/changelog.md: в разделе 3.84.0 отсутствует актуальный пункт ${snippet}`);
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

function getSection(text, version) {
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(version)}\\s*$`, 'm');
  const heading = headingPattern.exec(text);
  if (!heading) return '';

  const sectionStart = heading.index + heading[0].length;
  const nextHeadingPattern = /^##\s+\d+\.\d+\.\d+\s*$/gm;
  nextHeadingPattern.lastIndex = sectionStart;
  const nextHeading = nextHeadingPattern.exec(text);
  const sectionEnd = nextHeading ? nextHeading.index : text.length;

  return text.slice(sectionStart, sectionEnd).trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
