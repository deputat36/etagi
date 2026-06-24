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

const requiredSnippets = [
  "{ title: 'Заголовок не продаёт', action: 'strongHeadline', label: 'Усилить заголовок' }",
  "if (action === 'strongHeadline') setStrongHeadline()",
  'function setStrongHeadline() {'
];

for (const snippet of requiredSnippets) {
  if (!actionsSource.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует часть рабочего усиления заголовка — ${snippet}`);
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
