import './spnReportSummary.js';

const REVIEW_KEY = 'etagi-raskleyka-manager-review-v1';

const items = [
  ['contact', 'Контакты заполнены'],
  ['headline', 'Заголовок понятный'],
  ['place', 'Район, дом или ЖК указан'],
  ['text', 'Текст короткий и читаемый'],
  ['format', 'Формат А4 выбран правильно'],
  ['quality', 'Контроль качества пройден']
];

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const card = document.querySelector('.quality-card');
  if(!card || document.getElementById('spnManagerReview')) return;
  card.insertAdjacentHTML('afterend', renderReview());
  bindReview();
  restoreReview();
  updateReviewStatus();
});

function renderReview(){
  return `<section class="card spn-manager-review" id="spnManagerReview">
    <div class="spn-manager-review-head">
      <div>
        <b>Проверка менеджера</b>
        <span>короткий допуск макета перед печатью</span>
      </div>
      <strong id="managerReviewStatus">—</strong>
    </div>
    <div class="spn-manager-review-list">
      ${items.map(([id, label]) => `<label><input type="checkbox" data-manager-review="${id}"> ${label}</label>`).join('')}
    </div>
    <label>Комментарий менеджера<textarea id="managerReviewComment" rows="2" maxlength="240" placeholder="что исправить или почему можно печатать"></textarea></label>
    <div class="spn-manager-review-actions">
      <button type="button" id="copyManagerReviewBtn">Скопировать решение</button>
    </div>
    <p id="managerReviewHint">Для первого макета новичка лучше отметить все пункты до печати.</p>
  </section>`;
}

function bindReview(){
  document.querySelectorAll('[data-manager-review]').forEach(el => {
    el.addEventListener('change', () => {
      saveReview();
      updateReviewStatus();
    });
  });
  document.getElementById('managerReviewComment')?.addEventListener('input', saveReview);
  document.getElementById('copyManagerReviewBtn')?.addEventListener('click', copyReviewText);
}

function restoreReview(){
  const saved = readReview();
  document.querySelectorAll('[data-manager-review]').forEach(el => {
    el.checked = Boolean(saved.checked?.[el.dataset.managerReview]);
  });
  const comment = document.getElementById('managerReviewComment');
  if(comment) comment.value = saved.comment || '';
}

function saveReview(){
  const checked = {};
  document.querySelectorAll('[data-manager-review]').forEach(el => {
    checked[el.dataset.managerReview] = el.checked;
  });
  const payload = {
    checked,
    comment: document.getElementById('managerReviewComment')?.value || '',
    updatedAt: new Date().toISOString()
  };
  try{ localStorage.setItem(REVIEW_KEY, JSON.stringify(payload)); } catch(e){}
}

function readReview(){
  try{
    return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
  } catch(e){
    return {};
  }
}

function updateReviewStatus(){
  const total = items.length;
  const done = [...document.querySelectorAll('[data-manager-review]')].filter(el => el.checked).length;
  const status = document.getElementById('managerReviewStatus');
  const hint = document.getElementById('managerReviewHint');
  if(status) status.textContent = `${done}/${total}`;
  if(hint) hint.textContent = done === total ? 'Макет можно печатать, если нет критичных замечаний качества.' : 'Перед печатью закройте оставшиеся пункты проверки.';
}

async function copyReviewText(){
  const done = [...document.querySelectorAll('[data-manager-review]')].filter(el => el.checked).length;
  const comment = document.getElementById('managerReviewComment')?.value.trim() || 'без комментария';
  const text = [`ПРОВЕРКА МЕНЕДЖЕРА`, `Готовность: ${done}/${items.length}`, `Комментарий: ${comment}`].join('\n');
  try{
    await navigator.clipboard.writeText(text);
    setStatus('Решение менеджера скопировано.');
  } catch(e){
    setStatus('Не удалось скопировать решение менеджера.');
  }
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function injectStyles(){
  if(document.getElementById('spnManagerReviewStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnManagerReviewStyles';
  style.textContent = `.spn-manager-review{border-color:#bbf7d0;background:#f0fdf4}.spn-manager-review-head{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px}.spn-manager-review-head b{display:block;font-size:12px;font-weight:900;color:#14532d}.spn-manager-review-head span{display:block;font-size:10.5px;font-weight:700;color:#15803d}.spn-manager-review-head strong{font-size:14px;color:#14532d}.spn-manager-review-list{display:grid;gap:5px;margin-bottom:8px}.spn-manager-review-list label{font-size:10.5px;font-weight:850;color:#14532d}.spn-manager-review textarea{background:#fff}.spn-manager-review-actions{display:flex;gap:6px;margin-top:7px}.spn-manager-review-actions button{padding:7px 9px;border-radius:10px;border:1px solid #86efac;background:#fff;color:#166534;font-size:10.5px;font-weight:900;box-shadow:none}.spn-manager-review p{margin:7px 0 0;color:#166534;font-size:10.5px;line-height:1.25;font-weight:750}@media print{.spn-manager-review{display:none!important}}`;
  document.head.appendChild(style);
}
