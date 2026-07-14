import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const overridesPath = path.join(dataDir, 'template_office_overrides.json');
const portfolioPath = path.join(dataDir, 'template_portfolio_status.json');
const loaderPath = path.join(rootDir, 'assets/js/templates.js');
const validLevels = new Set(['newbie', 'experienced', 'manager']);
const validRisks = new Set(['low', 'medium', 'high']);
const allowedOverridePackages = new Set(['templates_extra.json', 'templates_trust.json', 'templates_custom.json']);
const errors = [];

const templateFiles = fs.readdirSync(dataDir)
  .filter(file => /^templates.*\.json$/.test(file))
  .sort();
const templates = templateFiles.flatMap(readTemplateFile);
const templateById = new Map(templates.map(template => [template.id, template]));
const overrides = readObject(overridesPath, {version:1, templates:{}});
const portfolio = readObject(portfolioPath, {defaultStatus:'working', packageDefaults:{}, templates:{}});
const loaderSource = readRequired(loaderPath);
const scenarioOwners = new Map();

for(const template of templates){
  const scenario = String(template?.office?.scenario || '').trim();
  if(scenario) registerScenario(scenario, `template:${template.id}`);
}

if(overrides.version !== 1) errors.push(`template_office_overrides.json: ожидается version=1, найдено ${overrides.version}`);
if(!overrides.templates || typeof overrides.templates !== 'object' || Array.isArray(overrides.templates)) {
  errors.push('template_office_overrides.json: templates должен быть объектом');
}

const expectedIds = new Set([
  'seller_empty_flat','buyer_first_flat','buyer_maternity_capital','buyer_low_budget',
  'object_ready_move_in','object_no_repair_sale','newbuild_family_mortgage','newbuild_layout_choice',
  'private_buy_flat','private_sell_flat',
  'custom_blank_readable','custom_blank_entrance','custom_object_photo_showcase',
  'custom_private_note','custom_service_consultation','custom_ab_test_short',
  'trust_seller_safe_sale','trust_seller_no_pressure','trust_service_documents_check',
  'trust_buyer_safe_purchase','trust_object_clear_terms','trust_private_neighbor_question'
]);

const expectedPolicies = {
  custom_blank_readable: {recommended:false, level:'manager', risk:'medium', recommendedPrintCount:2},
  custom_blank_entrance: {recommended:false, level:'manager', risk:'high', recommendedPrintCount:4},
  custom_object_photo_showcase: {recommended:false, level:'manager', risk:'medium', recommendedPrintCount:1},
  custom_private_note: {recommended:false, level:'manager', risk:'high', recommendedPrintCount:4},
  custom_service_consultation: {recommended:false, level:'manager', risk:'high', recommendedPrintCount:2},
  custom_ab_test_short: {recommended:false, level:'manager', risk:'medium', recommendedPrintCount:4},
  trust_seller_safe_sale: {recommended:true, level:'newbie', risk:'low', recommendedPrintCount:2},
  trust_seller_no_pressure: {recommended:true, level:'newbie', risk:'low', recommendedPrintCount:4},
  trust_service_documents_check: {recommended:false, level:'manager', risk:'high', recommendedPrintCount:2},
  trust_buyer_safe_purchase: {recommended:true, level:'newbie', risk:'low', recommendedPrintCount:2},
  trust_object_clear_terms: {recommended:true, level:'manager', risk:'medium', recommendedPrintCount:2},
  trust_private_neighbor_question: {recommended:false, level:'manager', risk:'high', recommendedPrintCount:4}
};

const expectedStatuses = {
  custom_private_note: 'test',
  custom_service_consultation: 'test',
  custom_ab_test_short: 'test',
  trust_service_documents_check: 'test',
  trust_private_neighbor_question: 'test'
};

for(const id of expectedIds){
  if(!overrides.templates?.[id]) errors.push(`template_office_overrides.json: отсутствует обязательная разметка ${id}`);
}

