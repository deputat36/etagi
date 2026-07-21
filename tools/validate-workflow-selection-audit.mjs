import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  audit:'data/workflow-selection-audit.json',
  wizard:'assets/js/spnWizard.js',
  app:'assets/js/app.js',
  uiMode:'assets/js/spnUiMode.js',
  uiModeCss:'assets/css/spn-ui-mode.css',
  docs:'docs/workflow-selection-audit.md',
  smoke:'tools/workflow-selection-smoke.html',
  runner:'tools/run-workflow-selection-smoke.mjs',
  workflow:'.github/workflows/validate-workflow-selection.yml'
};
const sources = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readRequired(file)]));
const audit = readJson(files.audit, sources.audit);

if(audit){
  if(audit.schemaVersion !== 1) errors.push(`${files.audit}: schemaVersion должен быть 1`);
  if(audit.auditedMain !== 'bb24feb2d71f11a2c0f8ee35379530b5c418200e') errors.push(`${files.audit}: неверный auditedMain`);
  const levels = Array.isArray(audit.levels) ? audit.levels : [];
  const levelIds = levels.map(item => item.id);
  if(JSON.stringify(levelIds) !== JSON.stringify(['situation','task','scenario','template'])) errors.push(`${files.audit}: уровни должны идти situation → task → scenario → template`);
  const findings = Array.isArray(audit.findings) ? audit.findings : [];
  const byId = new Map(findings.map(item => [item.id, item]));
  for(const id of ['WF-01','WF-02','WF-03','WF-04','WF-05','WF-06']){
    if(!byId.has(id)) errors.push(`${files.audit}: отсутствует finding ${id}`);
  }
  for(const id of ['WF-01','WF-02','WF-03','WF-04','WF-05','WF-06']){
    if(byId.get(id)?.status !== 'resolved') errors.push(`${files.audit}: ${id} должен иметь status=resolved`);
  }
  if(audit.decisionForNextPr?.priority !== 'Этап 4: названия wizard + сохранение и перенос') errors.push(`${files.audit}: неверный следующий приоритет этапа 4`);
}

requireSnippets(files.wizard, sources.wizard, [
  "const situations = [",
  "id: 'tellerman-sad'",
  "goal: 'newbuild'",
  "new CustomEvent('spn:workflow-selection'",
  'situationId: item.id,',
  'scenario: item.scenario,',
  `data-spn-scenario="\${item.scenario || 'all'}"`,
  'printCount: item.printCount,',
  'layoutMode: item.layoutMode,',
  "document.addEventListener('spn:task-selection'",
  "const selectedSituation = Boolean(document.querySelector('[data-spn-situation].active'));"
]);
forbidSnippets(files.wizard, sources.wizard, [
  "Boolean(document.querySelector('[data-spn-situation].active')) || Boolean(value('templateSearch'))",
  'goalBtn.click()',
  'window.setTimeout(() => {',
  'applyRecommendedSettings(item)'
]);

requireSnippets(files.app, sources.app, [
  "document.addEventListener('spn:workflow-selection', applyWorkflowSelection);",
  'function applyWorkflowSelection(event)',
  "state.templateId = '';",
  "selectedScenario = scenarioPresets.some(item => item.id === detail.scenario) ? detail.scenario : 'all';",
  "$('templateSearch').value = String(detail.query || '');",
  "$('templateDensityFilter').value = 'all';",
  'if(nextLayoutMode) state = applyLayoutModePreservingMedia(state, nextLayoutMode);',
  'state.printCount = nextPrintCount;',
  'function handleUiModeChange(event)',
  `inferTemplateScenario(activeTemplate, 'all')`,
  'function inferTemplateScenario(t, currentScenario = selectedScenario)',
  'selectedScenario = inferTemplateScenario(t);',
  "new CustomEvent('spn:task-selection'",
  'selectedScenario = btn.dataset.scenario;',
  'goal: t.goal,',
  'templateId: t.id,'
]);
const renderGoalsSource = extractBetween(sources.app, 'function renderGoals(){', 'function applyWorkflowSelection(event)');
if(!renderGoalsSource) errors.push(`${files.app}: не найден блок renderGoals`);
else if(renderGoalsSource.includes('applyTemplate(')) errors.push(`${files.app}: выбор задачи не должен применять шаблон автоматически`);

