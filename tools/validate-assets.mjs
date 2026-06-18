import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const checked = new Set();

checkHtmlReferences();
checkTemplateDataReferences();
checkModuleImports(path.join(rootDir, 'assets/js/app.js'));

console.log(`Проверено ссылок на файлы: ${checked.size}`);

if (errors.length) {
  console.error('\nОшибки связей файлов:');
  errors.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Проверка связей файлов пройдена.');

function checkHtmlReferences() {
  const htmlFiles = collectFiles(rootDir)
    .filter(file => file.endsWith('.html'))
    .filter(file => !isIgnoredPath(file));

  if (!htmlFiles.length) {
    errors.push('HTML-файлы не найдены');
    return;
  }

  for (const htmlPath of htmlFiles) {
    const relativeHtmlPath = toProjectPath(htmlPath);
    const html = fs.readFileSync(htmlPath, 'utf8');
    const refs = [
      ...matchAll(html, /<link[^>]+href=["']([^"']+)["']/gi),
      ...matchAll(html, /<script[^>]+src=["']([^"']+)["']/gi),
      ...matchAll(html, /<a[^>]+href=["']([^"']+)["']/gi),
      ...matchAll(html, /<img[^>]+src=["']([^"']+)["']/gi)
    ];

    refs
      .filter(ref => shouldCheckReference(ref))
      .forEach(ref => checkFile(resolveReference(htmlPath, ref), relativeHtmlPath));
  }
}

function checkTemplateDataReferences() {
  const templatesJsPath = path.join(rootDir, 'assets/js/templates.js');
  if (!fs.existsSync(templatesJsPath)) {
    errors.push('assets/js/templates.js не найден');
    return;
  }

  const source = fs.readFileSync(templatesJsPath, 'utf8');
  const refs = matchAll(source, /['"](data\/templates[^'"]+\.json)['"]/g);
  refs.forEach(ref => checkFile(path.join(rootDir, ref), 'assets/js/templates.js'));
}

function checkModuleImports(entryPath) {
  const fullPath = path.resolve(entryPath);
  const relativePath = toProjectPath(fullPath);

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
    checkFile(resolved, relativePath);

    if (/\.(js|mjs)$/i.test(resolved)) checkModuleImports(resolved);
  }
}

function resolveImport(fromFile, importPath) {
  const base = path.resolve(path.dirname(fromFile), importPath);
  if (path.extname(base)) return base;
  return `${base}.js`;
}

function resolveReference(fromFile, ref) {
  const cleanRef = ref.split('?')[0].split('#')[0];
  if (cleanRef.startsWith('/')) return path.join(rootDir, cleanRef.slice(1));
  return path.resolve(path.dirname(fromFile), cleanRef);
}

function checkFile(fullPath, from) {
  const normalized = path.normalize(fullPath);
  const relativePath = toProjectPath(normalized);
  checked.add(relativePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    errors.push(`${from}: ссылка выходит за пределы проекта — ${relativePath}`);
    return;
  }

  if (!fs.existsSync(normalized)) errors.push(`${from}: файл не найден — ${relativePath}`);
}

function collectFiles(dir) {
  const result = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (isIgnoredPath(fullPath)) continue;
    if (item.isDirectory()) result.push(...collectFiles(fullPath));
    else result.push(fullPath);
  }
  return result;
}

function matchAll(text, regex) {
  return [...text.matchAll(regex)].map(match => match[1]);
}

function shouldCheckReference(ref) {
  if (!ref || ref.startsWith('#')) return false;
  if (isExternal(ref)) return false;
  if (/^(javascript:|data:)/i.test(ref)) return false;
  return true;
}

function isExternal(ref) {
  return /^https?:\/\//i.test(ref) || ref.startsWith('//') || ref.startsWith('mailto:') || ref.startsWith('tel:');
}

function isIgnoredPath(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  return normalized.includes('/.git/') || normalized.includes('/node_modules/') || normalized.includes('/.github/');
}

function toProjectPath(fullPath) {
  return path.relative(rootDir, fullPath).replaceAll('\\', '/');
}
