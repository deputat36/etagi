import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const appPath = path.join(rootDir, 'assets/js/app.js');
const qualityPath = path.join(rootDir, 'assets/js/quality.js');
const actionsPath = path.join(rootDir, 'assets/js/qualityExtraActions.js');
const levelLabelsPath = path.join(rootDir, 'assets/js/qualityLevelLabels.js');
const issueSummaryPath = path.join(rootDir, 'assets/js/qualityIssueSummary.js');
const priorityHintPath = path.join(rootDir, 'assets/js/qualityPriorityHint.js');
const printGuardHintPath = path.join(rootDir, 'assets/js/qualityPrintGuardHint.js');
const issueFiltersPath = path.join(rootDir, 'assets/js/qualityIssueFilters.js');
const preprintSummaryPath = path.join(rootDir, 'assets/js/preprintSummary.js');
const stylesPath = path.join(rootDir, 'assets/css/ui-improvements.css');
const levelStylesPath = path.join(rootDir, 'assets/css/quality-level-labels.css');
const issueSummaryStylesPath = path.join(rootDir, 'assets/css/quality-issue-summary.css');
const indexPath = path.join(rootDir, 'index.html');
const errors = [];

const appSource = readRequired(appPath);
const qualitySource = readRequired(qualityPath);
const actionsSource = readRequired(actionsPath);
const levelLabelsSource = readRequired(levelLabelsPath);
const issueSummarySource = readRequired(issueSummaryPath);
const priorityHintSource = readRequired(priorityHintPath);
const printGuardHintSource = readRequired(printGuardHintPath);
const issueFiltersSource = readRequired(issueFiltersPath);
const preprintSummarySource = readRequired(preprintSummaryPath);
const stylesSource = readRequired(stylesPath);
const levelStylesSource = readRequired(levelStylesPath);
const issueSummaryStylesSource = readRequired(issueSummaryStylesPath);
const indexSource = readRequired(indexPath);

if (qualitySource && actionsSource) {
  const quickActions = extractQuickActions(actionsSource);
  const actionTitles = quickActions.map(item => item.title).filter(Boolean);
  const actionNames = quickActions.map(item => item.action).filter(Boolean);

  if (!quickActions.length) {
    errors.push('assets/js/qualityExtraActions.js: не найдены быстрые исправления с title/action/label');
  }

  const titleCounts = countItems(actionTitles);
  for (const [title, count] of titleCounts) {
    if (count > 1) {
      errors.push(`assets/js/qualityExtraActions.js: дублируется заголовок быстрого исправления — ${title}`);
    }
  }

  for (const item of quickActions) {
    if (!item.title?.trim()) {
      errors.push('assets/js/qualityExtraActions.js: у быстрого исправления пустой title');
    }
    if (!item.action?.trim()) {
      errors.push(`assets/js/qualityExtraActions.js: пустое имя действия для заголовка — ${item.title || 'без title'}`);
    }
    else if (!/^[a-z][a-zA-Z0-9]*$/.test(item.action)) {
      errors.push(`assets/js/qualityExtraActions.js: небезопасное имя действия — ${item.action}`);
    }
    if (!item.label?.trim()) {
      errors.push(`assets/js/qualityExtraActions.js: пустая подпись кнопки для действия — ${item.action || 'без action'}`);
    }
    else if (item.label.length > 32) {
      errors.push(`assets/js/qualityExtraActions.js: слишком длинная подпись кнопки — ${item.label}`);
    }
  }

  for (const title of actionTitles) {
    if (!qualitySource.includes(`title:'${title}'`) && !qualitySource.includes(`title: '${title}'`)) {
      errors.push(`assets/js/qualityExtraActions.js: заголовок не найден в quality.js — ${title}`);
    }
  }

  for (const actionName of [...new Set(actionNames)]) {
    if (!actionsSource.includes(`action === '${actionName}'`) && !actionsSource.includes(`action === "${actionName}"`)) {
      errors.push(`assets/js/qualityExtraActions.js: действие не обработано в handleClick — ${actionName}`);
    }
  }

  const requiredActionWiring = [
    {
      snippet: "document.addEventListener('DOMContentLoaded', init)",
      message: 'assets/js/qualityExtraActions.js: модуль должен запускаться после загрузки DOM'
    },
    {
      snippet: "list.addEventListener('click', handleClick)",
      message: 'assets/js/qualityExtraActions.js: не найден обработчик клика быстрых исправлений'
    },
    {
      snippet: 'new MutationObserver(enhanceQualityList)',
      message: 'assets/js/qualityExtraActions.js: не найдено наблюдение за обновлением списка замечаний'
    },
    {
      snippet: "item.querySelector('[data-extra-quality-fix]')",
      message: 'assets/js/qualityExtraActions.js: нет защиты от повторной вставки кнопок'
    },
    {
      snippet: 'data-extra-quality-fix=',
      message: 'assets/js/qualityExtraActions.js: кнопки должны иметь data-extra-quality-fix'
    },
    {
      snippet: 'type="button"',
      message: 'assets/js/qualityExtraActions.js: кнопки быстрых исправлений должны быть type="button"'
    },
    {
      snippet: 'class="quality-extra-fix-btn"',
      message: 'assets/js/qualityExtraActions.js: кнопки быстрых исправлений должны иметь отдельный CSS-класс'
    },
    {
      snippet: 'aria-label="${escapeHtml(ariaLabel)}"',
      message: 'assets/js/qualityExtraActions.js: у кнопок быстрых исправлений должен быть aria-label'
    },
    {
      snippet: 'escapeHtml(config.label)',
      message: 'assets/js/qualityExtraActions.js: подпись кнопки должна экранироваться перед вставкой в HTML'
    }
  ];

  for (const item of requiredActionWiring) {
    if (!actionsSource.includes(item.snippet)) {
      errors.push(item.message);
    }
  }
}

