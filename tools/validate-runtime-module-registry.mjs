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

if(stored.schemaVersion !== 1) errors.push('schemaVersion должен быть равен 1');
if(stored.generatedBy !== 'tools/build-runtime-module-registry.mjs') errors.push('неверно указан generatedBy');
if(stored.source !== 'index.html') errors.push('источником точек входа должен быть index.html');

const entrypoints = Array.isArray(stored.entrypoints) ? stored.entrypoints : [];
const modules = Array.isArray(stored.modules) ? stored.modules : [];
const modulePaths = modules.map(item => item?.path).filter(Boolean);
const uniquePaths = new Set(modulePaths);

if(entrypoints.length < 10) errors.push(`слишком мало module entrypoints: ${entrypoints.length}`);
if(modules.length < 50) errors.push(`слишком мало достижимых runtime-модулей: ${modules.length}`);
if(uniquePaths.size !== modulePaths.length) errors.push('в реестре есть повторяющиеся module path');

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

const storedText = `${JSON.stringify(stored, null, 2)}\n`;
const actualText = `${JSON.stringify(actual, null, 2)}\n`;
if(storedText !== actualText){
  errors.push('runtime registry устарел относительно index.html или import graph; выполните npm run runtime:registry');
}

const uiMode = moduleMap.get('assets/js/spnUiMode.js');
if(!uiMode || (uiMode.imports || []).length < 40){
  errors.push('spnUiMode.js: реестр не отражает полный bundle side-effect модулей');
}

if(errors.length) fail(errors);

console.log(`Runtime registry проверен: ${stored.summary.entrypointCount} точек входа, ${stored.summary.moduleCount} модулей, ${stored.summary.relationCount} связей.`);

function fail(items){
  console.error('\nОшибки runtime module registry:');
  items.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
