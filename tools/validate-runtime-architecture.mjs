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
  agentBrandGuard: 'assets/js/spnAgentBrandModeGuard.js',
  layoutAccessibility: 'assets/js/spnLayoutModeAccessibility.js',
  workspaceBackup: 'assets/js/spnWorkspaceBackup.js',
  distributionFieldMode: 'assets/js/spnDistributionFieldMode.js',
  wizardCss: 'assets/css/spn-wizard.css',
  audit: 'docs/full-project-audit-and-roadmap-2026-07-11.md'
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
  "const TEMPLATE_ID_ALIASES_FILE = 'data/template_id_aliases.json';",
  'loadTemplatePortfolioRegistry()',
  'loadTemplateOfficeOverrides()',
  'loadTemplateIdAliases()',
  'enrichTemplatePortfolio',
  'enrichTemplateOffice',
  'applyTemplateIdAlias',
  'sourcePackage: packageName',
  'if(byId.has(resolved.id))',
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
  'spnManagerPeriodSummary.js',
  'spnWorkspaceBackup.js',
  'spnDistributionFieldMode.js',
  'spnPhotoLayoutQualityActions.js',
  'spnAgentBrandModeGuard.js',
  'spnLayoutModeAccessibility.js'
];

for (const file of helperEntries) {
  requireSnippets(files.uiMode, sources.uiMode, [`import './${file}';`]);
  forbidSnippets(files.index, sources.index, [`src="assets/js/${file}"`, `src='assets/js/${file}'`]);
}

const taskImportIndex = sources.uiMode.indexOf("import './spnDistributionTaskHelper.js';");
const reportImportIndex = sources.uiMode.indexOf("import './spnDistributionReportHelper.js';");
const fieldImportIndex = sources.uiMode.indexOf("import './spnDistributionFieldMode.js';");
if(!(taskImportIndex >= 0 && reportImportIndex > taskImportIndex && fieldImportIndex > reportImportIndex)){
  errors.push('assets/js/spnUiMode.js: мобильный полевой режим должен подключаться после задания и отчёта');
}

requireSnippets(files.agentBrandGuard, sources.agentBrandGuard, [
  '[data-layout-mode="agent_brand_photo"]',
  'window.requestAnimationFrame(normalizeAgentBrandMode)',
  "colorMode.value === 'private'",
  "colorMode.value = 'brand'",
  'showBrand.checked = true'
]);

requireSnippets(files.layoutAccessibility, sources.layoutAccessibility, [
  "grid.setAttribute('role', 'radiogroup')",
  "button.setAttribute('role', 'radio')",
  "button.setAttribute('aria-checked'",
  'button.tabIndex = selected ? 0 : -1',
  "event.key === 'ArrowRight'",
  "event.key === 'Home'",
  "event.key === 'End'",
  'new MutationObserver(() => scheduleSync(grid)).observe(grid',
  ':focus-visible'
]);

forbidSnippets(files.layoutAccessibility, sources.layoutAccessibility, [
  "document.addEventListener('keydown'",
  "window.addEventListener('keydown'"
]);

requireSnippets(files.workspaceBackup, sources.workspaceBackup, [
  "const STORAGE_PREFIX = 'etagi-raskleyka-'",
  "const BACKUP_SCHEMA = 'etagi-raskleyka-workspace-backup'",
  'collectWorkspaceEntries',
  'const previousEntries = collectWorkspaceEntries()',
  'rollbackWorkspace(previousEntries)',
  'window.confirm',
  "key.startsWith(STORAGE_PREFIX)"
]);

forbidSnippets(files.workspaceBackup, sources.workspaceBackup, [
  'localStorage.clear(',
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon'
]);

requireSnippets(files.distributionFieldMode, sources.distributionFieldMode, [
  "const FIELD_KEY = 'etagi-raskleyka-field-task-v1'",
  'spnDistributionFieldDialog',
  'completedPointKeys',
  'actualSheets <= 0',
  'buildFieldResultText',
  'sendToReport',
  "reportNotes.value = [reportNotes.value.trim(), note]",
  '@media(max-width:640px)'
]);

forbidSnippets(files.distributionFieldMode, sources.distributionFieldMode, [
  'type="file"',
  'data:image',
  'fetch(',
  'XMLHttpRequest'
]);

requireSnippets(files.index, sources.index, [
  "new URLSearchParams(window.location.search).has('smoke')",
  'window.__ETAGI_EARLY_ERRORS__ = errors;',
  "window.addEventListener('error'",
  "window.addEventListener('unhandledrejection'"
]);

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
  '# Многосторонний аудит и автономный план развития генератора расклеек',
  'Насколько проект решает задачи пользователя',
  'Повторяющиеся templateId',
  'Ранние runtime-ошибки не попадают в smoke',
  'Полевое выполнение',
  'Сохранность рабочего пространства'
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