if (appSource) {
  const requiredBuiltInButtonMarkup = [
    {
      snippet: 'class="quality-fix-btn"',
      message: 'assets/js/app.js: кнопки штатных исправлений должны иметь класс quality-fix-btn'
    },
    {
      snippet: 'aria-label="${esc(ariaLabel)}"',
      message: 'assets/js/app.js: кнопки штатных исправлений должны иметь aria-label'
    },
    {
      snippet: 'data-fix="${i.action}"',
      message: 'assets/js/app.js: кнопки штатных исправлений должны сохранять data-fix'
    },
    {
      snippet: 'esc(label)',
      message: 'assets/js/app.js: подпись штатной кнопки должна экранироваться'
    }
  ];

  for (const item of requiredBuiltInButtonMarkup) {
    if (!appSource.includes(item.snippet)) {
      errors.push(item.message);
    }
  }
}

if (levelLabelsSource) {
  const requiredLevelLabelSnippets = [
    ['error: \'Ошибка\'', 'assets/js/qualityLevelLabels.js: не найдена метка Ошибка'],
    ['warn: \'Важно\'', 'assets/js/qualityLevelLabels.js: не найдена метка Важно'],
    ['tip: \'Совет\'', 'assets/js/qualityLevelLabels.js: не найдена метка Совет'],
    ['new MutationObserver(enhanceQualityItems)', 'assets/js/qualityLevelLabels.js: метки должны обновляться после перерендера списка'],
    ['item.querySelector(\'.quality-level\')', 'assets/js/qualityLevelLabels.js: нет защиты от повторной вставки меток'],
    ['quality-level-${level}', 'assets/js/qualityLevelLabels.js: не найден CSS-класс уровня замечания']
  ];

  for (const [snippet, message] of requiredLevelLabelSnippets) {
    if (!levelLabelsSource.includes(snippet)) {
      errors.push(message);
    }
  }
}

