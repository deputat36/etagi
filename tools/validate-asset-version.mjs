import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const indexPath = path.join(rootDir, 'index.html');
const stampPath = path.join(rootDir, 'tools/stamp-asset-version.mjs');
const errors = [];

const pkg = readJson(packagePath);
const version = String(pkg?.version || '').trim();
const html = readRequired(indexPath);
const stampSource = readRequired(stampPath);
const refs = [...html.matchAll(/\b(?:href|src)=(['"])(assets\/(?:css|js)\/[^'"#]+\.(?:css|js)(?:\?v=[^'"#]*)?)\1/g)]
  .map(match => match[2]);

if(!/^\d+\.\d+\.\d+$/.test(version)) errors.push('package.json: version должна иметь формат X.Y.Z');
if(!refs.length) errors.push('index.html: CSS/JS entry-assets не найдены');

const expectedSuffix = `?v=${version}`;
for(const ref of refs){
  const queryCount = (ref.match(/\?v=/g) || []).length;
  if(queryCount !== 1) errors.push(`index.html: ссылка должна иметь ровно один ?v= — ${ref}`);
  if(!ref.endsWith(expectedSuffix)) errors.push(`index.html: ожидается ${expectedSuffix} — ${ref}`);
}

const uniqueVersions = new Set(refs.map(ref => ref.match(/\?v=([^&]+)/)?.[1] || ''));
if(uniqueVersions.size > 1) errors.push(`index.html: найдены смешанные asset-version — ${[...uniqueVersions].join(', ')}`);
if(html.includes('newbie-wizard-20260703-1')) errors.push('index.html: найден устаревший ручной asset-token newbie-wizard-20260703-1');

requireSnippets('tools/stamp-asset-version.mjs', stampSource, [
  "const packagePath = path.join(rootDir, 'package.json');",
  "const indexPath = path.join(rootDir, 'index.html');",
  "assetPath}?v=${version}",
  'fs.writeFileSync(indexPath, next);'
]);

const scripts = pkg?.scripts || {};
if(scripts['assets:stamp'] !== 'node tools/stamp-asset-version.mjs') {
  errors.push('package.json: assets:stamp должен запускать node tools/stamp-asset-version.mjs');
}

if(errors.length){
  console.error('\nОшибки asset-version:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Проверка asset-version пройдена: ${refs.length} entry-assets, версия ${version}.`);

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
  }
}
function readJson(filePath){
  const source = readRequired(filePath);
  if(!source) return null;
  try { return JSON.parse(source); }
  catch(error){ errors.push(`${toProjectPath(filePath)}: JSON не читается — ${error.message}`); return null; }
}
function readRequired(filePath){
  if(!fs.existsSync(filePath)){ errors.push(`${toProjectPath(filePath)}: файл не найден`); return ''; }
  return fs.readFileSync(filePath, 'utf8');
}
function toProjectPath(filePath){
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
