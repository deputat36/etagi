import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = process.cwd();
const REGISTRY_PATH = 'data/runtime-modules.json';
const INDEX_PATH = 'index.html';

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
  const entrypointSet = new Set(entrypoints);
  const records = new Map();
  const queue = [...entrypoints];

  for(const entrypoint of entrypoints){
    ensureRecord(records, entrypoint).loadedAs.add('entrypoint');
  }

  while(queue.length){
    const modulePath = queue.shift();
    const record = ensureRecord(records, modulePath);
    const source = readRequired(rootDir, modulePath);
    const imports = parseModuleImports(source, modulePath, rootDir);

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

  const relationCount = modules.reduce((sum, item) => sum + item.imports.length, 0);
  const sideEffectModuleCount = modules.filter(item => item.loadedAs.includes('side-effect')).length;
  const dynamicModuleCount = modules.filter(item => item.loadedAs.includes('dynamic')).length;

  return {
    schemaVersion:1,
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
      dynamicModuleCount
    },
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
  console.log(`Runtime registry обновлён: ${registry.summary.entrypointCount} точек входа, ${registry.summary.moduleCount} модулей, ${registry.summary.relationCount} связей.`);
}
