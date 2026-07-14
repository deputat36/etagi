import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const indexPath = path.join(rootDir, 'index.html');

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = String(pkg.version || '').trim();
if(!/^\d+\.\d+\.\d+$/.test(version)){
  console.error('package.json: version должна иметь формат X.Y.Z');
  process.exit(1);
}

const source = fs.readFileSync(indexPath, 'utf8');
let replacements = 0;
const next = source.replace(/\b(href|src)=(['"])(assets\/(?:css|js)\/[^'"?#]+\.(?:css|js))(?:\?v=[^'"#]*)?\2/g, (match, attribute, quote, assetPath) => {
  replacements += 1;
  return `${attribute}=${quote}${assetPath}?v=${version}${quote}`;
});

if(!replacements){
  console.error('index.html: локальные CSS/JS entry-assets не найдены');
  process.exit(1);
}

if(next === source){
  console.log(`Asset-version уже актуален: ${version}; ссылок: ${replacements}.`);
  process.exit(0);
}

fs.writeFileSync(indexPath, next);
console.log(`Asset-version обновлён до ${version}; ссылок: ${replacements}.`);
