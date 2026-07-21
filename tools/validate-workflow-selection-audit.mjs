import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  audit:'data/workflow-selection-audit.json',
  wizard:'assets/js/spnWizard.js',
  app:'assets/js/app.js',
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
  const findingIds = (Array.isArray(audit.findings) ? audit.findings : []).map(item => item.id);
  for(const id of ['WF-01','WF-02','WF-03','WF-04','WF-05','WF-06']){
    if(!findingIds.includes(id)) errors.push(`${files.audit}: отсутствует finding ${id}`);
  }
  if(audit.decisionForNextPr?.priority !== 'WF-01 + WF-02 + WF-06') errors.push(`${files.audit}: следующий приоритет должен быть WF-01 + WF-02 + WF-06`);
}

requireSnippets(files.wizard, sources.wizard, [
  "const situations = [",
  "id: 'tellerman-sad'",
  "goal: 'newbuild'",
  'goalBtn.click()',
  'window.setTimeout(() => {',
  'search.value = item.query;',
  'applyRecommendedSettings(item);',
  "Boolean(document.querySelector('[data-spn-situation].active')) || Boolean(value('templateSearch'))"
]);
requireSnippets(files.app, sources.app, [
  "selectedScenario = 'all';",
  'const first = filterTemplates(templates, state.goal)[0];',
  'if(first) applyTemplate(first);',
  'selectedScenario = btn.dataset.scenario;',
  'renderTemplates();',
  'goal: t.goal,',
  'templateId: t.id,'
]);
requireSnippets(files.docs, sources.docs, [
  '# Аудит цепочки выбора рабочего пути СПН',
  'рабочая ситуация → задача → сценарий → шаблон',
  'WF-01. Автоматический первый шаблон',
  'WF-02. Две фазы ситуации',
  'WF-03. Поиск и сценарий',
  'WF-04. Поиск засчитывается как ситуация',
  'WF-05. Задача и сценарий после шаблона',
  'WF-06. Скрытый автоматически выбранный шаблон',
  'Текущий макет не заменяется до явного выбора шаблона.',
  'Активная карточка всегда соответствует фактически применённому шаблону'
]);
requireSnippets(files.smoke, sources.smoke, [
  'id="workflowSelectionSmokeResult"',
  "click(doc, '[data-spn-situation=\"tellerman-sad\"]')",
  'explicitTemplateClicks === 0',
  'задача не применила первый шаблон автоматически',
  'после ситуации сценарий не остался Все',
  'автоматически применённый шаблон неожиданно остался видимым',
  'ситуация: автоматически применённый шаблон скрыт последующим поиском',
  "doc.querySelector('[data-scenario=\"newbuild\"]')?.classList.contains('active')",
  'сценарий: только фильтрует список и не применяет шаблон',
  'шаблон: применяется только после явного клика пользователя',
  'маршрут: ручной поиск засчитывается как выбранная ситуация',
  'Последнее действие:',
  'Состояние:'
]);
forbidSnippets(files.smoke, sources.smoke, ['fetch(', 'XMLHttpRequest', 'localStorage.setItem']);
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
  console.error('\nОшибки аудита цепочки выбора:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Аудит цепочки ситуация → задача → сценарий → шаблон подтверждён.');

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
