import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const aliasPath = path.join(dataDir, 'template_id_aliases.json');
const loaderPath = path.join(rootDir, 'assets/js/templates.js');
const errors = [];

const aliases = readAliases();
const finalIds = new Map();
const rawOccurrences = new Map();
const usedAliases = new Set();
const templateFiles = fs.readdirSync(dataDir)
  .filter(file => /^templates.*\.json$/.test(file))
  .sort();

for(const file of templateFiles){
  let templates;
  try{
    templates = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  } catch(error){
    errors.push(`${file}: JSON не читается — ${error.message}`);
    continue;
  }
  if(!Array.isArray(templates)){
    errors.push(`${file}: корень должен быть массивом`);
    continue;
  }

  for(const [index, template] of templates.entries()){
    const sourceId = String(template?.id || '').trim();
    if(!sourceId) continue;
    const label = `${file}[${index}] (${sourceId})`;
    const alias = String(aliases.packages?.[file]?.[sourceId] || '').trim();
    const finalId = alias || sourceId;

    const rawList = rawOccurrences.get(sourceId) || [];
    rawList.push(label);
    rawOccurrences.set(sourceId, rawList);

    if(alias){
      usedAliases.add(`${file}:${sourceId}`);
      if(!/^[a-z0-9_-]+$/i.test(alias)) errors.push(`${label}: алиас ${alias} содержит недопустимые символы`);
      if(alias === sourceId) errors.push(`${label}: алиас совпадает с исходным id`);
    }

    if(finalIds.has(finalId)){
      errors.push(`${label}: итоговый id ${finalId} уже используется в ${finalIds.get(finalId)}`);
    } else {
      finalIds.set(finalId, label);
    }
  }
}

for(const [sourceId, occurrences] of rawOccurrences.entries()){
  if(occurrences.length < 2) continue;
  for(const occurrence of occurrences.slice(1)){
    const file = occurrence.split('[')[0];
    if(!aliases.packages?.[file]?.[sourceId]){
      errors.push(`${sourceId}: повтор в ${file} не разрешён через data/template_id_aliases.json`);
    }
  }
}

for(const [file, rules] of Object.entries(aliases.packages || {})){
  if(!templateFiles.includes(file)){
    errors.push(`template_id_aliases.json: пакет ${file} не найден`);
    continue;
  }
  if(!rules || typeof rules !== 'object' || Array.isArray(rules)){
    errors.push(`template_id_aliases.json: ${file} должен содержать объект алиасов`);
    continue;
  }
  for(const sourceId of Object.keys(rules)){
    if(!usedAliases.has(`${file}:${sourceId}`)){
      errors.push(`template_id_aliases.json: лишний алиас ${file}:${sourceId} — исходный шаблон не найден`);
    }
  }
}

const loader = readRequired(loaderPath);
for(const snippet of [
  "const TEMPLATE_ID_ALIASES_FILE = 'data/template_id_aliases.json';",
  'loadTemplateIdAliases()',
  'applyTemplateIdAlias(withOffice, packageName, idAliases)',
  'sourcePackage: packageName',
  'sourceId: alias ? sourceId :',
  'if(byId.has(resolved.id))'
]){
  if(!loader.includes(snippet)) errors.push(`assets/js/templates.js: отсутствует обязательный контракт — ${snippet}`);
}

console.log(`Проверено пакетов: ${templateFiles.length}`);
console.log(`Исходных ID: ${rawOccurrences.size}`);
console.log(`Итоговых уникальных ID: ${finalIds.size}`);

if(errors.length){
  console.error('\nОшибки алиасов templateId:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка уникальности templateId пройдена.');

function readAliases(){
  try{
    const parsed = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
    if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('корень должен быть объектом');
    return {
      packages: parsed.packages && typeof parsed.packages === 'object' && !Array.isArray(parsed.packages) ? parsed.packages : {}
    };
  } catch(error){
    errors.push(`template_id_aliases.json: ${error.message}`);
    return {packages:{}};
  }
}

function readRequired(file){
  if(!fs.existsSync(file)){
    errors.push(`${path.relative(rootDir, file)}: файл не найден`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}
