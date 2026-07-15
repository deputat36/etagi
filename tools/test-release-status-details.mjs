import {spawnSync} from 'node:child_process';

const errors = [];
const jsonResult = runReporter(['--json']);
let report = null;

if(jsonResult.status !== 0) {
  errors.push(`JSON-режим завершился кодом ${jsonResult.status}: ${collectOutput(jsonResult)}`);
} else {
  try {
    report = JSON.parse(jsonResult.stdout || '{}');
  } catch(error) {
    errors.push(`JSON-режим вернул некорректный JSON: ${error.message}`);
  }
}

const detailsResult = runReporter(['--details']);
if(detailsResult.status !== 0) {
  errors.push(`Режим --details завершился кодом ${detailsResult.status}: ${collectOutput(detailsResult)}`);
}

const defaultResult = runReporter([]);
if(defaultResult.status !== 0) {
  errors.push(`Обычный режим завершился кодом ${defaultResult.status}: ${collectOutput(defaultResult)}`);
}

if(report) {
  const groups = [
    ['Релизный бланк', report.checks?.release?.pendingItems],
    ['Issue #40 — ручная печатная приёмка', report.checks?.manualPrint?.pendingItems],
    ['Issue #51 — менеджерская проверка', report.checks?.managerReview?.pendingItems]
  ];
  const detailsOutput = String(detailsResult.stdout || '');

  if(!detailsOutput.includes('Незакрытые пункты:')) {
    errors.push('Режим --details не вывел раздел «Незакрытые пункты».');
  }

  for(let index = 0; index < groups.length; index += 1) {
    const [label, pendingItems] = groups[index];
    if(!Array.isArray(pendingItems)) {
      errors.push(`JSON не содержит массив pendingItems для группы «${label}».`);
      continue;
    }

    const marker = `${label} (${pendingItems.length}):`;
    const start = detailsOutput.indexOf(marker);
    if(start < 0) {
      errors.push(`В подробном выводе отсутствует группа «${marker}».`);
      continue;
    }

    const nextLabel = groups[index + 1]?.[0];
    const nextMarker = nextLabel ? `\n${nextLabel} (` : '\nСледующий шаг:';
    const end = detailsOutput.indexOf(nextMarker, start + marker.length);
    const section = detailsOutput.slice(start + marker.length, end >= 0 ? end : undefined);
    const numberedLines = section.split(/\r?\n/).filter(line => /^\d+\.\s/.test(line.trim()));

    if(numberedLines.length !== pendingItems.length) {
      errors.push(`Группа «${label}» содержит ${numberedLines.length} строк вместо ${pendingItems.length}.`);
    }

    pendingItems.forEach((item, itemIndex) => {
      const expectedLine = `${itemIndex + 1}. ${item}`;
      if(!section.includes(expectedLine)) {
        errors.push(`Группа «${label}» не содержит строку: ${expectedLine}`);
      }
    });
  }

  const totalPending = groups.reduce((sum, [, items]) => sum + (Array.isArray(items) ? items.length : 0), 0);
  const defaultOutput = String(defaultResult.stdout || '');
  if(totalPending > 0 && !defaultOutput.includes('Полный перечень: npm run release:status -- --details')) {
    errors.push('Обычный вывод не подсказывает команду --details при наличии незакрытых пунктов.');
  }
  if(defaultOutput.includes('Незакрытые пункты:')) {
    errors.push('Обычный вывод не должен разворачивать полный перечень без флага --details.');
  }

  const strictResult = runReporter(['--details', '--strict']);
  const expectedStrictStatus = report.ready ? 0 : 2;
  if(strictResult.status !== expectedStrictStatus) {
    errors.push(`Комбинация --details --strict должна завершаться кодом ${expectedStrictStatus}, получен ${strictResult.status}.`);
  }
  if(!String(strictResult.stdout || '').includes('Незакрытые пункты:')) {
    errors.push('Комбинация --details --strict должна сохранять подробный вывод.');
  }
}

if(errors.length) {
  console.error('\nОшибки подробного статуса готовности релиза:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Подробный статус релиза проверен: все pendingItems совпадают с пронумерованными группами, компактный и strict-режимы работают согласованно.');

function runReporter(extraArgs) {
  return spawnSync(process.execPath, ['tools/report-release-readiness.mjs', ...extraArgs], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 8 * 1024 * 1024
  });
}

function collectOutput(result) {
  return [result?.stdout?.trim(), result?.stderr?.trim()].filter(Boolean).join('\n') || 'нет диагностического вывода';
}
