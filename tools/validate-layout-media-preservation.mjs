import fs from 'node:fs';
import { applyLayoutMode, applyLayoutModePreservingMedia, getLayoutHints } from '../assets/js/layoutRules.js';
import { defaultState, layoutModes, photoModes } from '../assets/js/state.js';

const layoutRulesSource = read('assets/js/layoutRules.js');
const appSource = read('assets/js/app.js');
const indexSource = read('index.html');
const photoModeIds = photoModes.map(({ id }) => id);
const enabledPhotoModes = photoModeIds.filter(id => id !== 'none');
const explicitLayoutModes = layoutModes.map(({ id }) => id);
const allowedDefaultLayoutModes = ['manual', ...explicitLayoutModes];
const defaultBlockOrder = Array.isArray(defaultState.blockOrder) ? defaultState.blockOrder : [];
const blockOrderEntries = extractBlockOrderEntries(layoutRulesSource);
const blockOrdersByMode = Object.fromEntries(blockOrderEntries.map(({ mode, order }) => [mode, order]));
const blockOrderModes = blockOrderEntries.map(({ mode }) => mode);
const handledLayoutModes = extractHandledLayoutModes(layoutRulesSource);
const errors = [];

checkFunctionalBehavior();

check(layoutRulesSource, 'assets/js/layoutRules.js', [
  'export function applyLayoutModePreservingMedia',
  'const mediaIntent = pickMediaIntent(state);',
  'const next = applyLayoutMode(state, mode);',
  'next.showPhoto = true;',
  'next.photoMode = mediaIntent.photoMode;',
  'next.showQr = true;',
  'function pickMediaIntent',
  'showPhoto: Boolean(state.showPhoto && state.photoMode !== \'none\')',
  'showQr: Boolean(state.showQr)',
  "const countLabel = count === 4 ? 'Для 4 макетов на А4' : 'Для 6–8 макетов на А4';",
  'Если фото важно сохранить, используйте мягкую подстройку с сохранением фото и QR',
  'Если QR нужен, используйте мягкую подстройку с сохранением фото и QR или печатайте 1–2 на А4'
]);

check(appSource, 'assets/js/app.js', [
  'applyLayoutModePreservingMedia',
  "if($('preserveMediaLayoutBtn')) $('preserveMediaLayoutBtn').onclick = () => applyModePreservingMedia('auto');",
  'function applyModePreservingMedia(mode)',
  'Макет подстроен без отключения включённых фото и QR',
  "if(action === 'autoFix') state = applyLayoutMode(state, 'auto');"
]);

check(indexSource, 'index.html', [
  'id="preserveMediaLayoutBtn"',
  'Подстроить, сохранив фото и QR'
]);

if (!appSource.includes("$('autoLayoutBtn').onclick = () => applyMode('auto');")) {
  errors.push('assets/js/app.js: старая кнопка автоподстройки должна остаться отдельной');
}

if (!enabledPhotoModes.length) {
  errors.push('assets/js/state.js: должен быть хотя бы один включаемый режим фото кроме none');
}

if (!explicitLayoutModes.length) {
  errors.push('assets/js/state.js: должен быть хотя бы один явный режим подстройки');
}

if (!defaultBlockOrder.length) {
  errors.push('assets/js/state.js: defaultState.blockOrder должен содержать базовые блоки макета');
}

if (!photoModeIds.includes(defaultState.photoMode)) {
  errors.push(`assets/js/state.js: defaultState.photoMode ${defaultState.photoMode} должен быть описан в photoModes`);
}

if (!allowedDefaultLayoutModes.includes(defaultState.layoutMode)) {
  errors.push(`assets/js/state.js: defaultState.layoutMode ${defaultState.layoutMode} должен быть manual или режимом из layoutModes`);
}

for (const blockId of findDuplicates(defaultBlockOrder)) {
  errors.push(`assets/js/state.js: блок ${blockId} повторяется в defaultState.blockOrder`);
}

for (const mode of findDuplicates(photoModeIds)) {
  errors.push(`assets/js/state.js: режим фото ${mode} повторяется`);
}

for (const mode of findDuplicates(explicitLayoutModes)) {
  errors.push(`assets/js/state.js: режим подстройки ${mode} повторяется`);
}

if (!blockOrderModes.length) {
  errors.push('assets/js/layoutRules.js: не удалось определить режимы из BLOCK_ORDERS');
}

if (!handledLayoutModes.length) {
  errors.push('assets/js/layoutRules.js: не удалось определить режимы, обрабатываемые в applyLayoutMode');
}

checkModeCoverage('BLOCK_ORDERS', blockOrderModes);
checkModeCoverage('applyLayoutMode', handledLayoutModes);
checkBlockOrders();

