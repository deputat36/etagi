import fs from 'node:fs';

const qualitySource = read('assets/js/quality.js');
const sharedUpdatesSource = read('assets/js/qualityListUpdates.js');
const dedupeSource = read('assets/js/qualityQrDeduplicate.js');
const filtersSource = read('assets/js/qualityIssueFilters.js');
const summarySource = read('assets/js/qualityIssueSummary.js');
const priorityHintSource = read('assets/js/qualityPriorityHint.js');
const printGuardSource = read('assets/js/qualityPrintGuardHint.js');
const preprintSource = read('assets/js/preprintSummary.js');
const qrSizeSource = read('assets/js/qrSizeHint.js');
const layoutExtrasSyncSource = read('assets/js/layoutExtrasSync.js');
const errors = [];

check(qualitySource, 'quality.js', [
  'if(count >= 4 && count < 6)',
  "title:'QR может быть мелким'",
  "title:'QR слишком мал для мини-макета'"
]);

checkQrSourceGuard(qualitySource);
checkRemovedSuppressedPriority();

check(sharedUpdatesSource, 'qualityListUpdates.js', [
  "attributeFilter: ['data-quality-suppressed']",
  "record.target.matches('.qitem')",
  "scheduleQualityListUpdate('mutation')"
]);
if (sharedUpdatesSource.includes("attributeFilter: ['data-quality-suppressed', 'hidden']")) {
  errors.push('qualityListUpdates.js: общий observer не должен следить за hidden, который меняют фильтры');
}

check(dedupeSource, 'qualityQrDeduplicate.js', [
  "import { subscribeQualityListUpdates } from './qualityListUpdates.js';",
  "const SUPPRESSED_REASON = 'qr-size-duplicate'",
  "priority: 0",
  'softItem.dataset.qualitySuppressed !== SUPPRESSED_REASON',
  'softItem.dataset.qualitySuppressed = SUPPRESSED_REASON',
  'if (!softItem.hidden) softItem.hidden = true',
  'delete softItem.dataset.qualitySuppressed',
  'if (softItem.hidden) softItem.hidden = false'
]);
if (/if \(hardItem\) \{\s*softItem\.dataset\.qualitySuppressed = SUPPRESSED_REASON/.test(dedupeSource)) {
  errors.push('qualityQrDeduplicate.js: нельзя повторно записывать то же подавление на каждом общем проходе');
}

check(filtersSource, 'qualityIssueFilters.js', [
  "import { subscribeQualityListUpdates } from './qualityListUpdates.js';",
  "label: 'quality-issue-filters'",
  'const items = allItems.filter((item) => !item.dataset.qualitySuppressed)',
  'suppressedItems.forEach((item) => { item.hidden = true; })'
]);

check(summarySource, 'qualityIssueSummary.js', [
  "import { subscribeQualityListUpdates } from './qualityListUpdates.js';",
  "label: 'quality-issue-summary'",
  "filter((item) => !item.dataset.qualitySuppressed)",
  'count: activeItems.filter((item) => item.classList.contains(level.key)).length'
]);

check(priorityHintSource, 'qualityPriorityHint.js', [
  "import { subscribeQualityListUpdates } from './qualityListUpdates.js';",
  "label: 'quality-priority-hint'",
  "find((entry) => !entry.dataset.qualitySuppressed)"
]);

check(printGuardSource, 'qualityPrintGuardHint.js', [
  "import { subscribeQualityListUpdates } from './qualityListUpdates.js';",
  "label: 'quality-print-guard'",
  "const hasError = Boolean(findActiveIssue(list, 'error'))",
  "const hasWarning = Boolean(findActiveIssue(list, 'warn'))",
  "find((item) => !item.dataset.qualitySuppressed)"
]);

for (const [file, source] of [
  ['qualityQrDeduplicate.js', dedupeSource],
  ['qualityIssueFilters.js', filtersSource],
  ['qualityIssueSummary.js', summarySource],
  ['qualityPriorityHint.js', priorityHintSource],
  ['qualityPrintGuardHint.js', printGuardSource]
]) {
  if (source.includes('new MutationObserver')) {
    errors.push(`${file}: не должен создавать отдельный observer списка качества`);
  }
}

check(preprintSource, 'preprintSummary.js', [
  "filter((item) => !item.dataset.qualitySuppressed)",
  "const errorItems = items.filter((item) => item.classList.contains('error'))",
  "const warningItems = items.filter((item) => item.classList.contains('warn'))"
]);

check(qrSizeSource, 'qrSizeHint.js', [
  "import './qualityQrDeduplicate.js';"
]);

if (qrSizeSource.includes("import './qualitySuppressedPriority.js';")) {
  errors.push('qrSizeHint.js: не должен подключать устаревший страховочный приоритет, основной qualityPriorityHint.js уже учитывает подавленные замечания');
}

check(layoutExtrasSyncSource, 'layoutExtrasSync.js', [
  "import './qrSizeHint.js';"
]);

if (errors.length) {
  console.error('\nОшибки подавленных замечаний качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка подавленных замечаний качества пройдена.');

function checkQrSourceGuard(source) {
  const softQrLine = findLine(source, 'QR может быть мелким');
  if (!softQrLine) {
    errors.push('quality.js: не найден мягкий QR-совет');
    return;
  }

  if (!/count\s*>=\s*4\s*&&\s*count\s*<\s*6/.test(softQrLine)) {
    errors.push('quality.js: мягкий QR-совет должен работать только для 4 макетов, а не для 6–8');
  }
}

function checkRemovedSuppressedPriority() {
  if (fs.existsSync('assets/js/qualitySuppressedPriority.js')) {
    errors.push('assets/js/qualitySuppressedPriority.js: устаревший дубль основного qualityPriorityHint.js должен оставаться удалённым');
  }
}

function findLine(source, needle) {
  return String(source || '').split('\n').find((line) => line.includes(needle)) || '';
}

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
