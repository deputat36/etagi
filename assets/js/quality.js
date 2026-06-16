export function checkQuality(state, sheet){
  const issues = [];
  const count = Number(state.printCount) || 2;
  const phone = state.agentPhone.trim();
  const headlineLen = state.headline.replace(/\s/g,'').length;
  const descLen = state.description.length;
  if(!phone) issues.push({level:'error', title:'Нет телефона', text:'Без телефона объявление нельзя печатать.', action:'phone'});
  if(phone && Number(state.phoneScale) < 1.1) issues.push({level:'warn', title:'Телефон мелковат', text:'Для расклейки номер должен читаться издалека.', action:'bigPhone'});
  if(headlineLen > 48) issues.push({level:'warn', title:'Длинный заголовок', text:'Лучше 1–3 короткие строки.', action:'shortHeadline'});
  if(descLen > 260 && count >= 4) issues.push({level:'warn', title:'Много текста', text:'Для 4 макетов на А4 лучше сократить описание.', action:'shortDesc'});
  if(state.photoMode !== 'none' && !state.photoOne) issues.push({level:'warn', title:'Фото включено, но не загружено', text:'Загрузите фото или выберите режим без фото.', action:'noPhoto'});
  if(state.photoMode === 'two' && !state.photoTwo) issues.push({level:'warn', title:'Второе фото не загружено', text:'Для шаблона с двумя фото загрузите второе изображение.', action:'onePhoto'});
  if(state.photoMode !== 'none' && count >= 6) issues.push({level:'warn', title:'Фото при плотной печати', text:'На 6+ макетах фото ухудшает читаемость.', action:'twoOnPage'});
  if(state.qrLink && count >= 6) issues.push({level:'tip', title:'QR может быть мелким', text:'Для QR лучше 1, 2 или 4 макета на листе.', action:'twoOnPage'});
  if(state.colorMode === 'private' && /этажи|etagi/i.test(`${state.headline} ${state.description}`)) issues.push({level:'warn', title:'Частное объявление с фирменностью', text:'В частном режиме лучше убрать упоминание компании.', action:'cleanBrand'});
  const overflow = [...sheet.querySelectorAll('.flyer')].some(f=>f.classList.contains('overflow'));
  if(overflow) issues.push({level:'error', title:'Текст не помещается', text:'В одном или нескольких макетах есть переполнение.', action:'autoFix'});
  let score = 100;
  for(const issue of issues) score -= issue.level === 'error' ? 25 : issue.level === 'warn' ? 12 : 5;
  return { score: Math.max(0, score), issues };
}
