import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const templatesLoaderPath = path.join(rootDir, 'assets/js/templates.js');
const templatesLoaderSource = readOptional(templatesLoaderPath);
const templateFiles = fs
  .readdirSync(dataDir)
  .filter(file => /^templates.*\.json$/.test(file))
  .sort();

const requiredTopLevelFields = ['id', 'goal', 'title', 'note', 'tags', 'density', 'photo', 'printCount', 'data'];
const requiredDataFields = [
  'agentName',
  'agentPhone',
  'area',
  'propertyType',
  'price',
  'params',
  'headline',
  'description',
  'benefits',
  'qrCaption',
  'qrLink',
  'showBrand',
  'showBenefits',
  'showMeta',
  'tearOffs',
  'colorMode',
  'splitMode',
  'headlineScale',
  'phoneScale',
  'pageMargin',
  'pageGap',
  'flyerPadding'
];
const validGoals = new Set(['seller', 'buyer', 'object', 'newbuild', 'service', 'rent', 'brand', 'private', 'all']);
const validDensity = new Set(['airy', 'normal', 'dense']);
const validPhoto = new Set(['none', 'one', 'two', 'plan']);
const validColor = new Set(['brand', 'economy', 'bw', 'private']);
const validSplit = new Set(['auto', 'horizontal', 'vertical', 'grid']);
const validOfficeLevels = new Set(['newbie', 'experienced', 'manager']);
const validOfficeRisks = new Set(['low', 'medium', 'high']);
const indexedExtraFields = ['contactCta', 'tearOffLabel', 'brandName', 'brandSideText'];
const entranceTemplateFile = 'templates_entrance.json';
const borisoglebskTemplateFile = 'templates_borisoglebsk.json';
const borisoglebskExpandedTemplateFile = 'templates_borisoglebsk_expanded.json';
const salesTemplateFile = 'templates_sales.json';
const tellermanTemplateFile = 'templates_tellerman_sad.json';
const tellermanTemplatePath = `data/${tellermanTemplateFile}`;
const expectedTellermanIds = new Set([
  'bgo_newbuild_tellerman_waitlist',
  'bgo_newbuild_tellerman_family',
  'bgo_newbuild_tellerman_studio',
  'bgo_newbuild_tellerman_mortgage',
  'bgo_newbuild_tellerman_tradein'
]);
const tellermanForbiddenSnippets = [
  'продажи начались',
  'уже в продаже',
  'можно забронировать',
  'бронь квартиры',
  'фиксируем бронь',
  'гарантируем ипотеку',
  'ипотека одобрена',
  'одобрение гарантировано',
  'цена от',
  'точная цена'
];

const errors = [];
const warnings = [];
const seenIds = new Map();
const templatesByFile = new Map();
const tellermanTemplates = [];
let templateCount = 0;

for (const file of templateFiles) {
  const fullPath = path.join(dataDir, file);
  let parsed;

  try {
    parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`${file}: JSON не читается — ${error.message}`);
    continue;
  }

  if (!Array.isArray(parsed)) {
    errors.push(`${file}: корень файла должен быть массивом шаблонов`);
    continue;
  }

  templatesByFile.set(file, parsed);

  parsed.forEach((template, index) => {
    templateCount += 1;
    const label = `${file}[${index}]${template?.id ? ` (${template.id})` : ''}`;

    if (!template || typeof template !== 'object') {
      errors.push(`${label}: шаблон должен быть объектом`);
      return;
    }

    if (file === tellermanTemplateFile) tellermanTemplates.push({template, label});

    for (const field of requiredTopLevelFields) {
      if (!(field in template)) errors.push(`${label}: нет обязательного поля ${field}`);
    }

    if (typeof template.id !== 'string' || !template.id.trim()) errors.push(`${label}: id должен быть непустой строкой`);
    if (template.id && !/^[a-z0-9_\-]+$/i.test(template.id)) warnings.push(`${label}: id лучше держать латиницей, цифрами, _ и -`);

    if (template.id) {
      if (seenIds.has(template.id)) {
        warnings.push(`${label}: id уже есть в ${seenIds.get(template.id)}. В приложении более поздний файл заменит ранний шаблон.`);
      }
      seenIds.set(template.id, file);
    }

    if (!validGoals.has(template.goal)) errors.push(`${label}: неизвестная goal ${template.goal}`);
    if (!validDensity.has(template.density)) errors.push(`${label}: неизвестная density ${template.density}`);
    if (!validPhoto.has(template.photo)) errors.push(`${label}: неизвестный photo ${template.photo}`);
    if (!Number.isInteger(template.printCount) || template.printCount < 1 || template.printCount > 12) {
      errors.push(`${label}: printCount должен быть целым числом от 1 до 12`);
    }
    if (!Array.isArray(template.tags)) errors.push(`${label}: tags должен быть массивом`);

    checkOfficeMetadata(label, template);

    if (!template.data || typeof template.data !== 'object') {
      errors.push(`${label}: data должен быть объектом`);
      return;
    }

    for (const field of requiredDataFields) {
      if (!(field in template.data)) errors.push(`${label}: в data нет обязательного поля ${field}`);
    }

    if (template.data.colorMode && !validColor.has(template.data.colorMode)) errors.push(`${label}: неизвестный colorMode ${template.data.colorMode}`);
    if (template.data.splitMode && !validSplit.has(template.data.splitMode)) errors.push(`${label}: неизвестный splitMode ${template.data.splitMode}`);

    const headline = String(template.data.headline || '');
    const description = String(template.data.description || '');
    const benefits = String(template.data.benefits || '');

    if (headline.length > 95) warnings.push(`${label}: заголовок длинный (${headline.length} символов)`);
    if (description.length > 320) warnings.push(`${label}: описание длинное (${description.length} символов)`);
    if (benefits.split('\n').filter(Boolean).length > 6) warnings.push(`${label}: много преимуществ, часть может не поместиться`);
  });
}

