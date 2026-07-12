import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  helper: 'assets/js/spnInkEfficiency.js',
  entry: 'assets/js/spnUiMode.js',
  screenshot: 'tools/print-screenshot.html',
  guide: 'docs/ink-efficiency.md'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.helper, sources.helper, [
  '[data-layout-mode="economy"], [data-layout-mode="entrance"]',
  "colorMode.value !== 'brand'",
  "colorMode.value = 'economy'",
  "dispatchEvent(new Event('change', {bubbles:true}))",
  'Повышенный расход чернил',
  'Экономный цвет',
  'count < 4',
  '.flyer.color-economy .contact',
  'background:#fff!important',
  'border:.55mm solid var(--accent)!important',
  'box-shadow:inset 0 1.1mm 0 var(--accent)!important',
  '.flyer.color-economy.layout-photo_card:not(.photo-mode-plan) .headline',
  'background:rgba(255,255,255,.94)!important',
  '-webkit-print-color-adjust:exact',
  'print-color-adjust:exact'
]);

forbidSnippets(files.helper, sources.helper, [
  "document.addEventListener('click'",
  "window.addEventListener('click'",
  'showPhoto.checked = false',
  'showQr.checked = false',
  "colorMode.value = 'bw'"
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnInkEfficiency.js';"
]);

requireSnippets(files.screenshot, sources.screenshot, [
  "doc.getElementById('colorMode')?.value === 'economy'",
  '.flyer.color-economy.count-4',
  'assertInkEfficientContacts(flyers)',
  'relativeLuminance(style.backgroundColor) < 0.82',
  'экономный режим оставил тёмную сплошную контактную заливку',
  'экономная контактная зона потеряла цветную рамку'
]);

requireSnippets(files.guide, sources.guide, [
  '# Оптимизация расхода чернил',
  'не переводит лист в чёрно-белый',
  'не удаляет фото, QR, телефон или фирменность',
  'npm run validate:ink-efficiency',
  'four-contacts.png',
  'светлый фон контактного блока'
]);

if(errors.length){
  console.error('\nОшибки оптимизации расхода чернил:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка оптимизации расхода чернил пройдена.');

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
