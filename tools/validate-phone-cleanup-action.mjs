import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const qualitySource = read('assets/js/quality.js');
const actionsSource = read('assets/js/qualityExtraActions.js');
const errors = [];

const phoneIssuePattern = /issues\.push\(\{[^}]*title:'В поле телефона есть лишний текст'[^}]*action:null[^}]*\}\)/;
if (!phoneIssuePattern.test(qualitySource)) {
  errors.push('quality.js: замечание о лишнем тексте в телефоне должно оставлять только отдельную кнопку очистки');
}

const forbiddenPhoneAction = /issues\.push\(\{[^}]*title:'В поле телефона есть лишний текст'[^}]*action:'phone'[^}]*\}\)/;
if (forbiddenPhoneAction.test(qualitySource)) {
  errors.push('quality.js: у очистки телефона найдена дублирующая штатная кнопка');
}

const requiredActionSnippets = [
  "{ title: 'В поле телефона есть лишний текст', action: 'cleanPhone', label: 'Оставить только номер' }",
  "if (action === 'cleanPhone') cleanPhone()",
  'function cleanPhone() {',
  'cleanPhoneValue(input.value)'
];

for (const snippet of requiredActionSnippets) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует часть рабочего исправления телефона — ${snippet}`);
  }
}

if (errors.length) {
  console.error('\nОшибки действия очистки телефона:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка действия очистки телефона пройдена.');

function read(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}
