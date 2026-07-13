const filters = [
  { title: 'Рекомендовано', query: 'рекомендовано', hint: 'Безопасные рабочие макеты', note: 'Начните отсюда', kind: 'safe' },
  { title: 'Новичку', query: 'новичку', hint: 'Первые простые расклейки', note: 'Минимум риска', kind: 'newbie' },
  { title: 'Менеджер', query: 'менеджер', hint: 'Проверить перед печатью', note: 'Для контроля', kind: 'manager' },
  { title: 'Подъезд', query: 'подъезд', hint: 'Коротко, с отрывными телефонами', note: '4 на А4', kind: 'entrance' },
  { title: 'Собственники', query: 'собственники', hint: 'Оценка, спрос, продажа', note: 'Найти продавца', kind: 'owner' },
  { title: 'Покупатели', query: 'покупател', hint: 'Поиск вариантов под заявку', note: 'Под клиента', kind: 'buyer' },
  { title: 'Объекты', query: 'объект', hint: 'Продажа квартиры, дома, участка', note: 'Проверить цену', kind: 'object' },
  { title: 'Новостройки', query: 'новостройка', hint: 'ЖК, ипотека, подбор', note: 'Без обещаний', kind: 'newbuild' },
  { title: 'Теллерманов сад', query: 'Теллерманов сад', hint: 'Локальный пакет ЖК', note: 'Борисоглебск', kind: 'local' },
  { title: 'Доверие', query: 'доверие', hint: 'Мягкие консультационные тексты', note: 'Без давления', kind: 'trust' },
  { title: 'С фото', query: 'фото', hint: 'Макеты с изображением', note: '1–2 на А4', kind: 'photo' },
  { title: 'Пустые под проверку', query: 'пустой', hint: 'С нуля, только с контролем', note: 'Не новичку', kind: 'blank' }
];

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('templateSearch');
  const toolbar = search?.closest('.toolbar-row');
  if(!search || !toolbar || document.getElementById('spnOfficeTemplateFilters')) return;
  injectStyles();
  toolbar.insertAdjacentHTML('afterend', renderFilters());
  document.getElementById('spnOfficeTemplateFilters')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-office-query]');
    const reset = event.target.closest('[data-office-reset]');
    if(reset){
      search.value = '';
      fire(search);
      activateButton(null);
      status('Категория заготовок очищена. Показаны все подходящие шаблоны.');
      return;
    }
    if(!btn) return;
    search.value = btn.dataset.officeQuery || '';
    fire(search);
    activateButton(btn);
    status(`Категория заготовок: ${btn.querySelector('b')?.textContent || btn.textContent.trim()}.`);
  });
});

function renderFilters(){
  return `<div class="spn-office-template-filters" id="spnOfficeTemplateFilters" aria-label="Категории заготовок">
    <div class="spn-office-template-filters-head">
      <div>
        <b>Категории заготовок</b>
        <span>Выберите рабочий сценарий. Это быстрее и безопаснее, чем искать шаблон вручную.</span>
      </div>
      <button type="button" data-office-reset>Все</button>
    </div>
    <div class="spn-office-template-filter-grid">
      ${filters.map(renderFilterCard).join('')}
    </div>
  </div>`;
}

function renderFilterCard(item){
  return `<button type="button" class="spn-office-template-card spn-office-template-card-${item.kind}" data-office-query="${item.query}">
    <span class="spn-office-template-card-note">${item.note}</span>
    <b>${item.title}</b>
    <span class="spn-office-template-card-hint">${item.hint}</span>
  </button>`;
}

function activateButton(active){
  document.querySelectorAll('[data-office-query]').forEach(btn => btn.classList.toggle('active', btn === active));
}

function fire(search){
  search.dispatchEvent(new Event('input', {bubbles:true}));
  search.dispatchEvent(new Event('change', {bubbles:true}));
}

function status(text){
  const el = document.getElementById('statusLine');
  if(el) el.textContent = text;
}

function injectStyles(){
  if(document.getElementById('spnOfficeTemplateFiltersStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnOfficeTemplateFiltersStyles';
  style.textContent = `
    .spn-office-template-filters{margin:8px 0 10px;padding:10px;border:1px solid #dbeafe;border-radius:18px;background:#eff6ff}
    .spn-office-template-filters-head{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-bottom:9px}
    .spn-office-template-filters-head b{display:block;font-size:12px;font-weight:900;color:#111827}
    .spn-office-template-filters-head span{display:block;margin-top:3px;font-size:11px;line-height:1.25;color:#475569;font-weight:700}
    .spn-office-template-filters-head button{padding:7px 9px;border:1px solid #bfdbfe;background:#fff;color:#1e3a8a;font-size:11px;box-shadow:none}
    .spn-office-template-filter-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .spn-office-template-card{position:relative;min-height:76px;padding:9px 8px 8px;text-align:left;border:1px solid #bfdbfe;background:#fff;border-radius:15px;box-shadow:none;color:#172033;overflow:hidden}
    .spn-office-template-card:hover{transform:none;box-shadow:0 8px 18px rgba(15,23,42,.1)}
    .spn-office-template-card.active{border-color:var(--accent);background:var(--accent);color:#fff}
    .spn-office-template-card.active .spn-office-template-card-note{background:rgba(255,255,255,.22);color:#fff;border-color:rgba(255,255,255,.35)}
    .spn-office-template-card b{display:block;margin-top:18px;font-size:12px;line-height:1.1;font-weight:900}
    .spn-office-template-card-hint{display:block;margin-top:4px;font-size:10.5px;line-height:1.18;font-weight:700;opacity:.76}
    .spn-office-template-card-note{position:absolute;top:7px;left:7px;display:inline-flex;max-width:calc(100% - 14px);align-items:center;border:1px solid #dbe3ee;border-radius:999px;padding:3px 6px;background:#f8fafc;color:#475569;font-size:9px;line-height:1;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .spn-office-template-card-safe .spn-office-template-card-note,.spn-office-template-card-newbie .spn-office-template-card-note{background:#ecfdf5;border-color:#bbf7d0;color:#047857}
    .spn-office-template-card-manager .spn-office-template-card-note,.spn-office-template-card-blank .spn-office-template-card-note{background:#fff7ed;border-color:#fed7aa;color:#c2410c}
    .spn-office-template-card-local .spn-office-template-card-note,.spn-office-template-card-newbuild .spn-office-template-card-note{background:#fdf2f8;border-color:#fbcfe8;color:#be185d}
    .spn-office-template-card-photo .spn-office-template-card-note{background:#eef2ff;border-color:#c7d2fe;color:#4338ca}
    @media(max-width:520px){.spn-office-template-filter-grid,.spn-office-template-filters-head{grid-template-columns:1fr}.spn-office-template-card{min-height:74px}.spn-office-template-card b{margin-top:22px}.spn-office-template-card-hint{font-size:11.5px;line-height:1.25}.spn-office-template-card-note{padding:4px 7px;font-size:10.5px;line-height:1.1}}
    @media print{.spn-office-template-filters{display:none!important}}
  `;
  document.head.appendChild(style);
}
