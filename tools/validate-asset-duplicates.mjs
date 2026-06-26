import fs from 'node:fs';

const source = read('tools/validate-assets.mjs');
const errors = [];

check(source, 'tools/validate-assets.mjs', [
  'const linkRefs = matchAll(html, /<link[^>]+href=',
  'const stylesheetRefs = matchStylesheetRefs(html);',
  'const scriptRefs = matchAll(html, /<script[^>]+src=',
  "checkDuplicateHtmlAssetReferences(htmlPath, relativeHtmlPath, stylesheetRefs, 'stylesheet');",
  "checkDuplicateHtmlAssetReferences(htmlPath, relativeHtmlPath, scriptRefs, 'script');",
  'function checkDuplicateHtmlAssetReferences',
  'counts.set(key, (counts.get(key) || 0) + 1);',
  'подключён повторно',
  'function matchStylesheetRefs',
  '<link\\b[^>]*>',
  '\\brel\\s*=\\s*[\"\'][^\"\']*\\bstylesheet\\b',
  '\\bhref\\s*=\\s*[\"\']([^\"\']+)[\"\']'
]);

if (/const\s+stylesheetRefs\s*=\s*matchAll\(html,\s*\/<link\[\^>\]\+href=/.test(source)) {
  errors.push('tools/validate-assets.mjs: stylesheet-дубли снова ищутся по любому <link href>, а не только по rel="stylesheet"');
}

if (errors.length) {
  console.error('\nОшибки проверки дублей HTML-ассетов:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка дублей HTML-ассетов пройдена.');

function check(sourceText, file, snippets) {
  for (const snippet of snippets) {
    if (!sourceText.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
