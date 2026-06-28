import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const checked = new Set();
const checkedModules = new Set();

checkHtmlReferences();
checkTemplateDataReferences();
checkAppDomBindings();
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
    const linkRefs = matchAll(html, /<link[^>]+href=["']([^"']+)["']/gi);
    const stylesheetRefs = matchStylesheetRefs(html);
    const scriptRefs = matchAll(html, /<script[^>]+src=["']([^"']+)["']/gi);
    const refs = [
      ...linkRefs,
      ...scriptRefs,
      ...matchAll(html, /<a[^>]+href=["']([^"']+)["']/gi),
      ...matchAll(html, /<img[^>]+src=["']([^"']+)["']/gi)
    ];

    checkDuplicateHtmlAssetReferences(htmlPath, relativeHtmlPath, stylesheetRefs, 'stylesheet');
    checkDuplicateHtmlAssetReferences(htmlPath, relativeHtmlPath, scriptRefs, 'script');

    refs
      .filter(ref => shouldCheckReference(ref))
      .forEach(ref => {
        const resolved = resolveReference(htmlPath, ref);
        checkFile(resolved, relativeHtmlPath);
        if (/\.(js|mjs)$/i.test(resolved)) checkModuleImports(resolved);
      });
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

function checkAppDomBindings() {
  const appPath = path.join(rootDir, 'assets/js/app.js');
  const indexPath = path.join(rootDir, 'index.html');
  if (!fs.existsSync(appPath)) {
    errors.push('assets/js/app.js не найден');
    return;
  }
  if (!fs.existsSync(indexPath)) {
    errors.push('index.html не найден');
    return;
  }

  const appSource = fs.readFileSync(appPath, 'utf8');
  const html = fs.readFileSync(indexPath, 'utf8');
  const htmlIdList = extractHtmlIds(html);
  const htmlIds = new Set(htmlIdList);
  const fields = resolveStringArray(appSource, 'fields');
  const checks = resolveStringArray(appSource, 'checks');
  const blockVisibility = resolveStringArray(appSource, 'blockVisibility');
  const literalAppIds = extractDollarLiteralIds(appSource);
  const dynamicAppIds = [
    'showFavoriteTemplatesOnly',
    'scenarioFilterRow',
    'templateCountLine'
  ];
  const staticAppIds = [
    'templateSearch',
    'templateDensityFilter',
    'blockOrderList',
    'resetBlockOrderBtn',
    'photoOne',
    'photoTwo',
    'qualityBtn',
    'printBtn',
    'cancelPrintBtn',
    'printDialog',
    'confirmPrintBtn',
    'fitPreviewBtn',
    'zoom',
    'makeShortBtn',
    'makeStrongerBtn',
    'saveProfileBtn',
    'loadProfileBtn',
    'clearObjectBtn',
    'autoLayoutBtn',
    'preserveMediaLayoutBtn',
    'saveNamedLayoutBtn',
    'loadNamedLayoutBtn',
    'deleteNamedLayoutBtn',
    'saveLocalBtn',
    'loadLocalBtn',
    'downloadBtn',
    'uploadBtn',
    'uploadFile',
    'goalGrid',
    'photoModeRow',
    'printPresetRow',
    'propertyPresets',
    'layoutModeGrid',
    'templateList',
    'layoutHints',
    'savedLayouts',
    'printSheet',
    'previewStatus',
    'qualityScore',
    'qualityList',
    'sheetScale',
    'statusLine'
  ];

  checkRequiredAppSnippet(appSource, "fields.forEach(id => $(id).addEventListener('input', readFormAndRender));");
  checkRequiredAppSnippet(appSource, "fields.forEach(id => $(id).addEventListener('change', readFormAndRender));");
  checkRequiredAppSnippet(appSource, "checks.forEach(id => $(id).addEventListener('change', readFormAndRender));");
  checkRequiredAppSnippet(appSource, 'checks.forEach(id => { if($(id)) $(id).checked = !!state[id]; });');
  checkRequiredAppSnippet(appSource, 'checks.forEach(id => { state[id] = $(id).checked; });');
  checkRequiredAppSnippet(appSource, "$('templateSearch').addEventListener('input', renderTemplates);");
  checkRequiredAppSnippet(appSource, "$('blockOrderList').addEventListener('click', handleBlockOrderClick);");
  checkRequiredAppSnippet(appSource, "$('printBtn').onclick = printFlow;");
  checkRequiredAppSnippet(appSource, "$('printDialog').showModal();");

  if (!fields.length) errors.push('assets/js/app.js: массив fields должен содержать DOM-поля формы');
  if (!checks.length) errors.push('assets/js/app.js: массив checks должен содержать DOM-чекбоксы формы');
  if (!blockVisibility.length) errors.push('assets/js/app.js: массив blockVisibility должен содержать переключатели блоков');

  for (const id of findDuplicates(htmlIdList)) {
    errors.push(`index.html: id ${id} повторяется`);
  }

  for (const id of findDuplicates(fields)) {
    errors.push(`assets/js/app.js: поле ${id} повторяется в fields`);
  }

  for (const id of findDuplicates(checks)) {
    errors.push(`assets/js/app.js: чекбокс ${id} повторяется в checks`);
  }

  for (const id of findDuplicates(staticAppIds)) {
    errors.push(`tools/validate-assets.mjs: обязательный DOM-id ${id} повторяется в staticAppIds`);
  }

  for (const id of findDuplicates(dynamicAppIds)) {
    errors.push(`tools/validate-assets.mjs: динамический DOM-id ${id} повторяется в dynamicAppIds`);
  }

  for (const id of [...fields, ...checks]) {
    if (!htmlIds.has(id)) {
      errors.push(`assets/js/app.js: элемент ${id} из fields/checks должен существовать в index.html`);
    }
  }

  for (const id of staticAppIds) {
    if (!htmlIds.has(id)) {
      errors.push(`index.html: обязательный элемент ${id} для assets/js/app.js не найден`);
    }
  }

  for (const id of literalAppIds) {
    if (!htmlIds.has(id) && !dynamicAppIds.includes(id)) {
      errors.push(`assets/js/app.js: прямое обращение $('${id}') должно ссылаться на id в index.html или быть описано в dynamicAppIds`);
    }
  }

  for (const id of dynamicAppIds) {
    checkDynamicAppIdCreation(appSource, id);
  }

  for (const id of blockVisibility) {
    if (!checks.includes(id)) {
      errors.push(`assets/js/app.js: переключатель блока ${id} из blockVisibility должен входить в checks`);
    }
  }
}