for(const [id, rule] of Object.entries(overrides.templates || {})){
  const template = templateById.get(id);
  const label = `templates.${id}`;
  if(!template){ errors.push(`${label}: templateId не найден`); continue; }
  if(!allowedOverridePackages.has(template.__file)) errors.push(`${label}: пакет ${template.__file} не разрешён для office-overrides`);
  if(template.office) errors.push(`${label}: исходный шаблон уже имеет office; не нужно дублировать его в overrides`);

  const status = resolvePortfolioStatus(template, portfolio);
  if(status === 'deprecated') errors.push(`${label}: устаревший шаблон не должен получать новую office-разметку`);
  if(expectedStatuses[id] && status !== expectedStatuses[id]) errors.push(`${label}: portfolio status должен быть ${expectedStatuses[id]}`);

  if(!rule || typeof rule !== 'object' || Array.isArray(rule)){ errors.push(`${label}: правило должно быть объектом`); continue; }

  const tags = Array.isArray(rule.tags) ? rule.tags.map(tag => String(tag || '').trim()).filter(Boolean) : [];
  const office = rule.office;
  if(!tags.length) errors.push(`${label}: нужны дополнительные теги`);
  if(new Set(tags).size !== tags.length) errors.push(`${label}: дополнительные теги не должны повторяться`);
  if(!tags.includes('офис')) errors.push(`${label}: нужен тег офис`);

  if(!office || typeof office !== 'object' || Array.isArray(office)){ errors.push(`${label}: office должен быть объектом`); continue; }

  if(typeof office.recommended !== 'boolean') errors.push(`${label}: office.recommended должен быть boolean`);
  if(!validLevels.has(office.level)) errors.push(`${label}: неизвестный office.level ${office.level}`);
  if(!validRisks.has(office.risk)) errors.push(`${label}: неизвестный office.risk ${office.risk}`);
  if(typeof office.scenario !== 'string' || !office.scenario.trim()) errors.push(`${label}: office.scenario должен быть непустой строкой`);
  if(office.scenario && !/^[a-z0-9_\-]+$/i.test(office.scenario)) errors.push(`${label}: office.scenario должен быть латиницей, цифрами, _ или -`);
  if(Number.isInteger(office.recommendedPrintCount) === false || office.recommendedPrintCount < 1 || office.recommendedPrintCount > 12) errors.push(`${label}: office.recommendedPrintCount должен быть целым числом от 1 до 12`);
  if(typeof office.managerNote !== 'string' || office.managerNote.trim().length < 20) errors.push(`${label}: office.managerNote должен объяснять проверку минимум 20 символами`);
  if(office.level === 'newbie' && !tags.includes('новичку')) errors.push(`${label}: уровень newbie требует тег новичку`);
  if(office.level === 'manager' && !tags.includes('менеджер')) errors.push(`${label}: уровень manager требует тег менеджер`);
  if(office.recommended === true && !tags.includes('рекомендовано')) errors.push(`${label}: recommended=true требует тег рекомендовано`);
  if(office.risk === 'high' && office.level !== 'manager') errors.push(`${label}: высокий риск допускается только уровню manager`);
  if(status === 'test' && !tags.includes('тестовый')) errors.push(`${label}: тестовый шаблон должен иметь тег тестовый`);
  if(id.startsWith('custom_') && (office.recommended !== false || office.level !== 'manager')) errors.push(`${label}: custom-конструктор должен оставаться manager и not recommended`);

  const expectedPolicy = expectedPolicies[id];
  if(expectedPolicy){
    for(const [field, expected] of Object.entries(expectedPolicy)){
      if(office[field] !== expected) errors.push(`${label}: ${field} должен быть ${JSON.stringify(expected)}`);
    }
  }

  if(office.scenario) registerScenario(office.scenario, `override:${id}`);
}

const noPressureTemplate = templateById.get('trust_seller_no_pressure');
const noPressureText = JSON.stringify(noPressureTemplate?.data || {});
if(/реальн(?:ая|ую)\s+цен/i.test(noPressureText)) errors.push('trust_seller_no_pressure: нельзя обещать «реальную цену» без полноценной оценки');
if(!noPressureText.includes('ориентировочную стоимость')) errors.push('trust_seller_no_pressure: должна использоваться формулировка «ориентировочную стоимость»');

requireSnippets('assets/js/templates.js', loaderSource, [
  "const TEMPLATE_OFFICE_OVERRIDES_FILE = 'data/template_office_overrides.json';",
  'loadTemplateOfficeOverrides','enrichTemplateOffice','normalizeOfficeOverride','emptyOfficeOverrides',
  'office.scenario','office.managerNote','...override.tags'
]);

if(errors.length){
  console.error('\nОшибки реестра office-разметки шаблонов:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Office overrides: ${Object.keys(overrides.templates || {}).length}`);
console.log('Проверка реестра office-разметки пройдена.');

function registerScenario(scenario, owner){
  if(scenarioOwners.has(scenario)) errors.push(`office.scenario ${scenario} повторяется: ${scenarioOwners.get(scenario)} и ${owner}`);
  else scenarioOwners.set(scenario, owner);
}
function resolvePortfolioStatus(template, registry){
  const packageRule = normalizePortfolioRule(registry.packageDefaults?.[template.__file]);
  const templateRule = normalizePortfolioRule(registry.templates?.[template.id]);
  return templateRule.status || packageRule.status || registry.defaultStatus || 'working';
}
function normalizePortfolioRule(rule){
  if(typeof rule === 'string') return {status:rule};
  if(!rule || typeof rule !== 'object' || Array.isArray(rule)) return {status:''};
  return {status:String(rule.status || '').trim()};
}
function readTemplateFile(file){
  const source = readRequired(path.join(dataDir, file));
  if(!source) return [];
  try{
    const parsed = JSON.parse(source);
    if(!Array.isArray(parsed)){ errors.push(`${file}: корень должен быть массивом`); return []; }
    return parsed.map(template => ({...template, __file:file}));
  } catch(error){ errors.push(`${file}: JSON не читается — ${error.message}`); return []; }
}
function readObject(filePath, fallback){
  const source = readRequired(filePath);
  if(!source) return fallback;
  try{
    const parsed = JSON.parse(source);
    if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed)){ errors.push(`${path.basename(filePath)}: корень должен быть объектом`); return fallback; }
    return parsed;
  } catch(error){ errors.push(`${path.basename(filePath)}: JSON не читается — ${error.message}`); return fallback; }
}
function requireSnippets(file, source, snippets){ for(const snippet of snippets){ if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`); } }
function readRequired(filePath){
  if(!fs.existsSync(filePath)){ errors.push(`${path.relative(rootDir, filePath).replaceAll('\\', '/')}: файл не найден`); return ''; }
  return fs.readFileSync(filePath, 'utf8');
}
