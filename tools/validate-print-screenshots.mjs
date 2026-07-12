import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  harness: 'tools/print-screenshot.html',
  runner: 'tools/run-print-screenshots.mjs',
  collector: 'tools/collect-print-screenshots.mjs',
  workflow: '.github/workflows/validate.yml',
  package: 'package.json',
  guide: 'docs/print-screenshot-regression.md',
  maintenance: 'docs/maintenance-guide.md'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.harness, sources.harness, [
  'id="captureStatus"',
  'data-status="pending"',
  "scenario === 'one-no-photo'",
  "scenario === 'two-big-phone'",
  "scenario === 'one-showcase'",
  "scenario === 'two-photo'",
  "scenario === 'four-contacts'",
  'assertSheet(doc, scenario)',
  "flyer.classList.contains('overflow')",
  'контакты выходят за границы макета',
  "status.dataset.status = 'passed'",
  'prepareCaptureView(doc)'
]);

forbidSnippets(files.harness, sources.harness, [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'localStorage.setItem'
]);

requireSnippets(files.runner, sources.runner, [
  "path.join(rootDir, 'artifacts', 'print-screenshots')",
  "path.join(rootDir, 'print-screenshots-failure.log')",
  "{id:'one-no-photo'",
  "{id:'two-big-phone'",
  "{id:'one-showcase'",
  "{id:'two-photo'",
  "{id:'four-contacts'",
  'PRINT_SCREENSHOT_SCENARIO',
  "process.argv.indexOf('--scenario')",
  'selectedScenarios',
  "fs.writeFileSync(path.join(outputDir, `${scenario.id}.json`) ",
  "'--window-size=794,1123'",
  "'--dump-dom'",
  '`--screenshot=${screenshotPath}`',
  "dom.includes('data-status=\"passed\"')",
  'sizeBytes < 10000',
  'fs.writeFileSync(failureLogPath',
  'server.keepAliveTimeout = 1',
  "'Connection':'close'"
]);

requireSnippets(files.collector, sources.collector, [
  "'one-no-photo'",
  "'two-big-phone'",
  "'one-showcase'",
  "'two-photo'",
  "'four-contacts'",
  'Не найден ${id}.png после matrix job.',
  'Не найден ${id}.json после matrix job.',
  "path.join(outputDir, 'manifest.json')",
  'Print screenshot artifacts collected'
]);

requireSnippets(files.workflow, sources.workflow, [
  'print-screenshot:',
  'collect-print-screenshots:',
  'needs: browser-smoke',
  'needs: print-screenshot',
  'fail-fast: false',
  'matrix:',
  'scenario:',
  'PRINT_SCREENSHOT_SCENARIO: ${{ matrix.scenario }}',
  'run: npm run screenshots:print',
  'name: print-screenshot-${{ matrix.scenario }}',
  'name: print-screenshot-failure-${{ matrix.scenario }}',
  'uses: actions/download-artifact@v4',
  'pattern: print-screenshot-*',
  'merge-multiple: true',
  'run: npm run screenshots:manifest',
  'name: print-screenshots',
  'path: artifacts/print-screenshots/',
  'retention-days: 7'
]);

const pkg = readPackage(sources.package);
if(pkg){
  requireScript('screenshots:print', 'node tools/run-print-screenshots.mjs', pkg.scripts || {});
  requireScript('screenshots:manifest', 'node tools/collect-print-screenshots.mjs', pkg.scripts || {});
  requireScript('validate:print-screenshots', 'node tools/validate-print-screenshots.mjs', pkg.scripts || {});
}

requireSnippets(files.guide, sources.guide, [
  '# Screenshot-регрессия печатных листов А4',
  'npm run screenshots:print',
  '`one-no-photo.png`',
  '`two-big-phone.png`',
  '`one-showcase.png`',
  '`two-photo.png`',
  '`four-contacts.png`',
  'print-screenshots-failure.log',
  'синтетические данные'
]);

requireSnippets(files.maintenance, sources.maintenance, [
  'npm run validate:print-screenshots',
  'npm run screenshots:print',
  'print-screenshots',
  'изолирован'
]);

if(errors.length){
  console.error('\nОшибки screenshot-регрессии печати:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка screenshot-регрессии печати пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}

function requireScript(name, expected, scripts){
  const actual = String(scripts[name] || '').trim();
  if(actual !== expected) errors.push(`package.json: ${name} должен быть ${expected}`);
}

function readPackage(source){
  try{
    return JSON.parse(source || '{}');
  } catch(error){
    errors.push('package.json: JSON не читается');
    return null;
  }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
