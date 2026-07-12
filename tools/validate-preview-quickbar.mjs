import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  helper: 'assets/js/spnPreviewQuickBar.js',
  entry: 'assets/js/spnUiMode.js',
  index: 'index.html',
  guide: 'docs/preview-quickbar.md'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.helper, sources.helper, [
  "document.querySelector('.workspace .preview-top')",
  "document.getElementById('previewStatus')",
  "previewStatus?.setAttribute('aria-live', 'polite')",
  "previewStatus?.setAttribute('aria-atomic', 'true')",
  "button.id = 'spnJumpToPrintBtn'",
  "button.textContent = 'К печати'",
  "document.querySelector('.sidebar .print-card')",
  "document.getElementById('qualityBtn')",
  "document.getElementById('printBtn')",
  "scrollIntoView({block:'center', behavior:'smooth'})",
  'window.setTimeout(() => target.focus(), 280)',
  'position:sticky',
  '@media(max-width:640px)',
  'min-height:44px',
  '@media print'
]);

forbidSnippets(files.helper, sources.helper, [
  'window.print(',
  "document.addEventListener('click'",
  "window.addEventListener('click'",
  "document.querySelector('#printBtn').click()",
  "document.getElementById('printBtn').click()"
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnPreviewQuickBar.js';"
]);

forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnPreviewQuickBar.js"',
  "src='assets/js/spnPreviewQuickBar.js'"
]);

requireSnippets(files.guide, sources.guide, [
  '# Закреплённая панель предпросмотра',
  'aria-live="polite"',
  'Кнопка «К печати»',
  'не вызывает `window.print()`',
  'не обходит существующий print guard',
  'до 640 пикселей',
  'npm run validate:preview-quickbar'
]);

if(errors.length){
  console.error('\nОшибки закреплённой панели предпросмотра:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка закреплённой панели предпросмотра пройдена.');

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

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
