import fs from 'node:fs';

patchIndex();
patchInkEfficiency();
patchPhotoActions();
patchTemplateKeyboard();

function patchIndex(){
  const file = 'index.html';
  let source = fs.readFileSync(file, 'utf8');
  const anchor = '  <link rel="stylesheet" href="assets/css/print.css?v=3.85.0" media="print">';
  const additions = [
    '  <link rel="stylesheet" href="assets/css/quality-runtime.css?v=3.85.0">',
    '  <link rel="stylesheet" href="assets/css/template-keyboard.css?v=3.85.0">'
  ];
  if(!source.includes(anchor)) throw new Error('index.html: не найден print.css anchor');
  for(const line of additions){
    if(!source.includes(line)) source = source.replace(anchor, `${anchor}\n${line}`);
  }
  fs.writeFileSync(file, source, 'utf8');
}

function patchInkEfficiency(){
  const file = 'assets/js/spnInkEfficiency.js';
  let source = fs.readFileSync(file, 'utf8');
  source = source.replace("const STYLE_ID = 'spnInkEfficiencyStyles';\n", '');
  source = source.replace('  injectStyles();\n\n', '');
  source = removeTrailingFunction(source, 'function injectStyles(){');
  assertNoInjectedStyle(file, source, 'spnInkEfficiencyStyles');
  fs.writeFileSync(file, source, 'utf8');
}

function patchPhotoActions(){
  const file = 'assets/js/spnPhotoLayoutQualityActions.js';
  let source = fs.readFileSync(file, 'utf8');
  source = source.replace("const STYLE_ID = 'spnPhotoLayoutQualityActionStyles';\n\n", '');
  source = source.replace('  injectStyles();\n', '');
  source = removeTrailingFunction(source, 'function injectStyles(){');
  assertNoInjectedStyle(file, source, 'spnPhotoLayoutQualityActionStyles');
  fs.writeFileSync(file, source, 'utf8');
}

function patchTemplateKeyboard(){
  const file = 'assets/js/spnTemplateKeyboard.js';
  let source = fs.readFileSync(file, 'utf8');
  source = source.replace("const STYLE_ID = 'spn-template-keyboard-style';\n", '');
  source = source.replace('    ensureStyle();\n', '');
  source = removeTrailingFunction(source, 'function ensureStyle(){');
  assertNoInjectedStyle(file, source, 'spn-template-keyboard-style');
  fs.writeFileSync(file, source, 'utf8');
}

function removeTrailingFunction(source, marker){
  const index = source.indexOf(`\n${marker}`);
  if(index < 0) throw new Error(`Не найден trailing function: ${marker}`);
  return `${source.slice(0, index).trimEnd()}\n`;
}

function assertNoInjectedStyle(file, source, styleId){
  for(const forbidden of [styleId, "createElement('style')", 'document.head.appendChild(style)']){
    if(source.includes(forbidden)) throw new Error(`${file}: остался injected style — ${forbidden}`);
  }
}

console.log('Runtime styles moved to CSS domains.');
