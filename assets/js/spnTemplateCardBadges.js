const STYLE_ID = 'spnTemplateCardBadgesStyle';

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  enhanceTemplateCards();
  observeTemplateList();
});

function observeTemplateList(){
  const list = document.getElementById('templateList');
  if(!list) return;
  new MutationObserver(enhanceTemplateCards).observe(list, { childList: true, subtree: true });
}

function enhanceTemplateCards(){
  document.querySelectorAll('.tpl-card').forEach(card => {
    if(card.querySelector('.tpl-card-office-badges')) return;
    const content = card.querySelector('div:last-child');
    if(!content) return;
    const badges = getBadges(card);
    if(!badges.length) return;
    const reason = getTemplateReason(card, badges);
    content.insertAdjacentHTML('afterbegin', `${reason ? renderReason(reason) : ''}<div class="tpl-card-office-badges">${badges.map(renderBadge).join('')}</div>`);
  });
}

function getBadges(card){
  const text = card.textContent.toLowerCase().replace(/ё/g, 'е');
  const badges = [];

  if(text.includes('новичку')) badges.push(['newbie', 'Новичку']);
  if(text.includes('менеджер')) badges.push(['manager', 'Проверка']);
  if(text.includes('рекомендовано')) badges.push(['safe', 'Рекомендовано']);
  if(text.includes('подъезд') || text.includes('соседи')) badges.push(['entrance', 'Подъезд']);
  if(text.includes('теллерманов сад')) badges.push(['newbuild', 'Теллерманов сад']);
  if(text.includes('доверие') || text.includes('безопасность')) badges.push(['trust', 'Доверие']);
  if(text.includes('пустой') || text.includes('с нуля')) badges.push(['blank', 'Пустой']);

  const mini = card.querySelector('.tpl-mini');
  if(mini?.classList.contains('has-photo') || mini?.classList.contains('two-photo')) badges.push(['photo', 'Фото']);

  return uniqueBadges(badges).slice(0, 4);
}

function getTemplateReason(card, badges){
  const text = card.textContent.toLowerCase().replace(/ё/g, 'е');
  const badgeTypes = new Set(badges.map(([type]) => type));

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
  return `<span class="tpl-office-badge tpl-office-badge-${type}">${title}</span>`;
}

function renderReason([type, text]){
  return `<div class="tpl-card-office-reason tpl-card-office-reason-${type}">${text}</div>`;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .tpl-card-office-badges{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 5px}
    .tpl-office-badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 6px;font-size:10px;line-height:1;font-weight:900;border:1px solid #dbe3ee;background:#fff;color:#334155}
    .tpl-office-badge-newbie{background:#ecfdf5;border-color:#bbf7d0;color:#047857}
    .tpl-office-badge-manager{background:#fff7ed;border-color:#fed7aa;color:#c2410c}
    .tpl-office-badge-safe{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}
    .tpl-office-badge-entrance{background:#f8fafc;border-color:#cbd5e1;color:#334155}
    .tpl-office-badge-newbuild{background:#fdf2f8;border-color:#fbcfe8;color:#be185d}
    .tpl-office-badge-trust{background:#f0fdf4;border-color:#bbf7d0;color:#166534}
    .tpl-office-badge-blank{background:#fef2f2;border-color:#fecaca;color:#b91c1c}
    .tpl-office-badge-photo{background:#eef2ff;border-color:#c7d2fe;color:#4338ca}
    .tpl-card-office-reason{margin:0 0 6px;padding:6px 7px;border-radius:10px;font-size:10.5px;line-height:1.22;font-weight:800;background:#f8fafc;color:#475569;border:1px solid #e2e8f0}
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
