import fs from 'node:fs';
import path from 'node:path';
import { buildRuntimeModuleRegistry } from './build-runtime-module-registry.mjs';

const rootDir = process.cwd();
const registryPath = path.join(rootDir, 'data/runtime-modules.json');
const errors = [];

if(!fs.existsSync(registryPath)){
  fail(['data/runtime-modules.json: реестр не найден', 'Выполните npm run runtime:registry.']);
}

let stored;
try{
  stored = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
} catch(error){
  fail([`data/runtime-modules.json: некорректный JSON — ${error.message}`]);
}

let actual;
try{
  actual = buildRuntimeModuleRegistry(rootDir);
} catch(error){
  fail([`Не удалось построить фактический runtime graph: ${error.message}`]);
}

if(stored.schemaVersion !== 2) errors.push('schemaVersion должен быть равен 2');
if(stored.generatedBy !== 'tools/build-runtime-module-registry.mjs') errors.push('неверно указан generatedBy');
if(stored.source !== 'index.html') errors.push('источником точек входа должен быть index.html');

const entrypoints = Array.isArray(stored.entrypoints) ? stored.entrypoints : [];
const modules = Array.isArray(stored.modules) ? stored.modules : [];
const ownership = stored.ownership && typeof stored.ownership === 'object' ? stored.ownership : {};
const domIds = Array.isArray(ownership.domIds) ? ownership.domIds : [];
const storageKeys = Array.isArray(ownership.storageKeys) ? ownership.storageKeys : [];
const observers = Array.isArray(ownership.observers) ? ownership.observers : [];
const styleIds = Array.isArray(ownership.styleIds) ? ownership.styleIds : [];
const modulePaths = modules.map(item => item?.path).filter(Boolean);
const uniquePaths = new Set(modulePaths);

if(entrypoints.length < 10) errors.push(`слишком мало module entrypoints: ${entrypoints.length}`);
if(modules.length < 50) errors.push(`слишком мало достижимых runtime-модулей: ${modules.length}`);
if(uniquePaths.size !== modulePaths.length) errors.push('в реестре есть повторяющиеся module path');
if(domIds.length < 50) errors.push(`слишком мало DOM ID в ownership registry: ${domIds.length}`);
if(storageKeys.filter(item => !item.dynamic).length < 5) errors.push('ownership registry не отражает основные статические storage keys');
if(!observers.length) errors.push('ownership registry не отражает observer instances');
if(!styleIds.length) errors.push('ownership registry не отражает injected style IDs');

for(const required of ['assets/js/app.js', 'assets/js/spnUiMode.js']){
  if(!entrypoints.some(item => item.path === required)) errors.push(`отсутствует обязательная точка входа ${required}`);
}

const moduleMap = new Map(modules.map(item => [item.path, item]));
for(const entrypoint of entrypoints){
  const record = moduleMap.get(entrypoint.path);
  if(!record) errors.push(`entrypoint ${entrypoint.path} отсутствует в modules`);
  else if(!record.loadedAs?.includes('entrypoint')) errors.push(`${entrypoint.path}: отсутствует loadedAs=entrypoint`);
}

