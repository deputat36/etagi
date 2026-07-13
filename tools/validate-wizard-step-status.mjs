import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  module: 'assets/js/spnWizardStepStatus.js',
  uiMode: 'assets/js/spnUiMode.js',
  guide: 'docs/wizard-step-status.md',
  package: 'package.json',
  maintenance: 'docs/maintenance-guide.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.module, sources.module, [
  "const STATUS_PANEL_ID = 'spnWizardProgressSummary';",
  "const REPORT_HISTORY_KEY = 'etagi-raskleyka-distribution-report-history-v1';",
  'initWizardStepStatus',
  'ensureStatusPanel',
  'ensureStepBadges',
  'scheduleStatusUpdate',
  'window.requestAnimationFrame',
  'window.cancelAnimationFrame',
  "sidebar.addEventListener('input', scheduleStatusUpdate);",
  "sidebar.addEventListener('change', scheduleStatusUpdate);",
  "sidebar.addEventListener('click', event => {",
  'getGoalStatus',
  'getTemplateStatus',
  'getContentStatus',
  'getMediaStatus',
  'getCheckStatus',
  'getSaveStatus',
  'getTaskStatus',
  'getReportStatus',
  "status('optional', 'необязательно'",
  "status('later', 'после печати'",
  'До печати',
  'После печати',
  'data-step-status="ready"',
  '@media print'
]);

forbidSnippets(files.module, sources.module, [
  "document.addEventListener('click'",
  'document.onclick',
  'window.onclick',
  'setInterval(',
  'localStorage.setItem(',
  '.click();',
  '.click()'
]);

requireSnippets(files.uiMode, sources.uiMode, [
  "import './spnWizardFlow.js';",
  "import './spnWizardStepStatus.js';"
]);

requireSnippets(files.guide, sources.guide, [
  '# Компактный статус шагов мастера',
  'До печати',
  'После печати',
  'готово',
  'проверить',
  'необязательно',
  'после печати',
  'не использует `setInterval`',
  'npm run validate:wizard-step-status'
]);

let packageJson = {};
try{
  packageJson = JSON.parse(sources.package || '{}');
} catch(error){
  errors.push(`${files.package}: JSON не читается — ${error.message}`);
}

if(packageJson.scripts?.['validate:wizard-step-status'] !== 'node tools/validate-wizard-step-status.mjs') {
  errors.push(`${files.package}: отсутствует корректный validate:wizard-step-status`);
}

requireSnippets(files.maintenance, sources.maintenance, [
  'npm run validate:wizard-step-status',
  '## Компактный статус шагов мастера',
  'docs/wizard-step-status.md'
]);

if(errors.length){
  console.error('\nОшибки компактного статуса шагов мастера:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка компактного статуса шагов мастера пройдена.');

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

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