requireSnippets(files.docs, sources.docs, [
  '# Цепочка выбора рабочего пути СПН',
  'рабочая ситуация → задача → сценарий → шаблон',
  'WF-01 — исправлено',
  'WF-02 — исправлено',
  'WF-03 — исправлено',
  'WF-04 — исправлено',
  'WF-05 — исправлено',
  'WF-06 — исправлено',
  'Текущий макет не заменяется до явного выбора шаблона.',
  'WF-01–WF-06 закрыты автоматическими контрактами'
]);
requireSnippets(files.smoke, sources.smoke, [
  'id="workflowSelectionSmokeResult"',
  "click(doc, '[data-spn-situation=\"tellerman-sad\"]')",
  'explicitTemplateClicks === 0',
  'ситуация заменила текст текущего макета',
  'до явного выбора неожиданно остался активный шаблон',
  'ситуация: задача, поиск и настройки применены одной транзакцией',
  'задача: фильтрует библиотеку без автоматического шаблона',
  'сценарий: остаётся дополнительным фильтром и не применяет шаблон',
  'шаблон: применяется явно и синхронизирует сценарий',
  'режимы: повторный сценарный выбор скрыт в простом пути',
  'маршрут: ручной поиск не подменяет явный выбор ситуации',
  'Последнее действие:',
  'Состояние:'
]);
forbidSnippets(files.smoke, sources.smoke, ['fetch(', 'XMLHttpRequest', 'localStorage.setItem']);
requireSnippets(files.uiMode, sources.uiMode, [
  "new CustomEvent('spn:ui-mode-change'",
  'detail:{mode:next}'
]);
requireSnippets(files.uiModeCss, sources.uiModeCss, [
  'body[data-spn-ui-mode="quick"] .scenario-filter-row',
  'body[data-spn-ui-mode="newbie"] .scenario-filter-row',
  '.scenario-filter-label'
]);
requireSnippets(files.runner, sources.runner, [
  "path.join(rootDir, 'workflow-selection-failure.log')",
  'for(let attempt = 1; attempt <= 2; attempt += 1)',
  "'--virtual-time-budget=42000'",
  "'--dump-dom'",
  'workflowSelectionSmokeResult',
  'tools/workflow-selection-smoke.html',
  'fs.writeFileSync(failureLogPath'
]);
requireSnippets(files.workflow, sources.workflow, [
  'name: Validate workflow selection audit',
  'workflow-selection-audit:',
  'run: node tools/validate-workflow-selection-audit.mjs',
  'run: node tools/run-workflow-selection-smoke.mjs',
  'name: workflow-selection-failure',
  'path: workflow-selection-failure.log'
]);
const staticStep = sources.workflow.indexOf('run: node tools/validate-workflow-selection-audit.mjs');
const browserStep = sources.workflow.indexOf('run: node tools/run-workflow-selection-smoke.mjs');
if(staticStep < 0 || browserStep < 0 || staticStep > browserStep) errors.push(`${files.workflow}: статическая проверка должна выполняться до browser smoke`);

if(errors.length){
  console.error('\nОшибки цепочки выбора:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Цепочка выбора WF-01–WF-06 упрощена и подтверждена; следующий этап — названия wizard и сохранение/перенос.');

function extractBetween(source, start, end){
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if(startIndex < 0 || endIndex < 0) return '';
  return source.slice(startIndex, endIndex);
}
function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный фрагмент — ${snippet}`);
  }
}
function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}
function readJson(file, source){
  try{return JSON.parse(source || '{}');}
  catch(error){errors.push(`${file}: JSON не читается — ${error.message}`);return null;}
}
function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
