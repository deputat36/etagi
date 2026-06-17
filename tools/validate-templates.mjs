import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
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

const errors = [];
const warnings = [];
const seenIds = new Map();
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

  parsed.forEach((template, index) => {
    templateCount += 1;
    const label = `${file}[${index}]${template?.id ? ` (${template.id})` : ''}`;

    if (!template || typeof template !== 'object') {
      errors.push(`${label}: шаблон должен быть объектом`);
      return;
    }

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
