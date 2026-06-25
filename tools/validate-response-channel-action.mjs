import fs from 'node:fs';

const actionsSource = read('assets/js/qualityExtraActions.js');
const qualitySource = read('assets/js/quality.js');
const errors = [];

check(actionsSource, 'qualityExtraActions.js', [
  "button.dataset.fix === 'showContact' && !hasPhoneValue()",
  'event.stopImmediatePropagation?.()",
  'focusPhoneField();',
  'function hasPhoneValue()'
]);

check(qualitySource, 'quality.js', [
  "title:'Нет канала отклика'",
  "action:'showContact'"
]);

if (errors.length) {
  console.error('\nОшибки безопасного канала отклика:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка безопасного канала отклика пройдена.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
