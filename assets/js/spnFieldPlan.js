document.addEventListener('DOMContentLoaded', () => {
  const saveCard = document.querySelector('.save-card');
  if(!saveCard || document.getElementById('spnFieldPlan')) return;
  saveCard.insertAdjacentHTML('beforebegin', renderPlanShell());
  bindPlanUpdates();
  updatePlan();
});

function renderPlanShell(){
  return `<section class="card spn-field-plan" id="spnFieldPlan">
    <div class="quality-head">
      <div class="step-title"><span>→</span>План расклейки</div>
      <button type="button" id="copyFieldPlanBtn">Скопировать</button>
    </div>
    <div class="spn-plan-list" id="spnPlanList"></div>
    <div class="spn-response-script">
      <div class="spn-response-head">
        <b>Что говорить по отклику</b>
        <button type="button" id="copyResponseScriptBtn">Скопировать скрипт</button>
      </div>
      <div class="spn-response-list" id="spnResponseList"></div>
    </div>
    <div class="spn-plan-actions">
      <a href="help/response-log.html" target="_blank" rel="noopener">Открыть лист учёта откликов</a>
      <a href="help/results-analysis.html" target="_blank" rel="noopener">Как оценить результат</a>
    </div>
    <p class="hint-text">План нужен, чтобы СПН не просто распечатал макет, а провёл понятный тест: где клеим, сколько, что считаем и что делаем дальше.</p>
  </section>`;
}

function bindPlanUpdates(){
  const ids = ['templateSearch','printPresetRow','printCount','area','propertyType','price','headline','description','benefits','tearOffs','showQr','showPhoto'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', updatePlan);
    el.addEventListener('change', updatePlan);
    el.addEventListener('click', () => window.setTimeout(updatePlan, 80));
  });
  document.getElementById('spnWizard')?.addEventListener('click', () => window.setTimeout(updatePlan, 140));
  document.getElementById('templateList')?.addEventListener('click', () => window.setTimeout(updatePlan, 140));
  document.getElementById('copyFieldPlanBtn')?.addEventListener('click', copyPlan);
  document.getElementById('copyResponseScriptBtn')?.addEventListener('click', copyResponseScript);
}

function updatePlan(){
  const plan = buildPlan();
  const script = buildResponseScript(plan);
  const list = document.getElementById('spnPlanList');
  const scriptList = document.getElementById('spnResponseList');
  if(!list) return;
  list.innerHTML = [
    ['Формат', plan.format],
    ['Первый тест', plan.batch],
    ['Где клеить', plan.place],
    ['Что считать', plan.metric],
    ['Когда смотреть результат', plan.review],
    ['Следующий шаг', plan.next]
  ].map(([label, text]) => `<div class="spn-plan-item"><b>${escapeHtml(label)}</b><span>${escapeHtml(text)}</span></div>`).join('');
  if(scriptList){
    scriptList.innerHTML = script.map(([label, text]) => `<div class="spn-response-item"><b>${escapeHtml(label)}</b><span>${escapeHtml(text)}</span></div>`).join('');
  }
}

function buildPlan(){
  const count = getPrintCount();
  const situation = getActiveSituation();
  const text = normalize(`${value('templateSearch')} ${value('headline')} ${value('description')} ${value('benefits')} ${value('area')} ${value('propertyType')} ${value('price')} ${situation}`);
  const area = value('area') || 'выбранный район / дом';
  const totalAds = count * 10;
  const hasTears = checked('tearOffs');
  const hasQr = checked('showQr');
  const hasPhoto = checked('showPhoto');
  const type = getPlanType(text);

  const format = `${count} ${plural(count, 'макет', 'макета', 'макетов')} на А4${hasTears ? ', с отрывными телефонами' : ''}${hasQr ? ', QR проверить телефоном' : ''}${hasPhoto ? ', фото только если оно реально усиливает смысл' : ''}.`;

  let batch = `Начать с 10 листов: примерно ${totalAds} ${plural(totalAds, 'объявление', 'объявления', 'объявлений')}.`;
  if(count === 1) batch = 'Начать с 5–10 листов в точках с хорошей видимостью. Это витринный формат, его не нужно клеить слишком массово.';
  if(count >= 6) batch = `Начать с 5–8 листов: мини-формат сначала нужно проверить на читаемость и отклик.`;

  let place = `Клеить там, где человек сразу узнает контекст: ${area}.`;
  if(text.includes('подъезд') || text.includes('сосед') || text.includes('дом')) place = `Клеить точечно: подъезды, доски объявлений и входные зоны по адресу/дому: ${area}.`;
  if(text.includes('объект') || text.includes('фото') || text.includes('витрин')) place = 'Клеить там, где уместен крупный визуал: витрина офиса, доски у магазинов, проходные места, рядом с районом объекта.';
  if(text.includes('безопас') || text.includes('документ') || text.includes('консультац')) place = 'Клеить в местах, где люди решают бытовые и имущественные вопросы: подъезды, доски, офис, партнёрские точки.';

  let metric = 'Фиксировать: дата, район, шаблон, сколько листов, звонки, сообщения, качество обращения и итог.';
  if(type === 'price') metric = 'Фиксировать отдельно: звонки собственников, вопросы про цену, готовность назвать адрес и примерные ожидания.';
  if(type === 'buyer') metric = 'Фиксировать отдельно: кто звонит по покупателю, какой объект предлагает, готов ли обсуждать цену.';
  if(type === 'object') metric = 'Фиксировать отдельно: звонки по объекту, просьбы отправить фото, адрес, цену и просмотры.';

  return {
    type,
    format,
    batch,
    place,
    metric,
    review: 'Первый вывод делать через 2–3 дня или после 3–5 обращений. Не менять сразу всё: сравнивать по одному элементу.',
    next: 'Если звонков мало — менять заголовок. Если звонки нецелевые — уточнить контекст. Если звонят, но не идут дальше — усилить доверие и скрипт обработки.'
  };
}

