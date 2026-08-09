import fs from 'node:fs';

const files = {
  index: 'index.html',
  css: 'assets/css/editor-helpers.css',
  agent: 'assets/js/spnAgentHelper.js',
  brand: 'assets/js/spnBrandEditor.js',
  contact: 'assets/js/spnContactEditor.js',
  qr: 'assets/js/spnQrEditor.js'
};
const errors = [];
const sources = Object.fromEntries(Object.entries(files).map(([key,file]) => [key, read(file)]));

requireSnippets(files.index, sources.index, [
  'assets/css/field-helpers.css?v=3.85.0',
  'assets/css/editor-helpers.css?v=3.85.0'
]);
if(sources.index.indexOf('assets/css/editor-helpers.css?v=3.85.0') < sources.index.indexOf('assets/css/field-helpers.css?v=3.85.0')){
  errors.push('index.html: editor-helpers.css должен подключаться после field-helpers.css');
}

requireSnippets(files.css, sources.css, [
  '.spn-agent-helper{',
  '.spn-brand-editor{',
  '.spn-contact-editor{',
  '.spn-qr-editor{',
  '@media(max-width:520px){.spn-agent-ideas{grid-template-columns:1fr}}',
  '@media(max-width:520px){.spn-brand-editor-grid{grid-template-columns:1fr}}',
  '@media(max-width:520px){.spn-contact-presets{grid-template-columns:1fr}}',
  '@media(max-width:520px){.spn-qr-presets{grid-template-columns:1fr}}',
  '@media print{.spn-agent-helper{display:none!important}}',
  '@media print{.spn-brand-editor{display:none!important}}',
  '@media print{.spn-contact-editor{display:none!important}}',
  '@media print{.spn-qr-editor{display:none!important}}'
]);

const contracts = {
  agent: ['renderNameIdeas()', 'normalizeAgentName()', 'data-agent-idea', 'toTitleCase(raw)'],
  brand: ['data-brand-name', 'data-brand-side', 'saveBrand()', 'loadBrandName()', 'setLayoutExtraValue'],
  contact: ['data-contact-cta', 'saveCta(input.value)', 'loadCta()', 'setLayoutExtraValue'],
  qr: ['data-qr-caption', 'qrCleanLinkBtn', "setChecked('showQr', true)", "setValue('qrLink', '')"]
};
const styleIds = {
  agent:'spnAgentHelperStyles', brand:'brandRowEditorStyles', contact:'contactCtaEditorStyles', qr:'qrCaptionHelperStyles'
};
for(const key of ['agent','brand','contact','qr']){
  requireSnippets(files[key], sources[key], contracts[key]);
  forbidSnippets(files[key], sources[key], ['injectStyles', "createElement('style')", 'createElement("style")', styleIds[key]]);
}

if(errors.length){
  console.error('\nОшибки CSS редакторов полей:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log('Проверка CSS редакторов полей пройдена.');

function read(file){
  if(!fs.existsSync(file)){ errors.push(`${file}: файл отсутствует`); return ''; }
  return fs.readFileSync(file,'utf8');
}
function requireSnippets(file, source, snippets){
  for(const snippet of snippets) if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
}
function forbidSnippets(file, source, snippets){
  for(const snippet of snippets) if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
}
