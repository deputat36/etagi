document.addEventListener('DOMContentLoaded', () => {
  const headline = document.getElementById('headline');
  const headlineLabel = headline?.closest('label');
  if(headline && headlineLabel && !document.getElementById('spnHeadlineHelper')){
    headlineLabel.insertAdjacentHTML('afterend', renderHeadlineHelper());
  }

  const description = document.getElementById('description');
  const descriptionLabel = description?.closest('label');
  if(description && descriptionLabel && !document.getElementById('spnTextHelper')){
    descriptionLabel.insertAdjacentHTML('afterend', renderTextHelper());
  }

  bindContentHelpers();
  renderSuggestions();
  renderTextPresets();
});

function renderHeadlineHelper(){
  return `<div class="spn-headline-helper" id="spnHeadlineHelper">
    <div class="spn-headline-helper-head">
      <b>Варианты заголовка</b>
      <button type="button" id="refreshHeadlineIdeasBtn">Обновить</button>
    </div>
    <div class="spn-headline-ideas" id="spnHeadlineIdeas"></div>
    <p>Выберите вариант и доработайте под конкретный дом, район или объект.</p>
  </div>`;
}

function renderTextHelper(){
  return `<div class="spn-text-helper" id="spnTextHelper">
    <div class="spn-headline-helper-head">
      <b>Описание и причины</b>
      <button type="button" id="refreshTextIdeasBtn">Обновить</button>
    </div>
    <div class="spn-text-presets" id="spnTextPresets"></div>
    <p>Выберите тон: инструмент подставит короткое описание и 2–3 причины откликнуться.</p>
  </div>`;
}

function bindContentHelpers(){
  ['area','propertyType','price','templateSearch','description','headline'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', () => {
      renderSuggestions();
      renderTextPresets();
    });
    el.addEventListener('change', () => {
      renderSuggestions();
      renderTextPresets();
    });
  });
  document.getElementById('goalGrid')?.addEventListener('click', () => window.setTimeout(() => {
    renderSuggestions();
    renderTextPresets();
  }, 80));
  document.getElementById('spnWizard')?.addEventListener('click', () => window.setTimeout(() => {
    renderSuggestions();
    renderTextPresets();
  }, 120));
  document.getElementById('refreshHeadlineIdeasBtn')?.addEventListener('click', renderSuggestions);
  document.getElementById('refreshTextIdeasBtn')?.addEventListener('click', renderTextPresets);
  document.getElementById('spnHeadlineIdeas')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-headline-idea]');
    if(!btn) return;
    setHeadline(btn.dataset.headlineIdea);
  });
  document.getElementById('spnTextPresets')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-text-preset]');
    if(!btn) return;
    applyTextPreset(btn.dataset.textPreset);
  });
}

function renderSuggestions(){
  const box = document.getElementById('spnHeadlineIdeas');
  if(!box) return;
  const ideas = buildHeadlineIdeas();
  box.innerHTML = ideas.map(text => `<button type="button" data-headline-idea="${escapeAttr(text)}">${escapeHtml(text)}</button>`).join('');
}

function renderTextPresets(){
  const box = document.getElementById('spnTextPresets');
  if(!box) return;
  const presets = buildTextPresets();
  box.innerHTML = presets.map(item => `<button type="button" data-text-preset="${item.id}">
    <b>${escapeHtml(item.title)}</b>
    <span>${escapeHtml(item.description)}</span>
  </button>`).join('');
}

