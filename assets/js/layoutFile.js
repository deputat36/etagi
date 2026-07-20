import { defaultState, goals, photoModes, layoutModes } from './state.js';

export const LAYOUT_FILE_FORMAT = 'etagi-raskleyka-layout';
export const LAYOUT_FILE_FORMAT_VERSION = 1;
export const LAYOUT_FILE_SCHEMA_PATH = 'data/layout-file.schema.json';

const METADATA_FIELDS = new Set(['$schema', 'fileFormat', 'fileFormatVersion', 'exportedAt']);
const STATE_FIELDS = new Set(Object.keys(defaultState));
const LAYOUT_MARKERS = ['goal', 'templateId', 'layoutName', 'headline', 'printCount'];
const BLOCK_IDS = new Set(['headline', 'price', 'photo', 'description', 'meta', 'benefits', 'customBlock', 'contact']);
const ENUM_FIELDS = {
  goal: new Set(goals.map(item => item.id)),
  layoutMode: new Set(['manual', ...layoutModes.map(item => item.id)]),
  photoMode: new Set(photoModes.map(item => item.id)),
  printCount: new Set([1, 2, 3, 4, 6, 8]),
  splitMode: new Set(['auto', 'horizontal', 'vertical', 'grid']),
  colorMode: new Set(['brand', 'economy', 'bw', 'private']),
  layoutDensity: new Set(['auto', 'airy', 'normal', 'dense']),
  photoFit: new Set(['cover', 'contain'])
};
const NUMBER_RANGES = {
  pageMargin: [2, 18],
  pageGap: [1, 12],
  flyerPadding: [2, 12],
  radius: [0, 30],
  headlineScale: [0.75, 1.45],
  phoneScale: [0.8, 1.8]
};
const FIELD_LABELS = {
  version: 'Версия приложения',
  goal: 'Задача',
  templateId: 'Шаблон',
  layoutName: 'Название макета',
  layoutMode: 'Режим компоновки',
  blockOrder: 'Порядок блоков',
  agentName: 'Имя СПН',
  agentPhone: 'Телефон СПН',
  area: 'Район или адрес',
  propertyType: 'Тип объекта',
  price: 'Цена или бюджет',
  params: 'Параметры',
  headline: 'Заголовок',
  description: 'Описание',
  benefits: 'Преимущества',
  customBlockTitle: 'Название дополнительного блока',
  customBlockText: 'Текст дополнительного блока',
  contactCta: 'Призыв в контактах',
  tearOffLabel: 'Подпись отрывных телефонов',
  brandName: 'Название бренда',
  brandSideText: 'Боковая подпись бренда',
  photoMode: 'Режим фото',
  photoOne: 'Фото 1',
  photoTwo: 'Фото 2',
  qrLink: 'Ссылка QR',
  qrCaption: 'Подпись QR',
  printCount: 'Количество копий на А4',
  splitMode: 'Деление листа',
  colorMode: 'Цветность',
  tearOffs: 'Отрывные телефоны',
  showCutLines: 'Линии реза',
  safePrintMargins: 'Безопасные поля',
  printCheckMode: 'Режим проверки печати',
  pageMargin: 'Поля листа',
  pageGap: 'Зазор',
  flyerPadding: 'Внутренний отступ',
  radius: 'Скругление',
  headlineScale: 'Масштаб заголовка',
  phoneScale: 'Масштаб телефона',
  layoutDensity: 'Плотность',
  photoFit: 'Вписывание фото',
  showBrand: 'Показывать бренд',
  showHeadline: 'Показывать заголовок',
  showPrice: 'Показывать цену',
  showDescription: 'Показывать описание',
  showMeta: 'Показывать параметры',
  showBenefits: 'Показывать преимущества',
  showCustomBlock: 'Показывать дополнительный блок',
  showPhoto: 'Показывать фото',
  showQr: 'Показывать QR',
  showContact: 'Показывать контакты'
};

export function createLayoutFilePayload(source = {}) {
  return {
    ...source,
    $schema: LAYOUT_FILE_SCHEMA_PATH,
    fileFormat: LAYOUT_FILE_FORMAT,
    fileFormatVersion: LAYOUT_FILE_FORMAT_VERSION,
    exportedAt: new Date().toISOString()
  };
}

