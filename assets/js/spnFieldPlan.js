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
}

function updatePlan(){
  const plan = buildPlan();
  const list = document.getElementById('spnPlanList');
  if(!list) return;
  list.innerHTML = [
    ['Формат', plan.format],
    ['Первый тест', plan.batch],
    ['Где клеить', plan.place],
    ['Что считать', plan.metric],
    ['Когда смотреть результат', plan.review],
    ['Следующий шаг', plan.next]
  ].map(([label, text]) => `<div class="spn-plan-item"><b>${escapeHtml(label)}</b><span>${escapeHtml(text)}</span></div>`).join('');
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

  const format = `${count} ${plural(count, 'макет', 'макета', 'макетов')} на А4${hasTears ? ', с отрывными телефонами' : ''}${hasQr ? ', QR проверить телефоном' : ''}${hasPhoto ? ', фото только если оно реально усиливает смысл' : ''}.`;

  let batch = `Начать с 10 листов: примерно ${totalAds} ${plural(totalAds, 'объявление', 'объявления', 'объявлений')}.`;
  if(count === 1) batch = 'Начать с 5–10 листов в точках с хорошей видимостью. Это витринный формат, его не нужно клеить слишком массово.';
  if(count >= 6) batch = `Начать с 5–8 листов: мини-формат сначала нужно проверить на читаемость и отклик.`;

  let place = `Клеить там, где человек сразу узнает контекст: ${area}.`;
  if(text.includes('подъезд') || text.includes('сосед') || text.includes('дом')) place = `Клеить точечно: подъезды, доски объявлений и входные зоны по адресу/дому: ${area}.`;
  if(text.includes('объект') || text.includes('фото') || text.includes('витрин')) place = 'Клеить там, где уместен крупный визуал: витрина офиса, доски у магазинов, проходные места, рядом с районом объекта.';
  if(text.includes('безопас') || text.includes('документ') || text.includes('консультац')) place = 'Клеить в местах, где люди решают бытовые и имущественные вопросы: подъезды, доски, офис, партнёрские точки.';

  let metric = 'Фиксировать: дата, район, шаблон, сколько листов, звонки, сообщения, качество обращения и итог.';
  if(text.includes('цен')) metric = 'Фиксировать отдельно: звонки собственников, вопросы про цену, готовность назвать адрес и примерные ожидания.';
  if(text.includes('покупател')) metric = 'Фиксировать отдельно: кто звонит по покупателю, какой объект предлагает, готов ли обсуждать цену.';
  if(text.includes('объект')) metric = 'Фиксировать отдельно: звонки по объекту, просьбы отправить фото, адрес, цену и просмотры.';

  return {
    format,
    batch,
    place,
    metric,
    review: 'Первый вывод делать через 2–3 дня или после 3–5 обращений. Не менять сразу всё: сравнивать по одному элементу.',
    next: 'Если звонков мало — менять заголовок. Если звонки нецелевые — уточнить контекст. Если звонят, но не идут дальше — усилить доверие и скрипт обработки.'
  };
}

function copyPlan(){
  const plan = buildPlan();
  const text = `План расклейки\n\nФормат: ${plan.format}\nПервый тест: ${plan.batch}\nГде клеить: ${plan.place}\nЧто считать: ${plan.metric}\nКогда смотреть результат: ${plan.review}\nСледующий шаг: ${plan.next}`;
  navigator.clipboard?.writeText(text).then(() => setStatus('План расклейки скопирован.')).catch(() => setStatus('Не удалось скопировать план.'));
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