function buildHeadlineIdeas(){
  const area = value('area') || 'вашем районе';
  const property = value('propertyType') || 'недвижимость';
  const price = value('price');
  const text = getContextText();
  const priceTail = price ? ` за ${price}` : '';

  if(isBuyerContext(text)){
    return unique([
      `Есть покупатель на ${property} в ${area}`,
      `Рассмотрим ${property} в ${area}${priceTail}`,
      `Покупатель ищет вариант в ${area}`,
      `Ваш объект может подойти покупателю`,
      `Ищем ${property}: быстро и по делу`,
      `Собственникам ${area}: есть спрос`
    ]);
  }

  if(isPriceContext(text)){
    return unique([
      `Хотите узнать реальную цену?`,
      `Сколько стоит ${property} в ${area}?`,
      `Оценю недвижимость без обязательств`,
      `Подскажу цену по вашему объекту`,
      `В ${area} сейчас есть спрос`,
      `Узнайте цену до продажи`
    ]);
  }

  if(isObjectContext(text)){
    return unique([
      `${property} в ${area} — посмотрите вариант`,
      `Продаётся ${property} в ${area}`,
      `Хороший вариант для жизни или вложения`,
      `Покажу объект и расскажу детали`,
      `Вариант в ${area}: цена, документы, просмотр`,
      `Успейте посмотреть этот объект`
    ]);
  }

  if(isSafeContext(text)){
    return unique([
      `Проверьте недвижимость до сделки`,
      `Сделка без лишних рисков`,
      `Подскажу по документам и цене`,
      `Покупаете или продаёте? Начните с проверки`,
      `Консультация по недвижимости простым языком`,
      `Разберём вашу ситуацию без давления`
    ]);
  }

  if(isEntranceContext(text)){
    return unique([
      `Соседи, есть спрос на ваш дом`,
      `В вашем доме ищут недвижимость`,
      `Хотите узнать цену квартиры в доме?`,
      `Собственникам этого дома`,
      `В ${area} есть покупатели`,
      `Продажа без лишней публичности`
    ]);
  }

  return unique([
    `Недвижимость в ${area}`,
    `Подскажу по цене и спросу`,
    `Купля-продажа недвижимости без давления`,
    `Есть вопрос по недвижимости? Позвоните`,
    `Помогу разобраться с объектом и документами`,
    `Решение по недвижимости — спокойно и по делу`
  ]);
}

function buildTextPresets(){
  const area = value('area') || 'вашем районе';
  const property = value('propertyType') || 'недвижимости';
  const price = value('price');
  const text = getContextText();

  if(isBuyerContext(text)){
    return [
      preset('soft', 'Мягко для собственника', `Есть запрос на ${property} в ${area}. Если рассматриваете продажу или просто хотите понять интерес к объекту — позвоните, обсудим без давления.`, ['Можно без публикации объявления', 'Сначала сверим параметры и цену', 'Разговор ни к чему не обязывает']),
      preset('direct', 'Сильнее и конкретнее', `Покупатель рассматривает ${property} в ${area}${price ? ` до ${price}` : ''}. Подскажите параметры вашего объекта — проверим, может ли он подойти под текущий спрос.`, ['Есть конкретный спрос', 'Обсуждение по делу', 'Можно начать с телефонного разговора']),
      preset('short', 'Очень коротко', `Есть покупатель на ${property} в ${area}. Позвоните — быстро сверим параметры и ожидания по цене.`, ['Быстро', 'Без лишней публичности', 'По делу'])
    ];
  }

  if(isPriceContext(text)){
    return [
      preset('soft', 'Мягко про цену', `Подскажу ориентир цены по ${property} в ${area}. Можно просто уточнить информацию — это не обязывает к продаже.`, ['Оценка без давления', 'Объясню, что влияет на цену', 'Подскажу спрос по району']),
      preset('direct', 'С акцентом на спрос', `В ${area} есть движение по недвижимости. Если хотите понимать реальную цену своего объекта, позвоните — разберём ситуацию по рынку и документам.`, ['Цена по текущему рынку', 'Спрос и конкуренты', 'Простым языком']),
      preset('short', 'Короткая оценка', `Хотите узнать цену объекта? Позвоните — подскажу ориентир и что может повлиять на стоимость.`, ['Без обязательств', 'По делу', 'Быстро'])
    ];
  }

  if(isObjectContext(text)){
    return [
      preset('soft', 'Спокойная продажа', `${capitalize(property)} в ${area}${price ? `, ${price}` : ''}. Расскажу детали, документы, условия и помогу понять, подходит ли вариант под вашу ситуацию.`, ['Расскажу честно о плюсах и ограничениях', 'Можно уточнить по телефону', 'Помогу с просмотром']),
      preset('direct', 'Продающий объект', `Хороший вариант в ${area}: ${property}${price ? `, ${price}` : ''}. Позвоните — отвечу на вопросы и договоримся о просмотре.`, ['Удобный просмотр', 'Проверка документов', 'Помощь с ипотекой']),
      preset('short', 'Коротко по объекту', `${capitalize(property)} в ${area}. Позвоните — отправлю детали и подскажу условия просмотра.`, ['Цена и условия', 'Фото и детали', 'Просмотр'])
    ];
  }

  if(isSafeContext(text)){
    return [
      preset('soft', 'Консультация без давления', `Разберу вашу ситуацию по недвижимости простым языком: цена, документы, риски, ипотека или порядок сделки. Можно просто уточнить вопрос.`, ['Без давления', 'По документам и рискам', 'Понятный следующий шаг']),
      preset('direct', 'Про безопасность', `Перед покупкой или продажей лучше проверить цену, документы и условия сделки. Позвоните — подскажу, на что обратить внимание.`, ['Проверка документов', 'Снижение рисков', 'Опыт сопровождения сделок']),
      preset('short', 'Коротко о рисках', `Есть вопрос по недвижимости? Позвоните — подскажу, что проверить до решения.`, ['Простым языком', 'Без обязательств', 'По делу'])
    ];
  }

  if(isEntranceContext(text)){
    return [
      preset('soft', 'Для подъезда', `Соседи, если думаете о продаже или хотите узнать спрос по дому, позвоните. Расскажу спокойно, без давления и лишней публичности.`, ['Без обязательств', 'По вашему дому', 'Можно просто узнать цену']),
      preset('direct', 'Спрос по дому', `В этом доме и районе есть интерес к недвижимости. Если у вас есть объект или вопрос по цене — позвоните, обсудим по делу.`, ['Спрос по району', 'Оценка цены', 'Конфиденциально']),
      preset('short', 'Подъезд коротко', `Собственникам дома: подскажу цену и спрос по недвижимости. Звонок ни к чему не обязывает.`, ['Коротко', 'Без давления', 'По делу'])
    ];
  }

  return [
    preset('soft', 'Универсально мягко', `Помогу разобраться с вопросом по недвижимости в ${area}: цена, спрос, документы, покупка или продажа. Позвоните — подскажу без давления.`, ['По делу', 'Простым языком', 'Без обязательств']),
    preset('direct', 'Универсально сильнее', `Есть вопрос по ${property}? Позвоните — подскажу по цене, документам, спросу и следующему шагу.`, ['Оценка ситуации', 'Понятный план действий', 'Помощь специалиста']),
    preset('short', 'Универсально коротко', `Недвижимость в ${area}. Позвоните — подскажу по цене, спросу и документам.`, ['Быстро', 'Понятно', 'Без давления'])
  ];
}

