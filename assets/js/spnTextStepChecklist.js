const STYLE_ID = 'spnTextStepChecklistStyle';

const checks = [
  { id: 'agentName', title: 'Имя СПН', hint: 'Кто указан в объявлении' },
  { id: 'agentPhone', title: 'Телефон', hint: 'Куда должен прийти отклик' },
  { id: 'area', title: 'Район / адрес / ЖК', hint: 'Где актуально объявление' },
  { id: 'propertyType', title: 'Тип объекта', hint: 'Квартира, дом, участок', visibility: 'showMeta' },
  { id: 'price', title: 'Цена / бюджет', hint: 'Если цена показана в макете', visibility: 'showPrice' },
  { id: 'params', title: 'Параметры', hint: 'Комнаты, площадь, этаж', visibility: 'showMeta' },
  { id: 'headline', title: 'Заголовок', hint: 'Главный смысл за 1 секунду', visibility: 'showHeadline' },
  { id: 'description', title: 'Описание', hint: 'Коротко и по делу', visibility: 'showDescription' },
  { id: 'benefits', title: 'Преимущества', hint: '2–3 причины откликнуться', visibility: 'showBenefits' },
  { id: 'customBlockText', title: 'Доп. блок', hint: 'Условия или важная деталь', visibility: 'showCustomBlock' }
];

const visibilityControls = ['showHeadline','showPrice','showDescription','showMeta','showBenefits','showCustomBlock'];

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  renderPanel();
  bindPanel();
  updatePanel();
});

function renderPanel(){
  const anchor = document.getElementById('agentName')?.closest('.card')?.querySelector('.step-title');
  if(!anchor || document.getElementById('spnTextStepChecklist')) return;
  anchor.insertAdjacentHTML('afterend', `<div class="spn-text-step-checklist" id="spnTextStepChecklist">
    <div class="spn-text-step-head">
      <div>
        <b>Что заполнить в этом шаблоне</b>
        <span id="spnTextStepProgress">—</span>
      </div>
      <div class="spn-text-step-actions">
        <button type="button" id="spnTextStepNextBtn">К незаполненному</button>
        <button type="button" data-adaptation-more>Показать дополнительные поля</button>
      </div>
    </div>
    <p class="spn-text-step-note" data-adaptation-note>Показываем только поля, которые используются в выбранном макете.</p>
    <div class="spn-text-step-items" id="spnTextStepItems"></div>
  </div>`);
}

function bindPanel(){
  document.getElementById('spnTextStepChecklist')?.addEventListener('click', event => {
    const item = event.target.closest('[data-text-step-field]');
    const next = event.target.closest('#spnTextStepNextBtn');
    const more = event.target.closest('[data-adaptation-more]');
    if(item) focusField(item.dataset.textStepField);
    if(next) focusFirstMissing();
    if(more) toggleExtraFields();
  });

  checks.forEach(item => {
    const field = document.getElementById(item.id);
    if(!field) return;
    field.addEventListener('input', updatePanel);
    field.addEventListener('change', updatePanel);
  });

  visibilityControls.forEach(id => {
    document.getElementById(id)?.addEventListener('change', updatePanel);
  });

  document.addEventListener('spn:form-synced', updatePanel);
  document.addEventListener('spn:ui-mode-change', updatePanel);
  document.addEventListener('spn:reveal-form-field', event => {
    const item = checks.find(check => check.id === event.detail?.id);
    if(item && !isRelevant(item)){
      document.body.dataset.spnAdaptationExpanded = 'true';
      updateMoreButton();
    }
  });
  document.addEventListener('spn:focus-first-adaptation-field', () => {
    const missing = getItems().find(item => !item.ok);
    focusField(missing?.id || getItems()[0]?.id || 'agentName');
  });
}

function updatePanel(){
  const box = document.getElementById('spnTextStepItems');
  const progress = document.getElementById('spnTextStepProgress');
  const next = document.getElementById('spnTextStepNextBtn');
  if(!box || !progress) return;

  syncFieldVisibility();

  const items = getItems();
  const done = items.filter(item => item.ok).length;
  const missing = items.find(item => !item.ok);
  progress.textContent = items.length ? `${done}/${items.length} готовы` : 'Готово';
  if(next){
    next.disabled = !missing;
    next.textContent = missing ? 'К незаполненному' : 'Всё заполнено';
  }

  box.innerHTML = items.map(item => `<button type="button" class="${item.ok ? 'done' : 'todo'}" data-text-step-field="${item.id}">
    <span>${item.ok ? '✓' : '•'} ${item.title}</span>
    <small>${item.ok ? 'готово' : item.hint}</small>
  </button>`).join('');

  updateMoreButton();
}

function getItems(){
  return checks
    .filter(isRelevant)
    .map(item => {
      const value = getValue(item.id);
      const min = item.id === 'description' ? 18 : item.id === 'headline' ? 6 : 1;
      return { ...item, ok: value.length >= min };
    });
}

function isRelevant(item){
  if(!item.visibility) return true;
  const control = document.getElementById(item.visibility);
  return !control || control.checked;
}