export function parseLayoutFileText(text) {
  let payload;
  try {
    payload = JSON.parse(String(text || ''));
  }
  catch(error) {
    return fail('Файл повреждён или не является корректным JSON. Скачайте макет заново и не редактируйте файл в обычном текстовом редакторе.', 'invalid-json');
  }
  return validateLayoutFilePayload(payload);
}

export function validateLayoutFilePayload(payload) {
  if(!isPlainObject(payload)) {
    return fail('В файле должен находиться один объект макета, а не список, число или текст.', 'invalid-root');
  }

  if(payload.fileFormat && payload.fileFormat !== LAYOUT_FILE_FORMAT) {
    return fail(`Этот JSON относится к другому типу файла: «${String(payload.fileFormat)}». Нужен файл макета генератора расклеек.`, 'wrong-format');
  }

  if(payload.fileFormatVersion !== undefined) {
    if(!Number.isInteger(payload.fileFormatVersion) || payload.fileFormatVersion < 1) {
      return fail('Версия формата файла указана неверно. Скачайте макет заново из генератора.', 'invalid-format-version');
    }
    if(payload.fileFormatVersion > LAYOUT_FILE_FORMAT_VERSION) {
      return fail(`Файл создан в более новой версии формата (${payload.fileFormatVersion}). Обновите генератор и повторите импорт.`, 'future-format-version');
    }
  }

  if(!LAYOUT_MARKERS.some(field => Object.hasOwn(payload, field))) {
    return fail('Файл не похож на макет генератора: не найдены задача, шаблон, название, заголовок или формат печати.', 'not-layout');
  }

  const errors = [];
  for(const field of STATE_FIELDS) {
    if(!Object.hasOwn(payload, field)) continue;
    validateField(field, payload[field], errors);
  }

  if(errors.length) {
    const summary = errors.slice(0, 2).join(' ');
    const tail = errors.length > 2 ? ` Ещё ошибок: ${errors.length - 2}.` : '';
    return fail(`Файл макета содержит неверные данные. ${summary}${tail}`, 'invalid-fields', errors);
  }

  const cleanState = {};
  for(const field of STATE_FIELDS) {
    if(Object.hasOwn(payload, field)) cleanState[field] = payload[field];
  }

  const unknownFields = Object.keys(payload)
    .filter(field => !STATE_FIELDS.has(field) && !METADATA_FIELDS.has(field));
  const warnings = unknownFields.length
    ? [`Неизвестные поля проигнорированы: ${unknownFields.slice(0, 5).join(', ')}${unknownFields.length > 5 ? '…' : ''}`]
    : [];

  return {
    ok: true,
    state: cleanState,
    legacy: payload.fileFormat !== LAYOUT_FILE_FORMAT,
    warnings,
    metadata: {
      fileFormat: payload.fileFormat || '',
      fileFormatVersion: payload.fileFormatVersion || 0,
      exportedAt: payload.exportedAt || ''
    }
  };
}

function validateField(field, value, errors) {
  const label = FIELD_LABELS[field] || field;

  if(field === 'blockOrder') {
    if(!Array.isArray(value) || value.some(item => typeof item !== 'string' || !BLOCK_IDS.has(item))) {
      errors.push(`Поле «${label}» должно содержать только известные блоки макета.`);
    }
    return;
  }

  const expectedType = typeof defaultState[field];
  if(typeof value !== expectedType || (expectedType === 'number' && !Number.isFinite(value))) {
    errors.push(`Поле «${label}» должно иметь тип «${typeLabel(expectedType)}».`);
    return;
  }

  const allowed = ENUM_FIELDS[field];
  if(allowed && !allowed.has(value)) {
    errors.push(`Поле «${label}» содержит неподдерживаемое значение «${String(value)}».`);
    return;
  }

  const range = NUMBER_RANGES[field];
  if(range && (value < range[0] || value > range[1])) {
    errors.push(`Поле «${label}» должно быть от ${range[0]} до ${range[1]}.`);
  }
}

function typeLabel(type) {
  if(type === 'string') return 'текст';
  if(type === 'number') return 'число';
  if(type === 'boolean') return 'да/нет';
  return type;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function fail(message, code, details = []) {
  return {ok:false, message, code, details};
}
