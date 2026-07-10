import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  index: 'index.html',
  uiMode: 'assets/js/spnUiMode.js',
  templates: 'assets/js/templates.js',
  audit: 'docs/full-project-audit-and-roadmap-2026-07-10.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.templates, sources.templates, [
  'let templateLoadPromise = null;',
  'export function loadTemplates()',
  'if(!templateLoadPromise) templateLoadPromise = loadTemplateFiles();',
  'return templateLoadPromise;',
  'async function loadTemplateFiles()'
]);

const helperEntries = [
  'spnContactEditor.js',
  'spnTearOffEditor.js',
  'spnBrandEditor.js',
  'spnDistributionTaskHelper.js',
  'spnDistributionReportHelper.js'
];

for (const file of helperEntries) {
  requireSnippets(files.uiMode, sources.uiMode, [`import './${file}';`]);
  forbidSnippets(files.index, sources.index, [`src="assets/js/${file}"`, `src='assets/js/${file}'`]);
}

requireSnippets(files.uiMode, sources.uiMode, [
  'Выберите режим под свой опыт и текущую задачу.',
  'Новичок: пошаговый мастер, безопасные шаблоны и проверка перед печатью.',
  'Быстро: основные настройки и готовые сценарии без перегрузки.'
]);

forbidSnippets(files.uiMode, sources.uiMode, [
  'Режим новичка возвращается поэтапно.'
]);

requireSnippets(files.audit, sources.audit, [
  '# Полный аудит и автономный план развития генератора расклеек',
  'Этап 1. Стабилизация runtime',
  'Повторная загрузка шаблонов',
  'Дублирование точек входа',
  'Браузерная проверка'
]);

if (errors.length) {
  console.error('\nОшибки runtime-архитектуры:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка runtime-архитектуры пройдена.');

function requireSnippets(file, source, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets) {
  for (const snippet of snippets) {
    if (source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}

function readRequired(file) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
