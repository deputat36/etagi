import fs from 'node:fs';
import { defaultState, printPresets, SUPPORTED_PRINT_COUNTS, DEFAULT_PRINT_COUNT, normalizePrintCount } from '../assets/js/state.js';
import { getGrid } from '../assets/js/render.js';
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
const storageSource = fs.readFileSync('assets/js/storage.js', 'utf8');
const renderSource = fs.readFileSync('assets/js/render.js', 'utf8');
const runnerSource = fs.readFileSync('tools/run-ui-actions-smoke.mjs', 'utf8');
const smokeSource = fs.readFileSync('tools/print-format-policy-smoke.html', 'utf8');
const docsSource = fs.readFileSync('docs/print-format-policy.md', 'utf8');

assert(schema?.properties?.fileFormat?.const === LAYOUT_FILE_FORMAT, 'schema: неверный fileFormat');
assert(schema?.properties?.fileFormatVersion?.maximum === LAYOUT_FILE_FORMAT_VERSION, 'schema: неверная максимальная версия формата');
assert(schema?.properties?.printCount?.enum?.join(',') === SUPPORTED_PRINT_COUNTS.join(','), 'schema: список форматов не совпадает с источником истины');
assert(printPresets.map(item => item.count).join(',') === SUPPORTED_PRINT_COUNTS.join(','), 'UI: пресеты не совпадают с официальными форматами');
assert(defaultState.printCount === DEFAULT_PRINT_COUNT, 'state: значение по умолчанию не совпадает с политикой');
assert(normalizePrintCount(10) === DEFAULT_PRINT_COUNT && normalizePrintCount(12) === DEFAULT_PRINT_COUNT, 'state: 10/12 не нормализуются к безопасному значению');
assert(getGrid(10, 'grid').cols === 1 && getGrid(10, 'grid').rows === 2, 'render: 10 не использует безопасную сетку по умолчанию');
assert(getGrid(12, 'grid').cols === 1 && getGrid(12, 'grid').rows === 2, 'render: 12 не использует безопасную сетку по умолчанию');
assert(!renderSource.includes('if(n === 10)') && !renderSource.includes('if(n === 12)'), 'render: остались отдельные ветки 10/12');
assert(renderSource.includes("import { normalizePrintCount } from './state.js';"), 'render: не использует общий нормализатор');
assert(storageSource.includes("import { normalizePrintCount } from './state.js';"), 'storage: не использует общий нормализатор');
assert(storageSource.includes('state.printCount = normalizePrintCount(state.printCount);'), 'storage: старое локальное состояние не нормализуется');
assert(storageSource.includes('printCount:normalizePrintCount(state?.printCount)'), 'storage: неподдерживаемый формат можно сохранить повторно');
assert(runnerSource.includes("label:'Print format policy smoke'") && runnerSource.includes("path:'tools/print-format-policy-smoke.html'"), 'runner: browser smoke политики A4 не подключён');
for(const marker of [
  'A4: интерфейс показывает только 1, 2, 3, 4, 6 и 8',
  'A4: старые локальные 10/12 нормализуются до 2 без потери текста',
  'A4: импорт 10 и 12 отклоняется без изменения макета',
  'A4: renderer защищён от неподдерживаемого состояния'
]) assert(smokeSource.includes(marker), `smoke: отсутствует маркер — ${marker}`);
for(const marker of ['# Политика форматов A4','1, 2, 3, 4, 6 и 8','10 и 12','проверенными физической печатью']){
  assert(docsSource.includes(marker), `docs: отсутствует обязательное уточнение — ${marker}`);
}

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
for(const count of [10,12]){
  const unsupported = validateLayoutFilePayload({headline:'Тест', printCount:count});
  assert(unsupported.code === 'invalid-fields', `diagnostics: ${count} не отклонён`);
  assert(unsupported.message.includes(`Значение «${count}» не поддерживается`), `diagnostics: нет точного сообщения для ${count}`);
  assert(unsupported.message.includes(SUPPORTED_PRINT_COUNTS.join(', ')), `diagnostics: сообщение ${count} не перечисляет официальные форматы`);
}
assert(validateLayoutFilePayload({headline:'Тест', colorMode:'neon'}).code === 'invalid-fields', 'diagnostics: неизвестная цветность не отклонена');
assert(validateLayoutFilePayload({headline:'Тест', blockOrder:['headline','unknown']}).code === 'invalid-fields', 'diagnostics: неизвестный блок не отклонён');

const withUnknown = validateLayoutFilePayload({headline:'Тест', unknownFutureField:true});
assert(withUnknown.ok, 'forward compatibility: неизвестное поле заблокировало импорт');
assert(withUnknown.warnings.length === 1, 'forward compatibility: неизвестное поле не отражено в предупреждении');
assert(!Object.hasOwn(withUnknown.state, 'unknownFutureField'), 'forward compatibility: неизвестное поле попало в state');

if(errors.length){
  console.error('\nОшибки формата JSON-макета и политики A4:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка формата JSON-макета и политики A4 пройдена.');

function assert(condition, message){
  if(!condition) errors.push(message);
}