if (issueSummarySource) {
  const requiredIssueSummarySnippets = [
    ['const levels = [', 'assets/js/qualityIssueSummary.js: не найден список уровней замечаний'],
    ["{ key: 'error', label: 'Ошибки' }", 'assets/js/qualityIssueSummary.js: не найден счётчик ошибок'],
    ["{ key: 'warn', label: 'Важно' }", 'assets/js/qualityIssueSummary.js: не найден счётчик важных замечаний'],
    ["{ key: 'tip', label: 'Советы' }", 'assets/js/qualityIssueSummary.js: не найден счётчик советов'],
    ['document.getElementById(\'qualityIssueSummary\')?.addEventListener(\'click\', handleSummaryClick)', 'assets/js/qualityIssueSummary.js: сводка должна обрабатывать клики по чипам'],
    ['new MutationObserver(updateSummary)', 'assets/js/qualityIssueSummary.js: сводка должна обновляться после перерендера списка'],
    ['id="qualityIssueSummary"', 'assets/js/qualityIssueSummary.js: не найден id блока сводки'],
    ['aria-live="polite"', 'assets/js/qualityIssueSummary.js: сводка должна быть доступна для экранных читалок'],
    ['quality-summary-good', 'assets/js/qualityIssueSummary.js: не найдено состояние без замечаний'],
    ['list.querySelectorAll(`.qitem.${level.key}`)', 'assets/js/qualityIssueSummary.js: счётчики должны брать уровни из DOM-замечаний'],
    ['.filter((item) => item.count > 0)', 'assets/js/qualityIssueSummary.js: сводка не должна показывать нулевые чипы'],
    ['<button type="button" class="quality-summary-chip', 'assets/js/qualityIssueSummary.js: чипы сводки должны быть кнопками'],
    ['data-quality-summary-filter="${item.key}"', 'assets/js/qualityIssueSummary.js: чипы сводки должны иметь data-quality-summary-filter'],
    ['aria-label="Показать замечания: ${item.label}"', 'assets/js/qualityIssueSummary.js: кнопки сводки должны иметь aria-label'],
    ['function handleSummaryClick(event)', 'assets/js/qualityIssueSummary.js: не найден обработчик клика сводки'],
    ['document.querySelector(`[data-quality-filter="${button.dataset.qualitySummaryFilter}"]`)', 'assets/js/qualityIssueSummary.js: клик по сводке должен искать соответствующий фильтр'],
    ['filterButton.click()', 'assets/js/qualityIssueSummary.js: клик по сводке должен включать фильтр замечаний']
  ];

  for (const [snippet, message] of requiredIssueSummarySnippets) {
    if (!issueSummarySource.includes(snippet)) {
      errors.push(message);
    }
  }
}

if (priorityHintSource) {
  const requiredPriorityHintSnippets = [
    ['const priorities = [', 'assets/js/qualityPriorityHint.js: не найден порядок приоритетов замечаний'],
    ["{ key: 'error', label: 'Сначала исправьте ошибку' }", 'assets/js/qualityPriorityHint.js: не найден приоритет ошибок'],
    ["{ key: 'warn', label: 'Потом важное замечание' }", 'assets/js/qualityPriorityHint.js: не найден приоритет важных замечаний'],
    ["{ key: 'tip', label: 'Затем можно улучшить' }", 'assets/js/qualityPriorityHint.js: не найден приоритет советов'],
    ['new MutationObserver(updatePriority)', 'assets/js/qualityPriorityHint.js: подсказка должна обновляться после перерендера списка'],
    ['id="qualityPriorityHint"', 'assets/js/qualityPriorityHint.js: не найден id блока приоритетной подсказки'],
    ['aria-live="polite"', 'assets/js/qualityPriorityHint.js: подсказка должна быть доступна для экранных читалок'],
    ['getTopPriority(list)', 'assets/js/qualityPriorityHint.js: не найден выбор первого важного замечания'],
    ['list.querySelector(`.qitem.${priority.key}`)', 'assets/js/qualityPriorityHint.js: приоритет должен выбираться из DOM-замечаний'],
    ['escapeHtml(priority.title)', 'assets/js/qualityPriorityHint.js: заголовок замечания должен экранироваться перед вставкой в HTML']
  ];

  for (const [snippet, message] of requiredPriorityHintSnippets) {
    if (!priorityHintSource.includes(snippet)) {
      errors.push(message);
    }
  }
}