function checkModuleImports(entryPath) {
  const fullPath = path.resolve(entryPath);
  const relativePath = toProjectPath(fullPath);

  if (!fs.existsSync(fullPath)) {
    errors.push(`${relativePath} не найден`);
    return;
  }

  if (checkedModules.has(relativePath)) return;
  checkedModules.add(relativePath);
  checked.add(relativePath);

  const source = fs.readFileSync(fullPath, 'utf8');
  const imports = [
    ...matchAll(source, /import\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/g),
    ...matchAll(source, /import\(\s*['"]([^'"]+)['"]\s*\)/g)
  ];

  for (const importPath of imports) {
    if (!importPath.startsWith('.')) continue;

    const resolved = resolveImport(fullPath, importPath);
    checkFile(resolved, relativePath);

    if (/\.(js|mjs)$/i.test(resolved)) checkModuleImports(resolved);
  }
}

function checkDuplicateHtmlAssetReferences(htmlPath, relativeHtmlPath, refs, type) {
  const counts = new Map();
  for (const ref of refs) {
    if (!shouldCheckReference(ref)) continue;
    const key = toProjectPath(resolveReference(htmlPath, ref));
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  for (const [file, count] of counts) {
    if (count > 1) errors.push(`${relativeHtmlPath}: ${type} подключён повторно — ${file}`);
  }
}

function matchStylesheetRefs(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter(match => /\brel\s*=\s*["'][^"']*\bstylesheet\b[^"']*["']/i.test(match[0]))
    .map(match => match[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1])
    .filter(Boolean);
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

function extractHtmlIds(html) {
  return matchAll(html, /\bid=["']([^"']+)["']/gi);
}

function extractDollarLiteralIds(source) {
  return matchAll(source, /\$\(\s*['"]([^'"]+)['"]\s*\)/g);
}

function resolveStringArray(source, name, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);

  const match = source.match(new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!match) return [];

  const values = [];
  const pattern = /\.\.\.([A-Za-z_$][\w$]*)|['"]([^'"]+)['"]/g;
  let item;
  while ((item = pattern.exec(match[1]))) {
    if (item[1]) values.push(...resolveStringArray(source, item[1], seen));
    else values.push(item[2]);
  }
  return values;
}

function checkRequiredAppSnippet(source, snippet) {
  if (!source.includes(snippet)) errors.push(`assets/js/app.js: отсутствует ${snippet}`);
}

function checkDynamicAppIdCreation(source, id) {
  if (!source.includes(`id="${id}"`) && !source.includes(`id='${id}'`)) {
    errors.push(`assets/js/app.js: динамический элемент ${id} из dynamicAppIds должен явно создаваться в разметке`);
  }
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
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
