import fs from 'node:fs';

const readmeSource = read('README.md');
const statusSource = read('docs/current-project-status-2026-07-14.md');
const releaseSource = read('docs/release-3.86.0-candidate.md');
const inventorySource = read('docs/template-portfolio-inventory.generated.md');
const packageSource = read('package.json');
const workflowSource = read('.github/workflows/validate.yml');
const errors = [];
const pkg = readPackage(packageSource);

check(readmeSource, 'README.md', [
  '# Генератор расклеек СПН «Этажи»',
  '## Актуальный статус и план',
  'docs/current-project-status-2026-07-14.md',
  'docs/full-project-audit-and-roadmap-2026-07-11.md',
  'ручная viewport- и печатная приёмка #40',
  'менеджерская проверка #51',
  '### Контроль качества',
  'прямые безопасные действия для пустого QR, фото и отсутствующего канала отклика',
  'выбранные блоки не выключаются автоматически, а пользователь переходит к нужному полю или включает контакты только при корректном телефоне',
  'подавление дублирующих QR-замечаний',
  'мягкая автоподстройка, которая сохраняет включённые фото и QR в `auto` и явных режимах подстройки',
  '### Backup рабочего пространства',
  'полный backup позволяет перенести и восстановить рабочее пространство',
  '## Автоматические проверки',
  'npm run validate',
  'assets/js/quality.js',
  'assets/js/spnWorkspaceBackup.js',
  'tools/validate-runtime-architecture.mjs',
  'tools/validate-manager-sensitive-review.mjs'
]);

check(statusSource, 'docs/current-project-status-2026-07-14.md', [
  '# Актуальный статус генератора расклеек',
  'docs/full-project-audit-and-roadmap-2026-07-11.md',
  'docs/template-portfolio-inventory.generated.md',
  'docs/manager-sensitive-template-review-3.86.0.md',
  'docs/manager-sensitive-template-evidence-3.86.0.md',
  'tools/validate-manager-sensitive-review.mjs',
  'Issue #40',
  'Issue #51',
  'issues #40 и #51 остаются открытыми'
]);

validateStatusSnapshot();

