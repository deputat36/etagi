import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  helper: 'assets/js/spnDistributionReportHelper.js',
  enhancements: 'assets/js/spnReportHistoryEnhancements.js',
  uiMode: 'assets/js/spnUiMode.js',
  guide: 'docs/report-history.md',
  checklist: 'docs/report-history-regression-checklist.md',
  readme: 'README.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.helper, sources.helper, [
  "import { loadTemplates } from './templates.js';",
  'REPORT_HISTORY_KEY',
  'REPORT_HISTORY_LIMIT',
  'loadReportTemplateMetadata',
  'templateMap = new Map',
  'getReportContext',
  'templateId',
  'templateTitle',
  'officeScenario',
  'officeLevel',
  'officeRisk',
  'officeRecommended',
  'qualityScore',
  'qualityStatus',
  'qualityWarnings',
  'managerReviewProgress',
  'managerReviewed',
  'uiMode',
  'saveDistributionReportHistoryBtn',
  'exportDistributionReportHistoryBtn',
  'distributionReportHistorySearch',
  'data-report-history-filter',
  'filterReportHistory',
  'renderHistoryAnalytics',
  'Лучше повторить',
  'Нужно изменить',
  "'template_id'",
  "'office_scenario'",
  "'quality_score'",
  "'manager_reviewed'",
  'data-repeat-report',
  'downloadText'
]);

requireSnippets(files.enhancements, sources.enhancements, [
  'MIN_GROUP_REPORTS = 2',
  'data-delete-report',
  'Удалить ошибочный отчёт?',
  'writeReportHistory(history.filter',
  'groupHistory',
  'normalizePlace',
  'Стабильно лучше',
  'Стабильно слабее',
  'Устойчивость связок',
  'reportCount >= MIN_GROUP_REPORTS'
]);

requireSnippets(files.uiMode, sources.uiMode, [
  "import './spnDistributionReportHelper.js';",
  "import './spnReportHistoryEnhancements.js';"
]);

requireSnippets(files.guide, sources.guide, [
  '# История отчётов после расклейки',
  'Что сохраняется',
  '`templateId`',
  'Оценка качества',
  'Office-контекст',
  'Совместимость',
  'Аналитика связок',
  'Устойчивость связок',
  'Удаление ошибочного отчёта',
  'минимум 2 отчёта',
  'Фильтр истории',
  'Все / Рабочие / Слабые',
  'Лучше повторить',
  'Нужно изменить',
  'template_id',
  'quality_score',
  'manager_reviewed',
  'localStorage'
]);

requireSnippets(files.checklist, sources.checklist, [
  '# Чек-лист проверки истории отчётов',
  'Базовый сценарий',
  'Контекст шаблона',
  'Совместимость старых записей',
  'Аналитика связок',
  'Устойчивые связки',
  'Удаление ошибочного отчёта',
  'Стабильно лучше',
  'Стабильно слабее',
  'Фильтр истории',
  'templateId',
  'office-сценарию',
  'quality_score',
  'manager_reviewed',
  'CSV-экспорт',
  'Автоматический вывод'
]);

requireSnippets(files.readme, sources.readme, [
  'docs/report-history.md',
  'docs/report-history-regression-checklist.md',
  '### Задание и отчёты',
  'assets/js/spnDistributionReportHelper.js',
  'отчёт, история, фильтр и аналитика',
  'аналитика связок `Лучше повторить / Нужно изменить`'
]);

if (errors.length) {
  console.error('\nReport history documentation errors:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Report history documentation check passed.');

function requireSnippets(file, source, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: missing required snippet — ${snippet}`);
  }
}

function readRequired(file) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${file}: file not found`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