if (printGuardHintSource) {
  const requiredPrintGuardSnippets = [
    ["const printBtn = document.getElementById('printBtn')", 'assets/js/qualityPrintGuardHint.js: не найдена кнопка печати'],
    ['printBtn.dataset.originalLabel', 'assets/js/qualityPrintGuardHint.js: исходная подпись кнопки должна сохраняться'],
    ["printBtn.addEventListener('click', handlePrintClick)", 'assets/js/qualityPrintGuardHint.js: не найден обработчик клика по заблокированной печати'],
    ['new MutationObserver(updatePrintState)', 'assets/js/qualityPrintGuardHint.js: состояние печати должно обновляться после перерендера списка'],
    ["list.querySelector('.qitem.error')", 'assets/js/qualityPrintGuardHint.js: не найдена проверка критичных ошибок'],
    ["list.querySelector('.qitem.warn')", 'assets/js/qualityPrintGuardHint.js: не найдена проверка важных замечаний'],
    ["printBtn.classList.toggle('print-blocked', hasError)", 'assets/js/qualityPrintGuardHint.js: не найден визуальный класс блокировки печати'],
    ["printBtn.classList.toggle('print-has-warnings', !hasError && hasWarning)", 'assets/js/qualityPrintGuardHint.js: не найден визуальный класс предупреждений печати'],
    ["printBtn.textContent = 'Исправьте ошибки'", 'assets/js/qualityPrintGuardHint.js: кнопка должна явно говорить об ошибках'],
    ["printBtn.setAttribute('aria-label'", 'assets/js/qualityPrintGuardHint.js: у состояния печати должен быть aria-label'],
    ['focusFirstBlockingIssue', 'assets/js/qualityPrintGuardHint.js: не найден переход к первой ошибке'],
    ['showErrorFilter()', 'assets/js/qualityPrintGuardHint.js: перед фокусом нужно показывать фильтр ошибок'],
    ['function showErrorFilter()', 'assets/js/qualityPrintGuardHint.js: не найден helper включения фильтра ошибок'],
    ["document.querySelector('[data-quality-filter=\"error\"]')", 'assets/js/qualityPrintGuardHint.js: не найден поиск кнопки фильтра ошибок'],
    ['errorFilter.click()', 'assets/js/qualityPrintGuardHint.js: фильтр ошибок должен включаться кликом'],
    ["document.querySelector('#qualityList .qitem.error')", 'assets/js/qualityPrintGuardHint.js: переход должен искать первое критичное замечание'],
    ["issue.setAttribute('tabindex', '-1')", 'assets/js/qualityPrintGuardHint.js: замечание должно получать фокус клавиатуры'],
    ["issue.classList.add('quality-focus-target')", 'assets/js/qualityPrintGuardHint.js: не найдена подсветка выбранного замечания'],
    ["issue.scrollIntoView({ behavior: 'smooth', block: 'center' })", 'assets/js/qualityPrintGuardHint.js: не найдена прокрутка к ошибке'],
    ["status.textContent = 'Исправьте выделенное замечание", 'assets/js/qualityPrintGuardHint.js: статус должен объяснять следующий шаг']
  ];

  for (const [snippet, message] of requiredPrintGuardSnippets) {
    if (!printGuardHintSource.includes(snippet)) {
      errors.push(message);
    }
  }
}

if (issueFiltersSource) {
  const requiredIssueFilterSnippets = [
    ['const filters = [', 'assets/js/qualityIssueFilters.js: не найден список фильтров замечаний'],
    ["{ key: 'all', label: 'Все' }", 'assets/js/qualityIssueFilters.js: не найден фильтр всех замечаний'],
    ["{ key: 'error', label: 'Ошибки' }", 'assets/js/qualityIssueFilters.js: не найден фильтр ошибок'],
    ["{ key: 'warn', label: 'Важно' }", 'assets/js/qualityIssueFilters.js: не найден фильтр важных замечаний'],
    ["{ key: 'tip', label: 'Советы' }", 'assets/js/qualityIssueFilters.js: не найден фильтр советов'],
    ['id="qualityIssueFilters"', 'assets/js/qualityIssueFilters.js: не найден контейнер фильтров'],
    ['aria-label="Фильтр замечаний качества"', 'assets/js/qualityIssueFilters.js: фильтр должен иметь aria-label'],
    ['data-quality-filter=', 'assets/js/qualityIssueFilters.js: кнопки фильтра должны иметь data-quality-filter'],
    ['new MutationObserver(updateFilters)', 'assets/js/qualityIssueFilters.js: фильтры должны обновляться после перерендера списка'],
    ['button.setAttribute(\'aria-pressed\'', 'assets/js/qualityIssueFilters.js: активная кнопка фильтра должна иметь aria-pressed'],
    ['button.textContent = `${getFilterLabel(key)} ${count}`', 'assets/js/qualityIssueFilters.js: кнопки фильтра должны показывать счётчики'],
    ['item.hidden = !visible', 'assets/js/qualityIssueFilters.js: фильтр должен скрывать лишние замечания'],
    ['function getCounts(items)', 'assets/js/qualityIssueFilters.js: не найден подсчёт замечаний по уровням']
  ];

  for (const [snippet, message] of requiredIssueFilterSnippets) {
    if (!issueFiltersSource.includes(snippet)) {
      errors.push(message);
    }
  }
}

