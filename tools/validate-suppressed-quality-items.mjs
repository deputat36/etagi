import fs from 'node:fs';

const dedupeSource = read('assets/js/qualityQrDeduplicate.js');
const filtersSource = read('assets/js/qualityIssueFilters.js');
const summarySource = read('assets/js/qualityIssueSummary.js');
const prioritySource = read('assets/js/qualitySuppressedPriority.js');
const printGuardSource = read('assets/js/qualityPrintGuardHint.js');
const qrSizeSource = read('assets/js/qrSizeHint.js');
const layoutExtrasSyncSource = read('assets/js/layoutExtrasSync.js');
const errors = [];

check(dedupeSource, 'qualityQrDeduplicate.js', [
  "const SUPPRESSED_REASON = 'qr-size-duplicate'",
  'softItem.dataset.qualitySuppressed = SUPPRESSED_REASON',
  'delete softItem.dataset.qualitySuppressed'
]);

check(filtersSource, 'qualityIssueFilters.js', [
  "attributeFilter: ['data-quality-suppressed', 'hidden']",
  'const items = allItems.filter((item) => !item.dataset.qualitySuppressed)',
  'suppressedItems.forEach((item) => { item.hidden = true; })'
]);

check(summarySource, 'qualityIssueSummary.js', [
  "attributeFilter: ['data-quality-suppressed', 'hidden']",
  "filter((item) => !item.dataset.qualitySuppressed)",
  'count: activeItems.filter((item) => item.classList.contains(level.key)).length'
]);

check(prioritySource, 'qualitySuppressedPriority.js', [
  "attributeFilter: ['data-quality-suppressed']",
  "find((entry) => !entry.dataset.qualitySuppressed)",
  'quality-priority-hint good'
]);

check(printGuardSource, 'qualityPrintGuardHint.js', [
  "attributeFilter: ['data-quality-suppressed']",
  "const hasError = Boolean(findActiveIssue(list, 'error'))",
  "const hasWarning = Boolean(findActiveIssue(list, 'warn'))",
  "find((item) => !item.dataset.qualitySuppressed)"
]);

check(qrSizeSource, 'qrSizeHint.js', [
  "import './qualityQrDeduplicate.js';",
  "import './qualitySuppressedPriority.js';"
]);

check(layoutExtrasSyncSource, 'layoutExtrasSync.js', [
  "import './qrSizeHint.js';"
]);

if (errors.length) {
  console.error('\nОшибки подавленных замечаний качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка подавленных замечаний качества пройдена.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
