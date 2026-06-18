const situations = [
  {
    id: 'owner-price',
    title: 'Узнать цену у собственника',
    goal: 'seller',
    query: 'продающий собственник цена оценка',
    hint: 'Для мягкого захода: человек пока не продаёт, но может захотеть узнать цену.'
  },
  {
    id: 'direct-buyer',
    title: 'Есть покупатель',
    goal: 'seller',
    query: 'продающий есть покупатель куплю собственник',
    hint: 'Для точечного поиска объекта под активный спрос.'
  },
  {
    id: 'entrance-soft',
    title: 'Подъезд / соседи',
    goal: 'seller',
    query: 'продающий подъезд соседи без давления',
    hint: 'Для объявлений в конкретном доме или подъезде.'
  },
  {
    id: 'object-sale',
    title: 'Продать объект',
    goal: 'object',
    query: 'продающий объект фото витрина продажа',
    hint: 'Для квартиры, дома, участка или коммерции.'
  },
  {
    id: 'buyer-family',
    title: 'Найти покупателя',
    goal: 'buyer',
    query: 'продающий покупатель семья квартира дом',
    hint: 'Для людей, которые ищут жильё и хотят понятный подбор.'
  },
  {
    id: 'safe-deal',
    title: 'Консультация / безопасность',
    goal: 'service',
    query: 'продающий безопасная сделка документы консультация',
    hint: 'Для доверительного захода через пользу, документы и риски.'
  },
  {
    id: 'blank-custom',
    title: 'Нестандартный макет',
    goal: 'all',
    query: 'пустой нестандартный с нуля',
    hint: 'Для редкой задачи, когда нужен не готовый текст, а удобная основа.'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('templateSearch');
  const density = document.getElementById('templateDensityFilter');
  const toolbar = search?.closest('.toolbar-row');
  if(!search || !toolbar || document.getElementById('spnWizard')) return;

  toolbar.insertAdjacentHTML('afterend', renderWizard());
  const wizard = document.getElementById('spnWizard');

  wizard.addEventListener('click', event => {
    const btn = event.target.closest('[data-spn-situation]');
    const reset = event.target.closest('[data-spn-reset]');

    if(reset){
      search.value = '';
      if(density) density.value = 'all';
      search.dispatchEvent(new Event('input', {bubbles:true}));
      setStatus('Подбор очищен. Можно искать шаблон вручную.');
      wizard.querySelectorAll('[data-spn-situation]').forEach(item => item.classList.remove('active'));
      return;
    }

    if(!btn) return;
    const item = situations.find(situation => situation.id === btn.dataset.spnSituation);
    if(!item) return;

    wizard.querySelectorAll('[data-spn-situation]').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');

    if(item.goal !== 'all'){
      const goalBtn = document.querySelector(`[data-goal="${item.goal}"]`);
      if(goalBtn) goalBtn.click();
    }

    window.setTimeout(() => {
      search.value = item.query;
      if(density) density.value = 'all';
      search.dispatchEvent(new Event('input', {bubbles:true}));
      if(density) density.dispatchEvent(new Event('change', {bubbles:true}));
      setStatus(`Подобраны шаблоны: ${item.title}. ${item.hint}`);
    }, 80);
  });
});

function renderWizard(){
  return `<div class="spn-wizard" id="spnWizard">
    <div class="spn-wizard-head">
      <b>Быстрый подбор для СПН</b>
      <button type="button" data-spn-reset>Сбросить</button>
    </div>
    <div class="spn-wizard-grid">
      ${situations.map(item => `<button type="button" data-spn-situation="${item.id}"><span>${item.title}</span><small>${item.hint}</small></button>`).join('')}
    </div>
  </div>`;
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
