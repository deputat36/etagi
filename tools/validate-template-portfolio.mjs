import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const registryPath = path.join(dataDir, 'template_portfolio_status.json');
const loaderPath = path.join(rootDir, 'assets/js/templates.js');
const badgesPath = path.join(rootDir, 'assets/js/spnTemplateCardBadges.js');
const validStatuses = new Set(['working', 'test', 'deprecated']);
const errors = [];

const templateFiles = fs.readdirSync(dataDir)
  .filter(file => /^templates.*\.json$/.test(file))
  .sort();
const templates = templateFiles.flatMap(readTemplateFile);
const templateIds = new Set(templates.map(template => template.id).filter(Boolean));
const templateFileById = new Map(templates.map(template => [template.id, template.__file]));
const registry = readRegistry();
const loaderSource = readRequired(loaderPath);
const badgesSource = readRequired(badgesPath);

if(!validStatuses.has(registry.defaultStatus)) {
  errors.push(`template_portfolio_status.json: неизвестный defaultStatus ${registry.defaultStatus}`);
}

for(const [file, rule] of Object.entries(registry.packageDefaults || {})){
  if(!templateFiles.includes(file)) errors.push(`template_portfolio_status.json: неизвестный пакет ${file}`);
  validateRule(`packageDefaults.${file}`, rule, false);
}

for(const [id, rule] of Object.entries(registry.templates || {})){
  if(!templateIds.has(id)) errors.push(`template_portfolio_status.json: неизвестный templateId ${id}`);
  validateRule(`templates.${id}`, rule, true);

  const normalized = normalizeRule(rule);
  if(normalized.status === 'deprecated'){
    if(!normalized.replacementId) errors.push(`templates.${id}: устаревший шаблон должен иметь replacementId`);
    if(normalized.replacementId === id) errors.push(`templates.${id}: replacementId не может ссылаться на себя`);
    if(normalized.replacementId && !templateIds.has(normalized.replacementId)) {
      errors.push(`templates.${id}: replacementId ${normalized.replacementId} не найден в библиотеке`);
    }
    if(normalized.replacementId && templateIds.has(normalized.replacementId)){
      const replacementStatus = resolveStatus(normalized.replacementId);
      if(replacementStatus !== 'working') {
        errors.push(`templates.${id}: replacementId ${normalized.replacementId} должен быть working, сейчас ${replacementStatus}`);
      }
    }
  }
  else if(normalized.replacementId){
    errors.push(`templates.${id}: replacementId допускается только для статуса deprecated`);
  }
}

checkReplacementCycles(registry.templates || {});

requireSnippets('assets/js/templates.js', loaderSource, [
  "const TEMPLATE_PORTFOLIO_FILE = 'data/template_portfolio_status.json';",
  'loadTemplatePortfolioRegistry',
  'enrichTemplatePortfolio',
  'portfolio:',
  "status: templateRule.status || packageRule.status || registry.defaultStatus || 'working'",
  'replacementId: templateRule.replacementId',
  'template?.portfolio?.status',
  'template?.portfolio?.replacementId'
]);

requireSnippets('assets/js/spnTemplateCardBadges.js', badgesSource, [
  "portfolio?.status === 'deprecated'",
  "portfolio?.status === 'test'",
  "['deprecated', 'Устарел']",
  "['test', 'Тест']",
  'portfolio.replacementId',
  'escapeHtml(title)',
  'escapeHtml(text)',
  'tpl-office-badge-deprecated',
  'tpl-office-badge-test',
  'tpl-card-office-reason-deprecated',
  'tpl-card-office-reason-test'
]);

