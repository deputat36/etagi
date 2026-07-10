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
  render: 'assets/js/render.js',
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
  "{ id:'agent_brand_photo', title:'Фото СПН', hint:'портрет, имя и крупный телефон' }"
]);

requireSnippets(files.rules, sources.rules, [
  "agent_brand_photo: ['photo','headline','description','benefits','customBlock','price','meta','contact']",
  "if(effectiveMode === 'agent_brand_photo') applyAgentBrandPhoto(next);",
  'function applyAgentBrandPhoto(state)',
  "state.printCount = Number(state.printCount) === 1 ? 1 : 2;",
  'state.showBrand = true;',
  "if(state.photoMode === 'none') state.photoMode = 'one';"
]);

requireSnippets(files.render, sources.render, [
  "state.layoutMode === 'agent_brand_photo' ? renderAgentBrandIdentity(state) : ''",
  'function renderAgentBrandIdentity(state)',
  "String(state.agentName || '').trim() || 'ИМЯ СПЕЦИАЛИСТА'",
  'class="agent-brand-identity"',
  'esc(name)',
  'Специалист по недвижимости'
]);

requireSnippets(files.styles, sources.styles, [
  '.flyer.has-photo.layout-agent_brand_photo.count-1',
  '.flyer.has-photo.layout-agent_brand_photo.count-2',
  'grid-template-columns:minmax(0,38%) minmax(0,62%)',
  '.flyer.has-photo.layout-agent_brand_photo .photo-box img{object-fit:contain;object-position:center bottom',
  '.flyer.has-photo.layout-agent_brand_photo .agent-brand-identity strong',
  '.flyer.has-photo.layout-agent_brand_photo.count-1 .photos{height:145mm}',
  '.flyer.has-photo.layout-agent_brand_photo.count-2 .photos{height:63mm}',
  '@media print'
]);

requireSnippets(files.quality, sources.quality, [
  "const isAgentBrandPhoto = state.layoutMode === 'agent_brand_photo';",
  "title:'Брендовый макет без имени СПН'",
  "title:'Текст перегружает брендовый макет'",
  "title:'Длинный заголовок личного бренда'",
  "title:'Отрывные перегружают брендовый макет'"
]);

requireSnippets(files.actions, sources.actions, [
  "title === 'Брендовый макет без имени СПН'",
  "appendAction(item, 'focus-agent-name', 'Указать имя')",
  "button.dataset.photoLayoutQualityAction === 'focus-agent-name'",
  "document.getElementById('agentName')",
  "title === 'Отрывные перегружают брендовый макет'"
]);

requireSnippets(files.wizard, sources.wizard, [
  "id: 'brand-district'",
  "layoutMode: 'agent_brand_photo'",
  "format: '2 макета на А4, портрет СПН без обрезки, короткий текст и крупный телефон.'"
]);

requireSnippets(files.smoke, sources.smoke, [
  '[data-layout-mode="agent_brand_photo"]',
  '.flyer.has-photo.layout-agent_brand_photo.count-1 .agent-brand-identity strong',
  "win.getComputedStyle(agentImage).objectFit === 'contain'",
  '.flyer.has-photo.layout-agent_brand_photo.count-2'
]);

requireSnippets(files.guide, sources.guide, [
  '## Личный бренд СПН с фотографией',
  'портрет выводится через',
  'имя СПН показывается отдельным крупным блоком',
  'Проверить 1 макет на А4',
  'результат ограничен до 2 на А4'
]);

checkBehavior();

if(errors.length){
  console.error('\nОшибки брендового фото-режима СПН:');
  errors.forEach(error => console.error('- ' + error));
  process.exit(1);
}

console.log('Проверка брендового фото-режима СПН пройдена.');

function checkBehavior(){
  const source = {
    ...defaultState,
    goal: 'brand',
    printCount: 4,
    photoMode: 'none',
    photoOne: '',
    photoTwo: '',
    showPhoto: false,
    showQr: true,
    qrLink: '',
    showContact: false,
    agentName: '',
    agentPhone: '123',
    tearOffs: true,
    headline: 'ВАШ СПЕЦИАЛИСТ ПО НЕДВИЖИМОСТИ',
    description: 'Помогу разобраться с продажей, покупкой и оценкой недвижимости.',
    benefits: 'Консультация\nОценка недвижимости',
    area: 'Борисоглебск',
    propertyType: '',
    params: ''
  };
  const snapshot = JSON.stringify(source);
  const twoOnPage = applyLayoutMode(source, 'agent_brand_photo');

  if(twoOnPage.printCount !== 2) errors.push('applyAgentBrandPhoto: формат 4+ должен безопасно переводиться в 2 на А4');
  if(twoOnPage.layoutMode !== 'agent_brand_photo') errors.push('applyAgentBrandPhoto: layoutMode должен сохранять agent_brand_photo');
  if(!twoOnPage.showPhoto || twoOnPage.photoMode !== 'one') errors.push('applyAgentBrandPhoto: фото должно остаться включённым без подстановки файла');
  if(!twoOnPage.showQr) errors.push('applyAgentBrandPhoto: включённый пустой QR нельзя отключать автоматически');
  if(twoOnPage.showContact) errors.push('applyAgentBrandPhoto: контакты с ошибочным телефоном нельзя включать автоматически');
  if(!twoOnPage.tearOffs) errors.push('applyAgentBrandPhoto: отрывные нельзя выключать автоматически без действия пользователя');
  if(!twoOnPage.showBrand) errors.push('applyAgentBrandPhoto: фирменный блок должен быть включён');
  if(Number(twoOnPage.phoneScale) < 1.4) errors.push('applyAgentBrandPhoto: телефон должен оставаться крупным');
  if(JSON.stringify(source) !== snapshot) errors.push('applyAgentBrandPhoto: исходное состояние не должно мутироваться');

  const oneOnPage = applyLayoutMode({...source, printCount:1}, 'agent_brand_photo');
  if(oneOnPage.printCount !== 1) errors.push('applyAgentBrandPhoto: выбранный формат 1 на А4 должен сохраняться');

  const emptyIssues = issueTitles(twoOnPage);
  if(!emptyIssues.includes('Фото-компоновка без фото')) errors.push('quality: отсутствие портрета должно быть критической ошибкой');
  if(!emptyIssues.includes('Брендовый макет без имени СПН')) errors.push('quality: отсутствие имени должно быть критической ошибкой');

  const overloaded = {
    ...twoOnPage,
    agentName: 'Анна Качкина',
    photoOne: 'data:image/svg+xml;base64,portrait',
    showPhoto: true,
    description: 'а'.repeat(161),
    headline: 'Ж'.repeat(39)
  };
  const overloadedIssues = issueTitles(overloaded);
  for(const title of [
    'Текст перегружает брендовый макет',
    'Длинный заголовок личного бренда',
    'Отрывные перегружают брендовый макет'
  ]){
    if(!overloadedIssues.includes(title)) errors.push('quality: отсутствует проверка «' + title + '»');
  }

  const tooManyIssues = issueTitles({...overloaded, printCount:4});
  if(!tooManyIssues.includes('Фото-компоновка слишком мелкая')) errors.push('quality: 4+ макета должны блокироваться для agent_brand_photo');
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
