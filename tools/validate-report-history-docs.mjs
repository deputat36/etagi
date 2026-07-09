import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  helper: 'assets/js/spnDistributionReportHelper.js',
  guide: 'docs/report-history.md',
  checklist: 'docs/report-history-regression-checklist.md',
  readme: 'README.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.helper, sources.helper, [
  'REPORT_HISTORY_KEY',
  'REPORT_HISTORY_LIMIT',
  'saveDistributionReportHistoryBtn',
  'exportDistributionReportHistoryBtn',
  'distributionReportHistory',
  'getReportInsight',
  'renderHistoryAnalytics',
  'compareBestReport',
  'compareWeakReport',
  'scoreReport',
  'Лучше повторить',
  'Нужно изменить',
  'data-repeat-report',
  'insight',
  'downloadText'
]);

requireSnippets(files.guide, sources.guide, [
  '# История отчётов после расклейки',
  'Что сохраняется',
  'Автоматический вывод',
  'Аналитика связок',
  'Лучше повторить',
  'Нужно изменить',
  'заголовок макета + место расклейки + формат А4 + отклик + целевые обращения',
  'CSV',
  'localStorage'
]);

requireSnippets(files.checklist, sources.checklist, [
  '# Чек-лист проверки истории отчётов',
  'Базовый сценарий',
  'Аналитика связок',
  'Лучше повторить',
  'Нужно изменить',
  'Убедиться, что связка включает макет, место и формат А4',
  'Повтор расклейки',
  'CSV-экспорт',
  'Автоматический вывод',
  'insight'
]);

requireSnippets(files.readme, sources.readme, [
  'docs/report-history.md',
  'docs/report-history-regression-checklist.md',
  'assets/js/spnDistributionReportHelper.js отчёт после расклейки, история и CSV',
  'история отчётов, повтор прошлой расклейки, CSV-экспорт и автоматический вывод'
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