function buildResponseScript(plan){
  const area = value('area') || 'вашему району';
  const property = value('propertyType') || 'недвижимости';
  const price = value('price');
  const baseOpen = `Здравствуйте! Да, вы позвонили по объявлению про ${property}${area ? ` в ${area}` : ''}. Подскажите, вы звоните как собственник, покупатель или просто хотите уточнить информацию?`;

  if(plan.type === 'price'){
    return [
      ['Начало', 'Здравствуйте! Вы по объявлению про оценку цены недвижимости? Подскажите адрес или хотя бы район и тип объекта.'],
      ['Уточнить', 'Вам важно просто понимать ориентир цены или вы рассматриваете продажу в ближайшее время?'],
      ['Дать пользу', 'Я могу назвать примерный диапазон и объяснить, что влияет на цену: состояние, этаж, документы, спрос и конкуренты.'],
      ['Следующий шаг', 'Давайте я уточню пару деталей и скажу, какой ориентир по цене сейчас выглядит реалистично.']
    ];
  }

  if(plan.type === 'buyer'){
    return [
      ['Начало', 'Здравствуйте! Вы по объявлению, где указано, что есть покупатель? Подскажите, какой у вас объект и где он находится.'],
      ['Уточнить', 'Вы уже продаёте или только думаете, если будет нормальная цена и реальный покупатель?'],
      ['Дать пользу', 'Я сначала уточню параметры и ожидания по цене, чтобы не тратить ваше время на неподходящий запрос.'],
      ['Следующий шаг', 'Давайте сверим адрес, состояние и желаемую цену — после этого будет понятно, подходит ли объект под текущий спрос.']
    ];
  }

  if(plan.type === 'object'){
    return [
      ['Начало', baseOpen],
      ['Уточнить', 'Что для вас главное: цена, район, состояние, документы, ипотека или быстрый просмотр?'],
      ['Дать пользу', `По этому варианту сразу расскажу плюсы, ограничения и что нужно проверить перед решением${price ? `, цена сейчас: ${price}` : ''}.`],
      ['Следующий шаг', 'Могу отправить подробности и договориться о просмотре в удобное время.']
    ];
  }

  if(plan.type === 'safe'){
    return [
      ['Начало', 'Здравствуйте! Вы по объявлению про безопасную сделку или консультацию по недвижимости?'],
      ['Уточнить', 'У вас покупка, продажа, ипотека, документы или просто хотите понять риски?'],
      ['Дать пользу', 'Я объясню простым языком, на что обратить внимание до решения, чтобы не попасть на лишние расходы или проблемы.'],
      ['Следующий шаг', 'Расскажите ситуацию коротко — я подскажу, какие шаги лучше сделать в первую очередь.']
    ];
  }

  return [
    ['Начало', baseOpen],
    ['Уточнить', 'Что именно вас заинтересовало в объявлении и какая у вас ситуация сейчас?'],
    ['Дать пользу', 'Я коротко подскажу варианты, риски и следующий шаг, без давления и лишней воды.'],
    ['Следующий шаг', 'Давайте уточним пару деталей, и я скажу, что лучше сделать дальше.']
  ];
}

function copyPlan(){
  const plan = buildPlan();
  const text = `План расклейки\n\nФормат: ${plan.format}\nПервый тест: ${plan.batch}\nГде клеить: ${plan.place}\nЧто считать: ${plan.metric}\nКогда смотреть результат: ${plan.review}\nСледующий шаг: ${plan.next}`;
  navigator.clipboard?.writeText(text).then(() => setStatus('План расклейки скопирован.')).catch(() => setStatus('Не удалось скопировать план.'));
}

function copyResponseScript(){
  const script = buildResponseScript(buildPlan());
  const text = `Скрипт обработки отклика\n\n${script.map(([label, value]) => `${label}: ${value}`).join('\n')}`;
  navigator.clipboard?.writeText(text).then(() => setStatus('Скрипт отклика скопирован.')).catch(() => setStatus('Не удалось скопировать скрипт.'));
}

function getPlanType(text){
  if(text.includes('цен') || text.includes('оценк')) return 'price';
  if(text.includes('покупател') || text.includes('куплю') || text.includes('спрос')) return 'buyer';
  if(text.includes('объект') || text.includes('фото') || text.includes('продам') || text.includes('витрин')) return 'object';
  if(text.includes('безопас') || text.includes('документ') || text.includes('консультац') || text.includes('риск')) return 'safe';
  return 'general';
}
function getActiveSituation(){
  return document.querySelector('[data-spn-situation].active')?.textContent || '';
}
function getPrintCount(){
  const active = document.querySelector('[data-count].active');
  if(active) return Number(active.dataset.count) || 2;
  return 2;
}
function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function checked(id){
  return Boolean(document.getElementById(id)?.checked);
}
function normalize(value){
  return String(value || '').toLowerCase().replace(/ё/g, 'е');
}
function plural(number, one, two, five){
  const n = Math.abs(Number(number)) % 100;
  const n1 = n % 10;
  if(n > 10 && n < 20) return five;
  if(n1 > 1 && n1 < 5) return two;
  if(n1 === 1) return one;
  return five;
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
