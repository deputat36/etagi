import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  fieldMode: 'assets/js/spnDistributionFieldMode.js',
  entry: 'assets/js/spnUiMode.js',
  index: 'index.html',
  smoke: 'tools/browser-smoke.html',
  guide: 'docs/distribution-field-mode.md',
  checklist: 'docs/distribution-field-mode-regression-checklist.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.fieldMode, sources.fieldMode, [
  "const FIELD_KEY = 'etagi-raskleyka-field-task-v1'",
  'const MAX_POINTS = 30',
  'spnDistributionFieldDialog',
  'openDistributionFieldModeBtn',
  'distributionFieldPointChecklist',
  'distributionFieldActualSheets',
  'distributionFieldPhotoReport',
  'distributionFieldIssues',
  'completedPointKeys',
  "state.status = 'in_progress'",
  'actualSheets <= 0',
  "state.status = 'done'",
  'buildFieldResultText',
  'sendToReport',
  "document.getElementById('distributionReportPlace')",
  "document.getElementById('distributionReportSheets')",
  "document.getElementById('distributionReportNotes')",
  "reportNotes.value = [reportNotes.value.trim(), note]",
  "localStorage.setItem(FIELD_KEY",
  'Фотоотчёт сделан и сохранён отдельно',
  'Фотографии не сохраняются в генераторе',
  '@media(max-width:640px)',
  '@media print'
]);

forbidSnippets(files.fieldMode, sources.fieldMode, [
  'type="file"',
  'photoOne',
  'photoTwo',
  'data:image',
  'localStorage.clear(',
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  "document.addEventListener('click'",
  "document.addEventListener('change'"
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnDistributionTaskHelper.js';",
  "import './spnDistributionReportHelper.js';",
  "import './spnDistributionFieldMode.js';"
]);

const taskIndex = sources.entry.indexOf("import './spnDistributionTaskHelper.js';");
const reportIndex = sources.entry.indexOf("import './spnDistributionReportHelper.js';");
const fieldIndex = sources.entry.indexOf("import './spnDistributionFieldMode.js';");
if(!(taskIndex >= 0 && reportIndex > taskIndex && fieldIndex > reportIndex)){
  errors.push('assets/js/spnUiMode.js: полевой режим должен подключаться после задания и отчёта');
}

forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnDistributionFieldMode.js"',
  "src='assets/js/spnDistributionFieldMode.js'"
]);

requireSnippets(files.smoke, sources.smoke, [
  "doc.getElementById('openDistributionFieldModeBtn')",
  "doc.getElementById('spnDistributionFieldDialog')",
  'мобильный режим исполнителя открывается'
]);

requireSnippets(files.guide, sources.guide, [
  '# Мобильный режим выполнения расклейки',
  'до 30',
  'Фактически листов',
  'Фотоотчёт',
  'Передать в отчёт',
  'etagi-raskleyka-field-task-v1',
  'Данные не отправляются на сервер'
]);

requireSnippets(files.checklist, sources.checklist, [
  '# Чек-лист мобильного режима выполнения расклейки',
  'Заполнение из задания',
  'Статус и завершение',
  'Передача в отчёт',
  'Хранение и backup',
  'Что считать регрессией'
]);

if(errors.length){
  console.error('\nОшибки мобильного режима выполнения расклейки:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка мобильного режима выполнения расклейки пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
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
