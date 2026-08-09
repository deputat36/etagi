import fs from 'node:fs';

const errors = [];
const read = file => {
  if(!fs.existsSync(file)){ errors.push(`${file}: отсутствует`); return ''; }
  return fs.readFileSync(file, 'utf8');
};

const jsonText = read('data/performance-budget.json');
let budget = {};
try { budget = JSON.parse(jsonText); } catch(error){ errors.push(`performance-budget.json: ${error.message}`); }
const pkg = JSON.parse(read('package.json') || '{}');
const workflow = read('.github/workflows/validate.yml');
const docs = read('docs/performance-budget.md');
const maintenance = read('docs/maintenance-guide.md');
const runner = read('tools/run-performance-budget.mjs');

if(budget.schemaVersion !== 1) errors.push('performance-budget.json: schemaVersion должен быть 1');
if(budget.warmups < 2) errors.push('performance-budget.json: нужно минимум 2 warm-up');
if(budget.samples < 5) errors.push('performance-budget.json: нужно минимум 5 samples');
for(const count of ['1','2','4','8']){
  const item = budget.counts?.[count];
  if(!item || !Number.isFinite(item.medianCeilingMs) || item.medianCeilingMs <= 0) errors.push(`performance-budget.json: нет fixed ceiling для ${count}`);
  const baselineValues = [item?.baselineMedianMs, item?.baselineWorstMs];
  if(baselineValues.some(value => value !== null && !Number.isFinite(value))) errors.push(`performance-budget.json: baseline ${count} должен быть number или null`);
}
if(budget.scaling?.from !== 4 || budget.scaling?.to !== 8) errors.push('performance-budget.json: scaling должен контролировать 4→8');
if(pkg.scripts?.['performance:budget'] !== 'node tools/run-performance-budget.mjs') errors.push('package.json: отсутствует performance:budget');
if(pkg.scripts?.['validate:performance-budget'] !== 'node tools/validate-performance-budget.mjs') errors.push('package.json: отсутствует validate:performance-budget');
for(const token of ['npm run smoke:browser','npm run smoke:ui-actions','npm run performance:budget']) if(!workflow.includes(token)) errors.push(`validate.yml: отсутствует ${token}`);
const browserIndex = workflow.indexOf('npm run smoke:browser');
const uiIndex = workflow.indexOf('npm run smoke:ui-actions');
const perfIndex = workflow.indexOf('npm run performance:budget');
if(!(browserIndex >= 0 && browserIndex < uiIndex && uiIndex < perfIndex)) errors.push('validate.yml: performance budget должен идти после browser/UI smoke');
if(!workflow.includes('performance-budget-failure.json')) errors.push('validate.yml: failure JSON не включён в artifact');
for(const token of ['1 / 2 / 4 / 8','baseline','median','4 → 8']) if(!docs.toLowerCase().includes(token.toLowerCase())) errors.push(`performance-budget.md: отсутствует ${token}`);
if(!maintenance.includes('npm run performance:budget') || !maintenance.includes('npm run validate:performance-budget')) errors.push('maintenance-guide.md: команды performance budget не синхронизированы');
for(const token of ['MutationObserver','medianMs','worstMs','syncMedianMs']) if(!runner.includes(token)) errors.push(`run-performance-budget.mjs: отсутствует ${token}`);

if(errors.length){
  console.error('Ошибки performance budget:\n' + errors.map(x => `- ${x}`).join('\n'));
  process.exit(1);
}
console.log('Проверка performance budget пройдена.');
