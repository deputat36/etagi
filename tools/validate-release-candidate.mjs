import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  package: 'package.json',
  release: 'docs/release-3.86.0-candidate.md',
  acceptance: 'docs/manual-print-acceptance-3.86.0.md',
  managerReview: 'docs/manager-sensitive-template-review-3.86.0.md',
  testPack: 'docs/manual-print-test-pack-3.86.0.md',
  changelog: 'docs/changelog.md'
};

const pkg = readJson(files.package);
const release = readRequired(files.release);
const acceptance = readRequired(files.acceptance);
const managerReview = readRequired(files.managerReview);
const testPack = readRequired(files.testPack);
const changelog = readRequired(files.changelog);
const targetVersion = '3.86.0';
const packageVersion = String(pkg?.version || '').trim();
const status = release.match(/^Статус:\s*(DRAFT|READY)\s*$/m)?.[1] || '';
const workflowRunNumber = Number(release.match(/Последний полный контроль:\s*GitHub Actions workflow run #(\d+)/)?.[1] || 0);
const acceptancePassed = /^Статус:\s*ПРОЙДЕНА\s*$/m.test(acceptance);
const acceptancePending = /^Статус:\s*НЕ ПРОЙДЕНА\s*$/m.test(acceptance);
const managerReviewPassed = /^Статус:\s*ПРОЙДЕНА\s*$/m.test(managerReview);
const managerReviewPending = /^Статус:\s*НЕ ПРОЙДЕНА\s*$/m.test(managerReview);
const uncheckedRelease = countCheckboxes(release, false);
const uncheckedAcceptance = countCheckboxes(acceptance, false);
const uncheckedManagerReview = countCheckboxes(managerReview, false);
const changelogHasTarget = new RegExp(`^## ${escapeRegExp(targetVersion)}\\s*$`, 'm').test(changelog);

requireSnippets(files.release, release, [
  '# Релиз-кандидат 3.86.0',
  'Целевая версия: 3.86.0',
  'Причина статуса `DRAFT`',
  '## Автоматические доказательства',
  '## Блокирующие условия перед выпуском',
  'docs/manual-print-acceptance-3.86.0.md',
  'docs/manager-sensitive-template-review-3.86.0.md',
  'npm run assets:stamp',
  'npm run validate',
  '`validate` — успешно',
  '`browser-smoke` — успешно',
  '`print-screenshot` для пяти сценариев — успешно',
  '`collect-print-screenshots` — успешно'
]);

if(!Number.isInteger(workflowRunNumber) || workflowRunNumber <= 0) {
  errors.push(`${files.release}: нужен актуальный номер последнего полного workflow run`);
}

requireSnippets(files.acceptance, acceptance, [
  '# Ручная печатная приёмка 3.86.0',
  '1 на А4 без фото',
  '2 на А4 с крупным телефоном',
  '4 на А4 в экономном цвете',
  'Поля офисного принтера',
  'Телефон читается с 2 метров',
  'QR сканируется',
  'Расход чернил приемлем',
  '`photo_left`',
  '`photo_card`',
  '`newbuild_visual`',
  '`agent_brand_photo`',
  'Версию 3.86.0 можно переводить из `DRAFT` в `READY`.'
]);

requireSnippets(files.managerReview, managerReview, [
  '# Менеджерская проверка чувствительных шаблонов 3.86.0',
  'issue #41',
  '`buyer_mortgage`',
  '`newbuild_no_commission`',
  '`newbuild_budget`',
  '`newbuild_mortgage`',
  '`service_mortgage`',
  '`buyer_maternity_capital`',
  '`newbuild_family_mortgage`',
  '`service_complex_sale`',
  '`trust_service_documents_check`',
  '`custom_service_consultation`',
  '`service_micro_4`',
  'npm run templates:inventory',
  'npm run validate'
]);

requireSnippets(files.testPack, testPack, [
  '# Пакет ручной печатной проверки 3.86.0',
  '## Единые тестовые данные',
  'Тестовый специалист',
  '+7 900 000-00-00',
  'https://deputat36.github.io/etagi/',
  '## Сценарий 1 — один макет без фото',
  '## Сценарий 2 — два макета с крупным телефоном',
  '## Сценарий 3 — четыре макета и расход чернил',
  'Для массовой печати 4 на А4 допускаются оценки `Низкий` или `Приемлемый`.',
  '## Сценарий 5 — специализированные фото-компоновки',
  'Сканировать штатной камерой двух разных телефонов.',
  'issue #40'
]);

if(!status) errors.push(`${files.release}: статус должен быть DRAFT или READY`);

if(status === 'DRAFT'){
  if(packageVersion === targetVersion) errors.push(`${files.package}: нельзя ставить ${targetVersion}, пока релиз-кандидат имеет статус DRAFT`);
  if(changelogHasTarget) errors.push(`${files.changelog}: финальный раздел ${targetVersion} нельзя добавлять, пока релиз-кандидат имеет статус DRAFT`);
  if(!acceptancePending) errors.push(`${files.acceptance}: для DRAFT ожидается статус НЕ ПРОЙДЕНА`);
  if(!managerReviewPending) errors.push(`${files.managerReview}: для DRAFT ожидается статус НЕ ПРОЙДЕНА`);
  if(!uncheckedRelease) errors.push(`${files.release}: DRAFT должен содержать незакрытые блокирующие пункты`);
  if(!uncheckedAcceptance) errors.push(`${files.acceptance}: DRAFT должен содержать незакрытые ручные проверки`);
  if(!uncheckedManagerReview) errors.push(`${files.managerReview}: DRAFT должен содержать незакрытые пункты менеджерской проверки`);
}

if(status === 'READY'){
  if(packageVersion !== targetVersion) errors.push(`${files.package}: для READY ожидается version ${targetVersion}`);
  if(!changelogHasTarget) errors.push(`${files.changelog}: для READY требуется раздел ## ${targetVersion}`);
  if(!acceptancePassed) errors.push(`${files.acceptance}: для READY ожидается статус ПРОЙДЕНА`);
  if(!managerReviewPassed) errors.push(`${files.managerReview}: для READY ожидается статус ПРОЙДЕНА`);
  if(uncheckedRelease) errors.push(`${files.release}: для READY все блокирующие пункты должны быть отмечены`);
  if(uncheckedAcceptance) errors.push(`${files.acceptance}: для READY все ручные проверки должны быть отмечены`);
  if(uncheckedManagerReview) errors.push(`${files.managerReview}: для READY все пункты менеджерской проверки должны быть отмечены`);
}

if(errors.length){
  console.error('\nОшибки готовности релиз-кандидата 3.86.0:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Релиз-кандидат 3.86.0 корректен: статус ${status}, текущая версия ${packageVersion}, workflow run #${workflowRunNumber}; печатная и менеджерская приёмка согласованы со статусом.`);

function countCheckboxes(source, checked){
  const marker = checked ? 'x' : ' ';
  return (source.match(new RegExp(`^- \\[${marker}\\]`, 'gm')) || []).length;
}

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный фрагмент — ${snippet}`);
  }
}

function readJson(file){
  const source = readRequired(file);
  if(!source) return null;
  try { return JSON.parse(source); }
  catch(error){ errors.push(`${file}: JSON не читается — ${error.message}`); return null; }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){ errors.push(`${file}: файл не найден`); return ''; }
  return fs.readFileSync(fullPath, 'utf8');
}

function escapeRegExp(value){
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
