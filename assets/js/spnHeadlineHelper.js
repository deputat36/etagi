document.addEventListener('DOMContentLoaded', () => {
  const headline = document.getElementById('headline');
  const label = headline?.closest('label');
  if(!headline || !label || document.getElementById('spnHeadlineHelper')) return;
  label.insertAdjacentHTML('afterend', renderHeadlineHelper());
  bindHeadlineHelper();
  renderSuggestions();
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

function bindHeadlineHelper(){
  ['area','propertyType','price','templateSearch','description'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', renderSuggestions);
    el.addEventListener('change', renderSuggestions);
  });
  document.getElementById('goalGrid')?.addEventListener('click', () => window.setTimeout(renderSuggestions, 80));
  document.getElementById('spnWizard')?.addEventListener('click', () => window.setTimeout(renderSuggestions, 120));
  document.getElementById('refreshHeadlineIdeasBtn')?.addEventListener('click', renderSuggestions);
  document.getElementById('spnHeadlineIdeas')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-headline-idea]');
    if(!btn) return;
    setHeadline(btn.dataset.headlineIdea);
  });
}

function renderSuggestions(){
  const box = document.getElementById('spnHeadlineIdeas');
  if(!box) return;
  const ideas = buildHeadlineIdeas();
  box.innerHTML = ideas.map(text => `<button type="button" data-headline-idea="${escapeAttr(text)}">${escapeHtml(text)}</button>`).join('');
}

function buildHeadlineIdeas(){
  const area = value('area') || 'вашем районе';
  const property = value('propertyType') || 'недвижимость';
  const price = value('price');
  const text = normalize(`${activeGoal()} ${value('templateSearch')} ${value('description')} ${document.querySelector('[data-spn-situation].active')?.textContent || ''}`);
  const priceTail = price ? ` за ${price}` : '';

  if(text.includes('покупател') || text.includes('куплю') || text.includes('спрос')){
    return unique([
      `Есть покупатель на ${property} в ${area}`,
      `Рассмотрим ${property} в ${area}${priceTail}`,
      `Покупатель ищет вариант в ${area}`,
      `Ваш объект может подойти покупателю`,
      `Ищем ${property}: быстро и по делу`,
      `Собственникам ${area}: есть спрос`
    ]);
  }

  if(text.includes('цен') || text.includes('оценк')){
    return unique([
      `Хотите узнать реальную цену?`,
      `Сколько стоит ${property} в ${area}?`,
      `Оценю недвижимость без обязательств`,
      `Подскажу цену по вашему объекту`,
      `В ${area} сейчас есть спрос`,
      `Узнайте цену до продажи`
    ]);
  }

  if(text.includes('объект') || text.includes('продам') || text.includes('фото') || text.includes('витрин')){
    return unique([
      `${property} в ${area} — посмотрите вариант`,
      `Продаётся ${property} в ${area}`,
      `Хороший вариант для жизни или вложения`,
      `Покажу объект и расскажу детали`,
      `Вариант в ${area}: цена, документы, просмотр`,
      `Успейте посмотреть этот объект`
    ]);
  }

  if(text.includes('безопас') || text.includes('документ') || text.includes('консультац') || text.includes('риск')){
    return unique([
      `Проверьте недвижимость до сделки`,
      `Сделка без лишних рисков`,
      `Подскажу по документам и цене`,
      `Покупаете или продаёте? Начните с проверки`,
      `Консультация по недвижимости простым языком`,
      `Разберём вашу ситуацию без давления`
    ]);
  }

  if(text.includes('подъезд') || text.includes('сосед') || text.includes('дом')){
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

function setHeadline(text){
  const el = document.getElementById('headline');
  if(!el) return;
  el.value = text;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
  el.focus();
  const status = document.getElementById('statusLine');
  if(status) status.textContent = 'Заголовок подставлен. Проверьте, подходит ли он под конкретную ситуацию.';
}

function activeGoal(){
  return document.querySelector('[data-goal].active')?.dataset.goal || '';
}
function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function normalize(value){
  return String(value || '').toLowerCase().replace(/ё/g, 'е');
}
function unique(list){
  return [...new Set(list.map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 6);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
