import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const args = new Set(process.argv.slice(2));
const jsonMode = args.has('--json');
const strictMode = args.has('--strict');
const detailsMode = args.has('--details');
const files = {
  package: 'package.json',
  release: 'docs/release-3.86.0-candidate.md',
  acceptance: 'docs/manual-print-acceptance-3.86.0.md',
  managerReview: 'docs/manager-sensitive-template-review-3.86.0.md',
  changelog: 'docs/changelog.md'
};
const consistencyErrors = [];

const packageSource = readRequired(files.package);
const releaseSource = readRequired(files.release);
const acceptanceSource = readRequired(files.acceptance);
const managerReviewSource = readRequired(files.managerReview);
const changelogSource = readRequired(files.changelog);
const pkg = readJson(packageSource, files.package);

const packageVersion = String(pkg?.version || '').trim();
const targetVersion = matchValue(releaseSource, /^Целевая версия:\s*([0-9.]+)\s*$/m, files.release, 'целевая версия');
const publishedVersion = matchValue(releaseSource, /^Текущая опубликованная версия:\s*([0-9.]+)\s*$/m, files.release, 'текущая опубликованная версия');
const releaseStatus = matchValue(releaseSource, /^Статус:\s*(DRAFT|READY)\s*$/m, files.release, 'статус');
const documentedWorkflowRun = Number(matchValue(
  releaseSource,
  /Последний полный контроль:\s*GitHub Actions workflow run #(\d+)/,
  files.release,
  'номер полного workflow run'
) || 0);
const acceptanceStatus = matchValue(acceptanceSource, /^Статус:\s*(НЕ ПРОЙДЕНА|ПРОЙДЕНА)\s*$/m, files.acceptance, 'статус');
const managerReviewStatus = matchValue(managerReviewSource, /^Статус:\s*(НЕ ПРОЙДЕНА|ПРОЙДЕНА)\s*$/m, files.managerReview, 'статус');
const releaseChecks = checkboxSummary(releaseSource);
const acceptanceChecks = checkboxSummary(acceptanceSource);
const managerReviewChecks = checkboxSummary(managerReviewSource);
const releasePendingItems = uncheckedItems(releaseSource);
const acceptancePendingItems = uncheckedItems(acceptanceSource);
const managerReviewPendingItems = uncheckedItems(managerReviewSource);
const changelogHasTarget = targetVersion
  ? new RegExp(`^## ${escapeRegExp(targetVersion)}\\s*$`, 'm').test(changelogSource)
  : false;

checkPendingItems(files.release, releaseChecks, releasePendingItems);
checkPendingItems(files.acceptance, acceptanceChecks, acceptancePendingItems);
checkPendingItems(files.managerReview, managerReviewChecks, managerReviewPendingItems);

if(packageVersion && publishedVersion && packageVersion !== publishedVersion && releaseStatus === 'DRAFT') {
  consistencyErrors.push(`${files.package}: версия ${packageVersion} не совпадает с опубликованной ${publishedVersion} при статусе DRAFT`);
}
if(!Number.isInteger(documentedWorkflowRun) || documentedWorkflowRun <= 0) {
  consistencyErrors.push(`${files.release}: номер полного workflow run должен быть положительным целым числом`);
}

if(releaseStatus === 'DRAFT') {
  if(packageVersion === targetVersion) consistencyErrors.push(`${files.package}: целевую версию ${targetVersion} нельзя устанавливать при статусе DRAFT`);
  if(changelogHasTarget) consistencyErrors.push(`${files.changelog}: финальный раздел ${targetVersion} нельзя добавлять при статусе DRAFT`);
  if(acceptanceStatus !== 'НЕ ПРОЙДЕНА') consistencyErrors.push(`${files.acceptance}: при статусе DRAFT ожидается НЕ ПРОЙДЕНА`);
  if(managerReviewStatus !== 'НЕ ПРОЙДЕНА') consistencyErrors.push(`${files.managerReview}: при статусе DRAFT ожидается НЕ ПРОЙДЕНА`);
  if(releaseChecks.unchecked === 0) consistencyErrors.push(`${files.release}: статус DRAFT должен иметь незакрытые блокирующие пункты`);
}

