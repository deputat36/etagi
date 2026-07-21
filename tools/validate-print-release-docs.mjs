import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  readme:'README.md',
  status:'docs/current-project-status-2026-07-14.md',
  ci:'docs/ci-verification-3.86.0.md',
  release:'docs/release-3.86.0-candidate.md',
  acceptance:'docs/manual-print-acceptance-3.86.0.md',
  testPack:'docs/manual-print-test-pack-3.86.0.md',
  package:'package.json'
};
const sources = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readRequired(file)]));
const pkg = readJson(files.package, sources.package);

requireSnippets(files.readme, sources.readme, [
  'PR-run #1883',
  '1 / 2 / 3 / 4 / 6 / 8 на А4',
  'семь PNG-сценариев',
  'node tools/run-eight-print-screenshot.mjs',
  'node tools/run-print-format-coverage-smoke.mjs',
  'Обязательные физические форматы: 1, 2, 3, 4, 6 и 8 на А4.',
  'релиз-кандидат остаётся `DRAFT`'
]);

requireSnippets(files.status, sources.status, [
  'Дата среза: 21 июля 2026 года',
  '1, 2, 3, 4, 6 и 8 макетов на A4',
  'семь независимых print-screenshot jobs',
  'workflow run #1883',
  'coverage run #7',
  '8-на-A4 run #10',
  'физическую печать 1, 2, 3, 4, 6 и 8 макетов на A4',
  'issues #40 и #51 остаются открытыми'
]);

requireSnippets(files.ci, sources.ci, [
  'Pull request: #91',
  'Успешный workflow run: #1883',
  'Workflow run ID: `29824496781`',
  'Проверенный head SHA: `85406931140f369bcabe297d7dd4ba21ee10c237`',
  'Artifact ID: `8492754380`',
  'sha256:2edc6a1d42effe845a16687d20c6398e7a492f10aec9805f660964d556de5c03',
  'Все семь сценариев используют `captureMethod: cdp-pipe`.',
  'Artifact ID: `8492331845`',
  'Workflow run ID: `29824496884`',
  'ручные issues #40 и #51 не закрыты автоматическим запуском'
]);

requireSnippets(files.release, sources.release, [
  'Статус: DRAFT',
  'Текущая опубликованная версия: 3.85.0',
  'Последний полный контроль: GitHub Actions workflow run #1883',
  '`print-screenshot` для семи сценариев — успешно',
  'отдельный workflow 8 на A4 — успешно',
  'единый browser coverage 1/2/3/4/6/8 — успешно',
  'Проверена физическая печать 1, 2, 3, 4, 6 и 8 макетов на А4.',
  'Для 1/2/3/4 проверены восемь отрывных полос',
  'Для 6/8 подтверждено отсутствие отрывных полос'
]);

requireSnippets(files.acceptance, sources.acceptance, [
  'Статус: НЕ ПРОЙДЕНА',
  '### 1 на A4',
  '### 2 на A4',
  '### 3 на A4',
  '### 4 на A4',
  '### 6 на A4',
  '### 8 на A4',
  'Форматы 6/8 печатаются без отрывных полос.',
  'Количество карточек совпадает с выбранным форматом 1/2/3/4/6/8.',
  'Все форматы 1/2/3/4/6/8 проверены физически'
]);

requireSnippets(files.testPack, sources.testPack, [
  '## Сценарий 0 — доступ к печати на ПК и телефоне',
  '## Сценарий 1 — один макет без фото',
  '## Сценарий 2 — два макета с крупным телефоном',
  '## Сценарий 2А — три макета с отрывными полосами',
  '## Сценарий 3 — четыре макета и расход чернил',
  '## Сценарий 3А — шесть экономных макетов',
  '## Сценарий 3Б — восемь сверхкомпактных макетов',
  'Для каждого обязательного формата 1/2/3/4/6/8 проверить',
  'физически проверены все форматы 1/2/3/4/6/8'
]);

if(pkg?.version !== '3.85.0') errors.push(`${files.package}: документационная синхронизация не должна менять version 3.85.0`);
if(countChecked(sources.release) !== 0) errors.push(`${files.release}: DRAFT не должен содержать отмеченные блокирующие чекбоксы`);
if(countChecked(sources.acceptance) !== 0) errors.push(`${files.acceptance}: ручная приёмка ещё не выполнена, отмеченные чекбоксы недопустимы`);
if(!sources.release.includes('Причина статуса `DRAFT`')) errors.push(`${files.release}: должна быть объяснена причина DRAFT`);
if(!sources.acceptance.includes('Автоматические PNG- и browser-проверки не заменяют физическую печать')) errors.push(`${files.acceptance}: автоматические проверки не должны подменять физическую приёмку`);

if(errors.length){
  console.error('\nОшибки синхронизации печатной и релизной документации:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('README, статус, CI-журнал, release candidate и ручные печатные бланки синхронизированы.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный фрагмент — ${snippet}`);
  }
}
function countChecked(source){ return (String(source || '').match(/^- \[[xX]\]/gm) || []).length; }
function readJson(file, source){
  try{return JSON.parse(source || '{}');}
  catch(error){errors.push(`${file}: JSON не читается — ${error.message}`);return null;}
}
function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
