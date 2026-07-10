const situations = [
  {
    id: 'owner-price',
    title: 'Узнать цену у собственника',
    goal: 'seller',
    query: 'продающий собственник цена оценка',
    printCount: 2,
    layoutMode: 'readable',
    hint: 'Мягкий заход: человек пока не продаёт, но может захотеть узнать цену.',
    recommendation: {
      format: '2 макета на А4, без фото, крупный телефон и отрывные контакты.',
      message: 'Главный смысл: узнать реальную цену без обязательств и давления.',
      metric: 'Считать звонки от собственников и вопросы про цену.',
      manager: 'Проверить, есть ли район или дом и не звучит ли текст слишком навязчиво.'
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
      metric: 'Считать звонки с вопросом о покупателе и готовность назвать цену.',
      manager: 'Проверить, чтобы текст не обещал больше, чем реально известно по покупателю.'
    }
  },
  {
    id: 'entrance-soft',
    title: 'Подъезд / соседи',
    goal: 'seller',
    query: 'продающий подъезд соседи без давления',
    printCount: 4,
    layoutMode: 'entrance',
    hint: 'Для объявлений в конкретном доме, подъезде или небольшом районе.',
    recommendation: {
      format: '4 макета на А4, короткий текст, без фото и QR.',
      message: 'Главный смысл: соседям полезно узнать цену и спрос по этому дому.',
      metric: 'Считать отклики по конкретным домам и подъездам.',
      manager: 'Проверить, чтобы был указан дом, улица, район или другой понятный контекст.'
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
      metric: 'Считать звонки по объекту и просьбы отправить фото, адрес или подробности.',
      manager: 'Проверить фото, цену, параметры и отсутствие перегруза в описании.'
    }
  },
  {
    id: 'tellerman-sad',
    title: 'ЖК Теллерманов сад',
    goal: 'newbuild',
    query: 'Теллерманов сад новостройка семейная ипотека материнский капитал',
    printCount: 2,
    layoutMode: 'newbuild_visual',
    hint: 'Для аккуратного продвижения нового ЖК без лишней закрытой информации.',
    recommendation: {
      format: '2 макета на А4, крупный визуал дома, можно добавить планировку и QR.',
      message: 'Главный смысл: рассказать о старте продаж и собрать заинтересованных покупателей.',
      metric: 'Считать звонки, вопросы по планировкам, ипотеке и способам покупки.',
      manager: 'Проверить, что в макете нет непубличных данных и неподтверждённых условий.'
    }
  },
  {
    id: 'newbuild-mortgage',
    title: 'Новостройка / ипотека',
    goal: 'newbuild',
    query: 'новостройка семейная ипотека маткапитал молодая семья подбор',
    printCount: 2,
    layoutMode: 'readable',
    hint: 'Для покупателей, которым важны условия покупки и помощь с подбором.',
    recommendation: {
      format: '2 макета на А4, крупный контакт, QR по необходимости.',
      message: 'Главный смысл: помочь подобрать квартиру в новом доме и разобраться с условиями.',
      metric: 'Считать консультации, заявки на подбор и вопросы по ипотеке.',
      manager: 'Проверить актуальность формулировок перед массовой печатью.'
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
      metric: 'Считать новые заявки покупателей и качество запроса.',
      manager: 'Проверить, чтобы текст не был слишком общим и был понятен тип запроса.'
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
      metric: 'Считать обращения за консультацией и повторные контакты.',
      manager: 'Проверить аккуратность формулировок и отсутствие юридических обещаний.'
    }
  },
  {
    id: 'brand-district',
    title: 'Личный бренд СПН',
    goal: 'brand',
    query: 'личный бренд специалист район консультация оценка',
    printCount: 2,
    layoutMode: 'agent_brand_photo',
    hint: 'Для регулярного присутствия СПН в районе и доверительного знакомства.',
    recommendation: {
      format: '2 макета на А4, портрет СПН без обрезки, короткий текст и крупный телефон.',
      message: 'Главный смысл: в районе есть понятный специалист, к которому можно обратиться.',
      metric: 'Считать обращения за консультацией, оценкой и повторные контакты.',
      manager: 'Проверить, чтобы текст был про пользу клиенту, а не только про самого СПН.'
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
      metric: 'Сравнить, какая формулировка дала больше качественных откликов.',
      manager: 'Первый нестандартный макет лучше проверить перед печатью.'
    }
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('templateSearch');
  const density = document.getElementById('templateDensityFilter');
  const toolbar = search?.closest('.toolbar-row');
  const startCard = document.querySelector('.start-card');
  const anchor = startCard || toolbar;
  if(!search || !toolbar || !anchor || document.getElementById('spnWizard')) return;

  anchor.insertAdjacentHTML('afterend', renderWizard());
  const wizard = document.getElementById('spnWizard');

  wizard.addEventListener('click', event => {
    const btn = event.target.closest('[data-spn-situation]');
    const reset = event.target.closest('[data-spn-reset]');
    const routeAction = event.target.closest('[data-spn-route-action]');

    if(routeAction){
      applyRouteAction(routeAction.dataset.spnRouteAction);
      return;
    }

    if(reset){
      search.value = '';
      if(density) density.value = 'all';
      search.dispatchEvent(new Event('input', {bubbles:true}));
      setStatus('Подбор очищен. Можно искать шаблон вручную.');
      wizard.querySelectorAll('[data-spn-situation]').forEach(item => item.classList.remove('active'));
      renderRecommendation(null);
      updateRoute();
      return;
    }

    if(!btn) return;
    const item = situations.find(situation => situation.id === btn.dataset.spnSituation);
    if(!item) return;

    wizard.querySelectorAll('[data-spn-situation]').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    renderRecommendation(item);
    updateRoute();

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
      updateRoute();
      setStatus(`Офисный подбор: ${item.title}. ${item.hint}`);
    }, 90);
  });

  bindRouteUpdates();
  updateRoute();
});