for (const file of [
  'assets/js/qualityExtraActions.js',
  'assets/js/qualityQrDeduplicate.js',
  'assets/js/qrSizeHint.js',
  'docs/current-project-status-2026-07-14.md',
  'docs/quality-helper-map.md',
  'docs/quality-regression-checklist.md',
  'tools/validate-asset-duplicates.mjs',
  'tools/validate-layout-media-preservation.mjs',
  'tools/validate-photo-intent-action.mjs',
  'tools/validate-response-channel-action.mjs',
  'tools/validate-suppressed-quality-items.mjs',
  'tools/validate-quality-helper-imports.mjs',
  'tools/validate-quality-regression-checklist.mjs',
  'tools/validate-quality-helper-map.mjs',
  'tools/validate-qr-empty-direct-action.mjs',
  'tools/validate-manager-sensitive-review.mjs'
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: файл не найден`);
}

if (pkg) {
  const expectedScripts = {
    'validate:asset-duplicates': 'node tools/validate-asset-duplicates.mjs',
    'validate:layout-media-preservation': 'node tools/validate-layout-media-preservation.mjs',
    'validate:photo-intent-action': 'node tools/validate-photo-intent-action.mjs',
    'validate:response-channel-action': 'node tools/validate-response-channel-action.mjs',
    'validate:suppressed-quality-items': 'node tools/validate-suppressed-quality-items.mjs',
    'validate:quality-helper-imports': 'node tools/validate-quality-helper-imports.mjs',
    'validate:quality-regression-checklist': 'node tools/validate-quality-regression-checklist.mjs',
    'validate:quality-helper-map': 'node tools/validate-quality-helper-map.mjs',
    'validate:readme-quality-docs': 'node tools/validate-readme-quality-docs.mjs',
    'validate:qr-empty-direct-action': 'node tools/validate-qr-empty-direct-action.mjs'
  };

  for (const [name, command] of Object.entries(expectedScripts)) {
    if (String(pkg.scripts?.[name] || '').trim() !== command) {
      errors.push(`package.json: ${name} должен быть ${command}`);
    }
  }
}

check(workflowSource, '.github/workflows/validate.yml', [
  "- 'docs/**'",
  "- 'README.md'",
  'run: npm run validate'
]);

for (const removed of [
  'assets/js/qrIntentFix.js',
  'assets/js/photoIntentFix.js',
  'assets/js/responseChannelPhoneGuard.js'
]) {
  if (readmeSource.includes(removed)) errors.push(`README.md: удалённый модуль не должен упоминаться — ${removed}`);
}

if (errors.length) {
  console.error('\nОшибки README, актуального статуса и workflow по helper-модулям качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('README, актуальный статус, инвентаризация, релиз и workflow синхронизированы.');

function validateStatusSnapshot() {
  const releaseStatus = releaseSource.match(/^Статус:\s*(DRAFT|READY)\s*$/m)?.[1] || '';
  const targetVersion = releaseSource.match(/^Целевая версия:\s*([0-9.]+)\s*$/m)?.[1] || '';
  const workflowRun = releaseSource.match(/Последний полный контроль:\s*GitHub Actions workflow run #(\d+)/)?.[1] || '';

  if (!releaseStatus) errors.push('docs/release-3.86.0-candidate.md: не найден статус релиза');
  if (!targetVersion) errors.push('docs/release-3.86.0-candidate.md: не найдена целевая версия');
  if (!workflowRun) errors.push('docs/release-3.86.0-candidate.md: не найден номер полного workflow run');

  if (pkg?.version) {
    check(statusSource, 'docs/current-project-status-2026-07-14.md', [
      `Опубликованная версия: \`${pkg.version}\``
    ]);
  }

  if (targetVersion && releaseStatus) {
    check(statusSource, 'docs/current-project-status-2026-07-14.md', [
      `Релиз-кандидат: \`${targetVersion}\`, статус \`${releaseStatus}\``
    ]);
  }

  if (workflowRun) {
    check(statusSource, 'docs/current-project-status-2026-07-14.md', [
      `Последний полный запуск, зафиксированный в релиз-кандидате: workflow run #${workflowRun}`
    ]);
  }

  const metrics = {
    files: readMetric('файлов шаблонов'),
    templates: readMetric('шаблонов'),
    office: readMetric('с office-метаданными'),
    recommended: readMetric('office-рекомендованных'),
    working: readMetric('рабочих'),
    test: readMetric('тестовых'),
    deprecated: readMetric('устаревших'),
    unresolved: readMetric('неразрешённых итоговых id'),
    nearDuplicates: readMetric('вероятных смысловых дублей')
  };

  const expected = [
    `- файлов шаблонов: ${metrics.files};`,
    `- шаблонов всего: ${metrics.templates};`,
    `- \`working\`: ${metrics.working};`,
    `- \`test\`: ${metrics.test};`,
    `- \`deprecated\`: ${metrics.deprecated};`,
    `- шаблонов с office-метаданными: ${metrics.office};`,
    `- office-рекомендованных: ${metrics.recommended};`,
    `- Неразрешённых итоговых ID и вероятных смысловых дублей — ${metrics.unresolved}.`
  ];

  check(statusSource, 'docs/current-project-status-2026-07-14.md', expected);

  if (metrics.unresolved !== 0) errors.push('Инвентаризация: неразрешённые итоговые ID должны быть равны 0');
  if (metrics.nearDuplicates !== 0) errors.push('Инвентаризация: вероятные смысловые дубли должны быть равны 0');
  if (metrics.working + metrics.test + metrics.deprecated !== metrics.templates) {
    errors.push('Инвентаризация: working + test + deprecated не совпадает с общим количеством шаблонов');
  }
}

function readMetric(label) {
  const match = inventorySource.match(new RegExp(`^- ${escapeRegExp(label)}:\\s*(\\d+)`, 'm'));
  if (!match) {
    errors.push(`docs/template-portfolio-inventory.generated.md: не найден показатель ${label}`);
    return -1;
  }
  return Number(match[1]);
}

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function readPackage(source) {
  try { return JSON.parse(source || '{}'); }
  catch {
    errors.push('package.json: JSON не читается');
    return null;
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}