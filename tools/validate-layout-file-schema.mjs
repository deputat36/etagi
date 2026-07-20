import fs from 'node:fs';
import path from 'node:path';
import { defaultState } from '../assets/js/state.js';
import {
  LAYOUT_FILE_KIND,
  LAYOUT_FILE_SCHEMA_VERSION,
  LayoutFileError,
  createLayoutFile,
  getRequiredLayoutFields,
  parseLayoutFileObject,
  parseLayoutFileText
} from '../assets/js/layoutFile.js';

const rootDir = process.cwd();
const errors = [];
const files = {
  schema:'data/layout-file.schema.json',
  module:'assets/js/layoutFile.js',
  importModule:'assets/js/spnLayoutFileImport.js',
  utils:'assets/js/utils.js',
  entry:'assets/js/spnUiMode.js',
  runner:'tools/run-ui-actions-smoke.mjs',
  smoke:'tools/layout-file-diagnostics-smoke.html',
  guide:'docs/layout-file-format.md',
  package:'package.json'
};
const sources = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readRequired(file)]));
const schema = readJson(files.schema, sources.schema);
const pkg = readJson(files.package, sources.package);
const requiredLayoutFields = getRequiredLayoutFields();
const requiredFileFields = ['kind','schemaVersion','appVersion','exportedAt', ...requiredLayoutFields];

if(schema){
  assert(schema.$schema === 'https://json-schema.org/draft/2020-12/schema', `${files.schema}: должна использоваться JSON Schema 2020-12`);
  assert(schema.type === 'object' && schema.additionalProperties === false, `${files.schema}: корень должен быть строгим объектом`);
  assert(schema.properties?.kind?.const === LAYOUT_FILE_KIND, `${files.schema}: неверный kind`);
  assert(schema.properties?.schemaVersion?.const === LAYOUT_FILE_SCHEMA_VERSION, `${files.schema}: неверная версия схемы`);
  assert(sameSet(schema.required, requiredFileFields), `${files.schema}: required не совпадает с runtime-полями`);
  assert(sameSet(Object.keys(schema.properties || {}), requiredFileFields), `${files.schema}: properties не совпадает с runtime-полями`);
  assert(schema.properties?.printCount?.type === 'integer', `${files.schema}: printCount должен быть integer`);
  assert(schema.properties?.blockOrder?.uniqueItems === true, `${files.schema}: blockOrder должен запрещать повторы`);
}

try {
  const exported = createLayoutFile(defaultState);
  assert(exported.kind === LAYOUT_FILE_KIND, 'createLayoutFile: отсутствует kind');
  assert(exported.schemaVersion === LAYOUT_FILE_SCHEMA_VERSION, 'createLayoutFile: отсутствует schemaVersion');
  assert(!Object.hasOwn(exported, 'layout'), 'createLayoutFile: состояние не должно дублироваться внутри layout');
  assert(requiredFileFields.every(field => Object.hasOwn(exported, field)), 'createLayoutFile: отсутствуют обязательные поля');
  const parsed = parseLayoutFileObject(exported, defaultState);
  assert(parsed.legacy === false, 'parseLayoutFileObject: файл v1 ошибочно распознан как legacy');
  assert(parsed.layout.printCount === defaultState.printCount, 'parseLayoutFileObject: состояние v1 не восстановлено');
} catch(error){
  errors.push(`runtime roundtrip: ${error.message}`);
}

try {
  const legacy = parseLayoutFileText(JSON.stringify({headline:'Старый макет', printCount:4}), defaultState);
  assert(legacy.legacy === true, 'legacy: старый объект не распознан');
  assert(legacy.layout.headline === 'Старый макет' && legacy.layout.agentName === defaultState.agentName, 'legacy: значения по умолчанию не добавлены');
} catch(error){
  errors.push(`legacy compatibility: ${error.message}`);
}

expectLayoutError('повреждённый JSON', () => parseLayoutFileText('{"kind":', defaultState), 'JSON повреждён');
expectLayoutError('массив вместо объекта', () => parseLayoutFileText('[]', defaultState), 'корневой элемент JSON должен быть объектом');
expectLayoutError('чужой kind', () => parseLayoutFileObject({...createLayoutFile(defaultState), kind:'foreign'}, defaultState), 'это не макет генератора');
expectLayoutError('будущая версия', () => parseLayoutFileObject({...createLayoutFile(defaultState), schemaVersion:99}, defaultState), 'версия схемы 99 не поддерживается');
expectLayoutError('неверный тип', () => parseLayoutFileObject({...createLayoutFile(defaultState), printCount:'4'}, defaultState), 'поле «printCount» должно быть числом');
expectLayoutError('неизвестное поле', () => parseLayoutFileObject({...createLayoutFile(defaultState), unexpected:true}, defaultState), 'поле «unexpected» не поддерживается');

requireSnippets(files.utils, sources.utils, [
  "import { createLayoutFile } from './layoutFile.js';",
  'JSON.stringify(createLayoutFile(state), null, 2)'
]);
requireSnippets(files.importModule, sources.importModule, [
  "input.addEventListener('change', validateBeforeImport, true)",
  'event.stopImmediatePropagation()',
  'parseLayoutFileText(await file.text(), cloneDefaultState())',
  "input.setAttribute('aria-invalid', 'true')",
  "document.getElementById('uploadBtn')?.focus"
]);
requireSnippets(files.entry, sources.entry, ["import './spnLayoutFileImport.js';"]);
requireSnippets(files.runner, sources.runner, [
  "label:'Layout file diagnostics smoke'",
  "path:'tools/layout-file-diagnostics-smoke.html'"
]);
requireSnippets(files.smoke, sources.smoke, [
  'JSON-схема: экспорт содержит kind, версию, дату и плоское состояние',
  'JSON-схема: старый необёрнутый файл остаётся совместимым',
  'JSON-диагностика: пять ошибочных файлов отклонены без замены макета',
  "schemaVersion:99",
  "printCount:'четыре'",
  'assertSameState(doc, protectedState'
]);
requireSnippets(files.guide, sources.guide, [
  '# Формат JSON-макета',
  'data/layout-file.schema.json',
  'schemaVersion: 1',
  'При ошибке текущий макет не изменяется',
  'npm run validate:layout-file-schema',
  'Layout file diagnostics smoke'
]);

if(String(pkg?.scripts?.['validate:layout-file-schema'] || '').trim() !== 'node tools/validate-layout-file-schema.mjs'){
  errors.push(`${files.package}: validate:layout-file-schema должен запускать node tools/validate-layout-file-schema.mjs`);
}

if(errors.length){
  console.error('\nОшибки схемы отдельного JSON-макета:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Проверка схемы JSON-макета v${LAYOUT_FILE_SCHEMA_VERSION} пройдена: ${requiredLayoutFields.length} полей состояния.`);

function expectLayoutError(label, action, marker){
  try {
    action();
    errors.push(`${label}: ожидалась ошибка`);
  } catch(error){
    if(!(error instanceof LayoutFileError)) errors.push(`${label}: получен неверный тип ошибки ${error?.name || typeof error}`);
    else if(!String(error.userMessage || error.message).includes(marker)) errors.push(`${label}: диагностика не содержит «${marker}»`);
  }
}

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
  }
}

function sameSet(actual, expected){
  return Array.isArray(actual) && actual.length === expected.length && expected.every(item => actual.includes(item));
}

function assert(condition, message){
  if(!condition) errors.push(message);
}

function readJson(file, source){
  try { return JSON.parse(source || '{}'); }
  catch(error){ errors.push(`${file}: JSON не читается — ${error.message}`); return null; }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
