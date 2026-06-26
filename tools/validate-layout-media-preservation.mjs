import fs from 'node:fs';

const layoutRulesSource = read('assets/js/layoutRules.js');
const appSource = read('assets/js/app.js');
const indexSource = read('index.html');
const errors = [];

check(layoutRulesSource, 'assets/js/layoutRules.js', [
  'export function applyLayoutModePreservingMedia',
  'const mediaIntent = pickMediaIntent(state);',
  'const next = applyLayoutMode(state, mode);',
  'next.showPhoto = true;',
  'next.photoMode = mediaIntent.photoMode;',
  'next.showQr = true;',
  'function pickMediaIntent',
  'showPhoto: Boolean(state.showPhoto && state.photoMode !== \'none\')',
  'showQr: Boolean(state.showQr)'
]);

check(appSource, 'assets/js/app.js', [
  'applyLayoutModePreservingMedia',
  "if($('preserveMediaLayoutBtn')) $('preserveMediaLayoutBtn').onclick = () => applyModePreservingMedia('auto');",
  'function applyModePreservingMedia(mode)',
  'Макет подстроен без отключения включённых фото и QR',
  "if(action === 'autoFix') state = applyLayoutMode(state, 'auto');"
]);

check(indexSource, 'index.html', [
  'id="preserveMediaLayoutBtn"',
  'Подстроить, сохранив фото и QR'
]);

if (!appSource.includes("$('autoLayoutBtn').onclick = () => applyMode('auto');")) {
  errors.push('assets/js/app.js: старая кнопка автоподстройки должна остаться отдельной');
}

if (errors.length) {
  console.error('\nОшибки мягкой автоподстройки фото и QR:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка мягкой автоподстройки фото и QR пройдена.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
