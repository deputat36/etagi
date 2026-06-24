import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const source = read('assets/js/qualityExtraActions.js');
const errors = [];

const requiredSnippets = [
  "const paramsInput = document.getElementById('params')",
  "const typeInput = document.getElementById('propertyType')",
  "const params = String(paramsInput.value || '').trim()",
  "const propertyType = String(typeInput.value || '').trim()",
  'if (params && !includesText(propertyType, params))',
  "setInputValue(typeInput, [propertyType, params].filter(Boolean).join(', '))",
  "setInputValue(paramsInput, '')",
  'Параметры сохранены в компактной строке вместе с типом объекта.'
];

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    errors.push(`qualityExtraActions.js: отсутствует сохранение параметров при упрощении строки — ${snippet}`);
  }
}

if (source.includes("setInputValue(input, '')")) {
  errors.push('qualityExtraActions.js: упрощение параметров не должно безвозвратно очищать пользовательские данные');
}

if (errors.length) {
  console.error('\nОшибки сохранения параметров объекта:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка сохранения параметров объекта пройдена.');

function read(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}
