const situations = [
  {
    id: 'owner-price',
    title: 'Узнать цену у собственника',
    goal: 'seller',
    query: 'продающий собственник цена оценка',
    printCount: 2,
    layoutMode: 'readable',
    hint: 'Для мягкого захода: человек пока не продаёт, но может захотеть узнать цену.',
    recommendation: {
      format: '2 макета на А4, без фото, крупный телефон и отрывные контакты.',
      message: 'Главный смысл: узнать реальную цену без обязательств и давления.',
      metric: 'Считать звонки от собственников и вопросы про цену.'
    }
  },
  {
    id: 'direct-buyer',
    title: 'Есть покупатель',
    goal: 'seller',
    query: 'продающий есть покупатель куплю собственник',
    printCount: 4,
    layoutMode: 'entrance',
    hint: 'Для точечного поиска объекта под активный спрос.',
    recommendation: {
      format: '4 макета на А4, подъездный формат, отрывные контакты обязательны.',
      message: 'Главный смысл: есть конкретный спрос, можно обсудить продажу без публикации.',
      metric: 'Считать звонки с вопросом о покупателе и готовность назвать цену.'
    }
  },
  {
    id: 'entrance-soft',
    title: 'Подъезд / соседи',
    goal: 'seller',
    query: 'продающий подъезд соседи без давления',
    printCount: 4,
    layoutMode: 'entrance',
    hint: 'Для объявлений в конкретном доме или подъезде.',
    recommendation: {
      format: '4 макета на А4, короткий текст, без фото и QR.',
      message: 'Главный смысл: соседям полезно узнать цену и спрос по этому дому.',
      metric: 'Считать отклики по конкретным домам и подъездам.'
    }
  },
  {
    id: 'object-sale',
    title: 'Продать объект',
    goal: 'object',
    query: 'продающий объект фото витрина продажа',
    printCount: 1,
    layoutMode: 'showcase',
    hint: 'Для квартиры, дома, участка или коммерции.',
    recommendation: {
      format: '1 крупный макет на А4 или 2 на А4, фото желательно.',
      message: 'Главный смысл: показать сильную причину посмотреть объект.',
      metric: 'Считать звонки по объекту и просьбы отправить фото/адрес.'
    }
  },
  {
    id: 'buyer-family',
    title: 'Найти покупателя',
    goal: 'buyer',
    query: 'продающий покупатель семья квартира дом',
    printCount: 2,
    layoutMode: 'readable',
    hint: 'Для людей, которые ищут жильё и хотят понятный подбор.',
    recommendation: {
      format: '2 макета на А4, можно без фото, акцент на подбор и безопасность.',
      message: 'Главный смысл: человеку помогут найти вариант под ситуацию и бюджет.',
      metric: 'Считать новые заявки покупателей и качество запроса.'
    }
  },
  {
    id: 'safe-deal',
    title: 'Консультация / безопасность',
    goal: 'service',
    query: 'продающий безопасная сделка документы консультация',
    printCount: 2,
    layoutMode: 'readable',
    hint: 'Для доверительного захода через пользу, документы и риски.',
    recommendation: {
      format: '2 макета на А4, спокойный текст, без перегруза.',
      message: 'Главный смысл: лучше проверить цену, документы и риски до сделки.',
      metric: 'Считать обращения за консультацией и повторные контакты.'
    }
  },
  {
    id: 'blank-custom',
    title: 'Нестандартный макет',
    goal: 'all',
    query: 'пустой нестандартный с нуля',
    printCount: 2,
    layoutMode: 'readable',
    hint: 'Для редкой задачи, когда нужен не готовый текст, а удобная основа.',
    recommendation: {
      format: 'Начните с 2 макетов на А4, потом тестируйте 4 на А4.',
      message: 'Главный смысл: одна задача, один заголовок, один понятный призыв.',
      metric: 'Сравнить, какая формулировка дала больше качественных откликов.'
    }
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
      renderRecommendation(null);
      return;
    }

    if(!btn) return;
    const item = situations.find(situation => situation.id === btn.dataset.spnSituation);
    if(!item) return;

    wizard.querySelectorAll('[data-spn-situation]').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    renderRecommendation(item);

    if(item.goal !== 'all'){
      const goalBtn = document.querySelector(`[data-goal="${item.goal}"]`);
      if(goalBtn) goalBtn.click();
    }

    window.setTimeout(() => {
      search.value = item.query;
      if(density) density.value = 'all';
      search.dispatchEvent(new Event('input', {bubbles:true}));
      if(density) density.dispatchEvent(new Event('change', {bubbles:true}));
      applyRecommendedSettings(item);
      setStatus(`Подобраны шаблоны: ${item.title}. ${item.hint}`);
    }, 90);
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
    <div class="spn-recommendation" id="spnRecommendation">
      <b>Выберите ситуацию</b>
      <span>Подскажу формат печати, главный смысл и что отслеживать после расклейки.</span>
    </div>
  </div>`;
}

function renderRecommendation(item){
  const box = document.getElementById('spnRecommendation');
  if(!box) return;
  if(!item){
    box.innerHTML = '<b>Выберите ситуацию</b><span>Подскажу формат печати, главный смысл и что отслеживать после расклейки.</span>';
    return;
  }
  box.innerHTML = `<b>Рекомендация: ${item.title}</b>
    <span><strong>Формат:</strong> ${item.recommendation.format}</span>
    <span><strong>Смысл:</strong> ${item.recommendation.message}</span>
    <span><strong>Отслеживать:</strong> ${item.recommendation.metric}</span>`;
}

function applyRecommendedSettings(item){
  if(item.printCount){
    const countBtn = document.querySelector(`[data-count="${item.printCount}"]`);
    if(countBtn) countBtn.click();
  }
  if(item.layoutMode){
    const modeBtn = document.querySelector(`[data-layout-mode="${item.layoutMode}"]`);
    if(modeBtn) modeBtn.click();
  }
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
