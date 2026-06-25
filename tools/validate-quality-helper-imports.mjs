import fs from 'node:fs';

const indexSource = read('index.html');
const preprintSource = read('assets/js/preprintSummary.js');
const layoutSyncSource = read('assets/js/layoutExtrasSync.js');
const errors = [];

check(indexSource, 'index.html', [
  'src="assets/js/preprintSummary.js"',
  'src="assets/js/qualityExtraActions.js"'
]);

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
  "import './qrIntentFix.js';",
  "import './photoIntentFix.js';",
  "import './qrSizeHint.js';",
  "import './responseChannelPhoneGuard.js';"
]);

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

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
