import fs from 'node:fs';

const indexSource = read('index.html');
const preprintSource = read('assets/js/preprintSummary.js');
const layoutSyncSource = read('assets/js/layoutExtrasSync.js');
const qrSizeSource = read('assets/js/qrSizeHint.js');
const errors = [];

check(indexSource, 'index.html', [
  'src="assets/js/qualityPriorityHint.js"',
  'src="assets/js/preprintSummary.js"',
  'src="assets/js/qualityExtraActions.js"'
]);

checkScriptOrder(
  indexSource,
  'index.html',
  'assets/js/qualityPriorityHint.js',
  'assets/js/preprintSummary.js',
  'основной приоритет качества должен быть готов до помощников подавления'
);

checkScriptOrder(
  indexSource,
  'index.html',
  'assets/js/preprintSummary.js',
  'assets/js/qualityExtraActions.js',
  'помощники качества должны загружаться до быстрых исправлений'
);

check(preprintSource, 'preprintSummary.js', [
  "import './layoutExtrasSync.js';"
]);

check(layoutSyncSource, 'layoutExtrasSync.js', [
  "import './photoIntentFix.js';",
  "import './qrSizeHint.js';",
  "import './responseChannelPhoneGuard.js';"
]);

check(qrSizeSource, 'qrSizeHint.js', [
  "import './qualityQrDeduplicate.js';"
]);

checkConnectedHelper('assets/js/photoIntentFix.js', layoutSyncSource, "import './photoIntentFix.js';");
checkConnectedHelper('assets/js/qrSizeHint.js', layoutSyncSource, "import './qrSizeHint.js';");
checkConnectedHelper('assets/js/responseChannelPhoneGuard.js', layoutSyncSource, "import './responseChannelPhoneGuard.js';");
checkConnectedHelper('assets/js/qualityQrDeduplicate.js', qrSizeSource, "import './qualityQrDeduplicate.js';");
checkRemovedHelper('assets/js/qualitySuppressedPriority.js');
checkRemovedHelper('assets/js/qrIntentFix.js');

if (layoutSyncSource.includes("import './qrIntentFix.js';")) {
  errors.push('layoutExtrasSync.js: не должен импортировать удалённый qrIntentFix.js');
}

if (qrSizeSource.includes("import './qualitySuppressedPriority.js';")) {
  errors.push('qrSizeHint.js: не должен импортировать удалённый qualitySuppressedPriority.js');
}

if (errors.length) {
  console.error('\nQuality helper import errors:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Quality helper imports are valid.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: missing ${snippet}`);
  }
}

function checkScriptOrder(source, file, firstScript, secondScript, message) {
  const firstIndex = source.indexOf(`src="${firstScript}"`);
  const secondIndex = source.indexOf(`src="${secondScript}"`);
  if (firstIndex === -1 || secondIndex === -1) return;
  if (firstIndex > secondIndex) {
    errors.push(`${file}: ${message} — ${firstScript} должен быть выше ${secondScript}`);
  }
}

function checkConnectedHelper(file, source, importSnippet) {
  if (!fs.existsSync(file)) {
    errors.push(`${file}: файл помощника не найден`);
    return;
  }

  if (!source.includes(importSnippet)) {
    errors.push(`${file}: файл существует, но не подключён ожидаемым импортом ${importSnippet}`);
  }
}

function checkRemovedHelper(file) {
  if (fs.existsSync(file)) {
    errors.push(`${file}: устаревший helper должен оставаться удалённым`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
