import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const files = [
  'data/templates_borisoglebsk.json',
  'data/templates_borisoglebsk_expanded.json'
];
const loaderPath = 'assets/js/templates.js';
const errors = [];

const expectedIds = new Set([
  'bgo_seller_center_flat',
  'bgo_seller_aerodromnaya',
  'bgo_seller_north_area',
  'bgo_object_private_house',
  'bgo_object_aerodromnaya_newbuild_style',
  'bgo_buyer_family_flat',
  'bgo_newbuild_waitlist',
  'bgo_service_price_check',
  'bgo_private_buy_house',
  'bgo_service_inheritance_sale_plan',
  'bgo_seller_urgent_sale_strategy',
  'bgo_seller_exchange_larger_home',
  'bgo_seller_move_to_newbuild',
  'bgo_seller_house_resident_plan',
  'bgo_service_documents_before_sale',
  'bgo_object_land_plot',
  'bgo_object_commercial_space',
  'bgo_rent_owner_flat',
  'bgo_rent_tenant_search',
  'bgo_buyer_house_land',
  'bgo_brand_local_specialist'
]);

const minimumByGoal = {
  seller: 7,
  buyer: 2,
  object: 4,
  newbuild: 1,
  service: 3,
  rent: 2,
  brand: 1,
  private: 1
};

const forbiddenClaims = [
  'гарантируем продажу',
  'гарантия продажи',
  'продадим за 7 дней',
  'продадим за неделю',
  'готовый покупатель',
  'покупатель уже есть',
  'точная цена',
  'ипотека гарантирована',
  'одобрение гарантировано',
  '100% результат'
];

const templates = files.flatMap(readTemplateFile);
const loaderSource = readRequired(loaderPath);

for(const file of files){
  const normalized = file.replaceAll('\\', '/');
  if(!loaderSource.includes(`'${normalized}'`) && !loaderSource.includes(`"${normalized}"`)) {
    errors.push(`${loaderPath}: не подключён ${normalized}`);
  }
}

if(templates.length < 20) errors.push(`Локальных шаблонов Борисоглебска должно быть не меньше 20, найдено ${templates.length}`);

const seenIds = new Set();
const seenScenarios = new Set();
const goalCounts = {};

for(const template of templates){
  const id = String(template?.id || '');
  const label = id || 'шаблон без id';
  const office = template?.office;
  const tags = Array.isArray(template?.tags) ? template.tags : [];
  const text = normalizeText([
    template?.title,
    template?.note,
    ...tags,
    template?.data?.headline,
    template?.data?.description,
    template?.data?.benefits,
    template?.data?.customBlockTitle,
    template?.data?.customBlockText
  ].filter(Boolean).join(' '));

  if(seenIds.has(id)) errors.push(`${label}: повторяется id`);
  seenIds.add(id);

  goalCounts[template.goal] = (goalCounts[template.goal] || 0) + 1;

  if(!tags.includes('Борисоглебск')) errors.push(`${label}: нужен тег Борисоглебск`);
  if(!office || typeof office !== 'object') {
    errors.push(`${label}: отсутствуют office-метаданные`);
  } else {
    if(seenScenarios.has(office.scenario)) errors.push(`${label}: повторяется office.scenario ${office.scenario}`);
    seenScenarios.add(office.scenario);
    if(office.recommended === true && !tags.includes('рекомендовано')) errors.push(`${label}: рекомендованный шаблон должен иметь тег рекомендовано`);
    if(office.level === 'newbie' && !tags.includes('новичку')) errors.push(`${label}: уровень newbie требует тег новичку`);
    if(office.level === 'manager' && !tags.includes('менеджер')) errors.push(`${label}: уровень manager требует тег менеджер`);
    if(office.risk === 'high' && office.level !== 'manager') errors.push(`${label}: высокий риск разрешён только уровню manager`);
  }

  for(const claim of forbiddenClaims){
    if(text.includes(claim)) errors.push(`${label}: запрещённая неподтверждённая формулировка — ${claim}`);
  }
}

for(const id of expectedIds){
  if(!seenIds.has(id)) errors.push(`Отсутствует обязательный локальный сценарий ${id}`);
}

for(const [goal, minimum] of Object.entries(minimumByGoal)){
  const actual = goalCounts[goal] || 0;
  if(actual < minimum) errors.push(`Цель ${goal}: нужно минимум ${minimum} шаблонов, найдено ${actual}`);
}

if(errors.length){
  console.error('\nОшибки покрытия шаблонов Борисоглебска:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Локальных шаблонов Борисоглебска: ${templates.length}`);
console.log(`Office-сценариев: ${seenScenarios.size}`);
console.log(`Покрытие целей: ${Object.entries(goalCounts).sort().map(([goal, count]) => `${goal}=${count}`).join(', ')}`);
console.log('Проверка покрытия шаблонов Борисоглебска пройдена.');

function readTemplateFile(file){
  const source = readRequired(file);
  if(!source) return [];
  try{
    const parsed = JSON.parse(source);
    if(!Array.isArray(parsed)){
      errors.push(`${file}: корень должен быть массивом`);
      return [];
    }
    return parsed;
  } catch(error){
    errors.push(`${file}: JSON не читается — ${error.message}`);
    return [];
  }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function normalizeText(value){
  return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}
