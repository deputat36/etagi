import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const errors = [];
const files = {
  reporter: 'tools/report-release-readiness.mjs',
  package: 'package.json',
  release: 'docs/release-3.86.0-candidate.md',
  acceptance: 'docs/manual-print-acceptance-3.86.0.md',
  managerReview: 'docs/manager-sensitive-template-review-3.86.0.md',
  changelog: 'docs/changelog.md'
};

const reporterSource = readRequired(files.reporter);
const packageSource = readRequired(files.package);
const releaseSource = readRequired(files.release);
const acceptanceSource = readRequired(files.acceptance);
const managerReviewSource = readRequired(files.managerReview);
const changelogSource = readRequired(files.changelog);
const pkg = readJson(packageSource, files.package);

requireSnippets(files.reporter, reporterSource, [
  "args.has('--json')",
  "args.has('--strict')",
  'documentedWorkflowRun',
  'checkboxSummary',
  'consistencyErrors',
  'Следующий шаг:',
  'process.exitCode = 2'
]);
forbidSnippets(files.reporter, reporterSource, [
  'fetch(',
  'XMLHttpRequest',
  'node:http',
  'node:https'
]);

if(String(pkg?.scripts?.['release:status'] || '').trim() !== 'node tools/report-release-readiness.mjs') {
  errors.push('package.json: release:status должен запускать node tools/report-release-readiness.mjs');
}
if(String(pkg?.scripts?.['validate:release-status-report'] || '').trim() !== 'node tools/validate-release-status-report.mjs') {
  errors.push('package.json: validate:release-status-report должен запускать node tools/validate-release-status-report.mjs');
}

const jsonResult = runReporter(['--json']);
let report = null;
if(jsonResult.status !== 0) {
  errors.push(`release:status --json должен завершаться успешно для согласованного DRAFT, получен код ${jsonResult.status}`);
} else {
  try {
    report = JSON.parse(jsonResult.stdout || '{}');
  } catch(error) {
    errors.push(`release:status --json вернул некорректный JSON — ${error.message}`);
  }
}

if(report) validateReport(report);

const humanResult = runReporter([]);
if(humanResult.status !== 0) errors.push(`release:status должен завершаться успешно, получен код ${humanResult.status}`);
for(const snippet of ['Релиз-кандидат', 'Зафиксированный полный CI:', 'Готовность документов:', 'Следующий шаг:']) {
  if(!String(humanResult.stdout || '').includes(snippet)) errors.push(`release:status: в человекочитаемом выводе отсутствует ${snippet}`);
}

if(report) {
  const strictResult = runReporter(['--strict']);
  const expectedStrictCode = report.ready ? 0 : 2;
  if(strictResult.status !== expectedStrictCode) {
    errors.push(`release:status --strict должен завершаться кодом ${expectedStrictCode}, получен ${strictResult.status}`);
  }
}

