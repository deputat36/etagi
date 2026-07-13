const WIZARD_STEP_KEY = 'etagi-raskleyka-wizard-step-v2';
const WIZARD_ENABLED_KEY = 'etagi-raskleyka-wizard-enabled-v2';
const LEGACY_WIZARD_STEP_KEY = 'etagi-raskleyka-wizard-step-v1';
const LEGACY_WIZARD_ENABLED_KEY = 'etagi-raskleyka-wizard-enabled-v1';

const steps = [
  {
    id: 'goal',
    title: '1. Цель',
    hint: 'Что делаем и сколько на А4',
    help: 'Выберите задачу расклейки и формат листа. Для офиса чаще всего подходит 2 на А4, для подъездов — 4 на А4, для объекта с фото — 1 на А4.',
    sections: ['goal', 'situation']
  },
  {
    id: 'template',
    title: '2. Заготовка',
    hint: 'Категория и макет',
    help: 'Начните с карточек категорий. Новичку лучше брать «Рекомендовано» или «Новичку». Шаблоны с пометкой «Проверка» покажите менеджеру до массовой печати.',
    sections: ['category', 'template']
  },
  {
    id: 'content',
    title: '3. Текст',
    hint: 'Контакты и смысл',
    help: 'Проверьте имя, телефон, район, тип объекта, заголовок и основной текст. Текст должен быть коротким: человек должен понять смысл за 2–3 секунды.',
    sections: ['content']
  },
  {
    id: 'media',
    title: '4. Фото / QR',
    hint: 'Изображения и ссылка',
    help: 'Фото и QR нужны не всегда. Для подъездной расклейки важнее крупный телефон. Для объекта, витрины или ЖК проверьте качество изображения и читаемость QR.',
    sections: ['media']
  },
  {
    id: 'check',
    title: '5. Проверка',
    hint: 'Качество и печать',
    help: 'Нажмите «Проверить», посмотрите ошибки качества, безопасные поля, линии реза и отрывные телефоны. Если выбран менеджерский шаблон — сначала согласуйте макет.',
    sections: ['print', 'quality']
  },
  {
    id: 'save',
    title: '6. Сохранить',
    hint: 'Сохранить макет',
    help: 'Сохраните удачный макет с понятным названием: район, цель, формат А4. Это поможет быстро повторить рабочую связку позже.',
    sections: ['save']
  },
  {
    id: 'task',
    title: '7. Задание',
    hint: 'Кому, где и сколько клеить',
    help: 'Сформируйте задание: место, количество листов, ответственный и срок. Скопируйте текст задания тому, кто будет расклеивать.',
    sections: ['task']
  },
  {
    id: 'report',
    title: '8. Отчёт',
    hint: 'Результат после расклейки',
    help: 'После расклейки внесите листы, звонки, целевые обращения и заметки. Сохраните отчёт в историю, чтобы аналитика показала рабочие и слабые связки.',
    sections: ['report']
  }
];

const printCounts = [
  { count: 1, title: '1 крупно', note: 'фото / витрина' },
  { count: 2, title: '2 на А4', note: 'чаще всего' },
  { count: 4, title: '4 экономно', note: 'подъезды' },
  { count: 6, title: '6 мелко', note: 'очень кратко' },
  { count: 8, title: '8 мини', note: 'только телефон' }
];

window.addEventListener('DOMContentLoaded', () => {
  window.setTimeout(initWizardFlow, 0);
});

function initWizardFlow(){
  const sidebar = document.querySelector('.sidebar');
  const header = document.querySelector('.app-header');
  if(!sidebar || !header || document.getElementById('spnWizardFlow')) return;

  clearLegacyWizardState();
  markSections();
  injectStyles();
  header.insertAdjacentHTML('afterend', renderWizardPanel());
  bindWizardPanel();

  const savedEnabled = localStorage.getItem(WIZARD_ENABLED_KEY);
  const enabled = savedEnabled === 'on';
  const savedStep = localStorage.getItem(WIZARD_STEP_KEY) || 'goal';
  setWizardEnabled(enabled);
  setStep(steps.some(step => step.id === savedStep) ? savedStep : 'goal');
  syncPrintCountButtons();
}

