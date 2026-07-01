const filters = [
  { title: 'Рекомендовано', query: 'офис рекомендовано', hint: 'Безопасные рабочие макеты' },
  { title: 'Новичку', query: 'офис новичку', hint: 'Первые простые расклейки' },
  { title: 'Менеджер', query: 'офис менеджер', hint: 'Проверить перед печатью' },
  { title: 'Подъезд', query: 'подъезд', hint: 'Коротко, с отрывными телефонами' },
  { title: 'Собственники', query: 'собственники', hint: 'Оценка, спрос, продажа' },
  { title: 'Покупатели', query: 'покупатель покупатели', hint: 'Поиск вариантов под заявку' },
  { title: 'Объекты', query: 'объект фото продажа', hint: 'Продажа квартиры, дома, участка' },
  { title: 'Новостройки', query: 'новостройка', hint: 'ЖК, ипотека, подбор' },
  { title: 'Теллерманов сад', query: 'Теллерманов сад', hint: 'Локальный пакет ЖК' },
  { title: 'Доверие', query: 'доверие', hint: 'Мягкие консультационные тексты' },
  { title: 'С фото', query: 'фото', hint: 'Макеты с изображением' },
  { title: 'Пустые под проверку', query: 'офис менеджер пустой', hint: 'С нуля, только с контролем' }
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
        <span>Выберите понятный сценарий вместо ручного поиска по всем шаблонам.</span>
      </div>
      <button type="button" data-office-reset>Все</button>
    </div>
    <div class="spn-office-template-filter-grid">
      ${filters.map(item => `<button type="button" data-office-query="${item.query}"><b>${item.title}</b><span>${item.hint}</span></button>`).join('')}
    </div>
  </div>`;
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
    .spn-office-template-filters{margin:8px 0 10px;padding:10px;border:1px solid #dbeafe;border-radius:16px;background:#eff6ff}
    .spn-office-template-filters-head{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-bottom:8px}
    .spn-office-template-filters-head b{display:block;font-size:12px;font-weight:900;color:#111827}
    .spn-office-template-filters-head span{display:block;margin-top:3px;font-size:11px;line-height:1.25;color:#475569;font-weight:700}
    .spn-office-template-filters-head button{padding:7px 9px;border:1px solid #bfdbfe;background:#fff;color:#1e3a8a;font-size:11px;box-shadow:none}
    .spn-office-template-filter-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
    .spn-office-template-filter-grid button{min-height:58px;padding:8px;text-align:left;border:1px solid #bfdbfe;background:#fff;border-radius:13px;box-shadow:none;color:#172033}
    .spn-office-template-filter-grid button:hover{transform:none;box-shadow:0 7px 16px rgba(15,23,42,.08)}
    .spn-office-template-filter-grid button.active{border-color:var(--accent);background:var(--accent);color:#fff}
    .spn-office-template-filter-grid b{display:block;font-size:12px;line-height:1.1;font-weight:900}
    .spn-office-template-filter-grid span{display:block;margin-top:4px;font-size:10.5px;line-height:1.18;font-weight:700;opacity:.72}
    @media(max-width:520px){.spn-office-template-filter-grid,.spn-office-template-filters-head{grid-template-columns:1fr}}
    @media print{.spn-office-template-filters{display:none!important}}
  `;
  document.head.appendChild(style);
}
