const JOURNAL_KEY = 'etagi-raskleyka-test-journal-v1';

document.addEventListener('DOMContentLoaded', () => {
  const saveCard = document.querySelector('.save-card');
  if(!saveCard || document.getElementById('spnResultEstimator')) return;
  saveCard.insertAdjacentHTML('beforebegin', renderEstimatorShell());
  bindEstimatorEvents();
  updateEstimator();
  renderJournal();
});

function renderEstimatorShell(){
  return `<section class="card spn-result-estimator" id="spnResultEstimator">
    <div class="quality-head">
      <div class="step-title"><span>%</span>Итог теста расклейки</div>
      <strong id="spnResultScore">—</strong>
    </div>
    <div class="spn-result-grid">
      <label>Листов расклеено<input id="resultSheets" type="number" min="0" step="1" placeholder="10"></label>
      <label>Всего откликов<input id="resultLeads" type="number" min="0" step="1" placeholder="3"></label>
      <label>Горячих<input id="resultHot" type="number" min="0" step="1" placeholder="1"></label>
      <label>Тёплых<input id="resultWarm" type="number" min="0" step="1" placeholder="1"></label>
    </div>
    <div class="spn-result-box" id="spnResultBox"></div>
    <div class="spn-result-actions">
      <button type="button" id="copyResultSummaryBtn">Скопировать итог</button>
      <button type="button" id="saveResultJournalBtn">Сохранить тест</button>
      <button type="button" id="resetResultSummaryBtn">Очистить поля</button>
    </div>
    <div class="spn-journal">
      <div class="spn-journal-head">
        <b>Журнал тестов</b>
        <div>
          <button type="button" id="copyJournalBtn">Скопировать журнал</button>
          <button type="button" id="clearJournalBtn">Очистить журнал</button>
        </div>
      </div>
      <div class="spn-journal-list" id="spnJournalList"></div>
    </div>
    <p class="hint-text">Заполните после тестовой расклейки. Важно считать не только количество звонков, но и качество обращений.</p>
  </section>`;
}

function bindEstimatorEvents(){
  ['resultSheets','resultLeads','resultHot','resultWarm'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', updateEstimator);
    el.addEventListener('change', updateEstimator);
  });
  document.getElementById('copyResultSummaryBtn')?.addEventListener('click', copyResultSummary);
  document.getElementById('saveResultJournalBtn')?.addEventListener('click', saveCurrentResult);
  document.getElementById('resetResultSummaryBtn')?.addEventListener('click', resetResultSummary);
  document.getElementById('copyJournalBtn')?.addEventListener('click', copyJournal);
  document.getElementById('clearJournalBtn')?.addEventListener('click', clearJournal);
}

function updateEstimator(){
  const data = readResultData();
  const result = calculateResult(data);
  const box = document.getElementById('spnResultBox');
  const score = document.getElementById('spnResultScore');
  if(!box || !score) return;

  score.textContent = result.scoreLabel;
  score.className = result.scoreClass;
  box.innerHTML = `<div class="spn-result-main">
      <b>${escapeHtml(result.title)}</b>
      <span>${escapeHtml(result.summary)}</span>
    </div>
    <div class="spn-result-metrics">
      <span><b>${result.ads}</b> объявлений примерно</span>
      <span><b>${result.conversion}%</b> отклик</span>
      <span><b>${result.quality}%</b> качество</span>
    </div>
    <div class="spn-result-next">${escapeHtml(result.next)}</div>`;
}

function calculateResult(data){
  const printCount = getPrintCount();
  const ads = data.sheets * printCount;
  const conversion = ads ? round((data.leads / ads) * 100) : 0;
  const quality = data.leads ? round(((data.hot + data.warm) / data.leads) * 100) : 0;

  if(!data.sheets && !data.leads){
    return {
      ads: 0,
      conversion: 0,
      quality: 0,
      scoreLabel: '—',
      scoreClass: 'score-mid',
      title: 'Заполните после теста',
      summary: 'После расклейки внесите листы, отклики, горячие и тёплые обращения.',
      next: 'Первый тест лучше оценивать через 2–3 дня или после 3–5 обращений.'
    };
  }

  if(data.leads === 0){
    return {
      ads,
      conversion,
      quality,
      scoreLabel: 'слабый',
      scoreClass: 'score-bad',
      title: 'Откликов нет',
      summary: 'Пока макет или место расклейки не дали реакции.',
      next: 'Сначала поменяйте заголовок или место расклейки. Не меняйте сразу все элементы.'
    };
  }

  if(quality >= 60 && data.hot > 0){
    return {
      ads,
      conversion,
      quality,
      scoreLabel: 'сильный',
      scoreClass: 'score-good',
      title: 'Макет можно масштабировать',
      summary: 'Есть качественные обращения. Стоит повторить в похожих местах и сохранить формулировку.',
      next: 'Увеличьте объём расклейки и отдельно проверьте второй заголовок для A/B-теста.'
    };
  }

  if(conversion > 0 && quality < 50){
    return {
      ads,
      conversion,
      quality,
      scoreLabel: 'шум',
      scoreClass: 'score-mid',
      title: 'Звонки есть, качество слабое',
      summary: 'Макет цепляет, но приводит не тех людей или неясные обращения.',
      next: 'Уточните контекст: район, тип объекта, собственник/покупатель, цена или задача.'
    };
  }

  return {
    ads,
    conversion,
    quality,
    scoreLabel: 'нормально',
    scoreClass: 'score-mid',
    title: 'Есть первые данные',
    summary: 'Результат можно улучшать через один элемент: заголовок, место расклейки или призыв.',
    next: 'Проведите второй тест с другим заголовком и сравните качество откликов.'
  };
}