function clearLegacyWizardState(){
  localStorage.removeItem(LEGACY_WIZARD_ENABLED_KEY);
  localStorage.removeItem(LEGACY_WIZARD_STEP_KEY);
}

function markSections(){
  const sectionMap = {
    goal: document.querySelector('.start-card'),
    situation: document.getElementById('spnWizard'),
    category: document.getElementById('spnOfficeTemplateFilters'),
    template: document.getElementById('templateList')?.closest('.card'),
    content: document.getElementById('agentName')?.closest('.card'),
    media: document.querySelector('.media-card'),
    print: document.querySelector('.print-card'),
    quality: document.querySelector('.quality-card'),
    save: document.querySelector('.save-card'),
    task: document.getElementById('spnDistributionTask'),
    report: document.getElementById('spnDistributionReport')
  };

  Object.entries(sectionMap).forEach(([name, el]) => {
    if(el) el.dataset.wizardSection = name;
  });
}

function renderWizardPanel(){
  return `<section class="spn-wizard-flow" id="spnWizardFlow" aria-label="Мастер создания расклейки">
    <div class="spn-wizard-flow-head">
      <div>
        <b>Мастер расклейки</b>
        <span id="spnWizardFlowHint">Панель шагов не скрывает блоки, пока не включён режим «Пошагово».</span>
      </div>
      <button type="button" id="spnWizardToggle">Все блоки</button>
    </div>
    <div class="spn-wizard-print-help">
      Выберите формат сразу: 2 на А4 — основной офисный вариант, 4 — для подъездов, 1 — для объекта с фото.
    </div>
    <div class="spn-wizard-print-count" aria-label="Количество объявлений на А4">
      ${printCounts.map(item => `<button type="button" data-wizard-print-count="${item.count}"><b>${item.title}</b>${item.note ? `<span>${item.note}</span>` : ''}</button>`).join('')}
    </div>
    <div class="spn-wizard-steps">
      ${steps.map(step => `<button type="button" data-wizard-step="${step.id}"><b>${step.title}</b><span>${step.hint}</span></button>`).join('')}
    </div>
    <div class="spn-wizard-step-help" id="spnWizardStepHelp" aria-live="polite"></div>
    <div class="spn-wizard-next-notice" id="spnWizardNextNotice" aria-live="polite" hidden></div>
    <div class="spn-wizard-nav">
      <button type="button" id="spnWizardPrev">Назад</button>
      <button type="button" id="spnWizardNext">Далее</button>
    </div>
  </section>`;
}

function bindWizardPanel(){
  document.getElementById('spnWizardFlow')?.addEventListener('click', event => {
    const stepButton = event.target.closest('[data-wizard-step]');
    if(stepButton){
      clearNextNotice();
      setStep(stepButton.dataset.wizardStep);
      return;
    }

    const printButton = event.target.closest('[data-wizard-print-count]');
    if(printButton){
      applyPrintCount(printButton.dataset.wizardPrintCount);
    }
  });

  document.getElementById('spnWizardPrev')?.addEventListener('click', () => {
    clearNextNotice();
    moveStep(-1);
  });
  document.getElementById('spnWizardNext')?.addEventListener('click', () => moveStep(1, {showRecommendation:true}));
  document.getElementById('spnWizardToggle')?.addEventListener('click', () => {
    setWizardEnabled(document.body.dataset.wizardFlow !== 'on');
  });

  const row = document.getElementById('printPresetRow');
  row?.addEventListener('click', () => window.setTimeout(syncPrintCountButtons, 80));
}

function moveStep(direction, options = {}){
  const current = document.body.dataset.wizardStep || 'goal';
  const index = steps.findIndex(step => step.id === current);
  const nextIndex = Math.max(0, Math.min(steps.length - 1, index + direction));
  if(direction > 0 && options.showRecommendation){
    showNextRecommendation(current);
  }
  setStep(steps[nextIndex].id);
}

