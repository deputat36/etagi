import fs from 'node:fs';
import path from 'node:path';
import { applyLayoutMode } from '../assets/js/layoutRules.js';
import { checkQuality } from '../assets/js/quality.js';
import { defaultState } from '../assets/js/state.js';

const rootDir = process.cwd();
const errors = [];
const files = {
  state: 'assets/js/state.js',
  rules: 'assets/js/layoutRules.js',
  styles: 'assets/js/spnPhotoLayoutStyle.js',
  quality: 'assets/js/quality.js',
  actions: 'assets/js/spnPhotoLayoutQualityActions.js',
  wizard: 'assets/js/spnWizard.js',
  smoke: 'tools/browser-smoke.html',
  guide: 'docs/photo-layout-modes.md'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.state, sources.state, [
  "{ id:'newbuild_visual', title:'Новостройка', hint:'фасад и планировка без обрезки' }"
]);

requireSnippets(files.rules, sources.rules, [
  "newbuild_visual: ['photo','headline','price','meta','description','benefits','customBlock','contact']",
  "if(effectiveMode === 'newbuild_visual') applyNewbuildVisual(next);",
  'function applyNewbuildVisual(state)',
  "state.printCount = Number(state.printCount) === 1 ? 1 : 2;",
  "if(state.photoMode === 'none') state.photoMode = 'one';"
]);

requireSnippets(files.styles, sources.styles, [
  '.flyer.has-photo.layout-newbuild_visual.count-1',
  '.flyer.has-photo.layout-newbuild_visual.count-2',
  '.flyer.has-photo.layout-newbuild_visual .photos.two{grid-template-columns:minmax(0,2.1fr) minmax(0,1fr)}',
  '.flyer.has-photo.layout-newbuild_visual .photos.two .photo-box:nth-child(2) img{object-fit:contain',
  '.flyer.has-photo.layout-newbuild_visual.photo-mode-plan .photo-box img',
  '.flyer.has-photo.layout-newbuild_visual.count-1 .photos{height:112mm}',
  '.flyer.has-photo.layout-newbuild_visual.count-2 .photos{height:50mm}',
  '@media print'
]);

requireSnippets(files.quality, sources.quality, [
  "const isNewbuildVisual = state.layoutMode === 'newbuild_visual';",
  "title:'Текст перегружает макет новостройки'",
  "title:'Длинный заголовок новостройки'",
  "title:'Отрывные перегружают макет новостройки'"
]);

requireSnippets(files.actions, sources.actions, [
  "title === 'Отрывные перегружают макет новостройки'",
  "appendAction(item, 'disable-tears', 'Выключить отрывные')"
]);

requireSnippets(files.wizard, sources.wizard, [
  "id: 'tellerman-sad'",
  "layoutMode: 'newbuild_visual'",
  "format: '2 макета на А4, крупный визуал дома, можно добавить планировку и QR.'"
]);

requireSnippets(files.smoke, sources.smoke, [
  '[data-layout-mode="newbuild_visual"]',
  '.flyer.has-photo.layout-newbuild_visual.count-1 .photos.two',
  "win.getComputedStyle(planImage).objectFit === 'contain'",
  '.flyer.has-photo.layout-newbuild_visual.count-2'
]);

requireSnippets(files.guide, sources.guide, [
  '## Визуальный макет новостройки',
  'используется для планировки',
  'object-fit: contain',
  'Проверить 1 макет на А4',
  'ограничен до 2 на А4'
]);

checkBehavior();

if(errors.length){
  console.error('\nОшибки визуального режима новостройки:');
  errors.forEach(error => console.error('- ' + error));
  process.exit(1);
}

console.log('Проверка визуального режима новостройки пройдена.');

function checkBehavior(){
  const source = {
    ...defaultState,
    goal: 'newbuild',
    printCount: 4,
    photoMode: 'none',
    photoOne: '',
    photoTwo: '',
    showPhoto: false,
    showQr: true,
    qrLink: '',
    showContact: false,
    agentPhone: '123',
    tearOffs: true,
    headline: 'ЖК ТЕЛЛЕРМАНОВ САД',
    description: 'Новый дом в Борисоглебске.',
    benefits: 'Подбор планировки\nКонсультация',
    area: 'Просторная 4а',
    propertyType: 'новостройка',
    params: 'квартиры разных форматов'
  };
  const snapshot = JSON.stringify(source);
  const twoOnPage = applyLayoutMode(source, 'newbuild_visual');

  if(twoOnPage.printCount !== 2) errors.push('applyNewbuildVisual: формат 4+ должен безопасно переводиться в 2 на А4');
  if(twoOnPage.layoutMode !== 'newbuild_visual') errors.push('applyNewbuildVisual: layoutMode должен сохранять newbuild_visual');
  if(!twoOnPage.showPhoto || twoOnPage.photoMode !== 'one') errors.push('applyNewbuildVisual: фото должно остаться включённым без подстановки файла');
  if(!twoOnPage.showQr) errors.push('applyNewbuildVisual: включённый пустой QR нельзя отключать автоматически');
  if(twoOnPage.showContact) errors.push('applyNewbuildVisual: контакты с ошибочным телефоном нельзя включать автоматически');
  if(!twoOnPage.tearOffs) errors.push('applyNewbuildVisual: отрывные нельзя выключать автоматически без действия пользователя');
  if(Number(twoOnPage.phoneScale) < 1.3) errors.push('applyNewbuildVisual: телефон должен оставаться крупным');
  if(JSON.stringify(source) !== snapshot) errors.push('applyNewbuildVisual: исходное состояние не должно мутироваться');

  const oneOnPage = applyLayoutMode({...source, printCount:1}, 'newbuild_visual');
  if(oneOnPage.printCount !== 1) errors.push('applyNewbuildVisual: выбранный формат 1 на А4 должен сохраняться');

  const emptyPhotoIssues = issueTitles(twoOnPage);
  if(!emptyPhotoIssues.includes('Фото-компоновка без фото')) errors.push('quality: отсутствие фасада должно быть критической ошибкой');

  const overloaded = {
    ...twoOnPage,
    photoOne: 'data:image/svg+xml;base64,facade',
    showPhoto: true,
    description: 'а'.repeat(171),
    headline: 'Ж'.repeat(43)
  };
  const overloadedIssues = issueTitles(overloaded);
  for(const title of [
    'Текст перегружает макет новостройки',
    'Длинный заголовок новостройки',
    'Отрывные перегружают макет новостройки'
  ]){
    if(!overloadedIssues.includes(title)) errors.push('quality: отсутствует проверка «' + title + '»');
  }

  const tooManyIssues = issueTitles({...overloaded, printCount:4});
  if(!tooManyIssues.includes('Фото-компоновка слишком мелкая')) errors.push('quality: 4+ макета должны блокироваться для newbuild_visual');
}

function issueTitles(state){
  const sheet = {querySelectorAll: () => []};
  return checkQuality(state, sheet).issues.map(issue => issue.title);
}

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(file + ': отсутствует ' + snippet);
  }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(file + ': файл не найден');
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