function renderWizard(){
  return `<div class="spn-wizard" id="spnWizard">
    <div class="spn-wizard-head office-head">
      <div>
        <b>Что делаем сегодня?</b>
        <span>Выберите рабочую ситуацию — генератор подберёт шаблоны, формат печати и подскажет, что считать после расклейки.</span>
      </div>
      <button type="button" data-spn-reset>Сбросить</button>
    </div>
    <div class="spn-wizard-grid">
      ${situations.map(item => `<button type="button" data-spn-situation="${item.id}"><span>${item.title}</span><small>${item.hint}</small></button>`).join('')}
    </div>
    <div class="spn-recommendation" id="spnRecommendation">
      <b>Выберите ситуацию</b>
      <span>Подскажу формат печати, главный смысл, проверку менеджера и метрику после расклейки.</span>
    </div>
    <div class="spn-route" id="spnRoute">
      <div class="spn-route-head">
        <b>Маршрут до печати</b>
        <span id="spnRouteProgress">0/5</span>
      </div>
      <div class="spn-route-steps" id="spnRouteSteps"></div>
      <div class="spn-route-next" id="spnRouteNext"></div>
    </div>
  </div>`;
}

function bindRouteUpdates(){
  const ids = ['templateSearch','agentPhone','headline','description','benefits','area','propertyType','price','showContact','tearOffs'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', updateRoute);
    el.addEventListener('change', updateRoute);
  });
  document.getElementById('templateList')?.addEventListener('click', () => window.setTimeout(updateRoute, 120));
  document.getElementById('qualityBtn')?.addEventListener('click', () => window.setTimeout(updateRoute, 120));
}

function getRouteState(){
  const text = `${value('headline')} ${value('description')} ${value('benefits')} ${value('customBlockText')}`.toLowerCase().replace(/ё/g, 'е');
  const selectedSituation = Boolean(document.querySelector('[data-spn-situation].active')) || Boolean(value('templateSearch'));
  const contactReady = Boolean(value('agentPhone')) && (checked('showContact') || checked('tearOffs'));
  const contextReady = Boolean(value('area') || value('propertyType') || value('price'));
  const contentReady = value('headline').length >= 10 && value('description').length >= 20 && value('benefits').split('\n').filter(Boolean).length >= 2;
  const trustReady = /без давлен|без обязательств|не обязывает|по делу|безопас|провер|документ|простым язык|честн/.test(text);
  const practicalReady = contactReady && contextReady && contentReady && trustReady;
  return { selectedSituation, contactReady, contextReady, contentReady, trustReady, practicalReady };
}

