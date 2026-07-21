import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { attachCdpPipeErrorHandlers } from './cdp-pipe-error-guard.mjs';

const rootDir = process.cwd();
const errors = [];
const files = {
  harness: 'tools/print-screenshot.html',
  runner: 'tools/run-print-screenshots.mjs',
  browserRunner: 'tools/run-browser-smoke.mjs',
  pipeGuard: 'tools/cdp-pipe-error-guard.mjs',
  fakeChrome: 'tools/fake-chrome-cdp-failure.mjs',
  faultTest: 'tools/test-cdp-failure-artifact.mjs',
  collector: 'tools/collect-print-screenshots.mjs',
  matrixValidator: 'tools/validate-print-matrix.mjs',
  tearStyles: 'assets/css/tear-offs.css',
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
  "scenario === 'three-tearoffs'",
  "scenario === 'one-showcase'",
  "scenario === 'two-photo'",
  "scenario === 'four-contacts'",
  "scenario === 'six-economy'",
  'prepareThreeTearoffs(doc)',
  'prepareSixEconomy(win, doc)',
  "click(doc, '[data-count=\"3\"]')",
  "click(doc, '[data-count=\"6\"]')",
  'телефон в формате 3 на А4 недостаточно крупный',
  'телефон в формате 6 на А4 недостаточно читаемый',
  'заголовок в формате 6 на А4 недостаточно читаемый',
  "'three-tearoffs':3",
  "'six-economy':6",
  "if(currentScenario === 'three-tearoffs') assertTearOffs(flyers);",
  "if(currentScenario === 'six-economy') assertSixEconomy(flyers);",
  'function assertTearOffs(flyers)',
  'function assertSixEconomy(flyers)',
  'отрывные полосы выходят за границы макета',
  'ожидалось 8 отрывных полос',
  'отрывная полоса потеряла телефон',
  'экономный макет 6 на А4 содержит отрывные полосы',
  'макет 6 на А4 потерял телефон',
  'макет 6 на А4 потерял имя специалиста',
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
  "{id:'three-tearoffs'",
  "{id:'one-showcase'",
  "{id:'two-photo'",
  "{id:'four-contacts'",
  "{id:'six-economy'",
  'PRINT_SCREENSHOT_SCENARIO',
  "process.argv.indexOf('--scenario')",
  'selectedScenarios',
  "fs.writeFileSync(path.join(outputDir, `${scenario.id}.json`)",
  "captureMethod: 'cdp-pipe'",
  "'--window-size=794,1123'",
  "'--remote-debugging-pipe'",
  "cdp.send('Runtime.evaluate'",
  "cdp.send('Page.captureScreenshot'",
  'waitForCaptureStatus',
  'createCdpPipeClient',
  "import { attachCdpPipeErrorHandlers } from './cdp-pipe-error-guard.mjs'",
  'attachCdpPipeErrorHandlers(input, output, failAll)',
  "input.write(`${JSON.stringify(payload)}\\0`)",
  'sizeBytes < 10000',
  'fs.writeFileSync(failureLogPath',
  'server.keepAliveTimeout = 1',
  "'Connection':'close'"
]);

requireSnippets(files.browserRunner, sources.browserRunner, [
  "import { attachCdpPipeErrorHandlers } from './cdp-pipe-error-guard.mjs'",
  'attachCdpPipeErrorHandlers(input, output, failAll)'
]);

requireSnippets(files.pipeGuard, sources.pipeGuard, [
  'export function attachCdpPipeErrorHandlers',
  "input.on('error', error => {",
  "output.on('error', error => {",
  "toCdpPipeError('write', error)",
  "toCdpPipeError('read', error)",
  'wrapped.code = code',
  'wrapped.direction = direction'
]);

requireSnippets(files.fakeChrome, sources.fakeChrome, [
  '#!/usr/bin/env node',
  "args.includes('--version')",
  'Fake Chrome CDP failure injector 1.0',
  'fault injection: fake Chrome exits before the CDP response',
  'process.exit(86)'
]);

requireSnippets(files.faultTest, sources.faultTest, [
  "path.join(rootDir, 'tools', 'fake-chrome-cdp-failure.mjs')",
  "path.join(rootDir, 'print-screenshots-failure.log')",
  "path.join(rootDir, 'artifacts', 'print-screenshots', 'one-showcase.png')",
  "spawnSync(process.execPath, ['tools/run-print-screenshots.mjs', '--scenario', 'one-showcase']",
  'CHROME_BIN: fakeChromePath',
  'result.status === 0',
  "failureLog.includes('попытка 2')",
  "failureLog.includes('fault injection')",
  '/(code=86|EPIPE|ECONNRESET)/.test(failureLog)',
  'Fault-injection проверка пройдена'
]);

