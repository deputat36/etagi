import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const checked = new Set();

checkIndexReferences();
checkTemplateDataReferences();
checkModuleImports(path.join(rootDir, 'assets/js/app.js'));

console.log(`Проверено ссылок на файлы: ${checked.size}`);

if (errors.length) {
  console.error('\nОшибки связей файлов:');
  errors.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Проверка связей файлов пройдена.');

function checkIndexReferences() {
  const indexPath = path.join(rootDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    errors.push('index.html не найден');
    return;
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const refs = [
    ...matchAll(html, /<link[^>]+href="([^"]+)"/gi),
    ...matchAll(html, /<script[^>]+src="([^"]+)"/gi)
  ];

  refs
    .filter(ref => !isExternal(ref) && !ref.startsWith('#'))
    .forEach(ref => checkFile(ref, 'index.html'));
}

function checkTemplateDataReferences() {
  const templatesJsPath = path.join(rootDir, 'assets/js/templates.js');
  if (!fs.existsSync(templatesJsPath)) {
    errors.push('assets/js/templates.js не найден');
    return;
  }

  const source = fs.readFileSync(templatesJsPath, 'utf8');
  const refs = matchAll(source, /['"](data\/templates[^'"]+\.json)['"]/g);
  refs.forEach(ref => checkFile(ref, 'assets/js/templates.js'));
}

function checkModuleImports(entryPath) {
  const fullPath = path.resolve(entryPath);
  const relativePath = path.relative(rootDir, fullPath);

  if (!fs.existsSync(fullPath)) {
    errors.push(`${relativePath} не найден`);
    return;
  }

  if (checked.has(relativePath)) return;
  checked.add(relativePath);

  const source = fs.readFileSync(fullPath, 'utf8');
  const imports = [
    ...matchAll(source, /import\s+[^'";]+['"]([^'"]+)['"]/g),
    ...matchAll(source, /import\(['"]([^'"]+)['"]\)/g)
  ];

  for (const importPath of imports) {
    if (!importPath.startsWith('.')) continue;

    const resolved = resolveImport(fullPath, importPath);
    const resolvedRelative = path.relative(rootDir, resolved);
    checkFile(resolvedRelative, relativePath);

    if (/\.(js|mjs)$/i.test(resolved)) checkModuleImports(resolved);
  }
}

function resolveImport(fromFile, importPath) {
  const base = path.resolve(path.dirname(fromFile), importPath);
  if (path.extname(base)) return base;
  return `${base}.js`;
}

function checkFile(relativePath, from) {
  const cleanPath = relativePath.split('?')[0].split('#')[0];
  const fullPath = path.join(rootDir, cleanPath);
  checked.add(cleanPath);
  if (!fs.existsSync(fullPath)) errors.push(`${from}: файл не найден — ${cleanPath}`);
}

function matchAll(text, regex) {
  return [...text.matchAll(regex)].map(match => match[1]);
}

function isExternal(ref) {
  return /^https?:\/\//i.test(ref) || ref.startsWith('//') || ref.startsWith('mailto:') || ref.startsWith('tel:');
}
