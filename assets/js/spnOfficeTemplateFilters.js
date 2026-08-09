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