checkTemplateSearchIndex();
checkTellermanTemplates();
checkOfficeTemplateTags();

console.log(`Проверено файлов шаблонов: ${templateFiles.length}`);
console.log(`Проверено шаблонов: ${templateCount}`);
console.log(`Уникальных id: ${seenIds.size}`);

if (warnings.length) {
  console.log('\nПредупреждения:');
  warnings.forEach(item => console.log(`- ${item}`));
}

if (errors.length) {
  console.error('\nОшибки:');
  errors.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('\nПроверка шаблонов пройдена.');

function checkTemplateSearchIndex() {
  for (const field of indexedExtraFields) {
    if (!templatesLoaderSource.includes(`data.${field}`)) {
      errors.push(`assets/js/templates.js: поиск шаблонов должен индексировать data.${field}`);
    }
  }
}

function checkTellermanTemplates() {
  if (!templateFiles.includes(tellermanTemplateFile)) {
    errors.push(`${tellermanTemplateFile}: пакет шаблонов ЖК Теллерманов сад не найден`);
    return;
  }

  if (!templatesLoaderSource.includes(`'${tellermanTemplatePath}'`) && !templatesLoaderSource.includes(`"${tellermanTemplatePath}"`)) {
    errors.push(`assets/js/templates.js: пакет ${tellermanTemplatePath} должен быть подключён в TEMPLATE_FILES`);
  }

  if (tellermanTemplates.length !== expectedTellermanIds.size) {
    errors.push(`${tellermanTemplateFile}: ожидается ${expectedTellermanIds.size} шаблонов ЖК Теллерманов сад, найдено ${tellermanTemplates.length}`);
  }

  const actualIds = new Set(tellermanTemplates.map(item => item.template?.id).filter(Boolean));
  for (const id of expectedTellermanIds) {
    if (!actualIds.has(id)) errors.push(`${tellermanTemplateFile}: отсутствует обязательный шаблон ${id}`);
  }

  for (const {template, label} of tellermanTemplates) {
    const data = template?.data || {};
    const text = normalizeText([
      template?.title,
      template?.note,
      ...(template?.tags || []),
      data.price,
      data.params,
      data.headline,
      data.description,
      data.benefits,
      data.customBlockTitle,
      data.customBlockText,
      data.contactCta,
      data.tearOffLabel,
      data.brandName,
      data.brandSideText
    ].filter(Boolean).join(' '));

    if (template.goal !== 'newbuild') errors.push(`${label}: шаблон ЖК должен быть в разделе newbuild`);
    if (!String(template.id || '').startsWith('bgo_newbuild_tellerman_')) errors.push(`${label}: id шаблона ЖК должен начинаться с bgo_newbuild_tellerman_`);
    if (!text.includes('теллерманов')) errors.push(`${label}: шаблон должен содержать название ЖК Теллерманов сад`);
    if (!text.includes('просторная') && template.id !== 'bgo_newbuild_tellerman_mortgage') errors.push(`${label}: шаблон должен указывать Просторную 4а или быть ипотечным общим сценарием`);
    if (!hasEarlyLeadWording(text)) errors.push(`${label}: шаблон должен вести к предварительной заявке или раннему информированию`);
    if (template.id === 'bgo_newbuild_tellerman_mortgage' && template.office?.level !== 'manager') errors.push(`${label}: ипотечный шаблон ЖК должен быть только уровня manager`);

    for (const forbidden of tellermanForbiddenSnippets) {
      if (text.includes(forbidden)) errors.push(`${label}: опасная рекламная формулировка — ${forbidden}`);
    }
  }
}

function checkOfficeTemplateTags() {
  checkEntranceOfficeTags();
  checkBorisoglebskOfficeTags(borisoglebskTemplateFile);
  checkBorisoglebskOfficeTags(borisoglebskExpandedTemplateFile);
  checkSalesOfficeTags();
  checkTellermanOfficeTags();
}

function checkEntranceOfficeTags() {
  const templates = templatesByFile.get(entranceTemplateFile) || [];
  for (const [index, template] of templates.entries()) {
    const label = `${entranceTemplateFile}[${index}]${template?.id ? ` (${template.id})` : ''}`;
    requireOfficeMetadata(label, template);
    requireTags(label, template, ['офис', 'рекомендовано', 'подъезд']);
    requireOneOfTags(label, template, ['новичку', 'менеджер']);
  }
}

function checkBorisoglebskOfficeTags(file) {
  const templates = templatesByFile.get(file) || [];
  for (const [index, template] of templates.entries()) {
    const label = `${file}[${index}]${template?.id ? ` (${template.id})` : ''}`;
    requireOfficeMetadata(label, template);
    if (template?.goal === 'private') {
      requireTags(label, template, ['менеджер']);
      forbidTags(label, template, ['новичку']);
      continue;
    }

    requireTags(label, template, ['офис', 'рекомендовано', 'Борисоглебск']);
    if (template?.office?.level === 'manager') {
      requireTags(label, template, ['менеджер']);
      forbidTags(label, template, ['новичку']);
    }
    else if (template?.office?.level === 'newbie') {
      requireTags(label, template, ['новичку']);
    }
  }
}

function checkSalesOfficeTags() {
  const templates = templatesByFile.get(salesTemplateFile) || [];
  for (const [index, template] of templates.entries()) {
    const label = `${salesTemplateFile}[${index}]${template?.id ? ` (${template.id})` : ''}`;
    requireOfficeMetadata(label, template);
    requireTags(label, template, ['офис']);
    if (template?.office?.recommended) requireTags(label, template, ['рекомендовано']);
    if (template?.office?.level === 'newbie') requireTags(label, template, ['новичку']);
    if (template?.office?.level === 'manager') requireTags(label, template, ['менеджер']);
    if (template?.office?.risk === 'high' && template?.office?.level !== 'manager') {
      errors.push(`${label}: высокий риск допускается только для уровня manager`);
    }
  }
}

function checkTellermanOfficeTags() {
  const templates = templatesByFile.get(tellermanTemplateFile) || [];
  for (const [index, template] of templates.entries()) {
    const label = `${tellermanTemplateFile}[${index}]${template?.id ? ` (${template.id})` : ''}`;
    requireOfficeMetadata(label, template);
    requireTags(label, template, ['офис', 'Борисоглебск', 'Теллерманов сад']);
    requireOneOfTags(label, template, ['новичку', 'менеджер']);
  }
}

function checkOfficeMetadata(label, template) {
  if (!('office' in template)) return;
  if (!template.office || typeof template.office !== 'object' || Array.isArray(template.office)) {
    errors.push(`${label}: office должен быть объектом`);
    return;
  }

  const office = template.office;
  if (typeof office.recommended !== 'boolean') errors.push(`${label}: office.recommended должен быть boolean`);
  if (!validOfficeLevels.has(office.level)) errors.push(`${label}: неизвестный office.level ${office.level}`);
  if (!validOfficeRisks.has(office.risk)) errors.push(`${label}: неизвестный office.risk ${office.risk}`);
  if (typeof office.scenario !== 'string' || !office.scenario.trim()) errors.push(`${label}: office.scenario должен быть непустой строкой`);
  if (office.scenario && !/^[a-z0-9_\-]+$/i.test(office.scenario)) errors.push(`${label}: office.scenario должен быть латиницей, цифрами, _ или -`);
  if (!Number.isInteger(office.recommendedPrintCount) || office.recommendedPrintCount < 1 || office.recommendedPrintCount > 12) {
    errors.push(`${label}: office.recommendedPrintCount должен быть целым числом от 1 до 12`);
  }
  if (typeof office.managerNote !== 'string' || office.managerNote.trim().length < 12) {
    errors.push(`${label}: office.managerNote должен быть понятной строкой минимум 12 символов`);
  }

  if (office.level === 'newbie' && !hasTag(template, 'новичку')) errors.push(`${label}: office.level newbie требует тег новичку`);
  if (office.level === 'manager' && !hasTag(template, 'менеджер')) errors.push(`${label}: office.level manager требует тег менеджер`);
  if (office.recommended === true && !hasTag(template, 'рекомендовано')) errors.push(`${label}: office.recommended=true требует тег рекомендовано`);
}

function requireOfficeMetadata(label, template) {
  if (!template?.office) errors.push(`${label}: для этого офисного пакета нужен объект office`);
}

function requireTags(label, template, tags) {
  for (const tag of tags) {
    if (!hasTag(template, tag)) errors.push(`${label}: нет офисного тега ${tag}`);
  }
}

function requireOneOfTags(label, template, tags) {
  if (!tags.some(tag => hasTag(template, tag))) errors.push(`${label}: нужен один из офисных тегов — ${tags.join(', ')}`);
}

function forbidTags(label, template, tags) {
  for (const tag of tags) {
    if (hasTag(template, tag)) errors.push(`${label}: недопустимый офисный тег ${tag}`);
  }
}

function hasTag(template, tag) {
  return Array.isArray(template?.tags) && template.tags.includes(tag);
}

function hasEarlyLeadWording(text) {
  return [
    'предварительн',
    'ранн',
    'после старта продаж',
    'продажи еще не начались',
    'продажи ещё не начались',
    'старт продаж впереди',
    'цены будут позже',
    'цены после старта продаж'
  ].some(snippet => text.includes(snippet));
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

function readOptional(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}