if(releaseStatus === 'READY') {
  if(packageVersion !== targetVersion) consistencyErrors.push(`${files.package}: при статусе READY ожидается версия ${targetVersion}`);
  if(!changelogHasTarget) consistencyErrors.push(`${files.changelog}: при статусе READY требуется раздел ${targetVersion}`);
  if(acceptanceStatus !== 'ПРОЙДЕНА') consistencyErrors.push(`${files.acceptance}: при статусе READY ожидается ПРОЙДЕНА`);
  if(managerReviewStatus !== 'ПРОЙДЕНА') consistencyErrors.push(`${files.managerReview}: при статусе READY ожидается ПРОЙДЕНА`);
  if(releaseChecks.unchecked > 0 || acceptanceChecks.unchecked > 0 || managerReviewChecks.unchecked > 0) {
    consistencyErrors.push('При статусе READY все блокирующие, печатные и менеджерские пункты должны быть закрыты');
  }
}

const ready = consistencyErrors.length === 0
  && releaseStatus === 'READY'
  && packageVersion === targetVersion
  && acceptanceStatus === 'ПРОЙДЕНА'
  && managerReviewStatus === 'ПРОЙДЕНА'
  && releaseChecks.unchecked === 0
  && acceptanceChecks.unchecked === 0
  && managerReviewChecks.unchecked === 0
  && changelogHasTarget;

const blockers = [];
if(releaseStatus !== 'READY') blockers.push(`релиз-кандидат имеет статус ${releaseStatus || 'не определён'}`);
if(releaseChecks.unchecked > 0) blockers.push(`в релизном бланке осталось ${releaseChecks.unchecked} пунктов`);
if(acceptanceStatus !== 'ПРОЙДЕНА' || acceptanceChecks.unchecked > 0) {
  blockers.push(`issue #40: ручная печатная приёмка — осталось ${acceptanceChecks.unchecked} пунктов`);
}
if(managerReviewStatus !== 'ПРОЙДЕНА' || managerReviewChecks.unchecked > 0) {
  blockers.push(`issue #51: менеджерская проверка — осталось ${managerReviewChecks.unchecked} пунктов`);
}
if(packageVersion !== targetVersion) blockers.push(`package.json остаётся на версии ${packageVersion || 'не определена'}`);
if(!changelogHasTarget) blockers.push(`в changelog нет финального раздела ${targetVersion || 'целевой версии'}`);

const nextAction = determineNextAction({
  consistencyErrors,
  releaseStatus,
  acceptanceStatus,
  managerReviewStatus,
  acceptanceChecks,
  managerReviewChecks,
  ready
});

const report = {
  targetVersion,
  packageVersion,
  publishedVersion,
  releaseStatus,
  documentedWorkflowRun,
  ready,
  checks: {
    release: {status: releaseStatus, ...releaseChecks, pendingItems: releasePendingItems},
    manualPrint: {status: acceptanceStatus, issue: 40, ...acceptanceChecks, pendingItems: acceptancePendingItems},
    managerReview: {status: managerReviewStatus, issue: 51, ...managerReviewChecks, pendingItems: managerReviewPendingItems},
    changelog: {targetSectionPresent: changelogHasTarget}
  },
  blockers,
  consistencyErrors,
  nextAction
};

if(jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printHumanReport(report, detailsMode);
}

if(consistencyErrors.length > 0) process.exitCode = 1;
else if(strictMode && !ready) process.exitCode = 2;