function setStep(stepId){
  const active = steps.find(step => step.id === stepId) || steps[0];
  document.body.dataset.wizardStep = active.id;
  localStorage.setItem(WIZARD_STEP_KEY, active.id);

  document.querySelectorAll('[data-wizard-step]').forEach(button => {
    button.classList.toggle('active', button.dataset.wizardStep === active.id);
  });

  document.querySelectorAll('[data-wizard-section]').forEach(section => {
    section.classList.toggle('spn-wizard-section-active', active.sections.includes(section.dataset.wizardSection));
  });

  const index = steps.findIndex(step => step.id === active.id);
  const prev = document.getElementById('spnWizardPrev');
  const next = document.getElementById('spnWizardNext');
  if(prev) prev.disabled = index === 0;
  if(next){
    const nextStep = steps[index + 1];
    next.disabled = !nextStep;
    next.textContent = nextStep ? `Далее: ${stripStepNumber(nextStep.title)}` : 'Готово';
  }

  const hint = document.getElementById('spnWizardFlowHint');
  if(hint) hint.textContent = active.hint;
  updateStepHelp(active);
}

function updateStepHelp(step){
  const box = document.getElementById('spnWizardStepHelp');
  if(!box) return;
  box.innerHTML = `<b>Что сделать сейчас</b><span>${escapeHtml(step.help || step.hint || '')}</span>`;
}

function showNextRecommendation(stepId){
  const notice = document.getElementById('spnWizardNextNotice');
  if(!notice) return;
  const recommendations = getStepRecommendations(stepId);
  if(!recommendations.length){
    clearNextNotice();
    return;
  }
  notice.hidden = false;
  notice.innerHTML = `<b>Переход выполнен. Желательно вернуться и проверить</b><span>${escapeHtml(recommendations.join(' · '))}</span>`;
  setStatus(`Можно продолжить, но желательно: ${recommendations.join('; ')}.`);
}

function clearNextNotice(){
  const notice = document.getElementById('spnWizardNextNotice');
  if(!notice) return;
  notice.hidden = true;
  notice.innerHTML = '';
}

function getStepRecommendations(stepId){
  const recommendations = [];

  if(stepId === 'goal'){
    if(!document.querySelector('[data-wizard-print-count].active')) recommendations.push('выбрать количество объявлений на А4');
  }

  if(stepId === 'template'){
    if(!document.querySelector('.tpl-card.active')) recommendations.push('выбрать конкретный шаблон');
  }

  if(stepId === 'content'){
    if(!fieldValue('agentPhone')) recommendations.push('заполнить телефон');
    if(!fieldValue('headline')) recommendations.push('проверить заголовок');
    if(!fieldValue('description')) recommendations.push('добавить короткий основной текст');
  }

  if(stepId === 'media'){
    if(fieldValue('qrLink') && !fieldValue('qrCaption')) recommendations.push('добавить понятную подпись к QR');
  }

  if(stepId === 'check'){
    const quality = Number(String(document.getElementById('qualityScore')?.textContent || '').replace(/\D/g, '')) || 0;
    if(quality < 70) recommendations.push('запустить проверку качества и получить не меньше 70 баллов');
    if(!document.getElementById('showCutLines')?.checked) recommendations.push('включить линии реза');
    if(!document.getElementById('safePrintMargins')?.checked) recommendations.push('включить безопасные поля');
  }

  if(stepId === 'task'){
    if(!fieldValue('distributionPlace')) recommendations.push('указать место расклейки');
    if((Number(fieldValue('distributionSheets')) || 0) <= 0) recommendations.push('указать количество листов');
  }

  return recommendations;
}

function setWizardEnabled(enabled){
  const next = enabled ? 'on' : 'off';
  document.body.dataset.wizardFlow = next;
  localStorage.setItem(WIZARD_ENABLED_KEY, next);
  const toggle = document.getElementById('spnWizardToggle');
  if(toggle){
    toggle.textContent = enabled ? 'Пошагово' : 'Все блоки';
    toggle.classList.toggle('active', enabled);
  }
}

function applyPrintCount(count){
  const original = document.querySelector(`#printPresetRow [data-count="${count}"]`);
  original?.click();
  syncPrintCountButtons(count);
}

