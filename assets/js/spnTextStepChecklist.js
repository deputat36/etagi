const STYLE_ID = 'spnTextStepChecklistStyle';

const checks = [
  { id: 'agentName', title: 'Имя СПН', hint: 'Кто указан в объявлении' },
  { id: 'agentPhone', title: 'Телефон', hint: 'Куда должен прийти отклик' },
  { id: 'area', title: 'Район / адрес / ЖК', hint: 'Где актуально объявление' },
  { id: 'headline', title: 'Заголовок', hint: 'Главный смысл за 1 секунду' },
  { id: 'description', title: 'Описание', hint: 'Коротко и по делу' },
  { id: 'benefits', title: 'Преимущества', hint: '2–3 причины откликнуться' }
];

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
        <b>Что заменить в тексте</b>
        <span id="spnTextStepProgress">—</span>
      </div>
      <button type="button" id="spnTextStepNextBtn">К следующему</button>
    </div>
    <div class="spn-text-step-items" id="spnTextStepItems"></div>
  </div>`);
}

function bindPanel(){
  document.getElementById('spnTextStepChecklist')?.addEventListener('click', event => {
    const item = event.target.closest('[data-text-step-field]');
    const next = event.target.closest('#spnTextStepNextBtn');
    if(item) focusField(item.dataset.textStepField);
    if(next) focusFirstMissing();
  });

  checks.forEach(item => {
    const field = document.getElementById(item.id);
    if(!field) return;
    field.addEventListener('input', updatePanel);
    field.addEventListener('change', updatePanel);
  });
}

function updatePanel(){
  const box = document.getElementById('spnTextStepItems');
  const progress = document.getElementById('spnTextStepProgress');
  if(!box || !progress) return;

  const items = getItems();
  const done = items.filter(item => item.ok).length;
  progress.textContent = `${done}/${items.length} заполнено`;
  box.innerHTML = items.map(item => `<button type="button" class="${item.ok ? 'done' : 'todo'}" data-text-step-field="${item.id}">
    <span>${item.ok ? '✓' : '•'} ${item.title}</span>
    <small>${item.ok ? 'заполнено' : item.hint}</small>
  </button>`).join('');
}

function getItems(){
  return checks.map(item => {
    const value = getValue(item.id);
    const min = item.id === 'description' ? 18 : item.id === 'headline' ? 6 : 1;
    return { ...item, ok: value.length >= min };
  });
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
    .spn-text-step-head{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-bottom:8px}
    .spn-text-step-head b{display:block;font-size:12px;font-weight:900;color:#111827}
    .spn-text-step-head span{display:block;margin-top:3px;font-size:11px;line-height:1.2;color:#166534;font-weight:800}
    .spn-text-step-head button{padding:7px 9px;border:1px solid #86efac;border-radius:10px;background:#fff;color:#166534;font-size:11px;font-weight:900;box-shadow:none}
    .spn-text-step-items{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .spn-text-step-items button{padding:8px;text-align:left;border:1px solid #dcfce7;border-radius:12px;background:#fff;color:#334155;box-shadow:none}
    .spn-text-step-items button:hover{transform:none;box-shadow:0 7px 16px rgba(15,23,42,.08)}
    .spn-text-step-items button.done{border-color:#86efac;background:#ecfdf5;color:#047857}
    .spn-text-step-items button.todo{border-color:#fed7aa;background:#fff7ed;color:#c2410c}
    .spn-text-step-items span{display:block;font-size:11px;line-height:1.1;font-weight:900}
    .spn-text-step-items small{display:block;margin-top:4px;font-size:10px;line-height:1.15;font-weight:700;opacity:.75}
    @media(max-width:520px){.spn-text-step-head,.spn-text-step-items{grid-template-columns:1fr}}
    @media print{.spn-text-step-checklist{display:none!important}}
  `;
  document.head.appendChild(style);
}
