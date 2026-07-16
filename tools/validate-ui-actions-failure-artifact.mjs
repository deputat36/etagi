import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  workflow:'.github/workflows/validate.yml',
  package:'package.json',
  runner:'tools/run-ui-actions-smoke.mjs',
  fixture:'tools/ui-actions-failure-fixture.html',
  test:'tools/test-ui-actions-failure-artifact.mjs'
};
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));

requireSnippets(files.workflow, source.workflow, [
  'ui-actions-failure-artifact:',
  'run: npm run test:ui-actions-failure-artifact',
  'name: ui-actions-failure-artifact',
  'path: browser-smoke-failure.log',
  'if-no-files-found: error',
  'retention-days: 3'
]);
requireSnippets(files.runner, source.runner, [
  "process.argv.includes('--failure-fixture')",
  "label:'UI actions failure fixture'",
  "path:'tools/ui-actions-failure-fixture.html'",
  "const failureLogPath = path.join(rootDir, 'browser-smoke-failure.log')",
  'writeFailureLog(failure)'
]);
requireSnippets(files.fixture, source.fixture, [
  'id="uiActionsSmokeResult"',
  'data-status="failed"',
  'fault injection: deterministic UI action failure',
  'Последнее действие: fixture.import',
  'Состояние: {"headline":"Fixture","printCount":4,"hasQr":true}'
]);
requireSnippets(files.test, source.test, [
  "spawnSync(process.execPath, ['tools/run-ui-actions-smoke.mjs', '--failure-fixture']",
  "path.join(rootDir, 'browser-smoke-failure.log')",
  "result.status === 0",
  "failureLog.includes(snippet)",
  'UI actions failure artifact проверен'
]);

try{
  const pkg = JSON.parse(source.package);
  requireScript(pkg.scripts, 'test:ui-actions-failure-artifact', 'node tools/test-ui-actions-failure-artifact.mjs');
  requireScript(pkg.scripts, 'validate:ui-actions-failure-artifact', 'node tools/validate-ui-actions-failure-artifact.mjs');
} catch(error){
  errors.push(`package.json: JSON не читается — ${error.message}`);
}

if(errors.length){
  console.error('\nUI actions failure artifact validation errors:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('UI actions failure artifact contract passed.');

function read(file){
  const filePath = path.join(rootDir, file);
  if(!fs.existsSync(filePath)){
    errors.push(`${file}: file not found`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}
function requireSnippets(file, text, snippets){
  for(const snippet of snippets){
    if(!text.includes(snippet)) errors.push(`${file}: missing required snippet — ${snippet}`);
  }
}
function requireScript(scripts, name, expected){
  const actual = String(scripts?.[name] || '').trim();
  if(actual !== expected) errors.push(`package.json: ${name} должен быть ${expected}`);
}