function updateRoute(){
  const route = document.getElementById('spnRoute');
  const stepsBox = document.getElementById('spnRouteSteps');
  const progressBox = document.getElementById('spnRouteProgress');
  const nextBox = document.getElementById('spnRouteNext');
  if(!route || !stepsBox || !progressBox || !nextBox) return;

  const state = getRouteState();
  const steps = [
    ['Ситуация', state.selectedSituation],
    ['Контакт', state.contactReady],
    ['Контекст', state.contextReady],
    ['Текст', state.contentReady],
    ['Доверие', state.trustReady]
  ];
  const passed = steps.filter(([, ok]) => ok).length;
  progressBox.textContent = `${passed}/${steps.length}`;
  route.classList.toggle('ready', state.practicalReady);
  stepsBox.innerHTML = steps.map(([title, ok]) => `<span class="${ok ? 'done' : 'todo'}">${ok ? '✓' : '•'} ${title}</span>`).join('');

  const next = getNextAction(state);
  nextBox.innerHTML = `<b>${next.title}</b><span>${next.text}</span><button type="button" data-spn-route-action="${next.action}">${next.button}</button>`;
}

function getNextAction(state){
  if(!state.selectedSituation) return {title:'Начните с офисной ситуации', text:'Выберите реальную задачу: собственник, покупатель, подъезд, объект, новостройка или консультация.', action:'situation', button:'Выбрать ситуацию'};
  if(!state.contactReady) return {title:'Заполните контакт', text:'Телефон должен быть виден в контактах, на отрывных листочках или в другом понятном канале отклика.', action:'phone', button:'К телефону'};
  if(!state.contextReady) return {title:'Добавьте контекст', text:'Район, дом, ЖК, объект или цена помогают человеку понять, что объявление относится к нему.', action:'context', button:'К контексту'};
  if(!state.contentReady) return {title:'Доведите текст', text:'Нужны заголовок, короткое описание и 2–3 причины откликнуться.', action:'text', button:'К тексту'};
  if(!state.trustReady) return {title:'Добавьте доверие', text:'Добавьте мягкую формулировку: без давления, без обязательств, по делу.', action:'trust', button:'Добавить доверие'};
  return {title:'Макет готов к проверке', text:'Нажмите «Проверить», затем печатайте, выдавайте задание и фиксируйте результат.', action:'quality', button:'Проверить макет'};
}

function applyRouteAction(action){
  if(action === 'situation') return scrollToId('spnWizard');
  if(action === 'phone') return focusField('agentPhone');
  if(action === 'context') return focusField(value('area') ? value('propertyType') ? 'price' : 'propertyType' : 'area');
  if(action === 'text') return focusField(value('headline') ? value('description') ? 'benefits' : 'description' : 'headline');
  if(action === 'trust'){
    const field = document.getElementById('customBlockText');
    const showCustom = document.getElementById('showCustomBlock');
    if(showCustom && !showCustom.checked){
      showCustom.checked = true;
      showCustom.dispatchEvent(new Event('change', {bubbles:true}));
    }
    if(!value('customBlockTitle')) setValue('customBlockTitle', 'Важно');
    if(field && !value('customBlockText').toLowerCase().replace(/ё/g,'е').includes('без обязательств')) setValue('customBlockText', `${value('customBlockText')} Можно просто уточнить информацию — звонок ни к чему не обязывает.`.trim());
    return focusField('customBlockText');
  }
  if(action === 'quality') return document.getElementById('qualityBtn')?.click();
}

function renderRecommendation(item){
  const box = document.getElementById('spnRecommendation');
  if(!box) return;
  if(!item){
    box.innerHTML = '<b>Выберите ситуацию</b><span>Подскажу формат печати, главный смысл, проверку менеджера и метрику после расклейки.</span>';
    return;
  }
  box.innerHTML = `<b>Рекомендация: ${item.title}</b>
    <span><strong>Формат:</strong> ${item.recommendation.format}</span>
    <span><strong>Смысл:</strong> ${item.recommendation.message}</span>
    <span><strong>Проверка:</strong> ${item.recommendation.manager}</span>
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

function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function checked(id){
  return Boolean(document.getElementById(id)?.checked);
}
function setValue(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function focusField(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.focus();
  el.scrollIntoView({behavior:'smooth', block:'center'});
}
function scrollToId(id){
  document.getElementById(id)?.scrollIntoView({behavior:'smooth', block:'start'});
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
