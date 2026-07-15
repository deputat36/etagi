import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const reporterPath = path.join(rootDir, 'tools', 'report-release-readiness.mjs');
const errors = [];
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'etagi-release-readiness-'));

try {
  if(!fs.existsSync(reporterPath)) {
    errors.push('Не найден tools/report-release-readiness.mjs.');
  } else {
    verifyDraftState();
    verifyReadyBeforePublicationState();
    verifyInconsistentState();
  }
} finally {
  fs.rmSync(fixtureRoot, {recursive:true, force:true});
}

if(errors.length) {
  console.error('\nОшибки переходных состояний release readiness:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Переходные состояния release readiness пройдены: DRAFT=2, READY до публикации=0, рассинхронизация=1.');

function verifyDraftState() {
  const cwd = createFixture('draft', {
    packageVersion: '3.85.0',
    publishedVersion: '3.85.0',
    releaseStatus: 'DRAFT',
    acceptanceStatus: 'НЕ ПРОЙДЕНА',
    managerStatus: 'НЕ ПРОЙДЕНА',
    checked: false,
    changelogTarget: false
  });
  const result = runJson(cwd);
  const strict = runReporter(cwd, ['--strict']);

  expectStatus('DRAFT JSON', result.process, 0);
  expectStatus('DRAFT strict', strict, 2);
  expectValue('DRAFT ready', result.report?.ready, false);
  expectValue('DRAFT packageVersion', result.report?.packageVersion, '3.85.0');
  expectValue('DRAFT publishedVersion', result.report?.publishedVersion, '3.85.0');
  expectBlocker('DRAFT', result.report, 'issue #40');
  expectBlocker('DRAFT', result.report, 'issue #51');
}

function verifyReadyBeforePublicationState() {
  const cwd = createFixture('ready-before-publication', {
    packageVersion: '3.86.0',
    publishedVersion: '3.85.0',
    releaseStatus: 'READY',
    acceptanceStatus: 'ПРОЙДЕНА',
    managerStatus: 'ПРОЙДЕНА',
    checked: true,
    changelogTarget: true
  });
  const result = runJson(cwd);
  const strict = runReporter(cwd, ['--strict']);

  expectStatus('READY JSON', result.process, 0);
  expectStatus('READY strict', strict, 0);
  expectValue('READY ready', result.report?.ready, true);
  expectValue('READY packageVersion', result.report?.packageVersion, '3.86.0');
  expectValue('READY publishedVersion', result.report?.publishedVersion, '3.85.0');
  expectValue('READY blockers', result.report?.blockers?.length, 0);
  if(!String(result.report?.nextAction || '').includes('GitHub Actions')) {
    errors.push('READY должен направлять к финальному GitHub Actions workflow.');
  }
}

function verifyInconsistentState() {
  const cwd = createFixture('inconsistent-draft', {
    packageVersion: '3.86.0',
    publishedVersion: '3.85.0',
    releaseStatus: 'DRAFT',
    acceptanceStatus: 'НЕ ПРОЙДЕНА',
    managerStatus: 'НЕ ПРОЙДЕНА',
    checked: false,
    changelogTarget: false
  });
  const result = runJson(cwd);
  const strict = runReporter(cwd, ['--strict']);

  expectStatus('Рассинхронизация JSON', result.process, 1);
  expectStatus('Рассинхронизация strict', strict, 1);
  expectValue('Рассинхронизация ready', result.report?.ready, false);
  if(!result.report?.consistencyErrors?.some(item => String(item).includes('не совпадает с опубликованной'))) {
    errors.push('Рассинхронизация DRAFT должна объяснять отличие package.version от опубликованной версии.');
  }
}

function createFixture(name, state) {
  const cwd = path.join(fixtureRoot, name);
  const docsDir = path.join(cwd, 'docs');
  fs.mkdirSync(docsDir, {recursive:true});

  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({
    name: 'release-readiness-fixture',
    version: state.packageVersion,
    private: true,
    type: 'module'
  }, null, 2));

  const marker = state.checked ? 'x' : ' ';
  fs.writeFileSync(path.join(docsDir, 'release-3.86.0-candidate.md'), [
    '# Релиз-кандидат 3.86.0',
    '',
    `Статус: ${state.releaseStatus}`,
    '',
    'Целевая версия: 3.86.0',
    '',
    `Текущая опубликованная версия: ${state.publishedVersion}`,
    '',
    'Последний полный контроль: GitHub Actions workflow run #1517.',
    '',
    `- [${marker}] Ручная печатная приёмка завершена.`,
    `- [${marker}] Менеджерская проверка завершена.`
  ].join('\n'));

  fs.writeFileSync(path.join(docsDir, 'manual-print-acceptance-3.86.0.md'), [
    '# Ручная печатная приёмка 3.86.0',
    '',
    `Статус: ${state.acceptanceStatus}`,
    '',
    `- [${marker}] Проверен рабочий ПК.`,
    `- [${marker}] Проверен офисный принтер.`
  ].join('\n'));

  fs.writeFileSync(path.join(docsDir, 'manager-sensitive-template-review-3.86.0.md'), [
    '# Менеджерская проверка чувствительных шаблонов 3.86.0',
    '',
    `Статус: ${state.managerStatus}`,
    '',
    `- [${marker}] Решения по шаблонам зафиксированы.`,
    `- [${marker}] Изменения проверены.`
  ].join('\n'));

  const changelog = state.changelogTarget
    ? '# История изменений\n\n## 3.86.0\n\n- Fixture готового релиза.\n'
    : '# История изменений\n\n## 3.85.0\n\n- Текущая опубликованная версия.\n';
  fs.writeFileSync(path.join(docsDir, 'changelog.md'), changelog);

  return cwd;
}

function runJson(cwd) {
  const processResult = runReporter(cwd, ['--json']);
  let report = null;
  try {
    report = JSON.parse(processResult.stdout || '{}');
  } catch(error) {
    errors.push(`${path.basename(cwd)}: reporter вернул некорректный JSON — ${error.message}`);
  }
  return {process:processResult, report};
}

function runReporter(cwd, args) {
  const result = spawnSync(process.execPath, [reporterPath, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 2 * 1024 * 1024
  });
  if(result.error) errors.push(`${path.basename(cwd)}: reporter не запустился — ${result.error.message}`);
  return result;
}

function expectStatus(label, result, expected) {
  if(result?.status !== expected) {
    const output = [result?.stdout?.trim(), result?.stderr?.trim()].filter(Boolean).join('\n');
    errors.push(`${label}: ожидается exit ${expected}, получен ${result?.status}; ${output || 'нет вывода'}`);
  }
}

function expectValue(label, actual, expected) {
  if(actual !== expected) errors.push(`${label}: ожидается ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`);
}

function expectBlocker(label, report, fragment) {
  if(!report?.blockers?.some(item => String(item).includes(fragment))) {
    errors.push(`${label}: отсутствует blocker ${fragment}.`);
  }
}
