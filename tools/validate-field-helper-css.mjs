import fs from 'node:fs';

const files = {
  index: 'index.html',
  css: 'assets/css/field-helpers.css',
  area: 'assets/js/spnAreaHelper.js',
  params: 'assets/js/spnParamsHelper.js',
  phone: 'assets/js/spnPhoneHelper.js',
  price: 'assets/js/spnPriceHelper.js'
};
const errors = [];
const sources = Object.fromEntries(Object.entries(files).map(([key,file]) => [key, read(file)]));

requireSnippets(files.index, sources.index, [
  'assets/css/quality-runtime.css?v=3.85.0',
  'assets/css/field-helpers.css?v=3.85.0'
]);
if(sources.index.indexOf('assets/css/field-helpers.css?v=3.85.0') < sources.index.indexOf('assets/css/quality-runtime.css?v=3.85.0')){
  errors.push('index.html: field-helpers.css должен подключаться после quality-runtime.css');
}

requireSnippets(files.css, sources.css, [
  '.spn-area-helper{',
  '.spn-params-helper{',
  '.spn-phone-helper{',
  '.spn-price-helper{',
  '@media(max-width:520px){.spn-area-presets,.spn-area-context{grid-template-columns:1fr}}',
  '@media(max-width:520px){.spn-params-ideas{grid-template-columns:1fr}}',
  '@media(max-width:520px){.spn-phone-actions{grid-template-columns:1fr}}',
  '@media(max-width:520px){.spn-price-ideas{grid-template-columns:1fr}}',
  '@media print{.spn-area-helper{display:none!important}}',
  '@media print{.spn-params-helper{display:none!important}}',
  '@media print{.spn-phone-helper{display:none!important}}',
  '@media print{.spn-price-helper{display:none!important}}'
]);

const contracts = {
  area: ['data-area-value', 'data-area-context', 'putAreaToHeadline()', "setChecked('showMeta', true)"],
  params: ['getIdeas()', 'housePresets', 'landPresets', 'commercialPresets', "setChecked('showMeta', false)"],
  phone: ['normalizeRussianPhone(raw)', 'showPhoneEverywhere()', 'showTearsOnly()', "setChecked('tearOffs', true)"],
  price: ['renderPriceIdeas()', 'normalizeAmount(raw)', 'data-price-idea', "setChecked('showPrice', false)"]
};
const styleIds = {
  area:'spnAreaHelperStyles', params:'spnParamsHelperStyles', phone:'spnPhoneHelperStyles', price:'spnPriceHelperStyles'
};
for(const key of ['area','params','phone','price']){
  requireSnippets(files[key], sources[key], contracts[key]);
  forbidSnippets(files[key], sources[key], ['injectStyles', "createElement('style')", 'createElement("style")', styleIds[key]]);
}

if(errors.length){
  console.error('\nОшибки CSS помощников полей:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log('Проверка CSS помощников полей пройдена.');

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
