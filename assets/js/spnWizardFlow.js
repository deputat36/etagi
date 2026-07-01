const WIZARD_STEP_KEY = 'etagi-raskleyka-wizard-step-v1';
const WIZARD_ENABLED_KEY = 'etagi-raskleyka-wizard-enabled-v1';

const steps = [
  { id: 'goal', title: '1. Цель', hint: 'Что делаем и сколько на А4', sections: ['goal'] },
  { id: 'template', title: '2. Заготовка', hint: 'Категория и макет', sections: ['template'] },
  { id: 'content', title: '3. Текст', hint: 'Контакты и смысл', sections: ['content'] },
  { id: 'media', title: '4. Фото / QR', hint: 'Изображения и ссылка', sections: ['media'] },
  { id: 'check', title: '5. Проверка', hint: 'Качество и печать', sections: ['print', 'quality'] },
  { id: 'save', title: '6. После', hint: 'Сохранить макет', sections: ['save'] }
];

const printCounts = [
  { count: 1, title: '1 крупно' },
  { count: 2, title: '2 на А4', note: 'чаще всего' },
  { count: 4, title: '4 экономно' },
  { count: 6, title: '6 мелко' },
  { count: 8, title: '8 мини' }
];

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initWizardFlow, 0);
});

function initWizardFlow(){
  const sidebar = document.querySelector('.sidebar');
  const header = document.querySelector('.app-header');
  if(!sidebar || !header || document.getElementById('spnWizardFlow')) return;

  markSections();
  injectStyles();
  header.insertAdjacentHTML('afterend', renderWizardPanel());
  bindWizardPanel();

  const savedEnabled = localStorage.getItem(WIZARD_ENABLED_KEY);
  const enabled = savedEnabled === null ? true : savedEnabled === 'on';
  const savedStep = localStorage.getItem(WIZARD_STEP_KEY) || 'goal';
  setWizardEnabled(enabled);
  setStep(steps.some(step => step.id === savedStep) ? savedStep : 'goal');
  syncPrintCountButtons();
  observePrintPresets();
}

function markSections(){
  const sectionMap = {
    goal: document.querySelector('.start-card'),
    template: document.getElementById('templateList')?.closest('.card'),
    content: document.getElementById('agentName')?.closest('.card'),
    media: document.querySelector('.media-card'),
    print: document.querySelector('.print-card'),
    quality: document.querySelector('.quality-card'),
    save: document.querySelector('.save-card')
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
        <span id="spnWizardFlowHint">Идите по шагам: цель → заготовка → текст → проверка.</span>
      </div>
      <button type="button" id="spnWizardToggle">Пошагово</button>
    </div>
    <div class="spn-wizard-print-count" aria-label="Количество объявлений на А4">
      ${printCounts.map(item => `<button type="button" data-wizard-print-count="${item.count}"><b>${item.title}</b>${item.note ? `<span>${item.note}</span>` : ''}</button>`).join('')}
    </div>
    <div class="spn-wizard-steps">
      ${steps.map(step => `<button type="button" data-wizard-step="${step.id}"><b>${step.title}</b><span>${step.hint}</span></button>`).join('')}
    </div>
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
      setStep(stepButton.dataset.wizardStep);
      return;
    }

    const printButton = event.target.closest('[data-wizard-print-count]');
    if(printButton){
      applyPrintCount(printButton.dataset.wizardPrintCount);
    }
  });

  document.getElementById('spnWizardPrev')?.addEventListener('click', () => moveStep(-1));
  document.getElementById('spnWizardNext')?.addEventListener('click', () => moveStep(1));
  document.getElementById('spnWizardToggle')?.addEventListener('click', () => {
    setWizardEnabled(document.body.dataset.wizardFlow !== 'on');
  });
}

function moveStep(direction){
  const current = document.body.dataset.wizardStep || 'goal';
  const index = steps.findIndex(step => step.id === current);
  const nextIndex = Math.max(0, Math.min(steps.length - 1, index + direction));
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
  if(next) next.disabled = index === steps.length - 1;

  const hint = document.getElementById('spnWizardFlowHint');
  if(hint) hint.textContent = active.hint;
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
  if(original){
    original.click();
  }
  syncPrintCountButtons(count);
}

function syncPrintCountButtons(fallbackCount = ''){
  const activeOriginal = document.querySelector('#printPresetRow [data-count].active');
  const activeCount = activeOriginal?.dataset.count || String(fallbackCount || 2);
  document.querySelectorAll('[data-wizard-print-count]').forEach(button => {
    button.classList.toggle('active', button.dataset.wizardPrintCount === activeCount);
  });
}

function observePrintPresets(){
  const row = document.getElementById('printPresetRow');
  if(!row) return;
  new MutationObserver(() => syncPrintCountButtons()).observe(row, { attributes: true, subtree: true, attributeFilter: ['class'] });
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
    .spn-wizard-print-count{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:8px}
    .spn-wizard-print-count button{padding:8px 6px;font-size:11px;background:#fff;text-align:center}
    .spn-wizard-print-count b{display:block;font-size:11px;line-height:1.05}
    .spn-wizard-print-count span{display:block;margin-top:3px;font-size:9px;font-weight:900;opacity:.75}
    .spn-wizard-steps{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .spn-wizard-steps button{text-align:left;background:#fff;padding:8px}
    .spn-wizard-steps b{display:block;font-size:11px;line-height:1.1}
    .spn-wizard-steps span{display:block;margin-top:3px;font-size:10px;line-height:1.15;opacity:.72}
    .spn-wizard-nav{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
    body[data-spn-ui-mode="quick"][data-wizard-flow="on"] .sidebar [data-wizard-section]{display:none!important}
    body[data-spn-ui-mode="quick"][data-wizard-flow="on"] .sidebar [data-wizard-section].spn-wizard-section-active{display:block!important}
    @media(max-width:520px){.spn-wizard-print-count{grid-template-columns:1fr 1fr}.spn-wizard-steps{grid-template-columns:1fr}.spn-wizard-flow-head{grid-template-columns:1fr}}
    @media print{.spn-wizard-flow{display:none!important}}
  `;
  document.head.appendChild(style);
}
