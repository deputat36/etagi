import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const reviewPath = path.join(rootDir, 'docs/manager-sensitive-template-review-3.86.0.md');
const evidencePath = path.join(rootDir, 'docs/manager-sensitive-template-evidence-3.86.0.md');
const overridesPath = path.join(dataDir, 'template_office_overrides.json');
const portfolioPath = path.join(dataDir, 'template_portfolio_status.json');
const errors = [];

const issue120Approved = {
  buyer_mortgage: {headline:'КВАРТИРА\nС ИПОТЕКОЙ', description:'Оценивайте свои финансовые возможности и риски.', benefits:'Подбор объекта\nПредварительный расчёт\nИпотечный специалист'},
  newbuild_mortgage: {headline:'НОВОСТРОЙКА\nС ИПОТЕКОЙ', description:'Оценивайте свои финансовые возможности и риски.', benefits:'Актуальные квартиры\nПредварительный расчёт\nИпотечный специалист'},
  service_mortgage: {headline:'КОНСУЛЬТАЦИЯ\nПО ИПОТЕКЕ', description:'Оценивайте свои финансовые возможности и риски.', benefits:'Разбор ситуации\nПредварительный расчёт\nПодготовка к заявке'},
  buyer_maternity_capital: {headline:'КВАРТИРА\nС МАТКАПИТАЛОМ', description:'Подскажу, какие варианты можно рассматривать, и помогу пройти сделку без лишней путаницы.', benefits:'Разбор условий\nПодбор объекта\nСопровождение документов'},
  newbuild_family_mortgage: {headline:'СЕМЕЙНАЯ\nИПОТЕКА И\nНОВОСТРОЙКА', description:'Оценивайте свои финансовые возможности и риски.', benefits:'Проверка условий\nАктуальные квартиры\nИпотечный специалист'}
};
const issue120MortgageIds = ['buyer_mortgage','newbuild_mortgage','service_mortgage','newbuild_family_mortgage'];
const issue120ShortTexts = {
  buyer_mortgage: 'КВАРТИРА С ИПОТЕКОЙ. Оценивайте свои финансовые возможности и риски.',
  newbuild_mortgage: 'НОВОСТРОЙКА С ИПОТЕКОЙ. Оценивайте свои финансовые возможности и риски.',
  service_mortgage: 'КОНСУЛЬТАЦИЯ ПО ИПОТЕКЕ. Оценивайте свои финансовые возможности и риски.',
  buyer_maternity_capital: 'КВАРТИРА С МАТКАПИТАЛОМ. Разберём условия и подберём варианты.',
  newbuild_family_mortgage: 'СЕМЕЙНАЯ ИПОТЕКА. Оценивайте свои финансовые возможности и риски.'
};
const issue120ReviewDecisions = {
  buyer_mortgage: 'Решение: Утверждённая редакция реализована в issue #120; шаблон остаётся test.',
  newbuild_mortgage: 'Решение: Утверждённая редакция реализована в issue #120; шаблон остаётся test.',
  service_mortgage: 'Решение: Утверждённая редакция реализована в issue #120; шаблон остаётся test.',
  buyer_maternity_capital: 'Решение: Утвердить без изменения рекламного текста; policy синхронизирована в issue #120.',
  newbuild_family_mortgage: 'Решение: Утверждённая редакция реализована в issue #120; шаблон остаётся test.'
};


const issue121Approved = {
  newbuild_no_commission: {
    title:'Новостройки с понятными условиями',
    headline:'НОВОСТРОЙКИ\nС ПОНЯТНЫМИ\nУСЛОВИЯМИ',
    description:'Подберу актуальные варианты и заранее объясню стоимость и порядок услуг.',
    benefits:'Актуальные квартиры\nСравнение вариантов\nУсловия по договору',
    shortText:'Новостройки с понятными условиями. Подберу актуальные варианты.'
  },
  newbuild_budget: {
    title:'Новостройка под бюджет',
    headline:'НОВОСТРОЙКА\nПОД ВАШ\nБЮДЖЕТ',
    description:'Подберу варианты по бюджету и сроку сдачи. Сравним актуальные условия покупки.',
    benefits:'Сравнение вариантов\nПодбор планировки\nПредварительный расчёт',
    shortText:'Подберу новостройку по бюджету и сроку сдачи.'
  }
};
const issue121ReviewDecisions = {
  newbuild_no_commission: 'Решение: Утверждённая редакция реализована в issue #121; templateId сохранён, абсолютное обещание «без комиссии» удалено.',
  newbuild_budget: 'Решение: Утверждённая редакция реализована в issue #121; шаблон остаётся test.'
};


