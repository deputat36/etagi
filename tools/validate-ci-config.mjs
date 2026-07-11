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
const workflowSource = readRequired(workflowPath);
const packageSource = readRequired(packagePath);
const indexSource = readRequired(indexPath);
const runValidateSource = readRequired(runValidatePath);
const browserSmokeRunnerSource = readRequired(browserSmokeRunnerPath);
const browserSmokePageSource = readRequired(browserSmokePagePath);
const pkg = readPackage(packageSource);

requireSnippets('.github/workflows/validate.yml', workflowSource, [
  'name: Validate project',
  'push:',
  'pull_request:',
  'workflow_dispatch:',
  "- 'index.html'",
  "- 'assets/**'",
  "- 'data/**'",
  "- 'help/**'",
  "- 'docs/**'",
  "- 'tools/**'",
  "- 'README.md'",
  "- 'package.json'",
  "- '.github/workflows/validate.yml'",
  'permissions:',
  'contents: read',
  'validate:',
  'browser-smoke:',
  'needs: validate',
  'runs-on: ubuntu-latest',
  'timeout-minutes: 5',
  'uses: actions/checkout@v4',
  'uses: actions/setup-node@v4',
  "node-version: '20'",
  'run: npm run validate',
  'if: failure()',
  'uses: actions/upload-artifact@v4',
  'name: validation-failure',
  'path: validation-failure.log',
  'name: browser-smoke-failure',
  'path: browser-smoke-failure.log',
  'if-no-files-found: warn',
  'retention-days: 3',
  'run: npm run smoke:browser'
]);

requireSnippets('index.html', indexSource, [
  "new URLSearchParams(window.location.search).has('smoke')",
  'window.__ETAGI_EARLY_ERRORS__ = errors;',
  "window.addEventListener('error'",
  "window.addEventListener('unhandledrejection'"
]);

requireSnippets('tools/run-validate.mjs', runValidateSource, [
  "startsWith('validate:')",
  "command === 'npm run validate'",
  "command === 'node tools/run-validate.mjs'",
  'Invalid recursive validation script',
  "spawnSync('npm', ['run', scriptName]",
  "const failureLogPath = path.join(rootDir, 'validation-failure.log')",
  'fs.writeFileSync(failureLogPath',
  'failValidation(details'
]);

requireSnippets('tools/run-browser-smoke.mjs', browserSmokeRunnerSource, [
  "import { spawn, spawnSync } from 'node:child_process';",
  "const failureLogPath = path.join(rootDir, 'browser-smoke-failure.log')",
  'writeFailureLog(message)',
  'fs.writeFileSync(failureLogPath',
  'findChrome()',
  'createStaticServer(rootDir)',
  'const result = await runChrome(chrome, [',
  'function runChrome(command, args, options)',
  "child.kill('SIGKILL')",
  "'--headless=new'",
  "'--virtual-time-budget=22000'",
  "'--dump-dom'",
  'data-status="passed"'
]);

if (browserSmokeRunnerSource.includes('spawnSync(chrome,')) {
  errors.push('tools/run-browser-smoke.mjs: Chrome нельзя запускать через spawnSync — он блокирует локальный HTTP-сервер');
}

requireSnippets('tools/browser-smoke.html', browserSmokePageSource, [
  'id="browserSmokeResult"',
  'data-status="pending"',
  'win.__ETAGI_EARLY_ERRORS__',
  'ранние runtime errors',
  'ранние runtime-ошибки не обнаружены',
  '[data-spn-ui-mode="newbie"]',
  "dataset.wizardFlow === 'on'",
  'Проверка → Задание',
  'Задание → Отчёт',
  '[data-spn-ui-mode="quick"]',
  '[data-spn-ui-mode="advanced"]',
  'backup рабочего пространства доступен',
  'мобильный режим исполнителя открывается',
  'keyboard: End выбрал последнюю компоновку',
  '[data-layout-mode="private"]',
  '[data-layout-mode="agent_brand_photo"]',
  'private → agent_brand_photo: фирменность восстановлена'
]);

if (pkg) {
  const scripts = pkg.scripts || {};
  requireScript('validate', 'node tools/run-validate.mjs', scripts);
  requireScript('validate:ci-config', 'node tools/validate-ci-config.mjs', scripts);
  requireScript('smoke:browser', 'node tools/run-browser-smoke.mjs', scripts);
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
  if (actual !== expectedCommand) {
    errors.push(`package.json: ${scriptName} должен быть ${expectedCommand}`);
  }
}

function readPackage(source) {
  if (!source) return null;
  try {
    return JSON.parse(source);
  }
  catch(e) {
    errors.push('package.json: JSON не читается');
    return null;
  }
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${toProjectPath(filePath)}: file not found`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
