import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  package: 'package.json',
  release: 'docs/release-3.86.0-candidate.md',
  acceptance: 'docs/manual-print-acceptance-3.86.0.md',
  managerReview: 'docs/manager-sensitive-template-review-3.86.0.md',
  managerEvidence: 'docs/manager-sensitive-template-evidence-3.86.0.md',
  managerValidator: 'tools/validate-manager-sensitive-review.mjs',
  testPack: 'docs/manual-print-test-pack-3.86.0.md',
  changelog: 'docs/changelog.md',
  readinessReporter: 'tools/report-release-readiness.mjs',
  readinessGuide: 'docs/release-readiness-status.md'
};

const pkg = readJson(files.package);
const release = readRequired(files.release);
const acceptance = readRequired(files.acceptance);
const managerReview = readRequired(files.managerReview);
const managerEvidence = readRequired(files.managerEvidence);
const testPack = readRequired(files.testPack);
const changelog = readRequired(files.changelog);
const readinessReporter = readRequired(files.readinessReporter);
const readinessGuide = readRequired(files.readinessGuide);
const targetVersion = '3.86.0';
const packageVersion = String(pkg?.version || '').trim();
const status = release.match(/^Статус:\s*(DRAFT|READY)\s*$/m)?.[1] || '';
const workflowRunNumber = Number(release.match(/Последний полный контроль:\s*GitHub Actions workflow run #(\d+)/)?.[1] || 0);
const acceptancePassed = /^Статус:\s*ПРОЙДЕНА\s*$/m.test(acceptance);
const acceptancePending = /^Статус:\s*НЕ ПРОЙДЕНА\s*$/m.test(acceptance);
const managerReviewPassed = /^Статус:\s*ПРОЙДЕНА\s*$/m.test(managerReview);
const managerReviewPending = /^Статус:\s*НЕ ПРОЙДЕНА\s*$/m.test(managerReview);
const releaseChecks = checkboxSummary(release);
const acceptanceChecks = checkboxSummary(acceptance);
const managerReviewChecks = checkboxSummary(managerReview);
const uncheckedRelease = releaseChecks.unchecked;
const uncheckedAcceptance = acceptanceChecks.unchecked;
const uncheckedManagerReview = managerReviewChecks.unchecked;
const changelogHasTarget = new RegExp(`^## ${escapeRegExp(targetVersion)}\\s*$`, 'm').test(changelog);

requireSnippets(files.release, release, [
  '# Релиз-кандидат 3.86.0',
  'Целевая версия: 3.86.0',
  'Причина статуса `DRAFT`',
  '## Автоматические доказательства',
  '## Блокирующие условия перед выпуском',
  'docs/manual-print-acceptance-3.86.0.md',
  'docs/manager-sensitive-template-review-3.86.0.md',
  'docs/manager-sensitive-template-evidence-3.86.0.md',
  'node tools/validate-manager-sensitive-review.mjs',
  'сценарий 0',
  '360–430 px',
  'удобный доступ к печати',
  'npm run release:status',
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
  '## Доступ к печати в длинной форме',
  '360–430 px',
  'Одно нажатие `К печати`',
  'кнопка `Проверить`',
  'Менеджер подтвердил удобный доступ к печати',
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
  'issue #51',
  'docs/manager-sensitive-template-evidence-3.86.0.md',
  'node tools/validate-manager-sensitive-review.mjs',
  '`buyer_mortgage`',
  '`newbuild_no_commission`',
  '`newbuild_budget`',
  '`newbuild_mortgage`',
  '`service_mortgage`',
  '`buyer_maternity_capital`',
  '`newbuild_family_mortgage`',
  '`service_complex_sale`',
  '`seller_empty_flat`',
  '`trust_service_documents_check`',
  '`custom_service_consultation`',
  '`service_micro_4`',
  'npm run templates:inventory',
  'npm run validate'
]);

requireSnippets(files.managerEvidence, managerEvidence, [
  '# Доказательный пакет чувствительных шаблонов 3.86.0',
  'Источник списка: `docs/manager-sensitive-template-review-3.86.0.md`',
  'Источник данных: `data/templates*.json`, `data/template_office_overrides.json`, `data/template_portfolio_status.json`',
  'npm run validate:release-candidate',
  'node tools/validate-manager-sensitive-review.mjs'
]);

requireSnippets(files.testPack, testPack, [
  '# Пакет ручной печатной проверки 3.86.0',
  '## Единые тестовые данные',
  'Тестовый специалист',
  '+7 900 000-00-00',
  'https://deputat36.github.io/etagi/',
  '## Сценарий 0 — доступ к печати на ПК и телефоне',
  'ширине viewport 360–430 px',
  'отсутствие горизонтальной прокрутки',
  'фокус установлен на `Проверить`',
  'пройден сценарий 0',
  '## Сценарий 1 — один макет без фото',
  '## Сценарий 2 — два макета с крупным телефоном',
  '## Сценарий 3 — четыре макета и расход чернил',
  'Для массовой печати 4 на А4 допускаются оценки `Низкий` или `Приемлемый`.',
  '## Сценарий 5 — специализированные фото-компоновки',
  'Сканировать штатной камерой двух разных телефонов.',
  'issue #40'
]);

requireSnippets(files.readinessReporter, readinessReporter, [
  "args.has('--json')",
  "args.has('--strict')",
  'documentedWorkflowRun',
  'checkboxSummary',
  'consistencyErrors',
  'issue #40',
  'issue #51',
  'Следующий шаг:',
  'process.exitCode = 2'
]);

forbidSnippets(files.readinessReporter, readinessReporter, [
  'fetch(',
  'XMLHttpRequest',
  'node:http',
  'node:https'
]);

requireSnippets(files.readinessGuide, readinessGuide, [
  '# Сводный статус готовности релиза',
  'npm run release:status',
  'npm run release:status -- --json',
  'npm run release:status -- --strict',
  'кодом `2`',
  'issue #40',
  'issue #51',
  'не изменяет файлы'
]);

if(String(pkg?.scripts?.['release:status'] || '').trim() !== 'node tools/report-release-readiness.mjs') {
  errors.push('package.json: release:status должен запускать node tools/report-release-readiness.mjs');
}

runManagerSensitiveReviewValidation();
runReleaseReadinessReportValidation();

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

console.log(`Релиз-кандидат 3.86.0 корректен: статус ${status}, текущая версия ${packageVersion}, workflow run #${workflowRunNumber}; viewport-, печатная и менеджерская приёмка согласованы со статусом, evidence-пакет и сводный отчёт синхронизированы.`);

function runManagerSensitiveReviewValidation(){
  const scriptPath = path.join(rootDir, files.managerValidator);
  if(!fs.existsSync(scriptPath)){
    errors.push(`${files.managerValidator}: файл не найден`);
    return;
  }

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 8 * 1024 * 1024
  });

  if(result.error){
    errors.push(`Проверка чувствительных шаблонов не запустилась: ${result.error.message}`);
    return;
  }

  if(result.status !== 0){
    const details = [result.stdout?.trim(), result.stderr?.trim()].filter(Boolean).join('\n');
    errors.push(details || 'Доказательный пакет чувствительных шаблонов не прошёл проверку.');
  }
}

