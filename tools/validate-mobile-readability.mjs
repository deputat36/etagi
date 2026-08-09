import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  wizard: 'assets/js/spnWizardFlow.js',
  status: 'assets/js/spnWizardStepStatus.js',
  office: 'assets/js/spnOfficeTemplateFilters.js',
  menu: 'assets/js/spnTemplateMenuCompact.js',
  badges: 'assets/js/spnTemplateCardBadges.js',
  libraryCss: 'assets/css/template-library.css',
  smoke: 'tools/browser-smoke.html',
  guide: 'docs/mobile-readability.md',
  maintenance: 'docs/maintenance-guide.md',
  package: 'package.json'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.wizard, sources.wizard, [
  '@media(max-width:520px)',
  '.spn-wizard-print-count span,.spn-wizard-steps span',
  'font-size:11.5px;line-height:1.3;opacity:.9'
]);

requireSnippets(files.status, sources.status, [
  '.spn-wizard-steps button{padding-right:120px}',
  '.spn-wizard-step-status{max-width:108px;padding:4px 6px;font-size:11px;line-height:1.1}',
  '.spn-wizard-progress-summary span,.spn-wizard-progress-summary span b{font-size:11.5px}',
  '@media print{.spn-wizard-progress-summary,.spn-wizard-step-status{display:none!important}}'
]);

// После миграции PR #114 JS отвечает только за поведение библиотеки шаблонов.
// Эти контракты не должны исчезнуть вместе с переносом визуальных правил в CSS.
requireSnippets(files.office, sources.office, [
  'id="spnOfficeTemplateFilters"',
  'data-office-query',
  "search.dispatchEvent(new Event('input', {bubbles:true}))"
]);

requireSnippets(files.menu, sources.menu, [
  "const TEMPLATE_MENU_KEY = 'etagi-raskleyka-template-menu-mode-v1';",
  'document.body.dataset.templateMenuMode = next;',
  'localStorage.setItem(TEMPLATE_MENU_KEY, mode)'
]);

requireSnippets(files.badges, sources.badges, [
  "import { loadTemplates } from './templates.js';",
  'new MutationObserver(() => enhanceTemplateCards()).observe(list, { childList: true });',
  'tpl-card-office-badges',
  'tpl-card-office-reason'
]);

// Мобильные и печатные правила библиотеки теперь имеют один статический источник истины.
const mobileCss = extractAtRuleBlock(files.libraryCss, sources.libraryCss, '@media(max-width:520px)');
const printCss = extractAtRuleBlock(files.libraryCss, sources.libraryCss, '@media print');

requireCssSnippets(files.libraryCss, mobileCss, [
  '.spn-office-template-card{min-height:74px}',
  '.spn-office-template-card-hint{font-size:11.5px;line-height:1.25}',
  '.spn-office-template-card-note{padding:4px 7px;font-size:10.5px;line-height:1.1}',
  '.template-menu-controls span,.template-menu-controls button{font-size:11.5px}',
  'body[data-template-menu-mode="compact"] .tpl-card p{font-size:11.5px;line-height:1.25}',
  'body[data-template-menu-mode="compact"] .badges{max-height:22px}',
  'body[data-template-menu-mode="compact"] .badge{font-size:10.5px;padding:3px 6px}',
  '.tpl-office-badge{padding:4px 7px;font-size:11px;line-height:1.1}',
  '.tpl-card-office-reason{font-size:11.5px;line-height:1.3}'
]);

requireCssSnippets(files.libraryCss, printCss, [
  '.spn-office-template-filters,.template-menu-controls,.tpl-card-office-badges,.tpl-card-office-reason{display:none!important}'
]);

requireSnippets(files.smoke, sources.smoke, [
  "frame.style.width = '500px';",
  "mobileFontSize('.spn-wizard-step-status') >= 11",
  "mobileFontSize('.spn-wizard-print-count span') >= 11.5",
  "mobileFontSize('.spn-wizard-steps span') >= 11.5",
  "mobileFontSize('.spn-wizard-progress-summary span') >= 11.5",
  "mobileFontSize('.spn-office-template-card-note') >= 10.5",
  "mobileFontSize('.tpl-card .badge') >= 10.5",
  "mobileFontSize('.tpl-office-badge') >= 11",
  "pass('mobile: важные рабочие подписи читаемы')"
]);

requireSnippets(files.guide, sources.guide, [
  '# Читаемость важных подписей на мобильном экране',
  '360 px',
  '500 px',
  'До печати / После печати',
  'риск',
  'npm run validate:mobile-readability',
  'npm run smoke:browser'
]);

requireSnippets(files.maintenance, sources.maintenance, [
  'npm run validate:mobile-readability',
  'docs/mobile-readability.md'
]);

const pkg = parseJson(files.package, sources.package);
if(pkg?.scripts?.['validate:mobile-readability'] !== 'node tools/validate-mobile-readability.mjs'){
  errors.push(`${files.package}: отсутствует корректный validate:mobile-readability`);
}

if(errors.length){
  console.error('\nОшибки проверки мобильной читаемости:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка мобильной читаемости пройдена.');

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл отсутствует`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function requireCssSnippets(file, source, snippets){
  const normalizedSource = normalizeCss(source);
  for(const snippet of snippets){
    if(!normalizedSource.includes(normalizeCss(snippet))){
      errors.push(`${file}: отсутствует CSS-правило ${snippet}`);
    }
  }
}

function normalizeCss(source){
  return String(source)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .trim();
}

function extractAtRuleBlock(file, source, marker){
  const markerIndex = source.indexOf(marker);
  if(markerIndex < 0){
    errors.push(`${file}: отсутствует ${marker}`);
    return '';
  }

  const openIndex = source.indexOf('{', markerIndex + marker.length);
  if(openIndex < 0){
    errors.push(`${file}: у ${marker} отсутствует открывающая фигурная скобка`);
    return '';
  }

  let depth = 0;
  for(let index = openIndex; index < source.length; index += 1){
    if(source[index] === '{') depth += 1;
    if(source[index] === '}'){
      depth -= 1;
      if(depth === 0) return source.slice(openIndex + 1, index);
    }
  }

  errors.push(`${file}: блок ${marker} не закрыт`);
  return source.slice(openIndex + 1);
}

function parseJson(file, source){
  try{
    return JSON.parse(source);
  } catch(error){
    errors.push(`${file}: невалидный JSON (${error.message})`);
    return null;
  }
}
