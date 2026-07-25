import { loadTemplates } from './templates.js';

let templateMap = new Map();

window.addEventListener('DOMContentLoaded', () => {
  enhanceTemplateCards();
  observeTemplateList();
  loadOfficeMetadata();
});

async function loadOfficeMetadata(){
  try{
    const templates = await loadTemplates();
    templateMap = new Map(templates.map(template => [template.id, template]));
    enhanceTemplateCards(true);
  }
  catch(error){
    // Бейджи остаются рабочими по тексту карточки. Ошибка загрузки метаданных не должна ломать интерфейс.
  }
}

function observeTemplateList(){
  const list = document.getElementById('templateList');
  if(!list) return;
  new MutationObserver(() => enhanceTemplateCards()).observe(list, { childList: true });
}

function enhanceTemplateCards(force = false){
  document.querySelectorAll('.tpl-card').forEach(card => {
    if(force){
      card.querySelector('.tpl-card-office-badges')?.remove();
      card.querySelector('.tpl-card-office-reason')?.remove();
    }
    if(card.querySelector('.tpl-card-office-badges')) return;
    const content = card.querySelector('div:last-child');
    if(!content) return;
    const template = templateMap.get(card.dataset.template);
    const badges = getBadges(card, template);
    if(!badges.length) return;
    const reason = getTemplateReason(card, badges, template);
    content.insertAdjacentHTML('afterbegin', `${reason ? renderReason(reason) : ''}<div class="tpl-card-office-badges">${badges.map(renderBadge).join('')}</div>`);
  });
}

function getBadges(card, template){
  const text = card.textContent.toLowerCase().replace(/ё/g, 'е');
  const badges = [];
  const office = template?.office;
  const portfolio = template?.portfolio;

  if(portfolio?.status === 'deprecated') badges.push(['deprecated', 'Устарел']);
  if(portfolio?.status === 'test') badges.push(['test', 'Тест']);
  if(office?.level === 'newbie') badges.push(['newbie', 'Новичку']);
  if(office?.level === 'manager') badges.push(['manager', 'Проверка']);
  if(office?.recommended) badges.push(['safe', 'Рекомендовано']);
  if(office?.risk === 'medium') badges.push(['risk', 'Риск средний']);
  if(office?.risk === 'high') badges.push(['risk', 'Риск высокий']);
  if(office?.recommendedPrintCount) badges.push(['print', `${office.recommendedPrintCount} на А4`]);

  if(text.includes('новичку')) badges.push(['newbie', 'Новичку']);
  if(text.includes('менеджер')) badges.push(['manager', 'Проверка']);
  if(text.includes('рекомендовано')) badges.push(['safe', 'Рекомендовано']);
  if(text.includes('подъезд') || text.includes('соседи')) badges.push(['entrance', 'Подъезд']);
  if(text.includes('теллерманов сад')) badges.push(['newbuild', 'Теллерманов сад']);
  if(text.includes('доверие') || text.includes('безопасность')) badges.push(['trust', 'Доверие']);
  if(text.includes('пустой') || text.includes('с нуля')) badges.push(['blank', 'Пустой']);

  const mini = card.querySelector('.tpl-mini');
  if(mini?.classList.contains('has-photo') || mini?.classList.contains('two-photo')) badges.push(['photo', 'Фото']);

  return uniqueBadges(badges).slice(0, 6);
}

function getTemplateReason(card, badges, template){
  const text = card.textContent.toLowerCase().replace(/ё/g, 'е');
  const badgeTypes = new Set(badges.map(([type]) => type));
  const office = template?.office;
  const portfolio = template?.portfolio;

  if(portfolio?.status === 'deprecated'){
    const replacement = portfolio.replacementId ? ` Используйте: ${portfolio.replacementId}.` : '';
    return ['deprecated', `${portfolio.reason || 'Шаблон сохранён для совместимости, но не рекомендуется для новой работы.'}${replacement}`];
  }
  if(portfolio?.status === 'test'){
    return ['test', portfolio.reason || 'Тестовый шаблон: используйте только для контролируемого сравнения и фиксируйте результат в отчёте.'];
  }

  if(office?.managerNote){
    if(office.level === 'manager') return ['manager', office.managerNote];
    if(office.level === 'newbie') return ['newbie', office.managerNote];
    return [office.risk === 'high' || office.risk === 'medium' ? 'manager' : 'safe', office.managerNote];
  }

  if(badgeTypes.has('manager')) return ['manager', 'Покажите менеджеру: в макете есть риск, цена, фото, QR или нестандартная формулировка.'];
  if(badgeTypes.has('blank')) return ['manager', 'Пустой макет подходит только для опытного СПН или после проверки менеджером.'];
  if(badgeTypes.has('newbie')) return ['newbie', 'Подходит новичку: короткий сценарий, меньше настроек и понятный повод для звонка.'];
  if(badgeTypes.has('safe')) return ['safe', 'Рекомендовано для регулярной работы: базовый сценарий без лишней сложности.'];
  if(badgeTypes.has('entrance')) return ['entrance', 'Подъездный формат: лучше короткий текст, крупный телефон и 4 на А4.'];
  if(badgeTypes.has('newbuild') || text.includes('новострой')) return ['newbuild', 'Новостройки: аккуратно с обещаниями, условиями покупки и ипотекой.'];
  return null;
}

function uniqueBadges(items){
  const seen = new Set();
  return items.filter(([type, title]) => {
    const key = `${type}:${title}`;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderBadge([type, title]){
  return `<span class="tpl-office-badge tpl-office-badge-${escapeHtml(type)}">${escapeHtml(title)}</span>`;
}

function renderReason([type, text]){
  return `<div class="tpl-card-office-reason tpl-card-office-reason-${escapeHtml(type)}">${escapeHtml(text)}</div>`;
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, character => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[character]));
}