function preset(id, title, description, benefits){
  return { id, title, description, benefits };
}

function applyTextPreset(id){
  const item = buildTextPresets().find(x => x.id === id);
  if(!item) return;
  const currentDescription = value('description');
  const currentBenefits = value('benefits');
  if((currentDescription || currentBenefits) && !confirm('Заменить текущее описание и преимущества?')) return;
  setValue('description', item.description);
  setValue('benefits', item.benefits.join('\n'));
  const status = document.getElementById('statusLine');
  if(status) status.textContent = 'Описание и причины откликнуться подставлены. Проверьте факты и адаптируйте под объект.';
}

function setHeadline(text){
  setValue('headline', text);
  const el = document.getElementById('headline');
  if(el) el.focus();
  const status = document.getElementById('statusLine');
  if(status) status.textContent = 'Заголовок подставлен. Проверьте, подходит ли он под конкретную ситуацию.';
}

function getContextText(){
  return normalize(`${activeGoal()} ${value('templateSearch')} ${value('headline')} ${value('description')} ${document.querySelector('[data-spn-situation].active')?.textContent || ''}`);
}
function isBuyerContext(text){ return text.includes('покупател') || text.includes('куплю') || text.includes('спрос'); }
function isPriceContext(text){ return text.includes('цен') || text.includes('оценк'); }
function isObjectContext(text){ return text.includes('объект') || text.includes('продам') || text.includes('фото') || text.includes('витрин'); }
function isSafeContext(text){ return text.includes('безопас') || text.includes('документ') || text.includes('консультац') || text.includes('риск'); }
function isEntranceContext(text){ return text.includes('подъезд') || text.includes('сосед') || text.includes('дом'); }
function activeGoal(){
  return document.querySelector('[data-goal].active')?.dataset.goal || '';
}
function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function setValue(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function normalize(value){
  return String(value || '').toLowerCase().replace(/ё/g, 'е');
}
function unique(list){
  return [...new Set(list.map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 6);
}
function capitalize(value){
  const text = String(value || '').trim();
  return text ? text.slice(0,1).toUpperCase() + text.slice(1) : text;
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
