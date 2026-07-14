import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const workflowPath = path.join(rootDir, '.github/workflows/validate.yml');
const packagePath = path.join(rootDir, 'package.json');
const indexPath = path.join(rootDir, 'index.html');
const runValidatePath = path.join(rootDir, 'tools/run-validate.mjs');
const browserSmokeRunnerPath = path.join(rootDir, 'tools/run-browser-smoke.mjs');
const browserSmokePagePath = path.join(rootDir, 'tools/browser-smoke.html');
const printScreenshotRunnerPath = path.join(rootDir, 'tools/run-print-screenshots.mjs');
const printScreenshotCollectorPath = path.join(rootDir, 'tools/collect-print-screenshots.mjs');
const printScreenshotPagePath = path.join(rootDir, 'tools/print-screenshot.html');
const workflowSource = readRequired(workflowPath);
const packageSource = readRequired(packagePath);
const indexSource = readRequired(indexPath);
const runValidateSource = readRequired(runValidatePath);
const browserSmokeRunnerSource = readRequired(browserSmokeRunnerPath);
const browserSmokePageSource = readRequired(browserSmokePagePath);
const printScreenshotRunnerSource = readRequired(printScreenshotRunnerPath);
const printScreenshotCollectorSource = readRequired(printScreenshotCollectorPath);
const printScreenshotPageSource = readRequired(printScreenshotPagePath);
const pkg = readPackage(packageSource);

requireSnippets('.github/workflows/validate.yml', workflowSource, [
  'name: Validate project','push:','pull_request:','workflow_dispatch:',
  "- 'index.html'","- 'assets/**'","- 'data/**'","- 'help/**'","- 'docs/**'","- 'tools/**'","- 'README.md'","- 'package.json'","- '.github/workflows/validate.yml'",
  'permissions:','contents: read','validate:','browser-smoke:','print-screenshot:','collect-print-screenshots:',
  'needs: validate','needs: browser-smoke','needs: print-screenshot','fail-fast: false','matrix:','scenario:',
  'PRINT_SCREENSHOT_SCENARIO: ${{ matrix.scenario }}','runs-on: ubuntu-latest','timeout-minutes: 5','timeout-minutes: 3',
  'uses: actions/checkout@v4','uses: actions/setup-node@v4','uses: actions/upload-artifact@v4','uses: actions/download-artifact@v4',
  "node-version: '20'",'run: npm run validate','run: npm run smoke:browser','run: npm run screenshots:print','run: npm run screenshots:manifest',
  'if: failure()','if: success()','name: validation-failure','path: validation-failure.log','name: browser-smoke-failure','path: browser-smoke-failure.log',
  'name: print-screenshot-${{ matrix.scenario }}','name: print-screenshot-failure-${{ matrix.scenario }}','pattern: print-screenshot-*','merge-multiple: true',
  'name: print-screenshots','path: artifacts/print-screenshots/','if-no-files-found: warn','if-no-files-found: error','retention-days: 1','retention-days: 3','retention-days: 7'
]);

requireSnippets('index.html', indexSource, [
  "new URLSearchParams(window.location.search).has('smoke')",
  'window.__ETAGI_EARLY_ERRORS__ = errors;',
  "window.addEventListener('error'",
  "window.addEventListener('unhandledrejection'"
]);

requireSnippets('tools/run-validate.mjs', runValidateSource, [
  "startsWith('validate:')","command === 'npm run validate'","command === 'node tools/run-validate.mjs'",'Invalid recursive validation script',
  "spawnSync('npm', ['run', scriptName]","const failureLogPath = path.join(rootDir, 'validation-failure.log')",'fs.writeFileSync(failureLogPath','failValidation(details'
]);

requireSnippets('tools/run-browser-smoke.mjs', browserSmokeRunnerSource, [
  "import { spawn, spawnSync } from 'node:child_process';",
  'class SmokeHarnessError extends Error {}',
  "const failureLogPath = path.join(rootDir, 'browser-smoke-failure.log')",
  'writeFailureLog(message)','fs.writeFileSync(failureLogPath','findChrome()','createStaticServer(rootDir)',
  'for(let attempt = 1; attempt <= 2; attempt += 1)','if(error instanceof SmokeHarnessError) throw error;',
  "'--headless=new'","'--remote-debugging-pipe'","cdp.send('Target.createTarget'","cdp.send('Runtime.evaluate'",
  'waitForSmokeStatus','createCdpPipeClient',"throw new SmokeHarnessError(smokeStatus.text",
  "document.getElementById('browserSmokeResult')",'latest.status === \'passed\' || latest.status === \'failed\'',
  'server.keepAliveTimeout = 1',"'Connection':'close'",'terminateProcess(child)','Browser smoke passed via CDP pipe'
]);

