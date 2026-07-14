import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const reviewPath = path.join(rootDir, 'docs/manager-sensitive-template-review-3.86.0.md');
const evidencePath = path.join(rootDir, 'docs/manager-sensitive-template-evidence-3.86.0.md');
const overridesPath = path.join(dataDir, 'template_office_overrides.json');
const portfolioPath = path.join(dataDir, 'template_portfolio_status.json');
const errors = [];

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
  'npm run validate:manager-sensitive-review'
]);

requireSnippets('docs/manager-sensitive-template-evidence-3.86.0.md', evidence, [
  '# Доказательный пакет чувствительных шаблонов 3.86.0',
  'Источник списка: `docs/manager-sensitive-template-review-3.86.0.md`',
  'Источник данных: `data/templates*.json`, `data/template_office_overrides.json`, `data/template_portfolio_status.json`',
  'Пакет автоматически сверяется командой `npm run validate:manager-sensitive-review`.'
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
