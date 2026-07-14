import fs from 'node:fs';

const indexSource = read('index.html');
const preprintSource = read('assets/js/preprintSummary.js');
const layoutSyncSource = read('assets/js/layoutExtrasSync.js');
const qrSizeSource = read('assets/js/qrSizeHint.js');
const errors = [];

checkHtmlScript(indexSource, 'index.html', [
  'assets/js/qualityPriorityHint.js',
  'assets/js/preprintSummary.js',
  'assets/js/qualityExtraActions.js'
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
  "import './qrSizeHint.js';",
  "import { syncLayoutExtras } from './layoutExtras.js';"
]);

check(qrSizeSource, 'qrSizeHint.js', [
  "import './qualityQrDeduplicate.js';"
]);

checkConnectedHelper('assets/js/qrSizeHint.js', layoutSyncSource, "import './qrSizeHint.js';");
checkConnectedHelper('assets/js/qualityQrDeduplicate.js', qrSizeSource, "import './qualityQrDeduplicate.js';");
checkRemovedHelper('assets/js/qualitySuppressedPriority.js');
checkRemovedHelper('assets/js/qrIntentFix.js');
checkRemovedHelper('assets/js/photoIntentFix.js');
checkRemovedHelper('assets/js/responseChannelPhoneGuard.js');

if (layoutSyncSource.includes("import './qrIntentFix.js';")) {
  errors.push('layoutExtrasSync.js: не должен импортировать удалённый qrIntentFix.js');
}

if (layoutSyncSource.includes("import './photoIntentFix.js';")) {
  errors.push('layoutExtrasSync.js: не должен импортировать удалённый photoIntentFix.js');
}

if (layoutSyncSource.includes("import './responseChannelPhoneGuard.js';")) {
  errors.push('layoutExtrasSync.js: не должен импортировать удалённый responseChannelPhoneGuard.js');
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

function checkHtmlScript(source, file, scriptPaths) {
  for (const scriptPath of scriptPaths) {
    const pattern = new RegExp(`src=["']${escapeRegex(scriptPath)}(?:\\?v=[^"']+)?["']`);
    if (!pattern.test(source)) errors.push(`${file}: missing script ${scriptPath} with optional asset-version`);
  }
}

function checkScriptOrder(source, file, firstScript, secondScript, message) {
  const firstIndex = findScriptIndex(source, firstScript);
  const secondIndex = findScriptIndex(source, secondScript);
  if (firstIndex === -1 || secondIndex === -1) return;
  if (firstIndex > secondIndex) {
    errors.push(`${file}: ${message} — ${firstScript} должен быть выше ${secondScript}`);
  }
}

function findScriptIndex(source, scriptPath) {
  const pattern = new RegExp(`src=["']${escapeRegex(scriptPath)}(?:\\?v=[^"']+)?["']`);
  return source.search(pattern);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
