import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  index: 'index.html',
  uiMode: 'assets/js/spnUiMode.js',
  templates: 'assets/js/templates.js',
  reportEnhancements: 'assets/js/spnReportHistoryEnhancements.js',
  managerSummary: 'assets/js/spnManagerPeriodSummary.js',
  managerReview: 'assets/js/spnManagerReview.js',
  wizardCss: 'assets/css/spn-wizard.css',
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
  'async function loadTemplateFiles()',
  "const TEMPLATE_PORTFOLIO_FILE = 'data/template_portfolio_status.json';",
  "const TEMPLATE_OFFICE_OVERRIDES_FILE = 'data/template_office_overrides.json';",
  'loadTemplatePortfolioRegistry()',
  'loadTemplateOfficeOverrides()',
  'enrichTemplatePortfolio',
  'enrichTemplateOffice',
  '...override.tags',
  'office.scenario',
  'office.managerNote'
]);

const helperEntries = [
  'spnContactEditor.js',
  'spnTearOffEditor.js',
  'spnBrandEditor.js',
  'spnDistributionTaskHelper.js',
  'spnDistributionReportHelper.js',
  'spnReportHistoryEnhancements.js',
  'spnManagerPeriodSummary.js'
];

for (const file of helperEntries) {
  requireSnippets(files.uiMode, sources.uiMode, [`import './${file}';`]);
  forbidSnippets(files.index, sources.index, [`src="assets/js/${file}"`, `src='assets/js/${file}'`]);
}

requireSnippets(files.reportEnhancements, sources.reportEnhancements, [
  'MIN_GROUP_REPORTS = 2',
  'data-delete-report',
  'Удалить ошибочный отчёт?',
  'groupHistory',
  'normalizePlace',
  'Стабильно лучше',
  'Стабильно слабее',
  'window.confirm',
  "localStorage.setItem(REPORT_HISTORY_KEY"
]);

requireSnippets(files.managerSummary, sources.managerSummary, [
  "{id:'7', title:'7 дней', days:7}",
  "{id:'30', title:'30 дней', days:30}",
  "{id:'all', title:'Вся история', days:0}",
  'copyManagerPeriodSummaryBtn',
  'buildPeriodSummary',
  'managerReviewed',
  'riskyReports',
  'notChecked',
  'Лучшая устойчивая связка',
  'СВОДКА ПО РАСКЛЕЙКЕ'
]);

requireSnippets(files.managerReview, sources.managerReview, [
  'let reviewUpdateFrame = 0;',
  'scheduleReviewUpdate',
  'window.cancelAnimationFrame(reviewUpdateFrame);',
  'window.requestAnimationFrame',
  'new MutationObserver(scheduleReviewUpdate)',
  'scheduleReviewUpdate();',
  'updateReviewStatus();',
  'Этот шаблон требует проверки менеджера перед массовой печатью.'
]);

forbidSnippets(files.managerReview, sources.managerReview, [
  'new MutationObserver(updateOfficeSummary)'
]);

requireSnippets(files.uiMode, sources.uiMode, [
  'Выберите режим под свой опыт и текущую задачу.',
  'Новичок: пошаговый мастер, безопасные шаблоны и проверка перед печатью.',
  'Быстро: основные настройки и готовые сценарии без перегрузки.'
]);

forbidSnippets(files.uiMode, sources.uiMode, [
  'Режим новичка возвращается поэтапно.'
]);

requireSnippets(files.wizardCss, sources.wizardCss, [
  'data-wizard-step="goal"',
  "content:'1А · Цель расклейки'",
  "content:'1Б · Формат листа'",
  'data-wizard-print-count="2"'
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
