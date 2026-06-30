const filters = [
  ['Рекомендовано', 'офис рекомендовано'],
  ['Новичку', 'офис новичку'],
  ['Менеджер', 'офис менеджер'],
  ['Теллерманов сад', 'Теллерманов сад'],
  ['Подъезд', 'подъезд']
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
      status('Офисный фильтр очищен.');
      return;
    }
    if(!btn) return;
    search.value = btn.dataset.officeQuery || '';
    fire(search);
    status(`Офисный фильтр: ${btn.textContent.trim()}.`);
  });
});

function renderFilters(){
  return `<div class="spn-office-template-filters" id="spnOfficeTemplateFilters"><b>Офисные подборки</b><div>${filters.map(([title, query]) => `<button type="button" data-office-query="${query}">${title}</button>`).join('')}<button type="button" data-office-reset>Все</button></div></div>`;
}

function fire(search){
  search.dispatchEvent(new Event('input', {bubbles:true}));
  search.dispatchEvent(new Event('change', {bubbles:true}));
}

function status(text){
  const el = document.getElementById('statusLine');
  if(el) el.textContent = text;
}
