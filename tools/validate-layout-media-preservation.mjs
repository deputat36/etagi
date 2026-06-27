import fs from 'node:fs';
import { applyLayoutMode, applyLayoutModePreservingMedia, getLayoutHints } from '../assets/js/layoutRules.js';

const layoutRulesSource = read('assets/js/layoutRules.js');
const appSource = read('assets/js/app.js');
const indexSource = read('index.html');
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

  for (const photoMode of ['one', 'two', 'plan']) {
    assertPreservedMedia(
      applyLayoutModePreservingMedia({ ...overloadedState, photoMode }, 'auto'),
      'auto',
      photoMode,
      overloadedState
    );
  }

  for (const mode of ['readable', 'economy', 'entrance', 'private']) {
    for (const photoMode of ['one', 'two', 'plan']) {
      assertPreservedMedia(
        applyLayoutModePreservingMedia({ ...overloadedState, photoMode }, mode),
        mode,
        photoMode,
        overloadedState
      );
    }
  }

  const emptyQrIntent = { ...overloadedState, qrLink: '', qrCaption: '' };
  for (const mode of ['auto', 'readable', 'economy', 'entrance', 'private']) {
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
    errors.push('applyLayoutModePreservingMedia: исходное состояние макета не должно мутироваться');
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
