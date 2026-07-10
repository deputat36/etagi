import { loadTemplates } from './templates.js';

const STYLE_ID = 'spnTemplateCardBadgesStyle';
let templateMap = new Map();

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
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
  new MutationObserver(() => enhanceTemplateCards()).observe(list, { childList: true, subtree: true });
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

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .tpl-card-office-badges{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 5px}
    .tpl-office-badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 6px;font-size:10px;line-height:1;font-weight:900;border:1px solid #dbe3ee;background:#fff;color:#334155}
    .tpl-office-badge-deprecated{background:#fef2f2;border-color:#fecaca;color:#b91c1c}
    .tpl-office-badge-test{background:#fff7ed;border-color:#fed7aa;color:#c2410c}
    .tpl-office-badge-newbie{background:#ecfdf5;border-color:#bbf7d0;color:#047857}
    .tpl-office-badge-manager{background:#fff7ed;border-color:#fed7aa;color:#c2410c}
    .tpl-office-badge-safe{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}
    .tpl-office-badge-risk{background:#fef3c7;border-color:#fde68a;color:#92400e}
    .tpl-office-badge-print{background:#f5f3ff;border-color:#ddd6fe;color:#5b21b6}
    .tpl-office-badge-entrance{background:#f8fafc;border-color:#cbd5e1;color:#334155}
    .tpl-office-badge-newbuild{background:#fdf2f8;border-color:#fbcfe8;color:#be185d}
    .tpl-office-badge-trust{background:#f0fdf4;border-color:#bbf7d0;color:#166534}
    .tpl-office-badge-blank{background:#fef2f2;border-color:#fecaca;color:#b91c1c}
    .tpl-office-badge-photo{background:#eef2ff;border-color:#c7d2fe;color:#4338ca}
    .tpl-card-office-reason{margin:0 0 6px;padding:6px 7px;border-radius:10px;font-size:10.5px;line-height:1.22;font-weight:800;background:#f8fafc;color:#475569;border:1px solid #e2e8f0}
    .tpl-card-office-reason-deprecated{background:#fef2f2;border-color:#fecaca;color:#991b1b}
    .tpl-card-office-reason-test{background:#fff7ed;border-color:#fed7aa;color:#9a3412}
    .tpl-card-office-reason-newbie,.tpl-card-office-reason-safe{background:#f0fdf4;border-color:#bbf7d0;color:#166534}
    .tpl-card-office-reason-manager{background:#fff7ed;border-color:#fed7aa;color:#c2410c}
    .tpl-card-office-reason-entrance{background:#f8fafc;border-color:#cbd5e1;color:#334155}
    .tpl-card-office-reason-newbuild{background:#fdf2f8;border-color:#fbcfe8;color:#be185d}
    .tpl-card.active .tpl-office-badge{border-color:color-mix(in srgb,var(--accent) 40%,#fff)}
    .tpl-card.active .tpl-card-office-reason{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.28);color:#fff}
    @media print{.tpl-card-office-badges,.tpl-card-office-reason{display:none!important}}
  `;
  document.head.appendChild(style);
}