function runReleaseReadinessReportValidation(){
  const jsonResult = runReporter(['--json']);
  if(!jsonResult) return;
  if(jsonResult.status !== 0){
    errors.push(`Сводный отчёт --json завершился кодом ${jsonResult.status}: ${collectOutput(jsonResult)}`);
    return;
  }

  let report;
  try {
    report = JSON.parse(jsonResult.stdout || '{}');
  } catch(error) {
    errors.push(`Сводный отчёт вернул некорректный JSON — ${error.message}`);
    return;
  }

  const expectedReady = status === 'READY'
    && packageVersion === targetVersion
    && acceptancePassed
    && managerReviewPassed
    && uncheckedRelease === 0
    && uncheckedAcceptance === 0
    && uncheckedManagerReview === 0
    && changelogHasTarget;

  compareReportValue('targetVersion', report.targetVersion, targetVersion);
  compareReportValue('packageVersion', report.packageVersion, packageVersion);
  compareReportValue('publishedVersion', report.publishedVersion, packageVersion);
  compareReportValue('releaseStatus', report.releaseStatus, status);
  compareReportValue('documentedWorkflowRun', report.documentedWorkflowRun, workflowRunNumber);
  compareReportValue('ready', report.ready, expectedReady);
  compareReportSummary('release', report.checks?.release, releaseChecks, status);
  compareReportSummary('manualPrint', report.checks?.manualPrint, acceptanceChecks, acceptancePassed ? 'ПРОЙДЕНА' : 'НЕ ПРОЙДЕНА');
  compareReportSummary('managerReview', report.checks?.managerReview, managerReviewChecks, managerReviewPassed ? 'ПРОЙДЕНА' : 'НЕ ПРОЙДЕНА');
  compareReportValue('changelog.targetSectionPresent', report.checks?.changelog?.targetSectionPresent, changelogHasTarget);

  if(!Array.isArray(report.blockers)) errors.push(`${files.readinessReporter}: blockers должен быть массивом`);
  if(!Array.isArray(report.consistencyErrors)) errors.push(`${files.readinessReporter}: consistencyErrors должен быть массивом`);
  if(report.consistencyErrors?.length) errors.push(`${files.readinessReporter}: найден рассинхрон — ${report.consistencyErrors.join('; ')}`);
  if(!String(report.nextAction || '').trim()) errors.push(`${files.readinessReporter}: не указан следующий шаг`);
  if(!expectedReady && !report.blockers?.some(item => String(item).includes('issue #40'))) errors.push(`${files.readinessReporter}: DRAFT должен показывать blocker issue #40`);
  if(!expectedReady && !report.blockers?.some(item => String(item).includes('issue #51'))) errors.push(`${files.readinessReporter}: DRAFT должен показывать blocker issue #51`);

  const humanResult = runReporter([]);
  if(humanResult && humanResult.status !== 0) errors.push(`${files.readinessReporter}: обычный отчёт завершился кодом ${humanResult.status}`);
  for(const snippet of ['Релиз-кандидат', 'Зафиксированный полный CI:', 'Готовность документов:', 'Следующий шаг:']) {
    if(humanResult && !String(humanResult.stdout || '').includes(snippet)) errors.push(`${files.readinessReporter}: в обычном выводе отсутствует ${snippet}`);
  }

  const strictResult = runReporter(['--strict']);
  const expectedStrictStatus = expectedReady ? 0 : 2;
  if(strictResult && strictResult.status !== expectedStrictStatus) {
    errors.push(`${files.readinessReporter}: --strict должен завершаться кодом ${expectedStrictStatus}, получен ${strictResult.status}`);
  }
}

