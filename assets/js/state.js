export const goals = [
  { id:'seller', title:'Куплю / найти продавца', hint:'собственники, район, дом' },
  { id:'buyer', title:'Найти покупателя', hint:'есть спрос, заявка, бюджет' },
  { id:'object', title:'Продать объект', hint:'квартира, дом, участок' },
  { id:'newbuild', title:'Новостройки', hint:'ЖК, ипотека, без комиссии' },
  { id:'service', title:'Услуги', hint:'оценка, ипотека, безопасность' },
  { id:'rent', title:'Аренда', hint:'сдать / снять' },
  { id:'brand', title:'Личный бренд', hint:'СПН по району' },
  { id:'private', title:'Частное', hint:'без явной фирменности' }
];

export const photoModes = [
  { id:'none', title:'Без фото' },
  { id:'one', title:'1 фото' },
  { id:'two', title:'2 фото' },
  { id:'plan', title:'Планировка' }
];

export const DEFAULT_PRINT_COUNT = 2;
export const SUPPORTED_PRINT_COUNTS = Object.freeze([1, 2, 3, 4, 6, 8]);

export const printPresets = [
  { count:1, title:'1 крупно' },
  { count:2, title:'2 на А4' },
  { count:3, title:'3 полосы' },
  { count:4, title:'4 экономно' },
  { count:6, title:'6 мелко' },
  { count:8, title:'8 мини' }
];

export function isSupportedPrintCount(value){
  return Number.isInteger(value) && SUPPORTED_PRINT_COUNTS.includes(value);
}

export function normalizePrintCount(value, fallback = DEFAULT_PRINT_COUNT){
  const count = Number(value);
  return isSupportedPrintCount(count) ? count : fallback;
}

export const layoutModes = [
  { id:'readable', title:'Читаемо', hint:'крупный телефон, мало лишнего' },
  { id:'economy', title:'Экономно', hint:'4 на А4 без фото' },
  { id:'photo', title:'С фото', hint:'крупная верхняя фотография' },
  { id:'photo_left', title:'Фото слева', hint:'фото и текст в две колонки' },
  { id:'photo_card', title:'Фото-карточка', hint:'заголовок поверх фотографии' },
  { id:'newbuild_visual', title:'Новостройка', hint:'фасад и планировка без обрезки' },
  { id:'agent_brand_photo', title:'Фото СПН', hint:'портрет, имя и крупный телефон' },
  { id:'showcase', title:'Витрина', hint:'1 крупный макет' },
  { id:'entrance', title:'Подъезд', hint:'отрывные телефоны' },
  { id:'private', title:'Частное', hint:'без бренда' }
];

export const scenarioPresets = [
  { id:'all', title:'Все' },
  { id:'entrance', title:'Подъезд' },
  { id:'owner', title:'Собственники' },
  { id:'buyer', title:'Покупатели' },
  { id:'object', title:'Объекты' },
  { id:'newbuild', title:'Новостройки' },
  { id:'private', title:'Частное' },
  { id:'photo', title:'С фото' },
  { id:'economy', title:'Экономно' }
];

export const propertyPresets = [
  'квартира', '1-комнатная', '2-комнатная', '3-комнатная', 'дом', 'участок', 'коммерция', 'новостройка'
];

export const defaultState = {
  version: '3.85.0',
  goal: 'seller',
  templateId: '',
  layoutName: '',
  layoutMode: 'manual',
  blockOrder: ['headline','price','photo','description','meta','benefits','customBlock','contact'],
  agentName: '',
  agentPhone: '',
  area: '',
  propertyType: '',
  price: '',
  params: '',
  headline: '',
  description: '',
  benefits: '',
  customBlockTitle: '',
  customBlockText: '',
  contactCta: 'Позвоните — подскажу по объекту и условиям',
  tearOffLabel: 'Недвижимость',
  brandName: 'Этажи',
  brandSideText: 'etagi.com',
  photoMode: 'none',
  photoOne: '',
  photoTwo: '',
  qrLink: '',
  qrCaption: '',
  printCount: DEFAULT_PRINT_COUNT,
  splitMode: 'auto',
  colorMode: 'brand',
  tearOffs: true,
  showCutLines: true,
  safePrintMargins: true,
  printCheckMode: false,
  pageMargin: 7,
  pageGap: 4,
  flyerPadding: 5,
  radius: 16,
  headlineScale: 1,
  phoneScale: 1.25,
  layoutDensity: 'auto',
  photoFit: 'cover',
  showBrand: true,
  showHeadline: true,
  showPrice: true,
  showDescription: true,
  showMeta: true,
  showBenefits: true,
  showCustomBlock: false,
  showPhoto: true,
  showQr: true,
  showContact: true
};

export function cloneDefaultState(){
  return structuredClone(defaultState);
}