if(errors.length) {
  console.error('\nОшибки сводного статуса релиз-кандидата:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Сводный статус релиз-кандидата корректно отражает документы, блокеры и strict-режим.');

function validateReport(report) {
  const packageVersion = String(pkg?.version || '').trim();
  const targetVersion = releaseSource.match(/^Целевая версия:\s*([0-9.]+)\s*$/m)?.[1] || '';
  const publishedVersion = releaseSource.match(/^Текущая опубликованная версия:\s*([0-9.]+)\s*$/m)?.[1] || '';
  const releaseStatus = releaseSource.match(/^Статус:\s*(DRAFT|READY)\s*$/m)?.[1] || '';
  const workflowRun = Number(releaseSource.match(/Последний полный контроль:\s*GitHub Actions workflow run #(\d+)/)?.[1] || 0);
  const acceptanceStatus = acceptanceSource.match(/^Статус:\s*(НЕ ПРОЙДЕНА|ПРОЙДЕНА)\s*$/m)?.[1] || '';
  const managerReviewStatus = managerReviewSource.match(/^Статус:\s*(НЕ ПРОЙДЕНА|ПРОЙДЕНА)\s*$/m)?.[1] || '';
  const releaseChecks = checkboxSummary(releaseSource);
  const acceptanceChecks = checkboxSummary(acceptanceSource);
  const managerReviewChecks = checkboxSummary(managerReviewSource);
  const changelogHasTarget = targetVersion
    ? new RegExp(`^## ${escapeRegExp(targetVersion)}\\s*$`, 'm').test(changelogSource)
    : false;
  const expectedReady = releaseStatus === 'READY'
    && packageVersion === targetVersion
    && acceptanceStatus === 'ПРОЙДЕНА'
    && managerReviewStatus === 'ПРОЙДЕНА'
    && releaseChecks.unchecked === 0
    && acceptanceChecks.unchecked === 0
    && managerReviewChecks.unchecked === 0
    && changelogHasTarget;

  compare('targetVersion', report.targetVersion, targetVersion);
  compare('packageVersion', report.packageVersion, packageVersion);
  compare('publishedVersion', report.publishedVersion, publishedVersion);
  compare('releaseStatus', report.releaseStatus, releaseStatus);
  compare('documentedWorkflowRun', report.documentedWorkflowRun, workflowRun);
  compare('ready', report.ready, expectedReady);
  compareSummary('release', report.checks?.release, releaseChecks, releaseStatus);
  compareSummary('manualPrint', report.checks?.manualPrint, acceptanceChecks, acceptanceStatus);
  compareSummary('managerReview', report.checks?.managerReview, managerReviewChecks, managerReviewStatus);
  compare('changelog.targetSectionPresent', report.checks?.changelog?.targetSectionPresent, changelogHasTarget);

  if(!Array.isArray(report.blockers)) errors.push('release:status --json: blockers должен быть массивом');
  if(!Array.isArray(report.consistencyErrors)) errors.push('release:status --json: consistencyErrors должен быть массивом');
  if(report.consistencyErrors?.length) errors.push(`release:status --json: согласованный репозиторий не должен иметь ошибок — ${report.consistencyErrors.join('; ')}`);
  if(!String(report.nextAction || '').trim()) errors.push('release:status --json: отсутствует следующий шаг');
  if(!expectedReady && !report.blockers?.some(item => String(item).includes('issue #40'))) errors.push('release:status --json: DRAFT должен явно показывать blocker issue #40');
  if(!expectedReady && !report.blockers?.some(item => String(item).includes('issue #51'))) errors.push('release:status --json: DRAFT должен явно показывать blocker issue #51');
}

function compareSummary(label, actual, expected, status) {
  if(!actual || typeof actual !== 'object') {
    errors.push(`release:status --json: отсутствует checks.${label}`);
    return;
  }
  compare(`${label}.status`, actual.status, status);
  compare(`${label}.checked`, actual.checked, expected.checked);
  compare(`${label}.unchecked`, actual.unchecked, expected.unchecked);
  compare(`${label}.total`, actual.total, expected.total);
}

function compare(label, actual, expected) {
  if(actual !== expected) errors.push(`release:status --json: ${label}=${JSON.stringify(actual)}, ожидается ${JSON.stringify(expected)}`);
}

function runReporter(extraArgs) {
  const result = spawnSync(process.execPath, [files.reporter, ...extraArgs], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024
  });
  if(result.error) errors.push(`Не удалось запустить ${files.reporter}: ${result.error.message}`);
  return result;
}

function checkboxSummary(source) {
  const checked = (source.match(/^- \[[xX]\]/gm) || []).length;
  const unchecked = (source.match(/^- \[ \]/gm) || []).length;
  return {checked, unchecked, total: checked + unchecked};
}

function requireSnippets(file, source, snippets) {
  for(const snippet of snippets) if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
}

function forbidSnippets(file, source, snippets) {
  for(const snippet of snippets) if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
}

function readJson(source, file) {
  if(!source) return null;
  try {
    return JSON.parse(source);
  } catch(error) {
    errors.push(`${file}: JSON не читается — ${error.message}`);
    return null;
  }
}

function readRequired(file) {
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)) {
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
