const STYLE_ID = 'spnNewbieWizardPatchStyle';
let syncTimer = 0;
let redirectingFromSave = false;

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  bindNewbieWizardGuards();
  scheduleNewbieWizardSync();
});

function bindNewbieWizardGuards(){
  new MutationObserver(scheduleNewbieWizardSync).observe(document.body, {
    attributes: true,
    attributeFilter: ['data-spn-ui-mode', 'data-wizard-step', 'data-wizard-flow']
  });

  document.addEventListener('click', event => {
    if(!event.target.closest('#spnWizardFlow')) return;
    window.setTimeout(scheduleNewbieWizardSync, 40);
  });
}

function scheduleNewbieWizardSync(){
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(syncNewbieWizardState, 60);
}

function syncNewbieWizardState(){
  const isNewbie = document.body.dataset.spnUiMode === 'newbie';
  const step = document.body.dataset.wizardStep;
  const nextBtn = document.getElementById('spnWizardNext');

  if(nextBtn){
    nextBtn.textContent = isNewbie && step === 'check' ? 'Готово' : 'Далее';
    nextBtn.disabled = Boolean(isNewbie && step === 'check');
  }

  if(isNewbie && step === 'save'){
    redirectToCheckStep();
  }
}

function redirectToCheckStep(){
  if(redirectingFromSave) return;
  const checkStep = document.querySelector('[data-wizard-step="check"]');
  if(!checkStep) return;

  redirectingFromSave = true;
  window.setTimeout(() => {
    checkStep.click();
    redirectingFromSave = false;
    scheduleNewbieWizardSync();
  }, 30);
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    body[data-spn-ui-mode="newbie"][data-wizard-flow="on"] .sidebar [data-wizard-section]{display:none!important}
    body[data-spn-ui-mode="newbie"][data-wizard-flow="on"] .sidebar [data-wizard-section].spn-wizard-section-active{display:block!important}
    body[data-spn-ui-mode="newbie"] #spnWizardFlow{border-color:#bbf7d0;background:linear-gradient(180deg,#fff,#f0fdf4)}
    body[data-spn-ui-mode="newbie"] #spnWizardFlow .spn-wizard-flow-head b::after{content:' для новичка';color:#047857}
    body[data-spn-ui-mode="newbie"] #spnWizardFlow [data-wizard-step="save"]{display:none}
    body[data-spn-ui-mode="newbie"] #spnWizardFlow .spn-wizard-steps{grid-template-columns:1fr 1fr}
    body[data-spn-ui-mode="newbie"][data-wizard-step="check"] #spnWizardNext{background:#ecfdf5;border-color:#86efac;color:#047857;cursor:default}
    @media(max-width:520px){body[data-spn-ui-mode="newbie"] #spnWizardFlow .spn-wizard-steps{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}