function saveCurrentResult(){
  const data = readResultData();
  const result = calculateResult(data);
  if(!data.sheets && !data.leads){
    setStatus('Сначала заполните результат теста.');
    return;
  }
  const journal = loadJournal();
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleDateString('ru-RU'),
    source: getSourceText(),
    headline: value('headline'),
    printCount: getPrintCount(),
    sheets: data.sheets,
    leads: data.leads,
    hot: data.hot,
    warm: data.warm,
    ads: result.ads,
    conversion: result.conversion,
    quality: result.quality,
    conclusion: result.title,
    next: result.next
  };
  journal.unshift(entry);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal.slice(0, 30)));
  renderJournal();
  setStatus('Тест сохранён в журнал.');
}

function renderJournal(){
  const list = document.getElementById('spnJournalList');
  if(!list) return;
  const journal = loadJournal();
  if(!journal.length){
    list.innerHTML = '<div class="spn-journal-empty">Пока нет сохранённых тестов. Сохраните первый результат после расклейки.</div>';
    return;
  }
  list.innerHTML = journal.slice(0, 5).map(item => `<div class="spn-journal-item">
    <b>${escapeHtml(item.date)} — ${escapeHtml(item.source)}</b>
    <span>${escapeHtml(item.conclusion)}. Листов: ${item.sheets}, откликов: ${item.leads}, горячих: ${item.hot}, тёплых: ${item.warm}.</span>
    <small>Отклик: ${item.conversion}% · качество: ${item.quality}% · ${escapeHtml(item.next)}</small>
  </div>`).join('');
}

function copyJournal(){
  const journal = loadJournal();
  if(!journal.length){
    setStatus('Журнал тестов пока пуст.');
    return;
  }
  const text = `Журнал тестов расклейки\n\n${journal.map(item => `${item.date}\nИсточник: ${item.source}\nЗаголовок: ${item.headline || 'не указан'}\nФормат: ${item.printCount} на А4\nЛистов: ${item.sheets}\nОткликов: ${item.leads}\nГорячих: ${item.hot}\nТёплых: ${item.warm}\nОтклик: ${item.conversion}%\nКачество: ${item.quality}%\nВывод: ${item.conclusion}\nСледующий шаг: ${item.next}`).join('\n\n---\n\n')}`;
  navigator.clipboard?.writeText(text).then(() => setStatus('Журнал тестов скопирован.')).catch(() => setStatus('Не удалось скопировать журнал.'));
}

function clearJournal(){
  if(!confirm('Очистить журнал тестов в этом браузере?')) return;
  localStorage.removeItem(JOURNAL_KEY);
  renderJournal();
  setStatus('Журнал тестов очищен.');
}

function loadJournal(){
  try{
    const data = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch(e){
    return [];
  }
}

function copyResultSummary(){
  const data = readResultData();
  const result = calculateResult(data);
  const source = getSourceText();
  const text = `Итог теста расклейки\n\nИсточник: ${source}\nЛистов: ${data.sheets}\nПримерно объявлений: ${result.ads}\nОткликов: ${data.leads}\nГорячих: ${data.hot}\nТёплых: ${data.warm}\nОтклик: ${result.conversion}%\nКачество: ${result.quality}%\nВывод: ${result.title}\nСледующий шаг: ${result.next}`;
  navigator.clipboard?.writeText(text).then(() => setStatus('Итог теста скопирован.')).catch(() => setStatus('Не удалось скопировать итог.'));
}

function resetResultSummary(){
  ['resultSheets','resultLeads','resultHot','resultWarm'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  updateEstimator();
}

function readResultData(){
  return {
    sheets: numberValue('resultSheets'),
    leads: numberValue('resultLeads'),
    hot: numberValue('resultHot'),
    warm: numberValue('resultWarm')
  };
}
function getSourceText(){
  return [value('area'), value('propertyType'), value('price')].filter(Boolean).join(' / ') || 'текущий макет';
}
function getPrintCount(){
  const active = document.querySelector('[data-count].active');
  if(active) return Number(active.dataset.count) || 2;
  return 2;
}
function numberValue(id){
  return Math.max(0, Number(document.getElementById(id)?.value || 0));
}
function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function round(value){
  return Math.round(value * 10) / 10;
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