for(const forbidden of ["'--virtual-time-budget=", "'--dump-dom'", 'function runChrome(command, args, options)']){
  if(browserSmokeRunnerSource.includes(forbidden)) errors.push(`tools/run-browser-smoke.mjs: запрещён устаревший CLI smoke-runner — ${forbidden}`);
}

if (browserSmokeRunnerSource.includes('spawnSync(chrome,')) {
  errors.push('tools/run-browser-smoke.mjs: Chrome нельзя запускать через spawnSync — он блокирует локальный HTTP-сервер');
}

requireSnippets('tools/browser-smoke.html', browserSmokePageSource, [
  'id="browserSmokeResult"','data-status="pending"','win.__ETAGI_EARLY_ERRORS__','ранние runtime errors','ранние runtime-ошибки не обнаружены',
  '[data-spn-ui-mode="newbie"]',"dataset.wizardFlow === 'on'",'Проверка → Задание','Задание → Отчёт','[data-spn-ui-mode="quick"]','[data-spn-ui-mode="advanced"]',
  'backup рабочего пространства доступен','мобильный режим исполнителя открывается','keyboard: End выбрал последнюю компоновку',
  '[data-layout-mode="private"]','[data-layout-mode="agent_brand_photo"]','private → agent_brand_photo: фирменность восстановлена','}, 65000);'
]);

requireSnippets('tools/run-print-screenshots.mjs', printScreenshotRunnerSource, [
  "path.join(rootDir, 'artifacts', 'print-screenshots')","path.join(rootDir, 'print-screenshots-failure.log')",'PRINT_SCREENSHOT_SCENARIO','selectedScenarios',
  "fs.writeFileSync(path.join(outputDir, `${scenario.id}.json`)","captureMethod: 'cdp-pipe'","'--window-size=794,1123'","'--remote-debugging-pipe'",
  "cdp.send('Runtime.evaluate'","cdp.send('Page.captureScreenshot'",'waitForCaptureStatus','createCdpPipeClient','server.keepAliveTimeout = 1',"'Connection':'close'"
]);

for(const forbidden of ["'--virtual-time-budget=", "'--dump-dom'", '`--screenshot=${screenshotPath}`']){
  if(printScreenshotRunnerSource.includes(forbidden)) errors.push(`tools/run-print-screenshots.mjs: запрещён устаревший CLI-захват — ${forbidden}`);
}

requireSnippets('tools/collect-print-screenshots.mjs', printScreenshotCollectorSource, [
  'Не найден ${id}.png после matrix job.','Не найден ${id}.json после matrix job.',"path.join(outputDir, 'manifest.json')",'Print screenshot artifacts collected'
]);

requireSnippets('tools/print-screenshot.html', printScreenshotPageSource, [
  'id="captureStatus"',"scenario === 'four-contacts'","doc.getElementById('colorMode')?.value === 'economy'",'assertInkEfficientContacts(flyers)',"status.dataset.status = 'passed'"
]);

if (pkg) {
  const scripts = pkg.scripts || {};
  requireScript('validate', 'node tools/run-validate.mjs', scripts);
  requireScript('validate:ci-config', 'node tools/validate-ci-config.mjs', scripts);
  requireScript('smoke:browser', 'node tools/run-browser-smoke.mjs', scripts);
  requireScript('screenshots:print', 'node tools/run-print-screenshots.mjs', scripts);
  requireScript('screenshots:manifest', 'node tools/collect-print-screenshots.mjs', scripts);
}

if (errors.length) {
  console.error('\nCI config validation errors:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CI config validation passed.');

function requireSnippets(file, text, snippets) {
  for (const snippet of snippets) {
    if (!text.includes(snippet)) errors.push(`${file}: missing required snippet — ${snippet}`);
  }
}
function requireScript(scriptName, expectedCommand, scripts) {
  const actual = String(scripts[scriptName] || '').trim();
  if (actual !== expectedCommand) errors.push(`package.json: ${scriptName} должен быть ${expectedCommand}`);
}
function readPackage(source) {
  if (!source) return null;
  try { return JSON.parse(source); }
  catch(e) { errors.push('package.json: JSON не читается'); return null; }
}
function readRequired(filePath) {
  if (!fs.existsSync(filePath)) { errors.push(`${toProjectPath(filePath)}: file not found`); return ''; }
  return fs.readFileSync(filePath, 'utf8');
}
function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