const managerSensitivePinnedIds = new Set([
  'buyer_mortgage',
  'newbuild_no_commission',
  'newbuild_budget',
  'newbuild_mortgage',
  'service_mortgage',
  'buyer_maternity_capital',
  'newbuild_family_mortgage',
  'service_complex_sale',
  'seller_empty_flat',
  'trust_service_documents_check',
  'custom_service_consultation',
  'service_micro_4'
]);


const issue122Approved = {
  service_complex_sale: {
    headline:'СЛОЖНАЯ\nПРОДАЖА?',
    description:'Ипотека, маткапитал, встречная покупка, доли, наследство, документы — разберём ситуацию и составим план действий.',
    benefits:'План сделки\nЮридическая консультация\nКонтроль сроков',
    shortText:'СЛОЖНАЯ ПРОДАЖА? Разберём ситуацию и составим план.'
  },
  seller_empty_flat: {
    title:'Пустует квартира?', headline:'ПУСТУЕТ\nКВАРТИРА?',
    description:'Помогу оценить варианты: продажа, аренда или подготовка документов.',
    benefits:'Можно без ремонта\nОриентир по цене\nПонятный план действий',
    shortText:'Пустует квартира? Разберём варианты продажи или аренды.'
  },
  trust_service_documents_check: {
    headline:'ДОКУМЕНТЫ\nПЕРЕД СДЕЛКОЙ',
    description:'Помогу собрать исходные данные и передать документы профильному специалисту.',
    benefits:'Список документов\nПодключение юриста\nПонятный следующий шаг',
    customBlockTitle:'Важно', customBlockText:'Итоговая правовая оценка после проверки специалистом.',
    shortText:'Соберём документы и передадим профильному специалисту.'
  },
  custom_service_consultation: {
    headline:'НУЖНА\nКОНСУЛЬТАЦИЯ\nПО НЕДВИЖИМОСТИ?',
    description:'Замените текст на конкретную услугу: оценка цены, документы, ипотека, продажа или покупка.',
    benefits:'Объясним простым языком\nПодскажем риски\nПоможем с планом действий',
    shortText:'Заглушку не печатать. Нужен индивидуальный согласованный текст одной услуги.'
  },
  service_micro_4: {
    headline:'ПОМОЩЬ\nС НЕДВИЖИМОСТЬЮ',
    description:'Продажа или покупка: разберём задачу и определим следующий шаг.',
    benefits:'', shortText:'Продажа или покупка — начнём с разбора задачи.'
  }
};
const issue122ReviewDecisions = {
  service_complex_sale: 'Решение: Утверждённое условие реализовано в issue #122; рекламный текст сохранён, шаблон остаётся test.',
  seller_empty_flat: 'Решение: Утверждённая редакция реализована в issue #122; ложное «Куплю» удалено, шаблон остаётся test.',
  trust_service_documents_check: 'Решение: Утверждённая редакция реализована в issue #122; роли СПН и профильного специалиста разделены.',
  custom_service_consultation: 'Решение: Утверждённое условие реализовано в issue #122; заготовка остаётся test/manager и не является готовой рекламой.',
  service_micro_4: 'Решение: Утверждённая редакция реализована в issue #122; шаблон остаётся test.'
};