function syncPrintCountButtons(fallbackCount = ''){
  const activeOriginal = document.querySelector('#printPresetRow [data-count].active');
  const activeCount = activeOriginal?.dataset.count || String(fallbackCount || 2);
  document.querySelectorAll('[data-wizard-print-count]').forEach(button => {
    button.classList.toggle('active', button.dataset.wizardPrintCount === activeCount);
  });
}

function fieldValue(id){
  return String(document.getElementById(id)?.value || '').trim();
}

function stripStepNumber(title){
  return String(title || '').replace(/^\d+\.\s*/, '');
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function injectStyles(){
  if(document.getElementById('spnWizardFlowStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnWizardFlowStyles';
  style.textContent = `
    .spn-wizard-flow{margin:0 0 12px;padding:10px;border:1px solid #e2e8f0;border-radius:16px;background:#fff7ed;box-shadow:0 8px 20px rgba(15,23,42,.05)}
    .spn-wizard-flow-head{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-bottom:9px}
    .spn-wizard-flow-head b{display:block;font-size:13px;font-weight:900;color:#111827}
    .spn-wizard-flow-head span{display:block;margin-top:3px;font-size:11px;font-weight:700;color:#64748b;line-height:1.25}
    .spn-wizard-flow button{border:1px solid #dbe3ee;box-shadow:none;transform:none}
    .spn-wizard-flow button:hover{transform:none;box-shadow:none;background:#eef2ff}
    .spn-wizard-flow button.active{background:var(--accent);border-color:var(--accent);color:#fff}
    .spn-wizard-print-help{margin:-2px 0 8px;padding:7px 8px;border:1px dashed #fdba74;border-radius:12px;background:#fff;color:#9a3412;font-size:10.5px;line-height:1.25;font-weight:800}
    .spn-wizard-print-count{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:8px}
    .spn-wizard-print-count button{padding:8px 6px;font-size:11px;background:#fff;text-align:center}
    .spn-wizard-print-count b{display:block;font-size:11px;line-height:1.05}
    .spn-wizard-print-count span{display:block;margin-top:3px;font-size:9px;font-weight:900;opacity:.75}
    .spn-wizard-steps{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .spn-wizard-steps button{text-align:left;background:#fff;padding:8px}
    .spn-wizard-steps b{display:block;font-size:11px;line-height:1.1}
    .spn-wizard-steps span{display:block;margin-top:3px;font-size:10px;line-height:1.15;opacity:.72}
    .spn-wizard-step-help{margin-top:8px;padding:8px 9px;border:1px solid #fed7aa;border-radius:12px;background:#fff;color:#9a3412}
    .spn-wizard-step-help b{display:block;font-size:11px;font-weight:900;line-height:1.15}
    .spn-wizard-step-help span{display:block;margin-top:4px;font-size:10.5px;line-height:1.28;font-weight:800}
    .spn-wizard-next-notice{margin-top:8px;padding:8px 9px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;color:#92400e}
    .spn-wizard-next-notice b{display:block;font-size:10.8px;font-weight:900;line-height:1.2}
    .spn-wizard-next-notice span{display:block;margin-top:4px;font-size:10.3px;line-height:1.25;font-weight:800}
    .spn-wizard-nav{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
    body[data-wizard-flow="on"] .sidebar [data-wizard-section]{display:none!important}
    body[data-wizard-flow="on"] .sidebar [data-wizard-section].spn-wizard-section-active{display:block!important}
    @media(max-width:520px){.spn-wizard-print-count{grid-template-columns:1fr 1fr}.spn-wizard-steps{grid-template-columns:1fr}.spn-wizard-flow-head{grid-template-columns:1fr}.spn-wizard-print-help,.spn-wizard-print-count span,.spn-wizard-steps span,.spn-wizard-step-help span,.spn-wizard-next-notice span{font-size:11.5px;line-height:1.3;opacity:.9}}
    @media print{.spn-wizard-flow{display:none!important}}
  `;
  document.head.appendChild(style);
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
