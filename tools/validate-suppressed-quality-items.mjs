import fs from 'node:fs';

const qualitySource = read('assets/js/quality.js');
const dedupeSource = read('assets/js/qualityQrDeduplicate.js');
const filtersSource = read('assets/js/qualityIssueFilters.js');
const summarySource = read('assets/js/qualityIssueSummary.js');
const priorityHintSource = read('assets/js/qualityPriorityHint.js');
const prioritySource = read('assets/js/qualitySuppressedPriority.js');
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

check(priorityHintSource, 'qualityPriorityHint.js', [
  "attributeFilter: ['data-quality-suppressed']",
  "find((entry) => !entry.dataset.qualitySuppressed)"
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

check(preprintSource, 'preprintSummary.js', [
  "filter((item) => !item.dataset.qualitySuppressed)",
  "const errorItems = items.filter((item) => item.classList.contains('error'))",
  "const warningItems = items.filter((item) => item.classList.contains('warn'))"
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