if (errors.length) {
  console.error('\nОшибки мягкой автоподстройки фото и QR:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка мягкой автоподстройки фото и QR пройдена.');

function checkFunctionalBehavior() {
  const overloadedState = {
    printCount: 4,
    splitMode: 'grid',
    layoutDensity: 'dense',
    colorMode: 'brand',
    price: '3 200 000 ₽',
    area: 'Северный район',
    propertyType: 'квартира',
    params: '2-комн., 48 м²',
    showHeadline: true,
    showPrice: true,
    showDescription: true,
    showMeta: true,
    showBenefits: true,
    showPhoto: true,
    photoMode: 'two',
    photoOne: 'data:image/png;base64,one',
    photoTwo: 'data:image/png;base64,two',
    showQr: true,
    qrLink: 'https://example.com/object',
    qrCaption: 'Смотреть объект',
    showContact: true,
    tearOffs: true,
    showBrand: true,
    blockOrder: ['headline', 'price', 'photo', 'description', 'meta', 'benefits', 'customBlock', 'contact']
  };
  const originalSnapshot = JSON.stringify(overloadedState);

  const regular = applyLayoutMode(overloadedState, 'auto');
  if (regular.showPhoto || regular.photoMode !== 'none' || regular.showQr) {
    errors.push('applyLayoutMode: обычная автоподстройка должна сохранять прежнее право отключать фото и QR');
  }
  if (regular === overloadedState) {
    errors.push('applyLayoutMode: должен вернуть новый объект состояния');
  }

  const preservedAuto = applyLayoutModePreservingMedia(overloadedState, 'auto');
  if (preservedAuto === overloadedState) {
    errors.push('applyLayoutModePreservingMedia: должен вернуть новый объект состояния');
  }

  const autoModeCases = [
    ['private', { ...overloadedState, colorMode: 'private' }, 'private'],
    ['economy', { ...overloadedState, colorMode: 'brand', printCount: 4 }, 'economy'],
    ['showcase', { ...overloadedState, colorMode: 'brand', printCount: 1 }, 'showcase'],
    ['photo', { ...overloadedState, colorMode: 'brand', printCount: 2, photoMode: 'two', photoOne: 'data:image/png;base64,one' }, 'photo'],
    ['readable', { ...overloadedState, colorMode: 'brand', printCount: 2, showPhoto: false, photoMode: 'none', photoOne: '', photoTwo: '' }, 'readable']
  ];

  for (const [label, state, expectedMode] of autoModeCases) {
    assertBlockOrderMatchesMode(
      applyLayoutMode({ ...state }, 'auto').blockOrder,
      expectedMode,
      `applyLayoutMode(auto/${label})`
    );
    assertBlockOrderMatchesMode(
      applyLayoutModePreservingMedia({ ...state }, 'auto').blockOrder,
      expectedMode,
      `applyLayoutModePreservingMedia(auto/${label})`
    );
  }

  for (const mode of explicitLayoutModes) {
    assertBlockOrderMatchesMode(
      applyLayoutMode({ ...overloadedState }, mode).blockOrder,
      mode,
      `applyLayoutMode(${mode})`
    );
    assertBlockOrderMatchesMode(
      applyLayoutModePreservingMedia({ ...overloadedState }, mode).blockOrder,
      mode,
      `applyLayoutModePreservingMedia(${mode})`
    );
  }

  for (const photoMode of enabledPhotoModes) {
    assertPreservedMedia(
      applyLayoutModePreservingMedia({ ...overloadedState, photoMode }, 'auto'),
      'auto',
      photoMode,
      overloadedState
    );
  }

  for (const mode of explicitLayoutModes) {
    for (const photoMode of enabledPhotoModes) {
      assertPreservedMedia(
        applyLayoutModePreservingMedia({ ...overloadedState, photoMode }, mode),
        mode,
        photoMode,
        overloadedState
      );
    }
  }

  const emptyQrIntent = { ...overloadedState, qrLink: '', qrCaption: '' };
  for (const mode of ['auto', ...explicitLayoutModes]) {
    assertPreservedMedia(
      applyLayoutModePreservingMedia(emptyQrIntent, mode),
      mode,
      emptyQrIntent.photoMode,
      emptyQrIntent
    );
  }

  const noMedia = applyLayoutModePreservingMedia({ ...overloadedState, showPhoto: false, photoMode: 'none', showQr: false }, 'auto');
  if (noMedia.showPhoto || noMedia.photoMode !== 'none' || noMedia.showQr) {
    errors.push('applyLayoutModePreservingMedia: выключенные фото и QR не должны включаться сами');
  }

  if (JSON.stringify(overloadedState) !== originalSnapshot) {
    errors.push('applyLayoutMode/applyLayoutModePreservingMedia: исходное состояние макета не должно мутироваться');
  }

  const fourPhotoHint = getLayoutHints(overloadedState).join('\n');
  if (!fourPhotoHint.includes('Для 4 макетов на А4 фото часто делает объявление мелким')) {
    errors.push('getLayoutHints: для 4 макетов подсказка фото должна говорить про 4 макета');
  }

  for (const printCount of [6, 8]) {
    const compactPhotoHint = getLayoutHints({ ...overloadedState, printCount }).join('\n');
    if (!compactPhotoHint.includes('Для 6–8 макетов на А4 фото часто делает объявление мелким')) {
      errors.push(`getLayoutHints: для ${printCount} макетов подсказка фото должна говорить про 6–8 макетов`);
    }
    if (compactPhotoHint.includes('Для 4 макетов на А4 фото часто делает объявление мелким')) {
      errors.push(`getLayoutHints: подсказка ${printCount} макетов не должна ошибочно говорить про 4 макета`);
    }
  }
}

function checkModeCoverage(sourceName, sourceModes) {
  const explicitSet = new Set(explicitLayoutModes);
  const sourceSet = new Set(sourceModes);

  for (const mode of explicitLayoutModes) {
    if (!sourceSet.has(mode)) {
      errors.push(`assets/js/layoutRules.js: режим ${mode} должен быть описан в ${sourceName}`);
    }
  }

  for (const mode of sourceSet) {
    if (!explicitSet.has(mode)) {
      errors.push(`assets/js/layoutRules.js: режим ${mode} есть в ${sourceName}, но отсутствует в assets/js/state.js`);
    }
  }

  for (const mode of findDuplicates(sourceModes)) {
    errors.push(`assets/js/layoutRules.js: режим ${mode} повторяется в ${sourceName}`);
  }
}

function checkBlockOrders() {
  const defaultSet = new Set(defaultBlockOrder);
  for (const [mode, order] of Object.entries(blockOrdersByMode)) {
    for (const blockId of defaultBlockOrder) {
      if (!order.includes(blockId)) {
        errors.push(`assets/js/layoutRules.js: порядок блоков режима ${mode} должен содержать ${blockId}`);
      }
    }

    for (const blockId of order) {
      if (!defaultSet.has(blockId)) {
        errors.push(`assets/js/layoutRules.js: порядок блоков режима ${mode} содержит неизвестный блок ${blockId}`);
      }
    }

    for (const blockId of findDuplicates(order)) {
      errors.push(`assets/js/layoutRules.js: блок ${blockId} повторяется в порядке режима ${mode}`);
    }
  }
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function extractBlockOrderEntries(source) {
  const block = source.match(/const BLOCK_ORDERS = \{([\s\S]*?)\n\};/);
  if (!block) return [];

  const entries = [];
  const pattern = /^\s*['"]?([a-z][a-z0-9_-]*)['"]?\s*:\s*\[([^\]]*)\]/gmi;
  let match;
  while ((match = pattern.exec(block[1]))) {
    entries.push({
      mode: match[1],
      order: [...match[2].matchAll(/['"]([^'"]+)['"]/g)].map(item => item[1])
    });
  }
  return entries;
}

function extractHandledLayoutModes(source) {
  return [...source.matchAll(/effectiveMode === ['"]([^'"]+)['"]/g)].map(match => match[1]);
}

function assertBlockOrderMatchesMode(order, expectedMode, label) {
  assertBlockOrderIntegrity(order, label);
  const expectedOrder = blockOrdersByMode[expectedMode];
  if (!expectedOrder) {
    errors.push(`${label}: не найден ожидаемый порядок блоков для режима ${expectedMode}`);
    return;
  }

  const actual = JSON.stringify(order);
  const expected = JSON.stringify(expectedOrder);
  if (actual !== expected) {
    errors.push(`${label}: blockOrder должен совпадать с режимом ${expectedMode}`);
  }
}

function assertBlockOrderIntegrity(order, label) {
  if (!Array.isArray(order)) {
    errors.push(`${label}: blockOrder должен быть массивом`);
    return;
  }

  const defaultSet = new Set(defaultBlockOrder);
  for (const blockId of defaultBlockOrder) {
    if (!order.includes(blockId)) errors.push(`${label}: blockOrder должен содержать ${blockId}`);
  }

  for (const blockId of order) {
    if (!defaultSet.has(blockId)) errors.push(`${label}: blockOrder содержит неизвестный блок ${blockId}`);
  }

  for (const blockId of findDuplicates(order)) {
    errors.push(`${label}: blockOrder содержит повтор ${blockId}`);
  }
}

function assertPreservedMedia(result, mode, expectedPhotoMode, sourceState) {
  if (!result.showPhoto) errors.push(`applyLayoutModePreservingMedia(${mode}): включённое фото должно сохраниться`);
  if (result.photoMode !== expectedPhotoMode) errors.push(`applyLayoutModePreservingMedia(${mode}): photoMode ${expectedPhotoMode} должен сохраниться`);
  if (result.photoOne !== sourceState.photoOne) errors.push(`applyLayoutModePreservingMedia(${mode}): первое фото должно сохраниться`);
  if (result.photoTwo !== sourceState.photoTwo) errors.push(`applyLayoutModePreservingMedia(${mode}): второе фото должно сохраниться`);
  if (!result.showQr) errors.push(`applyLayoutModePreservingMedia(${mode}): включённый QR должен сохраниться`);
  if (result.qrLink !== sourceState.qrLink) errors.push(`applyLayoutModePreservingMedia(${mode}): ссылка QR должна сохраниться`);
  if (result.qrCaption !== sourceState.qrCaption) errors.push(`applyLayoutModePreservingMedia(${mode}): подпись QR должна сохраниться`);
  if (result.layoutMode !== mode) errors.push(`applyLayoutModePreservingMedia(${mode}): layoutMode должен остаться ${mode}`);
}

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
