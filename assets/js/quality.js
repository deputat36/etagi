import { getQrInfo } from './qr.js';
import { getLayoutExtra } from './layoutExtras.js';
import { getPhoneInfo } from './phone.js';

const CORE_BLOCKS = ['showHeadline','showPrice','showDescription','showMeta','showBenefits','showCustomBlock','showPhoto','showContact'];

export function checkQuality(state, sheet){
  const issues = [];
  const count = Number(state.printCount) || 2;
  const phone = String(state.agentPhone || '').trim();
  const phoneInfo = getPhoneInfo(phone);
  const contactCta = getLayoutExtra(state, 'contactCta');
  const tearOffLabel = getLayoutExtra(state, 'tearOffLabel');
  const brandName = getLayoutExtra(state, 'brandName');
  const brandSideText = getLayoutExtra(state, 'brandSideText');
  const headlineLen = String(state.headline || '').replace(/\s/g,'').length;
  const descLen = String(state.description || '').length;
  const customTextLen = String(state.customBlockText || '').length;
  const contactCtaLen = contactCta.length;
  const tearOffLabelLen = tearOffLabel.length;
  const brandLen = `${brandName} ${brandSideText}`.trim().length;
  const visibleBrandText = state.showBrand ? `${brandName} ${brandSideText}`.trim() : '';
  const benefitsCount = String(state.benefits || '').split('\n').filter(Boolean).length;
  const metaCount = [state.area, state.propertyType, state.params].filter(Boolean).length;
  const visibleBlocks = getVisibleBlockCount(state);
  const sellingText = normalizeText(`${state.headline} ${state.description} ${state.benefits} ${state.customBlockTitle} ${state.customBlockText} ${state.price} ${state.area} ${state.propertyType} ${contactCta}`);

  if(!state.showContact && !state.tearOffs && !(state.showQr && state.qrLink)) issues.push({level:'warn', title:'Нет канала отклика', text:'В макете нет контактов, отрывных телефонов и QR. Для расклейки это почти всегда ошибка.', action:'showContact'});
  if((state.showContact || state.tearOffs) && !phone) issues.push({level:'error', title:'Нет телефона для отклика', text:'Телефон обязателен, если включены контакты или отрывные листочки. Без номера макет печатать нельзя.', action:'phone'});
  if((state.showContact || state.tearOffs) && phone && !phoneInfo.isLikelyPhone) issues.push({level:'error', title:'Телефон похож на ошибочный', text:'Проверьте номер: для печати лучше указать полный номер с кодом, например +7 900 000-00-00.', action:'phone'});
  if(phoneInfo.hasExtensionText) issues.push({level:'tip', title:'В поле телефона есть лишний текст', text:'Для читаемости на отрывных листках лучше оставить только номер телефона, без пояснений и комментариев.', action:null});
  if(state.showContact && phone && phoneInfo.isLikelyPhone && Number(state.phoneScale) < 1.1) issues.push({level:'warn', title:'Телефон мелковат', text:'Для расклейки номер должен читаться издалека.', action:'bigPhone'});
  if(count >= 6 && state.showContact && phone && phoneInfo.isLikelyPhone && Number(state.phoneScale) < 1.3) issues.push({level:'warn', title:'Телефон мелкий для плотной печати', text:'Для 6–8 макетов на А4 телефон лучше сделать крупнее, иначе его сложнее прочитать после печати.', action:'bigPhone'});
  if(state.showContact && !contactCta) issues.push({level:'tip', title:'Нет призыва в контактах', text:'Под телефоном лучше оставить короткую фразу: зачем звонить и что человек получит.', action:null});
  if(state.showContact && contactCta && !hasCallToAction(normalizeText(contactCta))) issues.push({level:'tip', title:'Слабый призыв в контактах', text:'В контактной строке лучше прямо написать: позвоните, напишите, уточните, обсудим или подскажу.', action:null});
  if(state.showContact && contactCtaLen > 85 && count >= 4) issues.push({level:'warn', title:'Длинный призыв в контактах', text:'Для 4+ макетов на А4 контактный призыв лучше сократить, чтобы телефон оставался главным.', action:null});
  if(state.showContact && contactCtaLen > 60 && count >= 6) issues.push({level:'warn', title:'Призыв длинный для мини-макета', text:'Для 6–8 макетов на листе оставьте короткую фразу под телефоном.', action:null});
  if(!state.showHeadline) issues.push({level:'tip', title:'Заголовок скрыт', text:'Без заголовка макет может хуже цеплять внимание.', action:'showHeadline'});
  if(state.showHeadline && headlineLen > 48) issues.push({level:'warn', title:'Длинный заголовок', text:'Лучше 1–3 короткие строки.', action:'shortHeadline'});
  if(state.showHeadline && headlineLen > 38 && count >= 6) issues.push({level:'warn', title:'Заголовок длинный для мини-макета', text:'Для 6–8 макетов на А4 заголовок лучше сделать максимально коротким.', action:'shortHeadline'});
  if(state.showDescription && descLen > 260 && count >= 4) issues.push({level:'warn', title:'Много текста', text:'Для 4 макетов на А4 лучше сократить описание.', action:'shortDesc'});
  if(state.showDescription && descLen > 150 && count >= 6) issues.push({level:'warn', title:'Слишком много текста для 6–8 на А4', text:'В мини-формате оставьте одно короткое предложение и главный призыв.', action:'shortDesc'});
  if(state.showCustomBlock && !String(state.customBlockTitle || state.customBlockText || '').trim()) issues.push({level:'tip', title:'Дополнительный блок пустой', text:'Заполните дополнительный блок или выключите его в составе макета.', action:null});
  if(state.showCustomBlock && customTextLen > 120 && count >= 4) issues.push({level:'warn', title:'Длинный дополнительный блок', text:'Для 4 макетов на А4 дополнительный блок лучше сократить до одной строки.', action:null});
  if(state.showCustomBlock && customTextLen > 70 && count >= 6) issues.push({level:'warn', title:'Дополнительный блок перегружает мини-макет', text:'Для 6–8 макетов на листе доп. блок лучше сделать очень коротким или выключить.', action:null});
  if(state.showBenefits && benefitsCount > 3 && count >= 6) issues.push({level:'tip', title:'Много преимуществ для мини-макета', text:'Для 6–8 на А4 лучше оставить 2–3 самых сильных преимущества.', action:null});
  if(count >= 4 && visibleBlocks > 8) issues.push({level:'warn', title:'Слишком много блоков для плотной печати', text:'Для 4+ макетов на А4 лучше оставить только заголовок, короткий смысл, контакт и 1–2 сильных причины.', action:'autoFix'});
  if(count >= 6 && visibleBlocks > 6) issues.push({level:'warn', title:'Макет перегружен для мини-формата', text:'Для 6–8 макетов на А4 часть блоков почти наверняка станет слишком мелкой.', action:'autoFix'});
  if(state.showMeta && metaCount >= 3 && count >= 4) issues.push({level:'tip', title:'Параметры занимают много места', text:'Для плотной расклейки район, тип и параметры лучше выводить компактной строкой или оставить только самое важное.', action:null});

  if(state.tearOffs && !tearOffLabel) issues.push({level:'tip', title:'Нет подписи отрывных листков', text:'Короткая подпись над телефоном помогает понять, по какому вопросу звонить.', action:null});
  if(state.tearOffs && tearOffLabelLen > 24) issues.push({level:'warn', title:'Длинная подпись отрывных листков', text:'На отрывном листке подпись должна быть короткой, иначе телефон станет хуже читаться.', action:null});
  if(state.tearOffs && count >= 6 && tearOffLabelLen > 16) issues.push({level:'warn', title:'Подпись отрывных длинная для мини-макета', text:'Для 6–8 макетов на А4 лучше использовать 1–2 коротких слова над телефоном.', action:null});
  if(state.showBrand && state.colorMode !== 'private' && brandLen > 34 && count >= 4) issues.push({level:'tip', title:'Брендовая строка длинновата', text:'Для плотной печати лучше укоротить текст рядом с логотипом или правую подпись.', action:null});
  if(state.showBrand && state.colorMode !== 'private' && brandLen > 26 && count >= 6) issues.push({level:'warn', title:'Бренд перегружает мини-макет', text:'Для 6–8 макетов на листе брендовая строка должна быть максимально короткой.', action:null});

  addSellingChecks(issues, state, sellingText, benefitsCount);

  if(state.showPhoto && state.photoMode !== 'none' && !state.photoOne) issues.push({level:'warn', title:'Фото включено, но не загружено', text:'Загрузите фото в поле Фото 1 или выключите блок фото вручную, если он не нужен.', action:null});
  if(state.showPhoto && state.photoMode === 'two' && !state.photoTwo) issues.push({level:'warn', title:'Второе фото не загружено', text:'Для шаблона с двумя фото загрузите второе изображение или переключите режим на одно фото.', action:null});
  if(state.showPhoto && state.photoMode !== 'none' && count >= 6) issues.push({level:'warn', title:'Фото при плотной печати', text:'На 6+ макетах фото ухудшает читаемость.', action:'twoOnPage'});

  if(!state.showCutLines && count > 1) issues.push({level:'tip', title:'Линии реза выключены', text:'При нескольких макетах на А4 линии реза помогут ровно разрезать лист.', action:'showCutLines'});
  if(!state.safePrintMargins && Number(state.pageMargin) < 7) issues.push({level:'tip', title:'Безопасные поля выключены', text:'Включите безопасные поля, чтобы важный текст не оказался близко к краю печати.', action:'showSafeMargins'});
  if(count >= 6 && !state.safePrintMargins) issues.push({level:'tip', title:'Плотная печать без безопасных полей', text:'Для 6–8 макетов на листе безопасные поля помогают не обрезать важный текст.', action:'showSafeMargins'});

  if(state.showQr && !state.qrLink) issues.push({level:'tip', title:'QR включён, но ссылки нет', text:'Добавьте ссылку для QR или выключите QR, чтобы не держать пустой блок в настройках.', action:null});
  if(state.showQr && state.qrLink){
    const qr = getQrInfo(state.qrLink);
    if(!qr.ok) issues.push({level:'warn', title:'Ссылка для QR слишком длинная', text:`Встроенный QR поддерживает до ${qr.maxBytes} байт. Лучше использовать короткую ссылку.`, action:null});
    if(count >= 4 && count < 6) issues.push({level:'tip', title:'QR может быть мелким', text:'Для QR лучше 1, 2 или 4 макета на листе, а перед печатью нужно проверить сканирование.', action:'twoOnPage'});
    if(count >= 6) issues.push({level:'warn', title:'QR слишком мал для мини-макета', text:'Для 6–8 макетов на А4 QR лучше убрать или печатать меньше объявлений на листе.', action:'twoOnPage'});
  }

  if(state.colorMode === 'private' && /этажи|etagi/i.test(`${state.headline} ${state.description} ${state.benefits} ${state.customBlockTitle} ${state.customBlockText} ${visibleBrandText}`)) issues.push({level:'warn', title:'Частное объявление с фирменностью', text:'В частном режиме лучше убрать упоминание компании.', action:'cleanBrand'});

  const overflow = [...sheet.querySelectorAll('.flyer')].some(f=>f.classList.contains('overflow'));
  if(overflow) issues.push({level:'error', title:'Текст не помещается', text:'В одном или нескольких макетах есть переполнение.', action:'autoFix'});

  let score = 100;
  for(const issue of issues) score -= issue.level === 'error' ? 25 : issue.level === 'warn' ? 12 : 5;
  return { score: Math.max(0, score), issues };
}