const review = readRequired(reviewPath);
const evidence = readRequired(evidencePath);
const overrides = readJson(overridesPath, {version:1, templates:{}});
const portfolio = readJson(portfolioPath, {defaultStatus:'working', packageDefaults:{}, templates:{}});
const templates = loadTemplates();
const templateGroups = groupById(templates);
const reviewIds = extractIds(review, /^###\s+\d+\.\s+`([^`]+)`/gm, 'основной бланк');
const evidenceIds = extractIds(evidence, /^##\s+`([^`]+)`\s+—/gm, 'доказательный пакет');
const detectedIds = templates.filter(isSensitiveTemplate).map(template => template.id).sort();

requireUnique(reviewIds, 'основной бланк');
requireUnique(evidenceIds, 'доказательный пакет');
compareSets(reviewIds, detectedIds, 'Основной бланк не совпадает с автоматически обнаруженными чувствительными шаблонами');
compareArrays(evidenceIds, reviewIds, 'Порядок шаблонов в доказательном пакете должен совпадать с основным бланком');

requireSnippets('docs/manager-sensitive-template-review-3.86.0.md', review, [
  'docs/manager-sensitive-template-evidence-3.86.0.md',
  'npm run validate:release-candidate',
  'node tools/validate-manager-sensitive-review.mjs'
]);

requireSnippets('docs/manager-sensitive-template-evidence-3.86.0.md', evidence, [
  '# Доказательный пакет чувствительных шаблонов 3.86.0',
  'Источник списка: `docs/manager-sensitive-template-review-3.86.0.md`',
  'Источник данных: `data/templates*.json`, `data/template_office_overrides.json`, `data/template_portfolio_status.json`',
  'Пакет автоматически сверяется внутри `npm run validate:release-candidate`.',
  '`node tools/validate-manager-sensitive-review.mjs`'
]);

for(const id of reviewIds){
  const group = templateGroups.get(id) || [];
  if(group.length !== 1){
    errors.push(`${id}: ожидается ровно один исходный шаблон, найдено ${group.length}`);
    continue;
  }

  const template = group[0];
  const office = template.office || {};
  if(template.portfolioStatus !== 'test') errors.push(`${id}: для менеджерской проверки ожидается status=test, найдено ${template.portfolioStatus}`);
  if(office.level !== 'manager') errors.push(`${id}: office.level должен быть manager`);
  if(office.risk !== 'high') errors.push(`${id}: office.risk должен быть high`);
  if(office.recommended !== false) errors.push(`${id}: office.recommended должен быть false`);
  if(!office.scenario) errors.push(`${id}: отсутствует office.scenario`);
  if(!Number.isInteger(office.recommendedPrintCount) || office.recommendedPrintCount < 1) errors.push(`${id}: некорректный recommendedPrintCount`);
  if(typeof office.managerNote !== 'string' || office.managerNote.trim().length < 40) errors.push(`${id}: managerNote должен содержать понятное ограничение`);

  const expectedLines = [
    `## \`${id}\` — ${inline(template.title)}`,
    `- Файл: \`${template.__file}\``,
    `- Статус: \`${template.portfolioStatus}\``,
    `- Office: \`${office.level} / ${office.risk} / recommended=${office.recommended}\``,
    `- Сценарий: \`${office.scenario}\``,
    `- Рекомендуемый тираж: ${office.recommendedPrintCount}`,
    `- Назначение: ${inline(template.note)}`,
    `- Заголовок: ${inline(template.data?.headline)}`,
    `- Описание: ${inline(template.data?.description)}`,
    `- Преимущества: ${inline(template.data?.benefits)}`,
    `- Дополнительный блок: ${customBlock(template)}`,
    `- Ограничение менеджера: ${inline(office.managerNote)}`
  ];

  requireSnippets(`доказательный пакет:${id}`, evidence, expectedLines);
}

for(const [id, expected] of Object.entries(issue120Approved)){
  const group = templateGroups.get(id) || [];
  if(group.length !== 1) continue;
  const template = group[0];
  const office = template.office || {};
  const rule = portfolio.templates?.[id] || {};
  for(const [field, expectedValue] of Object.entries(expected)){
    if(template.data?.[field] !== expectedValue) errors.push(`${id}: issue #120 требует точное значение data.${field}`);
  }
  if(template.portfolioStatus !== 'test') errors.push(`${id}: issue #120 требует status=test`);
  if(rule && typeof rule === 'object' && 'replacementId' in rule) errors.push(`${id}: issue #120 запрещает replacementId`);
  if(office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) errors.push(`${id}: issue #120 требует office manager/high/recommended=false`);
}

for(const [id, shortText] of Object.entries(issue120ShortTexts)){
  requireSnippets(`issue #120: короткий запасной текст ${id}`, evidence, [
    `- Короткий запасной текст: ${shortText}`
  ]);
  const section = reviewSection(review, id);
  requireSnippets(`issue #120: решение ${id}`, section, [
    '- [x] Решение и необходимые изменения зафиксированы.',
    issue120ReviewDecisions[id]
  ]);
}
for(const id of issue120MortgageIds){
  const section = reviewSection(review, id);
  requireSnippets(`issue #120: незакрытая юридическая проверка ${id}`, section, [
    'единая юридическая проверка применимости и площади остаётся отдельным незакрытым условием.'
  ]);
}

for(const id of issue120MortgageIds){
  const template = (templateGroups.get(id) || [])[0];
  if(!template) continue;
  if(template.data?.description !== 'Оценивайте свои финансовые возможности и риски.') errors.push(`${id}: ипотечное предупреждение issue #120 должно быть полным`);
  const text = normalize([template.data?.headline, template.data?.description, template.data?.benefits].join(' '));
  if(/\b\d+(?:[.,]\d+)?\s*%|гарантир|одобрен|бесплатн|точн\w*\s+платеж/.test(text)) errors.push(`${id}: issue #120 запрещает ставки, гарантии, бесплатность и точный платёж`);
}
const maternity = (templateGroups.get('buyer_maternity_capital') || [])[0];
if(maternity){
  const text = normalize([maternity.data?.headline, maternity.data?.description, maternity.data?.benefits].join(' '));
  if(/\b\d[\d\s]{3,}\s*(?:руб|₽)|автоматическ\w*\s+одобр|гарантир/.test(text)) errors.push('buyer_maternity_capital: issue #120 запрещает устаревшие суммы и гарантии одобрения');
}


for(const [id, expected] of Object.entries(issue121Approved)){
  const template = (templateGroups.get(id) || [])[0];
  if(!template) continue;
  const office = template.office || {};
  const rule = portfolio.templates?.[id] || {};
  if(template.title !== expected.title) errors.push(`${id}: issue #121 требует точное значение title`);
  for(const field of ['headline','description','benefits']){
    if(template.data?.[field] !== expected[field]) errors.push(`${id}: issue #121 требует точное значение data.${field}`);
  }
  if(template.portfolioStatus !== 'test') errors.push(`${id}: issue #121 требует status=test`);
  if(rule && typeof rule === 'object' && 'replacementId' in rule) errors.push(`${id}: issue #121 запрещает replacementId`);
  if(office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) errors.push(`${id}: issue #121 требует office manager/high/recommended=false`);
  requireSnippets(`issue #121: короткий запасной текст ${id}`, evidence, [`- Короткий запасной текст: ${expected.shortText}`]);
  requireSnippets(`issue #121: решение ${id}`, reviewSection(review, id), [
    '- [x] Решение и необходимые изменения зафиксированы.',
    issue121ReviewDecisions[id]
  ]);
}
const issue121NoCommission = (templateGroups.get('newbuild_no_commission') || [])[0];
if(issue121NoCommission){
  const ownText = normalize([issue121NoCommission.title, issue121NoCommission.note, ...(issue121NoCommission.tags || []), issue121NoCommission.data?.headline, issue121NoCommission.data?.description, issue121NoCommission.data?.benefits].join(' '));
  if(/без\s+комисси|бесплатн/.test(ownText)) errors.push('newbuild_no_commission: issue #121 запрещает обещание «без комиссии»/«бесплатно» в рекламных данных и tags');
}
const issue121Budget = (templateGroups.get('newbuild_budget') || [])[0];
if(issue121Budget){
  const ownText = normalize([issue121Budget.data?.headline, issue121Budget.data?.description, issue121Budget.data?.benefits].join(' '));
  if(/выгодн|бесплатн|расч[её]т\s+платеж|первоначальн/.test(ownText)) errors.push('newbuild_budget: issue #121 запрещает «выгоднее», бесплатность и обещания платежа/взноса');
}


for(const [id, expected] of Object.entries(issue122Approved)){
  const template = (templateGroups.get(id) || [])[0];
  if(!template) continue;
  const office = template.office || {};
  const rule = portfolio.templates?.[id] || {};
  if(expected.title && template.title !== expected.title) errors.push(`${id}: issue #122 требует точное значение title`);
  for(const field of ['headline','description','benefits','customBlockTitle','customBlockText']){
    if(field in expected && template.data?.[field] !== expected[field]) errors.push(`${id}: issue #122 требует точное значение data.${field}`);
  }
  if(template.portfolioStatus !== 'test') errors.push(`${id}: issue #122 требует status=test`);
  if(rule && typeof rule === 'object' && 'replacementId' in rule) errors.push(`${id}: issue #122 запрещает replacementId`);
  if(office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) errors.push(`${id}: issue #122 требует office manager/high/recommended=false`);
  requireSnippets(`issue #122: короткий запасной текст ${id}`, evidence, [`- Короткий запасной текст: ${expected.shortText}`]);
  requireSnippets(`issue #122: решение ${id}`, reviewSection(review, id), [
    '- [x] Решение и необходимые изменения зафиксированы.', issue122ReviewDecisions[id]
  ]);
}
const issue122Seller = (templateGroups.get('seller_empty_flat') || [])[0];
if(issue122Seller){
  const ownText = normalize([issue122Seller.title, issue122Seller.note, ...(issue122Seller.tags || []), issue122Seller.data?.headline, issue122Seller.data?.description, issue122Seller.data?.benefits].join(' '));
  if(/\bкуплю\b|готов\w*\s+покупател/.test(ownText)) errors.push('seller_empty_flat: issue #122 запрещает рекламное «Куплю»/«готовый покупатель»');
}
const issue122Trust = (templateGroups.get('trust_service_documents_check') || [])[0];
if(issue122Trust){
  const text = normalize([issue122Trust.data?.description, issue122Trust.data?.benefits, issue122Trust.data?.customBlockText, issue122Trust.office?.managerNote].join(' '));
  if(!text.includes('профильн') || !text.includes('специалист') || !text.includes('итоговая правовая')) errors.push('trust_service_documents_check: issue #122 требует явного разделения ролей СПН и профильного специалиста');
}
const issue122Custom = (templateGroups.get('custom_service_consultation') || [])[0];
if(issue122Custom){
  const note = normalize(issue122Custom.office?.managerNote || '');
  if(!note.includes('полностью заменить') || !note.includes('заглушку не печатать') || !note.includes('менеджер')) errors.push('custom_service_consultation: issue #122 требует запрет печати заглушки до полной замены и менеджерской проверки');
}
const issue122Micro = (templateGroups.get('service_micro_4') || [])[0];
if(issue122Micro){
  const ownText = normalize([issue122Micro.data?.headline, issue122Micro.data?.description, issue122Micro.data?.benefits].join(' '));
  if(/ипотек|документ/.test(ownText)) errors.push('service_micro_4: issue #122 запрещает объединять ипотеку и документы в массовом рекламном тексте');
}

if(errors.length){
  console.error('\nОшибки менеджерской проверки чувствительных шаблонов:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Чувствительных шаблонов: ${reviewIds.length}. Основной бланк, доказательный пакет и текущие данные синхронизированы.`);

function loadTemplates(){
  const files = fs.readdirSync(dataDir).filter(file => /^templates.*\.json$/.test(file)).sort();
  const result = [];
  for(const file of files){
    const parsed = readJson(path.join(dataDir, file), []);
    if(!Array.isArray(parsed)){
      errors.push(`${file}: корень должен быть массивом`);
      continue;
    }
    for(const item of parsed){
      if(!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const override = overrides.templates?.[item.id];
      const overrideTags = Array.isArray(override?.tags) ? override.tags : [];
      const office = override?.office && typeof override.office === 'object' && !Array.isArray(override.office)
        ? {...(item.office || {}), ...override.office}
        : item.office;
      result.push({
        ...item,
        tags:[...new Set([...(Array.isArray(item.tags) ? item.tags : []), ...overrideTags])],
        office,
        portfolioStatus:resolveStatus(file, item.id),
        __file:file
      });
    }
  }
  return result;
}

function isSensitiveTemplate(template){
  const office = template.office || {};
  if(template.portfolioStatus !== 'test' || office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) return false;
  if(managerSensitivePinnedIds.has(template.id)) return true;

  const catalog = normalize([
    template.title,
    template.note,
    ...(Array.isArray(template.tags) ? template.tags : [])
  ].join(' '));
  const content = normalize([
    template.data?.headline,
    template.data?.description,
    template.data?.benefits,
    template.data?.customBlockTitle,
    template.data?.customBlockText
  ].join(' '));

  const financial = /ипотек|маткапитал|материнск|без\s+комисси|новостройк.{0,80}бюджет|бюджет.{0,80}новостройк|первоначальн|ставк|банк/.test(catalog);
  const legal = /юридическ|проверк[аи]\s+документ|документ\w*\s+до\s+сделк|сложн\w*\s+продаж|дол[яи]|наследств|обременен/.test(catalog);
  const combinedService = template.goal === 'service' && /ипотек/.test(content) && /документ/.test(content);
  return financial || legal || combinedService;
}

function resolveStatus(file, id){
  const packageRule = normalizeRule(portfolio.packageDefaults?.[file]);
  const templateRule = normalizeRule(portfolio.templates?.[id]);
  return templateRule.status || packageRule.status || portfolio.defaultStatus || 'working';
}

function normalizeRule(rule){
  if(typeof rule === 'string') return {status:rule};
  if(!rule || typeof rule !== 'object' || Array.isArray(rule)) return {status:''};
  return {status:String(rule.status || '').trim()};
}

function groupById(items){
  const groups = new Map();
  for(const item of items){
    const id = String(item.id || '').trim();
    if(!id) continue;
    if(!groups.has(id)) groups.set(id, []);
    groups.get(id).push(item);
  }
  return groups;
}

function extractIds(source, pattern, label){
  const ids = [...String(source || '').matchAll(pattern)].map(match => match[1].trim()).filter(Boolean);
  if(!ids.length) errors.push(`${label}: не найден список templateId`);
  return ids;
}

function requireUnique(ids, label){
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if(duplicates.length) errors.push(`${label}: повторяются templateId ${[...new Set(duplicates)].join(', ')}`);
}

function compareSets(actual, expected, label){
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter(id => !actualSet.has(id));
  const extra = actual.filter(id => !expectedSet.has(id));
  if(missing.length || extra.length){
    errors.push(`${label}; отсутствуют: ${missing.join(', ') || '—'}; лишние: ${extra.join(', ') || '—'}`);
  }
}

function compareArrays(actual, expected, label){
  if(actual.length !== expected.length || actual.some((id, index) => id !== expected[index])){
    errors.push(`${label}; ожидается: ${expected.join(', ')}; найдено: ${actual.join(', ')}`);
  }
}


function reviewSection(source, id){
  const text = String(source || '');
  const markerIndex = text.indexOf(`\`${id}\``);
  if(markerIndex < 0){
    errors.push(`${id}: в основном бланке не найден раздел решения issue #120`);
    return '';
  }
  const start = text.lastIndexOf('### ', markerIndex);
  const nextHeading = text.indexOf('\n### ', markerIndex);
  const finalHeading = text.indexOf('\n## Итог менеджера', markerIndex);
  const end = nextHeading < 0 ? finalHeading : (finalHeading >= 0 && finalHeading < nextHeading ? finalHeading : nextHeading);
  if(start < 0 || end < 0){
    errors.push(`${id}: не удалось выделить границы раздела решения issue #120`);
    return '';
  }
  return text.slice(start, end);
}

function customBlock(template){
  const title = inline(template.data?.customBlockTitle);
  const text = inline(template.data?.customBlockText);
  if(title === '—' && text === '—') return '—';
  if(title === '—') return text;
  if(text === '—') return title;
  return `${title}: ${text}`;
}

function inline(value){
  const normalized = String(value || '').replace(/\r?\n/g, ' / ').replace(/\s+/g, ' ').trim();
  return normalized || '—';
}

function normalize(value){
  return String(value || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

function requireSnippets(label, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${label}: отсутствует актуальный фрагмент — ${snippet}`);
  }
}

function readJson(file, fallback){
  const source = readRequired(file);
  if(!source) return fallback;
  try { return JSON.parse(source); }
  catch(error){ errors.push(`${path.relative(rootDir, file)}: JSON не читается — ${error.message}`); return fallback; }
}

function readRequired(file){
  if(!fs.existsSync(file)){
    errors.push(`${path.relative(rootDir, file)}: файл не найден`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}
