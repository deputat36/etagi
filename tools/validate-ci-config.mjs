import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const workflowPath = path.join(rootDir, '.github/workflows/validate.yml');
const packagePath = path.join(rootDir, 'package.json');
const runValidatePath = path.join(rootDir, 'tools/run-validate.mjs');
const browserSmokeRunnerPath = path.join(rootDir, 'tools/run-browser-smoke.mjs');
const browserSmokePagePath = path.join(rootDir, 'tools/browser-smoke.html');
const workflowSource = readRequired(workflowPath);
const packageSource = readRequired(packagePath);
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
  'run: npm run smoke:browser'
]);

requireSnippets('tools/run-validate.mjs', runValidateSource, [
  'startsWith(\'validate:\')',
  "command === 'npm run validate'",
  "command === 'node tools/run-validate.mjs'",
  'Invalid recursive validation script',
  "spawnSync('npm', ['run', scriptName]"
]);

requireSnippets('tools/run-browser-smoke.mjs', browserSmokeRunnerSource, [
  'findChrome()',
  'createStaticServer(rootDir)',
  "'--headless=new'",
  "'--virtual-time-budget=22000'",
  "'--dump-dom'",
  'data-status="passed"'
]);

requireSnippets('tools/browser-smoke.html', browserSmokePageSource, [
  'id="browserSmokeResult"',
  'data-status="pending"',
  '[data-spn-ui-mode="newbie"]',
  'dataset.wizardFlow === \'on\'',
  'Проверка → Задание',
  'Задание → Отчёт',
  '[data-spn-ui-mode="quick"]',
  '[data-spn-ui-mode="advanced"]'
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
