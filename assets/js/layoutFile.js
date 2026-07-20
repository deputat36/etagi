export const LAYOUT_FILE_KIND = 'etagi-raskleyka-layout';
export const LAYOUT_FILE_SCHEMA_VERSION = 1;

const BLOCK_IDS = ['headline','price','photo','description','meta','benefits','customBlock','contact'];
const STRING_FIELDS = [
  'version','templateId','layoutName','agentName','agentPhone','area','propertyType','price','params',
  'headline','description','benefits','customBlockTitle','customBlockText','contactCta','tearOffLabel',
  'brandName','brandSideText','photoOne','photoTwo','qrLink','qrCaption'
];
const BOOLEAN_FIELDS = [
  'tearOffs','showCutLines','safePrintMargins','printCheckMode','showBrand','showHeadline','showPrice',
  'showDescription','showMeta','showBenefits','showCustomBlock','showPhoto','showQr','showContact'
];
const ENUM_FIELDS = {
  goal:['seller','buyer','object','newbuild','service','rent','brand','private'],
  layoutMode:['manual','auto','readable','economy','photo','photo_left','photo_card','newbuild_visual','agent_brand_photo','showcase','entrance','private'],
  photoMode:['none','one','two','plan'],
  splitMode:['auto','horizontal','vertical','grid'],
  colorMode:['brand','economy','bw','private'],
  layoutDensity:['auto','airy','normal','dense'],
  photoFit:['cover','contain']
};
const NUMBER_FIELDS = {
  printCount:{integer:true,min:1,max:12},
  pageMargin:{min:2,max:18},
  pageGap:{min:1,max:12},
  flyerPadding:{min:2,max:12},
  radius:{min:0,max:30},
  headlineScale:{min:0.75,max:1.45},
  phoneScale:{min:0.8,max:1.8}
};
const REQUIRED_LAYOUT_FIELDS = [
  ...STRING_FIELDS,
  ...BOOLEAN_FIELDS,
  ...Object.keys(ENUM_FIELDS),
  ...Object.keys(NUMBER_FIELDS),
  'blockOrder'
];
const ALLOWED_LAYOUT_FIELDS = new Set(REQUIRED_LAYOUT_FIELDS);

export class LayoutFileError extends Error {
  constructor(message, diagnostics = []){
    super(message);
    this.name = 'LayoutFileError';
    this.diagnostics = diagnostics;
    this.userMessage = message;
  }
}

export function createLayoutFile(state){
  const layout = {};
  for(const field of REQUIRED_LAYOUT_FIELDS) layout[field] = cloneJsonValue(state?.[field]);
  return {
    kind:LAYOUT_FILE_KIND,
    schemaVersion:LAYOUT_FILE_SCHEMA_VERSION,
    appVersion:String(state?.version || ''),
    exportedAt:new Date().toISOString(),
    layout
  };
}

export function parseLayoutFileText(text, defaults = {}){
  let parsed;
  try {
    parsed = JSON.parse(String(text ?? ''));
  } catch(error){
    throw new LayoutFileError('Не удалось открыть файл: JSON повреждён или записан не полностью.');
  }
  return parseLayoutFileObject(parsed, defaults);
}

