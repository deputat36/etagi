import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  module:'assets/js/spnDestructiveSnapshot.js',
  entry:'assets/js/spnUiMode.js',
  runner:'tools/run-ui-actions-smoke.mjs',
  smoke:'tools/destructive-snapshot-smoke.html',
  docs:'docs/destructive-action-snapshots.md',
  storageRunner:'tools/validate-storage-contracts.mjs',
  package:'package.json'
};
const sources = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readRequired(file)]));
const pkg = readJson(files.package, sources.package);

requireSnippets(files.module, sources.module, [
  "export const DESTRUCTIVE_SNAPSHOT_KEY = 'etagi-raskleyka-destructive-snapshot-v1'",
  'export const DESTRUCTIVE_SNAPSHOT_VERSION = 1',
  "'clear-object':'Перед очисткой данных объекта'",
  "'load-named-layout':'Перед загрузкой именованного макета'",
  "'load-last-layout':'Перед загрузкой последнего макета'",
  "'import-layout-file':'Перед импортом JSON-макета'",
  "document.addEventListener('click', handleDestructiveClick, true)",
  "document.getElementById('uploadFile')?.addEventListener('change', prepareImportSnapshot, true)",
  "text.includes('Файл макета открыт без смешивания')",
  'state.blockOrder = blockOrder',
  'state.photoOne = photoOne',
  'state.photoTwo = photoTwo',
  "state:{...snapshot.state, photoOne:'', photoTwo:''}",
  'photosOmitted:true',
  "window.dispatchEvent(new CustomEvent('etagi:destructive-snapshot-saved'",
  "document.body.dataset.destructiveSnapshotAvailable = snapshot ? 'true' : 'false'"
]);
forbidSnippets(files.module, sources.module, [
  'localStorage.clear()',
  'setInterval(',
  "document.addEventListener('click', handleDestructiveClick, false)"
]);

requireSnippets(files.entry, sources.entry, ["import './spnDestructiveSnapshot.js';"]);
requireSnippets(files.runner, sources.runner, [
  "label:'Destructive snapshot smoke'",
  "path:'tools/destructive-snapshot-smoke.html'"
]);
requireSnippets(files.smoke, sources.smoke, [
  'снимок: состояние сохранено перед очисткой объекта',
  'снимок: состояние сохранено перед загрузкой именованного макета',
  'снимок: состояние сохранено перед загрузкой последнего макета',
  'снимок: состояние сохранено перед успешным импортом JSON',
  'снимок: ошибочный импорт не затирает предыдущую резервную точку',
  "startsWith('data:image/svg+xml')",
  "blockOrder?.[0] === 'price'",
  "state.contactCta === 'Позвоните до очистки'"
]);
requireSnippets(files.docs, sources.docs, [
  '# Снимки перед разрушительными действиями',
  'etagi-raskleyka-destructive-snapshot-v1',
  'Ошибочный JSON не перезаписывает',
  'photosOmitted: true',
  'Пользовательская команда восстановления будет добавлена следующим отдельным PR',
  'Destructive snapshot smoke'
]);
requireSnippets(files.storageRunner, sources.storageRunner, [
  "'tools/validate-storage-safety.mjs'",
  "'tools/validate-destructive-snapshot.mjs'"
]);

if(String(pkg?.scripts?.['validate:storage-safety'] || '').trim() !== 'node tools/validate-storage-contracts.mjs'){
  errors.push(`${files.package}: validate:storage-safety должен запускать node tools/validate-storage-contracts.mjs`);
}

if(errors.length){
  console.error('\nОшибки снимков перед разрушительными действиями:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка снимков перед разрушительными действиями пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}

function readJson(file, source){
  try { return JSON.parse(source || '{}'); }
  catch(error){ errors.push(`${file}: JSON не читается — ${error.message}`); return null; }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