function printHumanReport(value, showDetails) {
  console.log(`Релиз-кандидат ${value.targetVersion || 'не определён'}: ${value.releaseStatus || 'СТАТУС НЕ НАЙДЕН'}`);
  console.log(`Текущая версия: ${value.packageVersion || 'не определена'}`);
  console.log(`Зафиксированный полный CI: run #${value.documentedWorkflowRun || 'не указан'}`);
  console.log('');
  console.log('Готовность документов:');
  printCheckLine('Релизный бланк', value.checks.release);
  printCheckLine('Issue #40 / печать', value.checks.manualPrint);
  printCheckLine('Issue #51 / шаблоны', value.checks.managerReview);
  console.log(`- Changelog ${value.targetVersion}: ${value.checks.changelog.targetSectionPresent ? 'готов' : 'не добавлен'}`);

  if(value.consistencyErrors.length) {
    console.log('\nОшибки согласованности:');
    value.consistencyErrors.forEach(item => console.log(`- ${item}`));
  } else if(value.blockers.length) {
    console.log('\nБлокеры:');
    value.blockers.forEach(item => console.log(`- ${item}`));
  } else {
    console.log('\nБлокирующих условий не найдено.');
  }

  if(showDetails) {
    console.log('\nНезакрытые пункты:');
    printPendingGroup('Релизный бланк', value.checks.release.pendingItems);
    printPendingGroup('Issue #40 — ручная печатная приёмка', value.checks.manualPrint.pendingItems);
    printPendingGroup('Issue #51 — менеджерская проверка', value.checks.managerReview.pendingItems);
  } else if(value.checks.release.unchecked + value.checks.manualPrint.unchecked + value.checks.managerReview.unchecked > 0) {
    console.log('\nПолный перечень: npm run release:status -- --details');
  }

  console.log(`\nСледующий шаг: ${value.nextAction}`);
}

function printCheckLine(label, value) {
  console.log(`- ${label}: ${value.checked}/${value.total}, осталось ${value.unchecked}; статус ${value.status || 'не указан'}`);
}

function printPendingGroup(label, items) {
  console.log(`\n${label} (${items.length}):`);
  if(!items.length) {
    console.log('- незакрытых пунктов нет');
    return;
  }
  items.forEach((item, index) => console.log(`${index + 1}. ${item}`));
}

function determineNextAction(value) {
  if(value.consistencyErrors.length) return 'исправить рассинхронизацию релизных документов и повторить npm run validate';
  if(value.ready) return 'повторить полный GitHub Actions workflow и после зелёного результата публиковать 3.86.0';
  if(value.acceptanceStatus !== 'ПРОЙДЕНА' && value.managerReviewStatus !== 'ПРОЙДЕНА') {
    return 'пройти issue #40 на рабочем ПК, телефоне и принтере, затем принять решения по issue #51';
  }
  if(value.acceptanceStatus !== 'ПРОЙДЕНА' || value.acceptanceChecks.unchecked > 0) {
    return 'завершить ручную viewport- и печатную приёмку issue #40';
  }
  if(value.managerReviewStatus !== 'ПРОЙДЕНА' || value.managerReviewChecks.unchecked > 0) {
    return 'завершить менеджерскую проверку 12 чувствительных шаблонов issue #51';
  }
  if(value.releaseStatus !== 'READY') return 'перевести согласованный релизный пакет в READY по инструкции release candidate';
  return 'выполнить полный CI перед публикацией';
}

function checkboxSummary(source) {
  const checked = (source.match(/^- \[[xX]\]/gm) || []).length;
  const unchecked = (source.match(/^- \[ \]/gm) || []).length;
  return {checked, unchecked, total: checked + unchecked};
}

function uncheckedItems(source) {
  return String(source || '')
    .split(/\r?\n/)
    .map(line => line.match(/^- \[ \]\s+(.+?)\s*$/)?.[1] || '')
    .filter(Boolean);
}

function checkPendingItems(file, summary, items) {
  if(summary.unchecked !== items.length) {
    consistencyErrors.push(`${file}: число текстов незакрытых пунктов ${items.length} не совпадает со счётчиком ${summary.unchecked}`);
  }
}

function matchValue(source, pattern, file, label) {
  const value = source.match(pattern)?.[1] || '';
  if(!value) consistencyErrors.push(`${file}: не найдено поле «${label}»`);
  return value;
}

function readJson(source, file) {
  if(!source) return null;
  try {
    return JSON.parse(source);
  } catch(error) {
    consistencyErrors.push(`${file}: JSON не читается — ${error.message}`);
    return null;
  }
}

function readRequired(file) {
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)) {
    consistencyErrors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
