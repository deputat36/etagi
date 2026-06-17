import { getQrInfo } from './qr.js';

export function checkQuality(state, sheet){
  const issues = [];
  const count = Number(state.printCount) || 2;
  const phone = state.agentPhone.trim();
  const headlineLen = state.headline.replace(/\s/g,'').length;
  const descLen = state.description.length;
  const customTextLen = String(state.customBlockText || '').length;

  if(!state.showContact && !state.tearOffs) issues.push({level:'warn', title:'Нет контактного блока', text:'Макет можно напечатать без контактов, но для расклейки это почти всегда ошибка.', action:'showContact'});
  if(state.showContact && !phone) issues.push({level:'error', title:'Нет телефона', text:'Без телефона объявление нельзя печатать.', action:'phone'});
  if(state.showContact && phone && Number(state.phoneScale) < 1.1) issues.push({level:'warn', title:'Телефон мелковат', text:'Для расклейки номер должен читаться издалека.', action:'bigPhone'});
  if(!state.showHeadline) issues.push({level:'tip', title:'Заголовок скрыт', text:'Без заголовка макет может хуже цеплять внимание.', action:'showHeadline'});
  if(state.showHeadline && headlineLen > 48) issues.push({level:'warn', title:'Длинный заголовок', text:'Лучше 1–3 короткие строки.', action:'shortHeadline'});
  if(state.showDescription && descLen > 260 && count >= 4) issues.push({level:'warn', title:'Много текста', text:'Для 4 макетов на А4 лучше сократить описание.', action:'shortDesc'});
  if(state.showCustomBlock && !String(state.customBlockTitle || state.customBlockText || '').trim()) issues.push({level:'tip', title:'Дополнительный блок пустой', text:'Заполните дополнительный блок или выключите его в составе макета.', action:null});
  if(state.showCustomBlock && customTextLen > 120 && count >= 4) issues.push({level:'warn', title:'Длинный дополнительный блок', text:'Для 4 макетов на А4 дополнительный блок лучше сократить до одной строки.', action:'showCustomBlock'});
  if(state.showPhoto && state.photoMode !== 'none' && !state.photoOne) issues.push({level:'warn', title:'Фото включено, но не загружено', text:'Загрузите фото или выключите блок фото.', action:'noPhoto'});
  if(state.showPhoto && state.photoMode === 'two' && !state.photoTwo) issues.push({level:'warn', title:'Второе фото не загружено', text:'Для шаблона с двумя фото загрузите второе изображение.', action:'onePhoto'});
  if(state.showPhoto && state.photoMode !== 'none' && count >= 6) issues.push({level:'warn', title:'Фото при плотной печати', text:'На 6+ макетах фото ухудшает читаемость.', action:'twoOnPage'});

  if(!state.showCutLines && count > 1) issues.push({level:'tip', title:'Линии реза выключены', text:'При нескольких макетах на А4 линии реза помогут ровно разрезать лист.', action:'showCutLines'});
  if(!state.safePrintMargins && Number(state.pageMargin) < 7) issues.push({level:'tip', title:'Безопасные поля выключены', text:'Включите безопасные поля, чтобы важный текст не оказался близко к краю печати.', action:'showSafeMargins'});

  if(state.showQr && state.qrLink){
    const qr = getQrInfo(state.qrLink);
    if(!qr.ok) issues.push({level:'warn', title:'Ссылка для QR слишком длинная', text:`Встроенный QR поддерживает до ${qr.maxBytes} байт. Лучше использовать короткую ссылку.`, action:'shortQr'});
    if(count >= 4) issues.push({level:'tip', title:'QR может быть мелким', text:'Для QR лучше 1, 2 или 4 макета на листе, а перед печатью нужно проверить сканирование.', action:'twoOnPage'});
  }

  if(state.colorMode === 'private' && /этажи|etagi/i.test(`${state.headline} ${state.description} ${state.customBlockText}`)) issues.push({level:'warn', title:'Частное объявление с фирменностью', text:'В частном режиме лучше убрать упоминание компании.', action:'cleanBrand'});

  const overflow = [...sheet.querySelectorAll('.flyer')].some(f=>f.classList.contains('overflow'));
  if(overflow) issues.push({level:'error', title:'Текст не помещается', text:'В одном или нескольких макетах есть переполнение.', action:'autoFix'});

  let score = 100;
  for(const issue of issues) score -= issue.level === 'error' ? 25 : issue.level === 'warn' ? 12 : 5;
  return { score: Math.max(0, score), issues };
}
