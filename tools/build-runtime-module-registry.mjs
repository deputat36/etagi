import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = process.cwd();
const REGISTRY_PATH = 'data/runtime-modules.json';
const INDEX_PATH = 'index.html';
const OBSERVER_TYPES = ['MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'PerformanceObserver'];
const STORAGE_AREAS = ['localStorage', 'sessionStorage'];

const ENTRYPOINT_ROLES = {
  'assets/js/app.js': 'Основное состояние, форма, шаблоны и печатный лист',
  'assets/js/qualityLevelLabels.js': 'Подписи уровней качества',
  'assets/js/qualityIssueSummary.js': 'Сводка замечаний качества',
  'assets/js/qualityPriorityHint.js': 'Приоритет следующего исправления',
  'assets/js/qualityPrintGuardHint.js': 'Подсказка защиты печати',
  'assets/js/qualityIssueFilters.js': 'Фильтрация замечаний качества',
  'assets/js/preprintSummary.js': 'Сводка перед печатью',
  'assets/js/spnUiMode.js': 'Режимы Новичок, Быстро и Расширенно',
  'assets/js/spnClarityPanel.js': 'Краткая сводка понятности макета',
  'assets/js/spnWizard.js': 'Рабочие ситуации и маршрут СПН',
  'assets/js/spnHeadlineHelper.js': 'Помощник заголовка',
  'assets/js/spnChecklist.js': 'Рабочий чек-лист',
  'assets/js/spnFieldPlan.js': 'План расклейки',
  'assets/js/spnLeadQualification.js': 'Квалификация отклика',
  'assets/js/spnResultEstimator.js': 'Оценка результата теста',
  'assets/js/qualityExtraActions.js': 'Прямые действия по замечаниям качества'
};

export function buildRuntimeModuleRegistry(rootDir = DEFAULT_ROOT){
  const entrypoints = readEntrypoints(rootDir);
  const indexDomIds = readIndexDomIds(rootDir);
  const records = new Map();
  const queue = [...entrypoints];
  const signals = [];

  for(const entrypoint of entrypoints){
    ensureRecord(records, entrypoint).loadedAs.add('entrypoint');
  }

  while(queue.length){
    const modulePath = queue.shift();
    const record = ensureRecord(records, modulePath);
    const source = readRequired(rootDir, modulePath);
    const imports = parseModuleImports(source, modulePath, rootDir);
    signals.push(parseRuntimeSignals(source, modulePath));

    for(const relation of imports){
      if(!record.imports.some(item => item.path === relation.path && item.mode === relation.mode)){
        record.imports.push(relation);
      }

      const child = ensureRecord(records, relation.path);
      child.loadedAs.add(relation.mode);
      if(!child.importedBy.some(item => item.path === modulePath && item.mode === relation.mode)){
        child.importedBy.push({path:modulePath, mode:relation.mode});
      }
      if(!child.scanned){
        child.scanned = true;
        queue.push(relation.path);
      }
    }
  }

  const modules = [...records.values()]
    .map(record => ({
      path:record.path,
      domain:inferDomain(record.path),
      loadedAs:[...record.loadedAs].sort(),
      importedBy:sortRelations(record.importedBy),
      imports:sortRelations(record.imports)
    }))
    .sort((a, b) => a.path.localeCompare(b.path, 'en'));

  const ownership = buildOwnership(indexDomIds, signals);
  const relationCount = modules.reduce((sum, item) => sum + item.imports.length, 0);
  const sideEffectModuleCount = modules.filter(item => item.loadedAs.includes('side-effect')).length;
  const dynamicModuleCount = modules.filter(item => item.loadedAs.includes('dynamic')).length;
  const observerInstanceCount = ownership.observers.reduce((sum, item) => sum + item.count, 0);

  return {
    schemaVersion:2,
    generatedBy:'tools/build-runtime-module-registry.mjs',
    source:INDEX_PATH,
    entrypoints:entrypoints.map(modulePath => ({
      path:modulePath,
      role:ENTRYPOINT_ROLES[modulePath] || 'Самостоятельная точка входа интерфейса'
    })),
    summary:{
      entrypointCount:entrypoints.length,
      moduleCount:modules.length,
      relationCount,
      sideEffectModuleCount,
      dynamicModuleCount,
      domIdCount:ownership.domIds.length,
      indexDomIdCount:ownership.domIds.filter(item => item.declaredInIndex).length,
      runtimeCreatedDomIdCount:ownership.domIds.filter(item => item.createdBy.length).length,
      storageKeyCount:ownership.storageKeys.filter(item => !item.dynamic).length,
      dynamicStorageKeyCount:ownership.storageKeys.filter(item => item.dynamic).length,
      observerModuleCount:ownership.observers.length,
      observerInstanceCount,
      styleIdCount:ownership.styleIds.length
    },
    ownership,
    modules
  };
}

function readEntrypoints(rootDir){
  const source = readRequired(rootDir, INDEX_PATH);
  const scripts = source.match(/<script\b[^>]*>/gi) || [];
  const entrypoints = [];

  for(const tag of scripts){
    const type = tag.match(/\btype=["']([^"']+)["']/i)?.[1] || '';
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] || '';
    if(type !== 'module' || !src) continue;
    const cleanPath = normalizeRepositoryPath(src.split(/[?#]/, 1)[0]);
    if(!cleanPath.startsWith('assets/js/')) continue;
    if(!entrypoints.includes(cleanPath)) entrypoints.push(cleanPath);
  }

  if(!entrypoints.length) throw new Error(`${INDEX_PATH}: не найдены локальные module entrypoints`);
  return entrypoints;
}

function readIndexDomIds(rootDir){
  const source = readRequired(rootDir, INDEX_PATH);
  return uniqueSorted([...source.matchAll(/\bid=["']([A-Za-z][\w:.-]*)["']/g)].map(match => match[1]));
}

function parseModuleImports(source, importerPath, rootDir){
  const relations = [];
  const seen = new Set();
  const patterns = [
    {mode:'side-effect', regex:/^\s*import\s+["']([^"']+)["'];?\s*$/gm, group:1},
    {mode:'dependency', regex:/^\s*import\s+.+?\s+from\s+["']([^"']+)["'];?\s*$/gm, group:1},
    {mode:'dynamic', regex:/\bimport\(\s*["']([^"']+)["']\s*\)/g, group:1}
  ];

  for(const pattern of patterns){
    pattern.regex.lastIndex = 0;
    let match;
    while((match = pattern.regex.exec(source))){
      const specifier = match[pattern.group];
      const resolved = resolveLocalImport(specifier, importerPath, rootDir);
      if(!resolved) continue;
      const key = `${pattern.mode}:${resolved}`;
      if(seen.has(key)) continue;
      seen.add(key);
      relations.push({path:resolved, mode:pattern.mode});
    }
  }

  return sortRelations(relations);
}

function parseRuntimeSignals(source, modulePath){
  const constants = readSimpleConstants(source);
  const dom = parseDomSignals(source, constants);
  return {
    module:modulePath,
    dom,
    storage:parseStorageSignals(source, constants),
    observers:parseObserverSignals(source),
    styleIds:parseStyleIds(source, constants, dom)
  };
}

function parseDomSignals(source, constants){
  const references = new Set();
  const created = new Set();
  const bound = new Set();
  const mutated = new Set();
  const variableIds = new Map();

  collectResolvedCalls(source, /\b(?:document\.)?getElementById\s*\(\s*([^)]+?)\s*\)/g, 1, constants, references);
  collectResolvedCalls(source, /(^|[^\w$])\$\s*\(\s*([^)]+?)\s*\)/gm, 2, constants, references);

  for(const match of source.matchAll(/\b(?:querySelector|querySelectorAll|closest|matches)\s*\(\s*(["'`])([\s\S]*?)\1\s*\)/g)){
    if(match[1] === '`' && match[2].includes('${')) continue;
    extractSelectorIds(match[2]).forEach(id => references.add(id));
  }

  for(const match of source.matchAll(/\bid=["']([A-Za-z][\w:.-]*)["']/g)) created.add(match[1]);
  collectResolvedAssignments(source, /\.id\s*=\s*([^;\n]+)/g, 1, constants, created);
  collectResolvedCalls(source, /\.setAttribute\s*\(\s*["']id["']\s*,\s*([^)]+?)\s*\)/g, 1, constants, created);

  const variablePatterns = [
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:document\.)?getElementById\s*\(\s*([^)]+?)\s*\)/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\$\s*\(\s*([^)]+?)\s*\)/g
  ];
  for(const pattern of variablePatterns){
    for(const match of source.matchAll(pattern)){
      const resolved = resolveExpression(match[2], constants);
      if(resolved && !resolved.dynamic){
        variableIds.set(match[1], resolved.value);
        references.add(resolved.value);
      }
    }
  }

  for(const match of source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:document\.)?querySelector\s*\(\s*(["'`])([\s\S]*?)\2\s*\)/g)){
    if(match[2] === '`' && match[3].includes('${')) continue;
    const ids = extractSelectorIds(match[3]);
    if(ids.length === 1){
      variableIds.set(match[1], ids[0]);
      references.add(ids[0]);
    }
  }

  for(const [variable, id] of variableIds){
    const escaped = escapeRegExp(variable);
    if(new RegExp(`\\b${escaped}\\s*\\.\\s*(?:addEventListener|removeEventListener|onclick|oninput|onchange|onsubmit|onkeydown|onkeyup|onfocus|onblur)\\b`).test(source)) bound.add(id);
    if(new RegExp(`\\b${escaped}\\s*\\.\\s*(?:innerHTML|outerHTML|textContent|innerText|value|checked|disabled|hidden|open|className|src|href|title|ariaLabel|dataset|style|classList)\\b`).test(source)) mutated.add(id);
  }

  const directSelector = String.raw`(?:(?:document\.)?getElementById\s*\(\s*([^)]+?)\s*\)|\$\s*\(\s*([^)]+?)\s*\))`;
  for(const match of source.matchAll(new RegExp(`${directSelector}\\s*\\.\\s*(?:addEventListener|removeEventListener|onclick|oninput|onchange|onsubmit|onkeydown|onkeyup|onfocus|onblur)\\b`, 'g'))){
    const resolved = resolveExpression(match[1] || match[2], constants);
    if(resolved && !resolved.dynamic) bound.add(resolved.value);
  }
  for(const match of source.matchAll(new RegExp(`${directSelector}\\s*\\.\\s*(?:innerHTML|outerHTML|textContent|innerText|value|checked|disabled|hidden|open|className|src|href|title|ariaLabel|dataset|style|classList)\\b`, 'g'))){
    const resolved = resolveExpression(match[1] || match[2], constants);
    if(resolved && !resolved.dynamic) mutated.add(resolved.value);
  }

  created.forEach(id => references.add(id));
  bound.forEach(id => references.add(id));
  mutated.forEach(id => references.add(id));

  return {
    references:uniqueSorted(references),
    created:uniqueSorted(created),
    bound:uniqueSorted(bound),
    mutated:uniqueSorted(mutated)
  };
}

function parseStorageSignals(source, constants){
  const records = [];
  for(const area of STORAGE_AREAS){
    const pattern = new RegExp(`\\b${area}\\s*\\.\\s*(getItem|setItem|removeItem)\\s*\\(\\s*([^,\\)\\n]+)`, 'g');
    for(const match of source.matchAll(pattern)){
      const resolved = resolveExpression(match[2], constants);
      if(!resolved) continue;
      records.push({area, operation:match[1], key:resolved.value, dynamic:resolved.dynamic});
    }
  }
  return records.sort((a, b) => a.area.localeCompare(b.area, 'en') || a.key.localeCompare(b.key, 'en') || a.operation.localeCompare(b.operation, 'en'));
}

function parseObserverSignals(source){
  const records = [];
  const variables = new Map();

  for(const type of OBSERVER_TYPES){
    const count = [...source.matchAll(new RegExp(`\\bnew\\s+${type}\\s*\\(`, 'g'))].length;
    if(!count) continue;
    records.push({type, count, observeCalls:0, disconnectCalls:0});
  }

  for(const match of source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+(MutationObserver|ResizeObserver|IntersectionObserver|PerformanceObserver)\s*\(/g)){
    variables.set(match[1], match[2]);
  }

  for(const [variable, type] of variables){
    const record = records.find(item => item.type === type);
    if(!record) continue;
    const escaped = escapeRegExp(variable);
    record.observeCalls += [...source.matchAll(new RegExp(`\\b${escaped}\\s*\\.\\s*observe\\s*\\(`, 'g'))].length;
    record.disconnectCalls += [...source.matchAll(new RegExp(`\\b${escaped}\\s*\\.\\s*disconnect\\s*\\(`, 'g'))].length;
  }

  return records.sort((a, b) => a.type.localeCompare(b.type, 'en'));
}

function parseStyleIds(source, constants, dom){
  const ids = new Set();
  for(const [name, value] of constants){
    if(/STYLE(?:S)?_ID|STYLE_ID|STYLES_ID/i.test(name)) ids.add(value);
  }

  const styleVariables = new Set();
  for(const match of source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\.createElement\s*\(\s*["']style["']\s*\)/g)){
    styleVariables.add(match[1]);
  }
  for(const variable of styleVariables){
    const escaped = escapeRegExp(variable);
    for(const match of source.matchAll(new RegExp(`\\b${escaped}\\s*\\.\\s*id\\s*=\\s*([^;\\n]+)`, 'g'))){
      const resolved = resolveExpression(match[1], constants);
      if(resolved && !resolved.dynamic) ids.add(resolved.value);
    }
  }

  for(const id of dom.created){
    if(/style/i.test(id)) ids.add(id);
  }
  return uniqueSorted(ids);
}

function buildOwnership(indexDomIds, signals){
  const domMap = new Map(indexDomIds.map(id => [id, makeDomOwnerRecord(id, true)]));
  const storageMap = new Map();
  const styleMap = new Map();
  const observers = [];

  for(const signal of signals){
    for(const id of signal.dom.references) ensureDomRecord(domMap, id).referencedBy.add(signal.module);
    for(const id of signal.dom.created) ensureDomRecord(domMap, id).createdBy.add(signal.module);
    for(const id of signal.dom.bound) ensureDomRecord(domMap, id).boundBy.add(signal.module);
    for(const id of signal.dom.mutated) ensureDomRecord(domMap, id).mutatedBy.add(signal.module);

    for(const storage of signal.storage){
      const mapKey = `${storage.area}:${storage.dynamic ? 'dynamic' : 'static'}:${storage.key}`;
      if(!storageMap.has(mapKey)) storageMap.set(mapKey, {
        area:storage.area,
        key:storage.key,
        dynamic:storage.dynamic,
        operations:new Set(),
        modules:new Set()
      });
      const record = storageMap.get(mapKey);
      record.operations.add(storage.operation);
      record.modules.add(signal.module);
    }

    for(const observer of signal.observers){
      observers.push({module:signal.module, ...observer});
    }

    for(const id of signal.styleIds){
      if(!styleMap.has(id)) styleMap.set(id, {id, modules:new Set(), createdBy:new Set()});
      const record = styleMap.get(id);
      record.modules.add(signal.module);
      if(signal.dom.created.includes(id)) record.createdBy.add(signal.module);
    }
  }

  const domIds = [...domMap.values()].map(record => {
    const createdBy = uniqueSorted(record.createdBy);
    const boundBy = uniqueSorted(record.boundBy);
    const mutatedBy = uniqueSorted(record.mutatedBy);
    const referencedBy = uniqueSorted(record.referencedBy);
    const bindOrMutateOwners = uniqueSorted([...boundBy, ...mutatedBy]);
    const owners = createdBy.length ? createdBy : bindOrMutateOwners.length ? bindOrMutateOwners : referencedBy;
    const ownershipBasis = createdBy.length
      ? 'runtime-create'
      : boundBy.length || mutatedBy.length
        ? 'bind-or-mutate'
        : referencedBy.length
          ? 'reference-only'
          : 'static-index';
    return {
      id:record.id,
      declaredInIndex:record.declaredInIndex,
      ownershipBasis,
      owners,
      createdBy,
      boundBy,
      mutatedBy,
      referencedBy
    };
  }).sort((a, b) => a.id.localeCompare(b.id, 'en'));

  const storageKeys = [...storageMap.values()].map(record => ({
    area:record.area,
    key:record.key,
    dynamic:record.dynamic,
    operations:uniqueSorted(record.operations),
    modules:uniqueSorted(record.modules)
  })).sort((a, b) => a.area.localeCompare(b.area, 'en') || Number(a.dynamic) - Number(b.dynamic) || a.key.localeCompare(b.key, 'en'));

  const styleIds = [...styleMap.values()].map(record => ({
    id:record.id,
    modules:uniqueSorted(record.modules),
    createdBy:uniqueSorted(record.createdBy)
  })).sort((a, b) => a.id.localeCompare(b.id, 'en'));

  return {
    domIds,
    storageKeys,
    observers:observers.sort((a, b) => a.module.localeCompare(b.module, 'en') || a.type.localeCompare(b.type, 'en')),
    styleIds
  };
}

function makeDomOwnerRecord(id, declaredInIndex = false){
  return {id, declaredInIndex, referencedBy:new Set(), createdBy:new Set(), boundBy:new Set(), mutatedBy:new Set()};
}

function ensureDomRecord(map, id){
  if(!map.has(id)) map.set(id, makeDomOwnerRecord(id, false));
  return map.get(id);
}

function readSimpleConstants(source){
  const constants = new Map();
  const pattern = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'`])((?:\\.|(?!\2)[\s\S])*?)\2\s*;/g;
  for(const match of source.matchAll(pattern)){
    if(match[2] === '`' && match[3].includes('${')) continue;
    constants.set(match[1], decodeLiteral(match[3]));
  }
  return constants;
}

function collectResolvedCalls(source, pattern, group, constants, target){
  for(const match of source.matchAll(pattern)){
    const resolved = resolveExpression(match[group], constants);
    if(resolved && !resolved.dynamic) target.add(resolved.value);
  }
}

function collectResolvedAssignments(source, pattern, group, constants, target){
  collectResolvedCalls(source, pattern, group, constants, target);
}

function resolveExpression(expression, constants){
  const value = String(expression || '').trim();
  if(!value) return null;
  const literal = parseLiteral(value);
  if(literal !== null) return {value:literal, dynamic:false};
  if(/^[A-Za-z_$][\w$]*$/.test(value) && constants.has(value)) return {value:constants.get(value), dynamic:false};
  return {value:normalizeExpression(value), dynamic:true};
}

function parseLiteral(value){
  const quote = value[0];
  if(!['"', "'", '`'].includes(quote) || value.at(-1) !== quote) return null;
  const body = value.slice(1, -1);
  if(quote === '`' && body.includes('${')) return null;
  return decodeLiteral(body);
}

function decodeLiteral(value){
  return String(value || '')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\([\\"'`])/g, '$1');
}

function normalizeExpression(value){
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function extractSelectorIds(selector){
  return uniqueSorted([...String(selector || '').matchAll(/#([A-Za-z][\w:.-]*)/g)].map(match => match[1]));
}

function resolveLocalImport(specifier, importerPath, rootDir){
  if(!specifier.startsWith('.')) return '';
  const base = normalizeRepositoryPath(path.posix.join(path.posix.dirname(importerPath), specifier));
  const candidates = path.posix.extname(base) ? [base] : [`${base}.js`, path.posix.join(base, 'index.js')];
  const resolved = candidates.find(candidate => fs.existsSync(path.join(rootDir, candidate)));
  if(!resolved) throw new Error(`${importerPath}: импорт ${specifier} не найден`);
  return resolved;
}

function ensureRecord(records, modulePath){
  if(!records.has(modulePath)){
    records.set(modulePath, {
      path:modulePath,
      loadedAs:new Set(),
      importedBy:[],
      imports:[],
      scanned:false
    });
  }
  return records.get(modulePath);
}

function inferDomain(modulePath){
  const name = path.posix.basename(modulePath).toLowerCase();
  if(name.startsWith('quality') || name.includes('quality')) return 'quality';
  if(name.includes('print') || name.includes('tear') || name.includes('ink') || name.includes('dense')) return 'print';
  if(name.includes('distribution') || name.includes('report') || name.includes('managerperiod')) return 'after-print';
  if(name.includes('newbie') || name.includes('wizard') || name.includes('uimode') || name.includes('office')) return 'workflow';
  if(name.includes('storage') || name.includes('backup') || name.includes('snapshot') || name.includes('layoutfile')) return 'persistence';
  if(['app.js','state.js','utils.js','templates.js','render.js','layoutrules.js'].includes(name)) return 'core';
  if(name.includes('photo') || name.includes('qr') || name.includes('contact') || name.includes('brand') || name.includes('editor') || name.includes('helper')) return 'editing';
  return 'interface';
}

function sortRelations(relations){
  return [...relations].sort((a, b) => a.path.localeCompare(b.path, 'en') || a.mode.localeCompare(b.mode, 'en'));
}

function uniqueSorted(values){
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), 'en'));
}

function escapeRegExp(value){
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRepositoryPath(value){
  return path.posix.normalize(String(value || '').replaceAll('\\', '/').replace(/^\.\//, ''));
}

function readRequired(rootDir, relativePath){
  const fullPath = path.join(rootDir, relativePath);
  if(!fs.existsSync(fullPath)) throw new Error(`${relativePath}: файл не найден`);
  return fs.readFileSync(fullPath, 'utf8');
}

function isDirectExecution(){
  if(!process.argv[1]) return false;
  return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if(isDirectExecution()){
  const registry = buildRuntimeModuleRegistry(DEFAULT_ROOT);
  const outputPath = path.join(DEFAULT_ROOT, REGISTRY_PATH);
  fs.mkdirSync(path.dirname(outputPath), {recursive:true});
  fs.writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  console.log(`Runtime registry обновлён: ${registry.summary.entrypointCount} точек входа, ${registry.summary.moduleCount} модулей, ${registry.summary.relationCount} связей, ${registry.summary.domIdCount} DOM ID, ${registry.summary.storageKeyCount} storage keys, ${registry.summary.observerInstanceCount} observers, ${registry.summary.styleIdCount} style IDs.`);
}