if (preprintSummarySource) {
  const requiredPreprintSummarySnippets = [
    ['const errorItems = items.filter((item) => item.classList.contains(\'error\'))', 'assets/js/preprintSummary.js: сводка должна отдельно собирать ошибки качества'],
    ['const warningItems = items.filter((item) => item.classList.contains(\'warn\'))', 'assets/js/preprintSummary.js: сводка должна отдельно собирать важные замечания'],
    ['errorTitles: getIssueTitles(errorItems)', 'assets/js/preprintSummary.js: не найдены названия ошибок в сводке печати'],
    ['warningTitles: getIssueTitles(warningItems)', 'assets/js/preprintSummary.js: не найдены названия предупреждений в сводке печати'],
    ['function getIssueTitles(items)', 'assets/js/preprintSummary.js: не найден helper названий замечаний'],
    ['.slice(0, 3)', 'assets/js/preprintSummary.js: сводка должна ограничивать список названий замечаний'],
    ['function formatIssueTitles(titles)', 'assets/js/preprintSummary.js: не найден формат названий замечаний'],
    ['Критичные замечания: ${quality.errors}.${formatIssueTitles(quality.errorTitles)}', 'assets/js/preprintSummary.js: критичные замечания должны выводиться с названиями'],
    ['Важные замечания: ${quality.warnings}.${formatIssueTitles(quality.warningTitles)}', 'assets/js/preprintSummary.js: важные замечания должны выводиться с названиями']
  ];

  for (const [snippet, message] of requiredPreprintSummarySnippets) {
    if (!preprintSummarySource.includes(snippet)) {
      errors.push(message);
    }
  }
}

if (stylesSource) {
  for (const className of ['.quality-fix-btn', '.quality-extra-fix-btn', '#printBtn.print-blocked', '#printBtn.print-has-warnings', '.qitem.quality-focus-target']) {
    if (!stylesSource.includes(className)) {
      errors.push(`assets/css/ui-improvements.css: не найден стиль ${className}`);
    }
  }
}

if (levelStylesSource) {
  for (const className of ['.quality-level', '.quality-level-error', '.quality-level-warn', '.quality-level-tip']) {
    if (!levelStylesSource.includes(className)) {
      errors.push(`assets/css/quality-level-labels.css: не найден стиль ${className}`);
    }
  }
}

if (issueSummaryStylesSource) {
  const requiredIssueSummaryClasses = [
    '.quality-issue-summary',
    '.quality-summary-chip',
    '.quality-summary-chip:hover',
    '.quality-summary-error',
    '.quality-summary-warn',
    '.quality-summary-tip',
    '.quality-summary-good',
    '.quality-priority-hint',
    '.quality-priority-hint.error',
    '.quality-priority-hint.warn',
    '.quality-priority-hint.tip',
    '.quality-priority-hint.good',
    '.quality-issue-filters',
    '.quality-issue-filters button',
    '.quality-issue-filters button.active'
  ];

  for (const className of requiredIssueSummaryClasses) {
    if (!issueSummaryStylesSource.includes(className)) {
      errors.push(`assets/css/quality-issue-summary.css: не найден стиль ${className}`);
    }
  }
}

