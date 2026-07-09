import './spnReportSummary.js';
import { loadTemplates } from './templates.js';

const REVIEW_KEY = 'etagi-raskleyka-manager-review-v1';

const items = [
  ['contact', 'Контакты заполнены'],
  ['headline', 'Заголовок понятный'],
  ['place', 'Район, дом или ЖК указан'],
  ['text', 'Текст короткий и читаемый'],
  ['format', 'Формат А4 выбран правильно'],
  ['quality', 'Контроль качества пройден']
];

let templateMap = new Map();

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const card = document.querySelector('.quality-card');
  if(!card || document.getElementById('spnManagerReview')) return;
  card.insertAdjacentHTML('afterend', renderReview());
  bindReview();
  restoreReview();
  observeActiveTemplate();
  loadOfficeMetadata();
  updateReviewStatus();
});

async function loadOfficeMetadata(){
  try{
    const templates = await loadTemplates();
    templateMap = new Map(templates.map(template => [template.id, template]));
    updateOfficeSummary();
  }
  catch(error){
    updateOfficeSummary();
  }
}

function renderReview(){
  return `<section class="card spn-manager-review" id="spnManagerReview">
    <div class="spn-manager-review-head">
      <div>
        <b>Проверка менеджера</b>
        <span>короткий допуск макета перед печатью</span>
      </div>
      <strong id="managerReviewStatus">—</strong>
    </div>
    <div class="spn-manager-office-summary" id="managerReviewOfficeSummary">Выберите шаблон, чтобы увидеть офисную сводку.</div>
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

function observeActiveTemplate(){
  const list = document.getElementById('templateList');
  if(!list) return;
  new MutationObserver(updateOfficeSummary).observe(list, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
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
  const template = getActiveTemplate();
  const office = template?.office;
  if(status) status.textContent = `${done}/${total}`;
  if(hint){
    if(office?.level === 'manager') hint.textContent = 'Этот шаблон требует проверки менеджера перед массовой печатью.';
    else if(office?.risk === 'medium' || office?.risk === 'high') hint.textContent = 'Есть повышенный риск: проверьте формулировки и условия перед печатью.';
    else hint.textContent = done === total ? 'Макет можно печатать, если нет критичных замечаний качества.' : 'Перед печатью закройте оставшиеся пункты проверки.';
  }
  updateOfficeSummary();
}

function updateOfficeSummary(){
  const summary = document.getElementById('managerReviewOfficeSummary');
  if(!summary) return;
  const template = getActiveTemplate();
  if(!template){
    summary.textContent = 'Выберите шаблон, чтобы увидеть офисную сводку.';
    summary.dataset.risk = 'none';
    return;
  }

  const office = template.office;
  if(!office){
    summary.innerHTML = `<b>${escapeHtml(template.title || 'Шаблон')}</b><span>Office-метаданные пока не заданы. Ориентируйтесь на теги, контроль качества и чек-лист менеджера.</span>`;
    summary.dataset.risk = 'none';
    return;
  }

  summary.dataset.risk = office.risk || 'low';
  summary.innerHTML = [
    `<b>${escapeHtml(template.title || 'Шаблон')}</b>`,
    `<span>Уровень: ${escapeHtml(levelLabel(office.level))} · риск: ${escapeHtml(riskLabel(office.risk))} · формат: ${escapeHtml(String(office.recommendedPrintCount || template.printCount || '—'))} на А4</span>`,
    `<em>${escapeHtml(office.managerNote || 'Проверьте телефон, район и читаемость перед печатью.')}</em>`
  ].join('');
}

async function copyReviewText(){
  const done = [...document.querySelectorAll('[data-manager-review]')].filter(el => el.checked).length;
  const comment = document.getElementById('managerReviewComment')?.value.trim() || 'без комментария';
  const template = getActiveTemplate();
  const office = template?.office;
  const lines = [
    'ПРОВЕРКА МЕНЕДЖЕРА',
    `Готовность: ${done}/${items.length}`,
    template ? `Шаблон: ${template.title || template.id}` : 'Шаблон: не выбран',
    office ? `Уровень: ${levelLabel(office.level)}; риск: ${riskLabel(office.risk)}; формат: ${office.recommendedPrintCount || template.printCount || '—'} на А4` : 'Office-сводка: метаданные не заданы',
    office?.managerNote ? `Проверить: ${office.managerNote}` : '',
    `Комментарий: ${comment}`
  ].filter(Boolean);
  try{
    await navigator.clipboard.writeText(lines.join('\n'));
    setStatus('Решение менеджера скопировано.');
  } catch(e){
    setStatus('Не удалось скопировать решение менеджера.');
  }
}

function getActiveTemplate(){
  const id = document.querySelector('.tpl-card.active')?.dataset.template;
  return id ? templateMap.get(id) : null;
}

function levelLabel(level){
  if(level === 'newbie') return 'новичку';
  if(level === 'manager') return 'менеджер';
  if(level === 'experienced') return 'опытному СПН';
  return 'не указан';
}

function riskLabel(risk){
  if(risk === 'low') return 'низкий';
  if(risk === 'medium') return 'средний';
  if(risk === 'high') return 'высокий';
  return 'не указан';
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function injectStyles(){
  if(document.getElementById('spnManagerReviewStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnManagerReviewStyles';
  style.textContent = `.spn-manager-review{border-color:#bbf7d0;background:#f0fdf4}.spn-manager-review-head{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px}.spn-manager-review-head b{display:block;font-size:12px;font-weight:900;color:#14532d}.spn-manager-review-head span{display:block;font-size:10.5px;font-weight:700;color:#15803d}.spn-manager-review-head strong{font-size:14px;color:#14532d}.spn-manager-office-summary{margin:0 0 8px;padding:7px 8px;border:1px solid #bbf7d0;border-radius:12px;background:#fff;color:#14532d;font-size:10.5px;line-height:1.25;font-weight:750}.spn-manager-office-summary b{display:block;font-size:11px;font-weight:900;margin-bottom:3px}.spn-manager-office-summary span,.spn-manager-office-summary em{display:block;font-style:normal}.spn-manager-office-summary em{margin-top:4px;color:#166534}.spn-manager-office-summary[data-risk="medium"]{border-color:#fde68a;background:#fffbeb;color:#92400e}.spn-manager-office-summary[data-risk="high"]{border-color:#fecaca;background:#fef2f2;color:#991b1b}.spn-manager-review-list{display:grid;gap:5px;margin-bottom:8px}.spn-manager-review-list label{font-size:10.5px;font-weight:850;color:#14532d}.spn-manager-review textarea{background:#fff}.spn-manager-review-actions{display:flex;gap:6px;margin-top:7px}.spn-manager-review-actions button{padding:7px 9px;border-radius:10px;border:1px solid #86efac;background:#fff;color:#166534;font-size:10.5px;font-weight:900;box-shadow:none}.spn-manager-review p{margin:7px 0 0;color:#166534;font-size:10.5px;line-height:1.25;font-weight:750}@media print{.spn-manager-review{display:none!important}}`;
  document.head.appendChild(style);
}
