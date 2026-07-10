import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  state: 'assets/js/state.js',
  rules: 'assets/js/layoutRules.js',
  styles: 'assets/js/spnPhotoLayoutStyle.js',
  quality: 'assets/js/quality.js',
  actions: 'assets/js/spnPhotoLayoutQualityActions.js',
  uiMode: 'assets/js/spnUiMode.js',
  guide: 'docs/photo-layout-modes.md'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.state, sources.state, [
  "{ id:'photo_left', title:'Фото слева', hint:'фото и текст в две колонки' }",
  "{ id:'photo_card', title:'Фото-карточка', hint:'заголовок поверх фотографии' }",
  "{ id:'newbuild_visual', title:'Новостройка', hint:'фасад и планировка без обрезки' }",
  "{ id:'agent_brand_photo', title:'Фото СПН', hint:'портрет, имя и крупный телефон' }"
]);

requireSnippets(files.rules, sources.rules, [
  "photo_left: ['photo','headline','price','description','meta','benefits','customBlock','contact']",
  "photo_card: ['photo','headline','price','description','meta','benefits','customBlock','contact']",
  "newbuild_visual: ['photo','headline','price','meta','description','benefits','customBlock','contact']",
  "agent_brand_photo: ['photo','headline','description','benefits','customBlock','price','meta','contact']",
  "if(effectiveMode === 'photo_left') applyPhotoLeft(next);",
  "if(effectiveMode === 'photo_card') applyPhotoCard(next);",
  "if(effectiveMode === 'newbuild_visual') applyNewbuildVisual(next);",
  "if(effectiveMode === 'agent_brand_photo') applyAgentBrandPhoto(next);",
  'function applyPhotoLeft(state)',
  'function applyPhotoCard(state)',
  'function applyNewbuildVisual(state)',
  'function applyAgentBrandPhoto(state)',
  "state.printCount = Number(state.printCount) === 1 ? 1 : 2;",
  "if(state.photoMode === 'none') state.photoMode = 'one';",
  'state.showQr = Boolean(state.qrLink);',
  "['photo_left','photo_card','newbuild_visual','agent_brand_photo'].includes(state.layoutMode)",
  "state.layoutMode === 'photo_card' && state.photoMode === 'plan'"
]);

requireSnippets(files.styles, sources.styles, [
  '.flyer.has-photo.layout-photo_left.count-1',
  'grid-template-columns:minmax(0,42%) minmax(0,58%)',
  '.flyer.has-photo.layout-photo_left .photos.two{grid-template-columns:1fr;grid-template-rows:1fr 1fr',
  '.flyer.has-photo.layout-photo_left.photo-mode-plan .photo-box img{object-fit:contain',
  '.flyer.has-photo.layout-photo_card.count-1',
  '.flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .headline',
  'background:linear-gradient(180deg,rgba(15,23,42,.68),rgba(15,23,42,.9))',
  '.flyer.has-photo.layout-photo_card.photo-mode-plan .headline',
  '.flyer.has-photo.layout-photo_card.photo-mode-plan .photo-box img{object-fit:contain',
  '.flyer.has-photo.layout-newbuild_visual.count-1',
  '.flyer.has-photo.layout-newbuild_visual .photos.two .photo-box:nth-child(2) img{object-fit:contain',
  '.flyer.has-photo.layout-agent_brand_photo.count-1',
  '.flyer.has-photo.layout-agent_brand_photo .photo-box img{object-fit:contain',
  '@media print',
  '.flyer.has-photo.layout-photo_left.count-1 .photos{height:150mm}',
  '.flyer.has-photo.layout-photo_card.count-1 .photos{height:124mm}'
]);

requireSnippets(files.quality, sources.quality, [
  "const isPhotoLayout = ['photo_left','photo_card','newbuild_visual','agent_brand_photo'].includes(state.layoutMode);",
  "title:'Фото-компоновка без фото'",
  "title:'Фото-компоновка слишком мелкая'",
  "title:'Текст перегружает фото-компоновку'",
  "title:'Длинный заголовок на фотографии'",
  "title:'Отрывные перегружают фотокарточку'",
  "state.layoutMode === 'photo_card'"
]);

requireSnippets(files.actions, sources.actions, [
  'data-photo-layout-quality-action',
  "title === 'Фото-компоновка без фото'",
  "title === 'Отрывные перегружают фотокарточку'",
  "title === 'Отрывные перегружают макет новостройки'",
  "title === 'Брендовый макет без имени СПН'",
  "title === 'Отрывные перегружают брендовый макет'",
  "appendAction(item, 'focus-photo', 'Загрузить фото')",
  "appendAction(item, 'disable-tears', 'Выключить отрывные')",
  "document.getElementById('photoOne')",
  "document.getElementById('tearOffs')",
  "checkbox.dispatchEvent(new Event('change', {bubbles:true}))"
]);

requireSnippets(files.uiMode, sources.uiMode, [
  "import './spnPhotoLayoutStyle.js';",
  "import './spnPhotoLayoutQualityActions.js';"
]);

requireSnippets(files.guide, sources.guide, [
  '# Фото-компоновки генератора',
  '## Фото слева',
  '## Фото-карточка',
  '## Визуальный макет новостройки',
  '## Личный бренд СПН с фотографией',
  '1–2 макета на А4',
  'Планировка',
  '## Ручная проверка',
  '## Что считать регрессией'
]);

if(errors.length){
  console.error('\nОшибки фото-компоновок:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка фото-компоновок пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
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
