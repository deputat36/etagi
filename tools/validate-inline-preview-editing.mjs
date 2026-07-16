import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  module: 'assets/js/spnInlinePreviewEditor.js',
  render: 'assets/js/render.js',
  entry: 'assets/js/spnUiMode.js',
  index: 'index.html',
  package: 'package.json',
  screenshot: 'tools/print-screenshot.html',
  qrSmoke: 'tools/qr-inline-error-smoke.html',
  tabSmoke: 'tools/inline-tab-order-smoke.html',
  uiSmokeRunner: 'tools/run-ui-actions-smoke.mjs',
  guide: 'docs/inline-preview-editing.md'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.module, sources.module, [
  "const EDITABLE_SELECTOR = '[data-inline-field]'",
  "sheet.dataset.inlinePreviewBound = 'true'",
  "sheet.addEventListener('focusin', handleFocusIn)",
  "sheet.addEventListener('focusout', handleFocusOut)",
  "sheet.addEventListener('keydown', handleKeydown)",
  "sheet.addEventListener('paste', handlePaste)",
  "event.key === 'Escape'",
  "event.ctrlKey || event.metaKey",
  "input.dispatchEvent(new Event('input', {bubbles:true}))",
  'updateBenefitLine',
  'insertPlainText',
  'нажмите на текст в макете',
  '@media print'
]);

forbidSnippets(files.module, sources.module, [
  "document.addEventListener('click'",
  "window.addEventListener('click'",
  'document.execCommand',
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'localStorage.setItem'
]);

requireSnippets(files.render, sources.render, [
  'function inlineEditAttrs(field, label, options = {})',
  'contenteditable="true"',
  'data-inline-field="${field}"',
  "inlineEditAttrs('headline', 'Заголовок'",
  "inlineEditAttrs('description', 'Описание'",
  "inlineEditAttrs('benefits', `Преимущество ${index + 1}`",
  "inlineEditAttrs('agentPhone', 'Телефон')",
  "inlineEditAttrs('agentName', 'Имя специалиста')",
  "inlineEditAttrs('contactCta', 'Призыв в контактах')",
  "inlineEditAttrs('qrCaption', 'Подпись QR')",
  'class="qr-copy"',
  'class="qr-caption"',
  'class="qr-error-note" contenteditable="false" role="note"',
  'normalizeInlineTabStops(sheet)',
  'function normalizeInlineTabStops(sheet)',
  "flyer.querySelectorAll('[data-inline-field]')",
  'editable.tabIndex = flyerIndex === 0 ? 0 : -1'
]);
forbidSnippets(files.render, sources.render, [
  '${caption}<br>ссылка слишком длинная</span>'
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnContactEditor.js';",
  "import './spnInlinePreviewEditor.js';"
]);
if(sources.entry.indexOf("import './spnInlinePreviewEditor.js';") < sources.entry.indexOf("import './spnContactEditor.js';")){
  errors.push(`${files.entry}: inline-редактор должен подключаться после редактора контактного призыва`);
}
forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnInlinePreviewEditor.js"',
  "src='assets/js/spnInlinePreviewEditor.js'"
]);

const pkg = readJson(files.package, sources.package);
if(String(pkg?.scripts?.['test:inline-preview-editing'] || '').trim() !== 'node tools/validate-inline-preview-editing.mjs'){
  errors.push(`${files.package}: test:inline-preview-editing должен запускать node tools/validate-inline-preview-editing.mjs`);
}

requireSnippets(files.screenshot, sources.screenshot, [
  'verifyInlineHeadlineEditing',
  'data-inline-field="headline"',
  'РЕДАКТИРУЮ ПРЯМО НА МАКЕТЕ',
  'прямое редактирование не синхронизировало поле заголовка',
  'прямое редактирование не обновило все копии макета'
]);

requireSnippets(files.qrSmoke, sources.qrSmoke, [
  'id="uiActionsSmokeResult"',
  "const longLink = `https://example.com/${'q'.repeat(140)}`",
  '.qr-caption[data-inline-field="qrCaption"]',
  '.qr-error-note',
  "getAttribute('contenteditable') === 'false'",
  "!doc.getElementById('qrCaption').value.includes('ссылка слишком длинная')",
  'после короткой ссылки ошибка QR не исчезла',
  'длинный QR: inline-редактор сохраняет только подпись'
]);

requireSnippets(files.tabSmoke, sources.tabSmoke, [
  'id="uiActionsSmokeResult"',
  "click(doc, '[data-count=\"4\"]')",
  'firstEditables.every(node => node.tabIndex === 0)',
  'duplicateEditables.every(node => node.tabIndex === -1)',
  'secondaryHeadline.isContentEditable',
  'doc.activeElement === secondaryHeadline',
  "doc.getElementById('headline')?.value === 'Изменено во второй копии'",
  'после рендера повторные Tab-stop вернулись',
  'вторая копия: прямое редактирование сохранено вне Tab-порядка'
]);

requireSnippets(files.uiSmokeRunner, sources.uiSmokeRunner, [
  "label:'QR inline error smoke'",
  "path:'tools/qr-inline-error-smoke.html'",
  "label:'Inline tab order smoke'",
  "path:'tools/inline-tab-order-smoke.html'"
]);

requireSnippets(files.guide, sources.guide, [
  '# Редактирование текста прямо на макете',
  'Значение синхронизируется с полем слева',
  'обновится во всех копиях макета на листе',
  'Esc отменяет',
  'Вставка выполняется как обычный текст без HTML-разметки',
  'Предупреждение о слишком длинной QR-ссылке не является частью подписи',
  'В клавиатурный Tab-порядок входит только первая копия макета',
  'Остальные копии остаются редактируемыми кликом или касанием',
  'npm run test:inline-preview-editing',
  'npm run validate:ink-efficiency'
]);

if(errors.length){
  console.error('\nОшибки прямого редактирования макета:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка прямого редактирования текста на макете пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}

function readJson(file, source){
  try{
    return JSON.parse(source || '{}');
  } catch(error){
    errors.push(`${file}: JSON не читается — ${error.message}`);
    return null;
  }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