requireSnippets(files.matrixValidator, sources.matrixValidator, [
  "'./validate-print-screenshots.mjs'",
  "'./validate-dense-print-policy.mjs'",
  'await import(new URL(check, import.meta.url))',
  'Проверка печатной матрицы и плотных форматов пройдена.'
]);

validatePipeErrorGuard();

forbidSnippets(files.runner, sources.runner, [
  "'--virtual-time-budget=",
  "'--dump-dom'",
  '`--screenshot=${screenshotPath}`'
]);

requireSnippets(files.collector, sources.collector, [
  "'one-no-photo'",
  "'two-big-phone'",
  "'three-tearoffs'",
  "'one-showcase'",
  "'two-photo'",
  "'four-contacts'",
  "'six-economy'",
  'Не найден ${id}.png после matrix job.',
  'Не найден ${id}.json после matrix job.',
  "path.join(outputDir, 'manifest.json')",
  'Print screenshot artifacts collected'
]);

requireSnippets(files.tearStyles, sources.tearStyles, [
  '.flyer.count-3.compact{gap:1.15mm}',
  '.flyer.count-3.compact .headline{font-size:calc(18pt * var(--headline-scale));line-height:.96}',
  '.flyer.count-3.compact .benefit:nth-child(n+4){display:none}',
  '.flyer.count-3.compact .contact .phone{font-size:calc(18pt * var(--phone-scale))}',
  '.flyer.count-3.compact .tear{min-height:15.5mm',
  '.flyer.count-3.compact .tear-phone{font-size:6.3pt;max-height:13.2mm}'
]);

requireSnippets(files.workflow, sources.workflow, [
  'cdp-failure-artifact:',
  'Verify double CDP failure artifact',
  'run: npm run test:cdp-failure-artifact',
  'name: cdp-failure-artifact',
  'path: print-screenshots-failure.log',
  'print-screenshot:',
  'collect-print-screenshots:',
  'needs: browser-smoke',
  'needs: print-screenshot',
  'fail-fast: false',
  'matrix:',
  'scenario:',
  '- three-tearoffs',
  '- six-economy',
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
  requireScript('test:cdp-failure-artifact', 'node tools/test-cdp-failure-artifact.mjs', pkg.scripts || {});
  requireScript('validate:print-screenshots', 'node tools/validate-print-matrix.mjs', pkg.scripts || {});
}

requireSnippets(files.guide, sources.guide, [
  '# Screenshot-регрессия печатных листов А4',
  'npm run screenshots:print',
  'npm run test:cdp-failure-artifact',
  '`one-no-photo.png`',
  '`two-big-phone.png`',
  '`three-tearoffs.png`',
  '`one-showcase.png`',
  '`two-photo.png`',
  '`four-contacts.png`',
  '`six-economy.png`',
  'семи job',
  'семь PNG',
  'Chrome DevTools Protocol',
  'print-screenshots-failure.log',
  '`ECONNRESET`',
  '`cdp-failure-artifact`',
  'синтетические данные'
]);

requireSnippets(files.maintenance, sources.maintenance, [
  'npm run validate:print-screenshots',
  'npm run screenshots:print',
  'print-screenshots',
  'изолирован',
  'Chrome DevTools Protocol'
]);

if(errors.length){
  console.error('\nОшибки screenshot-регрессии печати:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка screenshot-регрессии печати пройдена.');

function validatePipeErrorGuard(){
  const input = new EventEmitter();
  const output = new EventEmitter();
  const captured = [];
  attachCdpPipeErrorHandlers(input, output, error => captured.push(error));

  const readError = Object.assign(new Error('read ECONNRESET'), {code:'ECONNRESET'});
  const writeError = Object.assign(new Error('write EPIPE'), {code:'EPIPE'});
  output.emit('error', readError);
  input.emit('error', writeError);

  const [capturedRead, capturedWrite] = captured;
  if(captured.length !== 2) errors.push(`${files.pipeGuard}: stream error должен передаваться в failAll`);
  if(capturedRead?.code !== 'ECONNRESET' || capturedRead?.direction !== 'read' || !capturedRead.message.includes('read ECONNRESET')) {
    errors.push(`${files.pipeGuard}: read ECONNRESET должен сохранять код, направление и исходное сообщение`);
  }
  if(capturedWrite?.code !== 'EPIPE' || capturedWrite?.direction !== 'write' || !capturedWrite.message.includes('write EPIPE')) {
    errors.push(`${files.pipeGuard}: write EPIPE должен сохранять код, направление и исходное сообщение`);
  }
}

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