function syncFieldVisibility(){
  checks.forEach(item => {
    const field = document.getElementById(item.id);
    if(!field) return;
    const label = field.closest('label');
    if(!label) return;
    label.classList.toggle('spn-adaptation-extra-field', !isRelevant(item));
  });

  const metaVisible = isVisibilityEnabled('showMeta');
  document.getElementById('propertyPresets')?.classList.toggle('spn-adaptation-extra-field', !metaVisible);

  const customVisible = isVisibilityEnabled('showCustomBlock');
  document.querySelector('.custom-block-fields')?.classList.toggle('spn-adaptation-extra-field', !customVisible);

  document.querySelectorAll('.field-grid.two').forEach(group => {
    const visibleLabels = [...group.children].filter(child => child.matches?.('label') && !child.classList.contains('spn-adaptation-extra-field'));
    group.classList.toggle('spn-adaptation-single-field', visibleLabels.length === 1);
  });
}

function isVisibilityEnabled(id){
  const control = document.getElementById(id);
  return !control || control.checked;
}

function toggleExtraFields(){
  const expanded = document.body.dataset.spnAdaptationExpanded === 'true';
  document.body.dataset.spnAdaptationExpanded = expanded ? 'false' : 'true';
  updateMoreButton();
}

function updateMoreButton(){
  const button = document.querySelector('[data-adaptation-more]');
  const note = document.querySelector('[data-adaptation-note]');
  if(!button) return;

  const extraCount = checks.filter(item => !isRelevant(item)).length;
  const expanded = document.body.dataset.spnAdaptationExpanded === 'true';
  const mode = document.body.dataset.spnUiMode || 'quick';
  const simpleMode = mode === 'quick' || mode === 'newbie';

  button.hidden = !simpleMode || extraCount === 0;
  button.textContent = expanded ? 'Скрыть дополнительные поля' : `Показать дополнительные поля${extraCount ? ` · ${extraCount}` : ''}`;

  if(note){
    note.textContent = simpleMode
      ? expanded
        ? 'Показаны и основные, и дополнительные поля. Данные не теряются при скрытии.'
        : 'Показываем только поля, которые используются в выбранном макете.'
      : 'Расширенный режим показывает все поля выбранного макета и дополнительные настройки.';
  }
}

function focusFirstMissing(){
  const missing = getItems().find(item => !item.ok);
  if(missing) focusField(missing.id);
}

function focusField(id){
  const field = document.getElementById(id);
  if(!field) return;
  field.focus();
  field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getValue(id){
  return String(document.getElementById(id)?.value || '').trim();
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-text-step-checklist{margin:0 0 11px;padding:10px;border:1px solid #bbf7d0;border-radius:15px;background:#f0fdf4}
    .spn-text-step-head{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;margin-bottom:6px}
    .spn-text-step-head b{display:block;font-size:12px;font-weight:900;color:#111827}
    .spn-text-step-head span{display:block;margin-top:3px;font-size:11px;line-height:1.2;color:#166534;font-weight:800}
    .spn-text-step-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
    .spn-text-step-actions button{padding:7px 9px;border:1px solid #86efac;border-radius:10px;background:#fff;color:#166534;font-size:11px;font-weight:900;box-shadow:none}
    .spn-text-step-actions button:disabled{opacity:.58;cursor:default}
    .spn-text-step-note{margin:0 0 8px;color:#475569;font-size:10.5px;line-height:1.3;font-weight:700}
    .spn-text-step-items{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .spn-text-step-items button{padding:8px;text-align:left;border:1px solid #dcfce7;border-radius:12px;background:#fff;color:#334155;box-shadow:none}
    .spn-text-step-items button:hover{transform:none;box-shadow:0 7px 16px rgba(15,23,42,.08)}
    .spn-text-step-items button.done{border-color:#86efac;background:#ecfdf5;color:#047857}
    .spn-text-step-items button.todo{border-color:#fed7aa;background:#fff7ed;color:#c2410c}
    .spn-text-step-items span{display:block;font-size:11px;line-height:1.1;font-weight:900}
    .spn-text-step-items small{display:block;margin-top:4px;font-size:10px;line-height:1.15;font-weight:700;opacity:.75}

    body[data-spn-ui-mode="quick"]:not([data-spn-adaptation-expanded="true"]) .spn-adaptation-extra-field,
    body[data-spn-ui-mode="newbie"]:not([data-spn-adaptation-expanded="true"]) .spn-adaptation-extra-field{display:none!important}
    body[data-spn-ui-mode="quick"]:not([data-spn-adaptation-expanded="true"]) .field-grid.two.spn-adaptation-single-field,
    body[data-spn-ui-mode="newbie"]:not([data-spn-adaptation-expanded="true"]) .field-grid.two.spn-adaptation-single-field{grid-template-columns:1fr}
    body[data-spn-ui-mode="advanced"] [data-adaptation-more]{display:none!important}

    @media(max-width:520px){
      .spn-text-step-head,.spn-text-step-items{grid-template-columns:1fr}
      .spn-text-step-actions{justify-content:flex-start}
    }
    @media print{.spn-text-step-checklist{display:none!important}}
  `;
  document.head.appendChild(style);
}
