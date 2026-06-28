import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const changelogPath = path.join(rootDir, 'docs/changelog.md');
const errors = [];
const source = readRequired(changelogPath);
const requiredHistoricalVersions = ['3.84.0', '3.60.0', '2.0.0', '1.0.0'];
const requiredHistoricalSnippets = [
  'Версия состояния и пакета обновлена до `3.60.0`'
];
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
  'Старые штатные действия `noPhoto`, `onePhoto` и `showContact` удалены из `assets/js/app.js`',
  'не отключали фото и не включали контакты в обход безопасных прямых действий',
  'Старые штатные действия `shortQr` и guard `showContact` удалены из `assets/js/app.js` и `assets/js/qualityExtraActions.js`',
  'длинный QR и канал отклика исправлялись только прямыми безопасными действиями',
  'assets/js/qrIntentFix.js',
  'пустой QR теперь обрабатывается напрямую в `qualityExtraActions.js`',
  'assets/js/photoIntentFix.js',
  'пустые фото теперь обрабатываются напрямую в `qualityExtraActions.js`',
  'assets/js/responseChannelPhoneGuard.js',
  'канал отклика теперь обрабатывается напрямую в `qualityExtraActions.js`',
  'Мягкая QR-подсказка теперь работает только для 4 макетов',
  'Подсказка плотного макета с фото теперь различает 4 макета и 6–8 макетов на А4',
  'Проверка `validate:layout-media-preservation` теперь отдельно контролирует текст фото-подсказки для 6 и 8 макетов',
  'Проверка `validate:layout-media-preservation` теперь контролирует сохранение всех включённых режимов фото: `one`, `two` и `plan`',
  'Проверка `validate:layout-media-preservation` теперь берёт список включаемых режимов фото из `assets/js/state.js`, а не из ручного списка',
  'Проверка `validate:layout-media-preservation` теперь берёт список явных режимов подстройки из `assets/js/state.js`, а не из ручного списка',
  'Проверка `validate:layout-media-preservation` теперь сверяет каждый режим из `assets/js/state.js` с обработкой в `assets/js/layoutRules.js` и порядком блоков',
  'Проверка `validate:layout-media-preservation` теперь также ловит лишние или повторяющиеся режимы в `BLOCK_ORDERS` и обработчиках `applyLayoutMode`',
  'Проверка `validate:layout-media-preservation` теперь сохраняет список режимов `BLOCK_ORDERS` до преобразования в объект, чтобы повторяющиеся режимы не терялись при проверке',
  'Проверка `validate:layout-media-preservation` теперь контролирует, что режимы фото и режимы подстройки в `assets/js/state.js` не имеют повторяющихся ID',
  'Проверка `validate:layout-media-preservation` теперь контролирует, что `defaultState.photoMode` и `defaultState.layoutMode` используют допустимые режимы',
  'Проверка `validate:layout-media-preservation` теперь контролирует, что каждый порядок блоков в `BLOCK_ORDERS` содержит все базовые блоки из `defaultState.blockOrder` без дублей и неизвестных блоков',
  'Проверка `validate:layout-media-preservation` теперь контролирует, что `DEFAULT_BLOCK_ORDER` в `assets/js/app.js` совпадает с `defaultState.blockOrder` по составу и порядку',
  'Проверка `validate:layout-media-preservation` теперь контролирует, что каждый базовый блок имеет подпись в `blockOrderLabels` и переключатель в `blockVisibilityMap`',
  'Проверка `validate:layout-media-preservation` теперь контролирует уникальность переключателей видимости, наличие `showQr` и отсутствие неизвестных флагов в `blockVisibility`',
  'Проверка `validate:layout-media-preservation` теперь также закрепляет, что `blockVisibility` подключён к чекбоксам формы и счётчику видимых блоков в статусе предпросмотра',
  'Проверка `validate:layout-media-preservation` теперь проверяет реальный результат `applyLayoutMode` и мягкой подстройки: порядок блоков должен оставаться полным, без дублей и неизвестных блоков',
  'Проверка `validate:layout-media-preservation` теперь также проверяет, что `auto` выбирает ожидаемые режимы подстройки: `private`, `economy`, `showcase`, `photo` и `readable`',
  'Проверка `validate:layout-media-preservation` теперь отдельно контролирует, что обычная и мягкая подстройка возвращают новый объект и не мутируют исходное состояние макета',
  'Проверка `validate:layout-media-preservation` теперь проверяет все включённые режимы фото не только в `auto`, но и в явных режимах подстройки',
  'Проверка `validate:layout-media-preservation` теперь контролирует, что мягкая подстройка сохраняет сами данные `photoOne` и `photoTwo`',
  'Проверка `validate:layout-media-preservation` теперь контролирует, что мягкая подстройка сохраняет данные QR: `qrLink` и `qrCaption`',
  'Проверка `validate:layout-media-preservation` теперь контролирует, что мягкая подстройка не отключает включённый QR даже при пустой ссылке',
  'Проверка `validate:layout-media-preservation` теперь проверяет пустой включённый QR не только в `auto`, но и в явных режимах подстройки',
  'сводке перед печатью',
  'безопасно выделяет только текущий раздел версии',
  'Проверка changelog теперь также защищает ключевые исторические строки',
  'Проверки прямых действий QR, фото и канала отклика теперь связывают `action:null` с конкретным замечанием',
  'Проверка package-скриптов теперь точно разбирает общий `npm run validate`',
  'Проверка связей файлов теперь ловит повторное подключение локальных `script` и `stylesheet`-ассетов в HTML',
  'Проверка связей файлов теперь сверяет DOM-привязки `fields`, `checks` и `blockVisibility` из `assets/js/app.js` с реальными `id` в `index.html`',
  'Проверка связей файлов теперь также контролирует обязательные статические элементы `app.js` и реально ловит повторяющиеся `id` в HTML',
  'Проверка связей файлов теперь автоматически извлекает прямые обращения `$(\'...\')` из `assets/js/app.js`',
  'динамические были явно описаны в валидаторе',
  'README теперь отдельно описывает автоматическую сверку DOM-id приложения',
  'validate:readme-quality-docs` контролирует это описание',
  'Добавлена проверка `validate:asset-duplicates`',
  'Проверка README теперь контролирует описание `validate:asset-duplicates`',
  'Добавлена отдельная кнопка «Подстроить, сохранив фото и QR»',
  'Подсказки плотного макета теперь прямо предлагают мягкую подстройку',
  'README теперь уточняет, что мягкая автоподстройка сохраняет фото и QR в `auto` и явных режимах подстройки',
  'Чек-лист регрессии теперь фиксирует выбранный принцип автоподстройки',
  'Чек-лист регрессии теперь также фиксирует явные режимы мягкой автоподстройки',
  'Добавлена проверка `validate:layout-media-preservation`',
  'Проверка `validate:layout-media-preservation` теперь проверяет реальное поведение обычной и мягкой автоподстройки',
  'Проверка `validate:layout-media-preservation` теперь также покрывает явные режимы подстройки',
  'docs/quality-helper-map.md',
  'docs/quality-regression-checklist.md',
  'docs/**',
  'README.md',
  'validate:asset-duplicates',
  'validate:layout-media-preservation',
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

  for (const snippet of requiredHistoricalSnippets) {
    if (!source.includes(snippet)) {
      errors.push(`docs/changelog.md: отсутствует историческая строка ${snippet}`);
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