function runReporter(extraArgs){
  const scriptPath = path.join(rootDir, files.readinessReporter);
  if(!fs.existsSync(scriptPath)){
    errors.push(`${files.readinessReporter}: файл не найден`);
    return null;
  }
  const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 4 * 1024 * 1024
  });
  if(result.error) errors.push(`Сводный отчёт не запустился: ${result.error.message}`);
  return result;
}

function compareReportSummary(label, actual, expected, expectedStatus){
  if(!actual || typeof actual !== 'object'){
    errors.push(`${files.readinessReporter}: отсутствует checks.${label}`);
    return;
  }
  compareReportValue(`${label}.status`, actual.status, expectedStatus);
  compareReportValue(`${label}.checked`, actual.checked, expected.checked);
  compareReportValue(`${label}.unchecked`, actual.unchecked, expected.unchecked);
  compareReportValue(`${label}.total`, actual.total, expected.total);
}

function compareReportValue(label, actual, expected){
  if(actual !== expected) errors.push(`${files.readinessReporter}: ${label}=${JSON.stringify(actual)}, ожидается ${JSON.stringify(expected)}`);
}

function collectOutput(result){
  return [result?.stdout?.trim(), result?.stderr?.trim()].filter(Boolean).join('\n') || 'нет диагностического вывода';
}

function checkboxSummary(source){
  const checked = (source.match(/^- \[[xX]\]/gm) || []).length;
  const unchecked = (source.match(/^- \[ \]/gm) || []).length;
  return {checked, unchecked, total:checked + unchecked};
}

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный фрагмент — ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
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