function getVisibleBlockCount(state){
  const core = CORE_BLOCKS.filter(key => Boolean(state[key])).length;
  const extras = [
    state.showBrand && state.colorMode !== 'private',
    state.tearOffs,
    state.showQr && state.qrLink
  ].filter(Boolean).length;
  return core + extras;
}

function addSellingChecks(issues, state, text, benefitsCount){
  const placeholderHeadline = isStarterPlaceholder(state.headline);
  if(placeholderHeadline) issues.push({level:'warn', title:'Заголовок не продаёт', text:'Замените технический заголовок на конкретный смысл: что человеку получить или узнать.', action:null});
  if(state.showHeadline && state.headline && !placeholderHeadline && !hasClientHook(text)) issues.push({level:'tip', title:'Слабый крючок в заголовке', text:'Добавьте понятный повод: цена, покупатель, объект, район, безопасность, консультация или выгода.', action:null});
  if(state.showDescription && state.description && !hasCallToAction(text)) issues.push({level:'tip', title:'Нет явного призыва', text:'Для продающей расклейки лучше прямо написать: позвоните, напишите, узнайте цену, обсудим вариант.', action:null});
  if(state.showBenefits && benefitsCount < 2) issues.push({level:'tip', title:'Мало причин позвонить', text:'Добавьте 2–3 короткие выгоды: без давления, по делу, проверка документов, помощь с ипотекой, оценка цены.', action:null});
  if(!state.area && !state.propertyType && ['seller','buyer','object','rent'].includes(state.goal)) issues.push({level:'tip', title:'Не указан контекст', text:'Район, дом, тип объекта или ситуация помогают человеку понять, что объявление относится к нему.', action:null});
  if(!hasTrustSignal(text)) issues.push({level:'tip', title:'Нет снятия опасения', text:'Добавьте мягкую формулировку: без давления, без обязательств, по делу, объясню простым языком.', action:null});
}

function hasCallToAction(text){
  return /позвон|напиш|звон|обсуд|узна|уточн|получ|остав|свяж|спрос|покаж|подска/.test(text);
}
function hasClientHook(text){
  return /цен|покупател|собствен|прода|купл|ищ|район|дом|квартир|недвиж|ипотек|документ|безопас|сделк|консультац|выгод|спрос|объект/.test(text);
}
function hasTrustSignal(text){
  return /без давлен|без обязательств|по делу|безопас|провер|документ|риск|простым язык|честн|спокойн|не обязывает/.test(text);
}
function isStarterPlaceholder(value){
  return /ваш заголовок|проверьте свой заголовок/i.test(String(value || ''));
}
function normalizeText(value){
  return String(value || '').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
}
