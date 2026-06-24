import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const qualitySource = read('assets/js/quality.js');
const actionsSource = read('assets/js/qualityExtraActions.js');
const errors = [];

const issuePattern = /issues\.push\(\{[^}]*title:'Заголовок не продаёт'[^}]*action:null[^}]*\}\)/;
if (!issuePattern.test(qualitySource)) {
  errors.push('quality.js: непродающий заголовок должен оставлять только отдельную кнопку усиления');
}

const forbiddenAction = /issues\.push\(\{[^}]*title:'Заголовок не продаёт'[^}]*action:'showHeadline'[^}]*\}\)/;
if (forbiddenAction.test(qualitySource)) {
  errors.push('quality.js: найдена бесполезная кнопка показа уже видимого заголовка');
}

const requiredQualitySnippets = [
  'const placeholderHeadline = isStarterPlaceholder(state.headline)',
  'if(placeholderHeadline) issues.push',
  'state.headline && !placeholderHeadline && !hasClientHook(text)'
];

for (const snippet of requiredQualitySnippets) {
  if (!qualitySource.includes(snippet)) {
    errors.push(`quality.js: техническая заглушка не должна одновременно создавать второе замечание — ${snippet}`);
  }
}

const unsafeHookCheck = 'state.showHeadline && state.headline && !hasClientHook(text)';
if (qualitySource.includes(unsafeHookCheck)) {
  errors.push('quality.js: проверка слабого крючка должна исключать технический заголовок');
}

const requiredActionSnippets = [
  "{ title: 'Заголовок не продаёт', action: 'strongHeadline', label: 'Усилить заголовок' }",
  "if (action === 'strongHeadline') setStrongHeadline()",
  'function setStrongHeadline() {'
];

for (const snippet of requiredActionSnippets) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует часть рабочего усиления заголовка — ${snippet}`);
  }
}

const requiredGoalHeadlines = [
  "seller: 'Ищу недвижимость для покупки'",
  "buyer: 'Помогу найти покупателя'",
  "object: 'Помогу продать недвижимость'",
  "newbuild: 'Подберу квартиру в новостройке'",
  "service: 'Помогу с недвижимостью'",
  "rent: 'Помогу с арендой недвижимости'",
  "brand: 'Ваш специалист по недвижимости'",
  "private: 'Частное объявление о недвижимости'"
];

for (const snippet of requiredGoalHeadlines) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует понятный заголовок для выбранной задачи — ${snippet}`);
  }
}

const misleadingGoalHeadlines = [
  "seller: 'Куплю недвижимость'",
  "buyer: 'Есть покупатель'",
  "object: 'Продам объект'",
  "brand: 'СПН по недвижимости'"
];

for (const snippet of misleadingGoalHeadlines) {
  if (actionsSource.includes(snippet)) {
    errors.push(`qualityExtraActions.js: автоматический заголовок не должен создавать неподтверждённое обещание или непонятное сокращение — ${snippet}`);
  }
}

const requiredContextSnippets = [
  "const context = [propertyType, area].filter(Boolean).join(', ')",
  'return context ? `${base} — ${context}` : base'
];

for (const snippet of requiredContextSnippets) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`qualityExtraActions.js: контекст заголовка должен собираться без попытки склонять свободный текст — ${snippet}`);
  }
}

const unsafeContextSnippets = [
  "[propertyType, area].filter(Boolean).join(' в ')",
  'return context ? `${base}: ${context}` : base'
];

for (const snippet of unsafeContextSnippets) {
  if (actionsSource.includes(snippet)) {
    errors.push(`qualityExtraActions.js: найдено грамматически ненадёжное соединение типа объекта и района — ${snippet}`);
  }
}

if (errors.length) {
  console.error('\nОшибки действия усиления заголовка:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка действия усиления заголовка пройдена.');

function read(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}