for(const module of modules){
  const relativePath = String(module.path || '');
  if(!relativePath.startsWith('assets/js/')) errors.push(`${relativePath}: runtime-модуль вне assets/js`);
  if(/[?#]/.test(relativePath)) errors.push(`${relativePath}: path содержит query/hash`);
  if(relativePath && !fs.existsSync(path.join(rootDir, relativePath))) errors.push(`${relativePath}: файл отсутствует`);

  for(const relation of module.imports || []){
    const target = moduleMap.get(relation.path);
    if(!target){
      errors.push(`${relativePath}: импорт ${relation.path} отсутствует в registry modules`);
      continue;
    }
    if(!(target.importedBy || []).some(item => item.path === relativePath && item.mode === relation.mode)){
      errors.push(`${relativePath} → ${relation.path}: нет обратной связи importedBy (${relation.mode})`);
    }
  }

  for(const relation of module.importedBy || []){
    const parent = moduleMap.get(relation.path);
    if(!parent){
      errors.push(`${relativePath}: importedBy ссылается на отсутствующий ${relation.path}`);
      continue;
    }
    if(!(parent.imports || []).some(item => item.path === relativePath && item.mode === relation.mode)){
      errors.push(`${relation.path} → ${relativePath}: нет прямой связи imports (${relation.mode})`);
    }
  }
}

validateDomOwnership(domIds, moduleMap, errors);
validateStorageOwnership(storageKeys, moduleMap, errors);
validateObserverOwnership(observers, moduleMap, errors);
validateStyleOwnership(styleIds, moduleMap, errors);
validateSummary(stored.summary || {}, {entrypoints, modules, domIds, storageKeys, observers, styleIds}, errors);

const storedText = `${JSON.stringify(stored, null, 2)}\n`;
const actualText = `${JSON.stringify(actual, null, 2)}\n`;
if(storedText !== actualText){
  errors.push('runtime registry устарел относительно index.html, import graph или resource ownership; выполните npm run runtime:registry');
}

const uiMode = moduleMap.get('assets/js/spnUiMode.js');
if(!uiMode || (uiMode.imports || []).length < 40){
  errors.push('spnUiMode.js: реестр не отражает полный bundle side-effect модулей');
}

for(const requiredId of ['printBtn', 'spnUiMode', 'spnPostPrintWorkspace']){
  if(!domIds.some(item => item.id === requiredId)) errors.push(`DOM ownership: отсутствует обязательный ID ${requiredId}`);
}
for(const requiredKey of ['etagi-raskleyka-state-v1', 'etagi-raskleyka-ui-mode-v1']){
  if(!storageKeys.some(item => !item.dynamic && item.key === requiredKey)) errors.push(`Storage ownership: отсутствует ключ ${requiredKey}`);
}
if(!observers.some(item => item.type === 'MutationObserver')) errors.push('Observer ownership: MutationObserver не найден');
if(!styleIds.some(item => item.id === 'spnPostPrintWorkspaceStyles')) errors.push('Style ownership: spnPostPrintWorkspaceStyles не найден');

if(errors.length) fail(errors);

console.log(`Runtime registry проверен: ${stored.summary.entrypointCount} точек входа, ${stored.summary.moduleCount} модулей, ${stored.summary.domIdCount} DOM ID, ${stored.summary.storageKeyCount} storage keys, ${stored.summary.observerInstanceCount} observers, ${stored.summary.styleIdCount} style IDs.`);

function validateDomOwnership(records, moduleMap, target){
  const ids = records.map(item => item?.id).filter(Boolean);
  if(new Set(ids).size !== ids.length) target.push('DOM ownership: повторяющиеся ID');
  const allowedBasis = new Set(['runtime-create', 'bind-or-mutate', 'reference-only', 'static-index']);

  for(const record of records){
    if(!record.id) continue;
    if(!allowedBasis.has(record.ownershipBasis)) target.push(`${record.id}: неизвестный ownershipBasis ${record.ownershipBasis}`);
    for(const field of ['owners', 'createdBy', 'boundBy', 'mutatedBy', 'referencedBy']){
      if(!Array.isArray(record[field])){
        target.push(`${record.id}: ${field} должен быть массивом`);
        continue;
      }
      for(const modulePath of record[field]){
        if(!moduleMap.has(modulePath)) target.push(`${record.id}: ${field} ссылается на отсутствующий ${modulePath}`);
      }
    }
    const bindOrMutateOwners = uniqueSorted([...(record.boundBy || []), ...(record.mutatedBy || [])]);
    const expectedOwners = record.createdBy?.length ? record.createdBy : bindOrMutateOwners.length ? bindOrMutateOwners : record.referencedBy || [];
    if(JSON.stringify(record.owners || []) !== JSON.stringify(expectedOwners)) target.push(`${record.id}: owners не соответствует правилу приоритета create → bind/mutate → reference`);
    if(record.ownershipBasis !== 'static-index' && !(record.owners || []).length) target.push(`${record.id}: нет owner modules`);
  }
}

function validateStorageOwnership(records, moduleMap, target){
  const keys = records.map(item => `${item.area}:${item.dynamic ? 'dynamic' : 'static'}:${item.key}`);
  if(new Set(keys).size !== keys.length) target.push('Storage ownership: повторяющиеся записи');
  const allowedAreas = new Set(['localStorage', 'sessionStorage']);
  const allowedOperations = new Set(['getItem', 'setItem', 'removeItem']);

  for(const record of records){
    if(!allowedAreas.has(record.area)) target.push(`${record.key}: неизвестная storage area ${record.area}`);
    if(!record.key) target.push('Storage ownership: пустой key/expression');
    if(!Array.isArray(record.operations) || !record.operations.length) target.push(`${record.key}: отсутствуют operations`);
    for(const operation of record.operations || []) if(!allowedOperations.has(operation)) target.push(`${record.key}: неизвестная операция ${operation}`);
    if(!Array.isArray(record.modules) || !record.modules.length) target.push(`${record.key}: отсутствуют modules`);
    for(const modulePath of record.modules || []) if(!moduleMap.has(modulePath)) target.push(`${record.key}: modules ссылается на отсутствующий ${modulePath}`);
  }
}

function validateObserverOwnership(records, moduleMap, target){
  const allowedTypes = new Set(['MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'PerformanceObserver']);
  const keys = records.map(item => `${item.module}:${item.type}`);
  if(new Set(keys).size !== keys.length) target.push('Observer ownership: повторяющиеся module/type');

  for(const record of records){
    if(!moduleMap.has(record.module)) target.push(`Observer ${record.type}: отсутствующий module ${record.module}`);
    if(!allowedTypes.has(record.type)) target.push(`${record.module}: неизвестный observer ${record.type}`);
    if(!Number.isInteger(record.count) || record.count < 1) target.push(`${record.module}/${record.type}: count должен быть положительным целым`);
    for(const field of ['observeCalls', 'disconnectCalls']){
      if(!Number.isInteger(record[field]) || record[field] < 0) target.push(`${record.module}/${record.type}: ${field} должен быть неотрицательным целым`);
    }
  }
}

function validateStyleOwnership(records, moduleMap, target){
  const ids = records.map(item => item?.id).filter(Boolean);
  if(new Set(ids).size !== ids.length) target.push('Style ownership: повторяющиеся style IDs');

  for(const record of records){
    if(!record.id) continue;
    if(!Array.isArray(record.modules) || !record.modules.length) target.push(`${record.id}: отсутствуют style owner modules`);
    for(const modulePath of record.modules || []) if(!moduleMap.has(modulePath)) target.push(`${record.id}: modules ссылается на отсутствующий ${modulePath}`);
    for(const modulePath of record.createdBy || []) if(!moduleMap.has(modulePath)) target.push(`${record.id}: createdBy ссылается на отсутствующий ${modulePath}`);
  }
}

function validateSummary(summary, collections, target){
  const expected = {
    entrypointCount:collections.entrypoints.length,
    moduleCount:collections.modules.length,
    relationCount:collections.modules.reduce((sum, item) => sum + (item.imports || []).length, 0),
    sideEffectModuleCount:collections.modules.filter(item => item.loadedAs?.includes('side-effect')).length,
    dynamicModuleCount:collections.modules.filter(item => item.loadedAs?.includes('dynamic')).length,
    domIdCount:collections.domIds.length,
    indexDomIdCount:collections.domIds.filter(item => item.declaredInIndex).length,
    runtimeCreatedDomIdCount:collections.domIds.filter(item => item.createdBy?.length).length,
    storageKeyCount:collections.storageKeys.filter(item => !item.dynamic).length,
    dynamicStorageKeyCount:collections.storageKeys.filter(item => item.dynamic).length,
    observerModuleCount:collections.observers.length,
    observerInstanceCount:collections.observers.reduce((sum, item) => sum + Number(item.count || 0), 0),
    styleIdCount:collections.styleIds.length
  };
  for(const [key, value] of Object.entries(expected)) if(summary[key] !== value) target.push(`summary.${key}: ожидалось ${value}, получено ${summary[key]}`);
}

function uniqueSorted(values){
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), 'en'));
}

function fail(items){
  console.error('\nОшибки runtime module registry:');
  items.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
