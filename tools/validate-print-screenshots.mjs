import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  harness: 'tools/print-screenshot.html',
  runner: 'tools/run-print-screenshots.mjs',
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
  'prepareCaptureView(doc)',
  'фактически смены'
].filter(snippet => snippet !== 'фактически смены'));

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
  "'--window-size=794,1123'",
  "'--dump-dom'",
  '`--screenshot=${screenshotPath}`',
  "dom.includes('data-status=\"passed\"')",
  "path.join(outputDir, 'manifest.json')",
  'sizeBytes < 10000',
  'fs.writeFileSync(failureLogPath'
]);

requireSnippets(files.workflow, sources.workflow, [
  'print-screenshots:',
  'needs: browser-smoke',
  'run: npm run screenshots:print',
  'name: print-screenshots',
  'path: artifacts/print-screenshots/',
  'retention-days: 7',
  'name: print-screenshots-failure',
  'path: print-screenshots-failure.log'
]);

const pkg = readPackage(sources.package);
if(pkg){
  requireScript('screenshots:print', 'node tools/run-print-screenshots.mjs', pkg.scripts || {});
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
  'print-screenshots'
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