if(errors.length){
  console.error('\nОшибки реестра жизненного цикла шаблонов:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const statusCounts = countStatuses(templates, registry);
console.log(`Шаблонов: ${templates.length}`);
console.log(`Статусы: ${Object.entries(statusCounts).map(([status, count]) => `${status}=${count}`).join(', ')}`);
console.log('Проверка жизненного цикла шаблонов пройдена.');

function readTemplateFile(file){
  const source = readRequired(path.join(dataDir, file));
  if(!source) return [];
  try{
    const parsed = JSON.parse(source);
    if(!Array.isArray(parsed)){
      errors.push(`${file}: корень должен быть массивом`);
      return [];
    }
    return parsed.map(template => ({...template, __file:file}));
  } catch(error){
    errors.push(`${file}: JSON не читается — ${error.message}`);
    return [];
  }
}

function readRegistry(){
  const source = readRequired(registryPath);
  if(!source) return {defaultStatus:'working', packageDefaults:{}, templates:{}};
  try{
    const parsed = JSON.parse(source);
    if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed)){
      errors.push('template_portfolio_status.json: корень должен быть объектом');
      return {defaultStatus:'working', packageDefaults:{}, templates:{}};
    }
    if(parsed.version !== 1) errors.push(`template_portfolio_status.json: ожидается version=1, найдено ${parsed.version}`);
    return {
      defaultStatus: parsed.defaultStatus || 'working',
      packageDefaults: parsed.packageDefaults && typeof parsed.packageDefaults === 'object' && !Array.isArray(parsed.packageDefaults) ? parsed.packageDefaults : {},
      templates: parsed.templates && typeof parsed.templates === 'object' && !Array.isArray(parsed.templates) ? parsed.templates : {}
    };
  } catch(error){
    errors.push(`template_portfolio_status.json: JSON не читается — ${error.message}`);
    return {defaultStatus:'working', packageDefaults:{}, templates:{}};
  }
}

function validateRule(label, rule, allowReplacement){
  const normalized = normalizeRule(rule);
  if(!validStatuses.has(normalized.status)) errors.push(`${label}: неизвестный status ${normalized.status}`);
  if(!normalized.reason || normalized.reason.length < 20) errors.push(`${label}: reason должен понятно объяснять статус минимум 20 символами`);
  if(!allowReplacement && normalized.replacementId) errors.push(`${label}: packageDefault не должен задавать replacementId`);
}

function normalizeRule(rule){
  if(typeof rule === 'string') return {status:rule, reason:'', replacementId:''};
  if(!rule || typeof rule !== 'object' || Array.isArray(rule)) return {status:'', reason:'', replacementId:''};
  return {
    status: String(rule.status || '').trim(),
    reason: String(rule.reason || '').trim(),
    replacementId: String(rule.replacementId || '').trim()
  };
}

function resolveStatus(id){
  const file = templateFileById.get(id);
  const packageRule = normalizeRule(registry.packageDefaults?.[file]);
  const templateRule = normalizeRule(registry.templates?.[id]);
  return templateRule.status || packageRule.status || registry.defaultStatus || 'working';
}

function checkReplacementCycles(rules){
  for(const id of Object.keys(rules)){
    const visited = new Set([id]);
    let current = id;
    while(true){
      const rule = normalizeRule(rules[current]);
      if(rule.status !== 'deprecated' || !rule.replacementId) break;
      if(visited.has(rule.replacementId)){
        errors.push(`template_portfolio_status.json: цикл replacementId — ${[...visited, rule.replacementId].join(' → ')}`);
        break;
      }
      visited.add(rule.replacementId);
      current = rule.replacementId;
    }
  }
}

function countStatuses(items, registryData){
  const counts = {working:0, test:0, deprecated:0};
  for(const template of items){
    const packageRule = normalizeRule(registryData.packageDefaults?.[template.__file]);
    const templateRule = normalizeRule(registryData.templates?.[template.id]);
    const status = templateRule.status || packageRule.status || registryData.defaultStatus || 'working';
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
}

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function readRequired(filePath){
  if(!fs.existsSync(filePath)){
    errors.push(`${path.relative(rootDir, filePath).replaceAll('\\', '/')}: файл не найден`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}
