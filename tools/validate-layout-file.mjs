import fs from 'node:fs';
import { defaultState } from '../assets/js/state.js';
import {
  LAYOUT_FILE_FORMAT,
  LAYOUT_FILE_FORMAT_VERSION,
  LAYOUT_FILE_SCHEMA_PATH,
  createLayoutFilePayload,
  parseLayoutFileText,
  validateLayoutFilePayload
} from '../assets/js/layoutFile.js';

const schema = JSON.parse(fs.readFileSync(LAYOUT_FILE_SCHEMA_PATH, 'utf8'));
const errors = [];

assert(schema?.properties?.fileFormat?.const === LAYOUT_FILE_FORMAT, 'schema: неверный fileFormat');
assert(schema?.properties?.fileFormatVersion?.maximum === LAYOUT_FILE_FORMAT_VERSION, 'schema: неверная максимальная версия формата');
assert(schema?.properties?.printCount?.enum?.join(',') === '1,2,3,4,6,8', 'schema: неверный список форматов печати');

const payload = createLayoutFilePayload({...defaultState, headline:'Проверочный макет'});
assert(payload.fileFormat === LAYOUT_FILE_FORMAT, 'export: отсутствует идентификатор формата');
assert(payload.fileFormatVersion === LAYOUT_FILE_FORMAT_VERSION, 'export: отсутствует версия формата');
assert(payload.$schema === LAYOUT_FILE_SCHEMA_PATH, 'export: отсутствует ссылка на схему');
assert(!Number.isNaN(Date.parse(payload.exportedAt)), 'export: exportedAt не является датой');

const parsed = parseLayoutFileText(JSON.stringify(payload));
assert(parsed.ok, `import: корректный файл отклонён — ${parsed.message || ''}`);
assert(parsed.state.headline === 'Проверочный макет', 'import: потерян заголовок');
assert(!Object.hasOwn(parsed.state, 'fileFormat'), 'import: служебные поля попали в state');
assert(parsed.legacy === false, 'import: новый формат ошибочно отмечен как старый');

const legacy = validateLayoutFilePayload({headline:'Старый макет', printCount:2});
assert(legacy.ok && legacy.legacy === true, 'legacy: старый плоский макет не поддерживается');

assert(parseLayoutFileText('{broken').code === 'invalid-json', 'diagnostics: повреждённый JSON не распознан');
assert(validateLayoutFilePayload([]).code === 'invalid-root', 'diagnostics: массив не отклонён');
assert(validateLayoutFilePayload({foo:'bar'}).code === 'not-layout', 'diagnostics: посторонний JSON не отклонён');
assert(validateLayoutFilePayload({fileFormat:'other-app', headline:'Тест'}).code === 'wrong-format', 'diagnostics: чужой формат не отклонён');
assert(validateLayoutFilePayload({fileFormat:LAYOUT_FILE_FORMAT, fileFormatVersion:2, headline:'Тест'}).code === 'future-format-version', 'diagnostics: будущая версия не отклонена');
assert(validateLayoutFilePayload({headline:'Тест', printCount:'4'}).code === 'invalid-fields', 'diagnostics: неверный тип printCount не отклонён');
assert(validateLayoutFilePayload({headline:'Тест', colorMode:'neon'}).code === 'invalid-fields', 'diagnostics: неизвестная цветность не отклонена');
assert(validateLayoutFilePayload({headline:'Тест', blockOrder:['headline','unknown']}).code === 'invalid-fields', 'diagnostics: неизвестный блок не отклонён');

const withUnknown = validateLayoutFilePayload({headline:'Тест', unknownFutureField:true});
assert(withUnknown.ok, 'forward compatibility: неизвестное поле заблокировало импорт');
assert(withUnknown.warnings.length === 1, 'forward compatibility: неизвестное поле не отражено в предупреждении');
assert(!Object.hasOwn(withUnknown.state, 'unknownFutureField'), 'forward compatibility: неизвестное поле попало в state');

if(errors.length){
  console.error('\nОшибки формата JSON-макета:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка формата и диагностики JSON-макета пройдена.');

function assert(condition, message){
  if(!condition) errors.push(message);
}