export function parseLayoutFileObject(parsed, defaults = {}){
  if(!isPlainObject(parsed)){
    throw new LayoutFileError('Не удалось открыть файл: корневой элемент JSON должен быть объектом.');
  }

  const hasEnvelopeFields = Object.hasOwn(parsed, 'kind') || Object.hasOwn(parsed, 'schemaVersion') || Object.hasOwn(parsed, 'layout');
  const legacy = !hasEnvelopeFields;
  let layout;
  let metadata;

  if(legacy){
    layout = parsed;
    metadata = {kind:'legacy', schemaVersion:0, appVersion:String(parsed.version || ''), exportedAt:''};
  } else {
    if(parsed.kind !== LAYOUT_FILE_KIND){
      throw new LayoutFileError(`Не удалось открыть файл: это не макет генератора «Этажи» (${LAYOUT_FILE_KIND}).`);
    }
    if(!Number.isInteger(parsed.schemaVersion)){
      throw new LayoutFileError('Не удалось открыть файл: поле «schemaVersion» должно быть целым числом.');
    }
    if(parsed.schemaVersion !== LAYOUT_FILE_SCHEMA_VERSION){
      throw new LayoutFileError(`Не удалось открыть файл: версия схемы ${parsed.schemaVersion} не поддерживается. Поддерживается версия ${LAYOUT_FILE_SCHEMA_VERSION}.`);
    }
    if(!isPlainObject(parsed.layout)){
      throw new LayoutFileError('Не удалось открыть файл: поле «layout» должно содержать объект макета.');
    }
    layout = parsed.layout;
    metadata = {
      kind:parsed.kind,
      schemaVersion:parsed.schemaVersion,
      appVersion:String(parsed.appVersion || ''),
      exportedAt:String(parsed.exportedAt || '')
    };
  }

  const diagnostics = validateLayoutState(layout, {strict:!legacy});
  if(diagnostics.length){
    throw new LayoutFileError(`Не удалось открыть файл: ${diagnostics[0]}`, diagnostics);
  }

  return {
    layout:{...defaults, ...pickKnownLayoutFields(layout)},
    legacy,
    metadata
  };
}

export function validateLayoutState(layout, {strict = true} = {}){
  const diagnostics = [];
  if(!isPlainObject(layout)) return ['макет должен быть объектом.'];

  if(strict){
    for(const field of REQUIRED_LAYOUT_FIELDS){
      if(!Object.hasOwn(layout, field)) diagnostics.push(`отсутствует обязательное поле «${field}».`);
    }
    for(const field of Object.keys(layout)){
      if(!ALLOWED_LAYOUT_FIELDS.has(field)) diagnostics.push(`поле «${field}» не поддерживается схемой v${LAYOUT_FILE_SCHEMA_VERSION}.`);
    }
  }

  for(const field of STRING_FIELDS){
    if(Object.hasOwn(layout, field) && typeof layout[field] !== 'string') diagnostics.push(`поле «${field}» должно быть строкой.`);
  }
  for(const field of BOOLEAN_FIELDS){
    if(Object.hasOwn(layout, field) && typeof layout[field] !== 'boolean') diagnostics.push(`поле «${field}» должно иметь значение true или false.`);
  }
  for(const [field, values] of Object.entries(ENUM_FIELDS)){
    if(Object.hasOwn(layout, field) && !values.includes(layout[field])) diagnostics.push(`поле «${field}» содержит неподдерживаемое значение «${String(layout[field])}».`);
  }
  for(const [field, rules] of Object.entries(NUMBER_FIELDS)){
    if(!Object.hasOwn(layout, field)) continue;
    const value = layout[field];
    if(typeof value !== 'number' || !Number.isFinite(value)){
      diagnostics.push(`поле «${field}» должно быть числом.`);
      continue;
    }
    if(rules.integer && !Number.isInteger(value)) diagnostics.push(`поле «${field}» должно быть целым числом.`);
    if(value < rules.min || value > rules.max) diagnostics.push(`поле «${field}» должно быть в диапазоне ${rules.min}–${rules.max}.`);
  }

  if(Object.hasOwn(layout, 'blockOrder')){
    if(!Array.isArray(layout.blockOrder)) diagnostics.push('поле «blockOrder» должно быть массивом.');
    else {
      if(!layout.blockOrder.length) diagnostics.push('поле «blockOrder» не должно быть пустым.');
      if(layout.blockOrder.some(value => !BLOCK_IDS.includes(value))) diagnostics.push('поле «blockOrder» содержит неизвестный блок.');
      if(new Set(layout.blockOrder).size !== layout.blockOrder.length) diagnostics.push('поле «blockOrder» содержит повторяющиеся блоки.');
    }
  }

  return [...new Set(diagnostics)];
}

export function getRequiredLayoutFields(){
  return [...REQUIRED_LAYOUT_FIELDS];
}

function pickKnownLayoutFields(source){
  return Object.fromEntries(REQUIRED_LAYOUT_FIELDS.filter(field => Object.hasOwn(source, field)).map(field => [field, cloneJsonValue(source[field])]));
}

function cloneJsonValue(value){
  if(value === undefined) return '';
  return structuredClone(value);
}

function isPlainObject(value){
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