if (indexSource) {
  const requiredScripts = [
    'assets/js/app.js',
    'assets/js/qualityLevelLabels.js',
    'assets/js/qualityIssueSummary.js',
    'assets/js/qualityPriorityHint.js',
    'assets/js/qualityPrintGuardHint.js',
    'assets/js/qualityIssueFilters.js',
    'assets/js/spnContactEditor.js',
    'assets/js/spnTearOffEditor.js',
    'assets/js/spnBrandEditor.js',
    'assets/js/qualityExtraActions.js'
  ];

  for (const script of requiredScripts) {
    if (!indexSource.includes(`src="${script}"`)) {
      errors.push(`index.html: не подключён ${script}`);
    }
  }

  const requiredStyles = [
    'assets/css/ui-improvements.css',
    'assets/css/quality-level-labels.css',
    'assets/css/quality-issue-summary.css'
  ];

  for (const style of requiredStyles) {
    if (!indexSource.includes(`href="${style}"`)) {
      errors.push(`index.html: не подключён ${style}`);
    }
  }

  const appIndex = indexSource.indexOf('src="assets/js/app.js"');
  const labelsIndex = indexSource.indexOf('src="assets/js/qualityLevelLabels.js"');
  const summaryIndex = indexSource.indexOf('src="assets/js/qualityIssueSummary.js"');
  const priorityIndex = indexSource.indexOf('src="assets/js/qualityPriorityHint.js"');
  const printGuardIndex = indexSource.indexOf('src="assets/js/qualityPrintGuardHint.js"');
  const filtersIndex = indexSource.indexOf('src="assets/js/qualityIssueFilters.js"');
  if (appIndex >= 0 && labelsIndex >= 0 && labelsIndex < appIndex) {
    errors.push('index.html: qualityLevelLabels.js должен подключаться после app.js');
  }
  if (appIndex >= 0 && summaryIndex >= 0 && summaryIndex < appIndex) {
    errors.push('index.html: qualityIssueSummary.js должен подключаться после app.js');
  }
  if (labelsIndex >= 0 && summaryIndex >= 0 && summaryIndex < labelsIndex) {
    errors.push('index.html: qualityIssueSummary.js должен подключаться после qualityLevelLabels.js');
  }
  if (summaryIndex >= 0 && priorityIndex >= 0 && priorityIndex < summaryIndex) {
    errors.push('index.html: qualityPriorityHint.js должен подключаться после qualityIssueSummary.js');
  }
  if (priorityIndex >= 0 && printGuardIndex >= 0 && printGuardIndex < priorityIndex) {
    errors.push('index.html: qualityPrintGuardHint.js должен подключаться после qualityPriorityHint.js');
  }
  if (printGuardIndex >= 0 && filtersIndex >= 0 && filtersIndex < printGuardIndex) {
    errors.push('index.html: qualityIssueFilters.js должен подключаться после qualityPrintGuardHint.js');
  }

  const brandIndex = indexSource.indexOf('src="assets/js/spnBrandEditor.js"');
  const actionsIndex = indexSource.indexOf('src="assets/js/qualityExtraActions.js"');
  if (brandIndex >= 0 && actionsIndex >= 0 && actionsIndex < brandIndex) {
    errors.push('index.html: qualityExtraActions.js должен подключаться после spnBrandEditor.js');
  }
}

if (errors.length) {
  console.error('\nОшибки быстрых исправлений контроля качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка быстрых исправлений контроля качества пройдена.');

function extractQuickActions(source) {
  return [...source.matchAll(/\{[^{}]*\}/g)]
    .map(match => match[0])
    .map(block => ({
      title: getStringProperty(block, 'title'),
      action: getStringProperty(block, 'action'),
      label: getStringProperty(block, 'label')
    }))
    .filter(item => item.title !== null || item.action !== null || item.label !== null);
}

function getStringProperty(block, propertyName) {
  const pattern = new RegExp(`${propertyName}:\\s*['\"]([^'\"]*)['\"]`);
  return block.match(pattern)?.[1] ?? null;
}

function countItems(items) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return counts;
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${toProjectPath(filePath)} не найден`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
