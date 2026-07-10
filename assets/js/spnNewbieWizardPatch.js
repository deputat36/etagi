const STYLE_ID = 'spnNewbieWizardPatchStyle';
let syncTimer = 0;
let redirectingHiddenStep = false;
let lastMode = '';

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
}

function bindWizardNavigationPatch(){
  const flow = document.getElementById('spnWizardFlow');
  if(!flow || flow.dataset.newbieNavigationPatchBound === '1') return;
  flow.dataset.newbieNavigationPatchBound = '1';
  flow.addEventListener('click', handleNewbieWizardNavigation, true);
}

function handleNewbieWizardNavigation(event){
  if(document.body.dataset.spnUiMode !== 'newbie') return;

  const currentStep = document.body.dataset.wizardStep || 'goal';
  const next = event.target.closest('#spnWizardNext');
  const prev = event.target.closest('#spnWizardPrev');

  if(next && currentStep === 'check'){
    event.preventDefault();
    event.stopImmediatePropagation();
    goToWizardStep('task');
    return;
  }

  if(prev && currentStep === 'task'){
    event.preventDefault();
    event.stopImmediatePropagation();
    goToWizardStep('check');
  }
}

function scheduleNewbieWizardSync(){
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(syncNewbieWizardState, 60);
}

function syncNewbieWizardState(){
  bindWizardNavigationPatch();

  const mode = document.body.dataset.spnUiMode || '';
  const isNewbie = mode === 'newbie';
  const enteredNewbie = isNewbie && lastMode !== 'newbie';
  const step = document.body.dataset.wizardStep;

  if(enteredNewbie) enableWizardForNewbie();
  if(isNewbie && step === 'save') redirectHiddenSaveStep();

  lastMode = mode;
}

function enableWizardForNewbie(){
  if(document.body.dataset.wizardFlow === 'on') return;
  const toggle = document.getElementById('spnWizardToggle');
  if(!toggle) return scheduleNewbieWizardSync();
  toggle.click();
}

function redirectHiddenSaveStep(){
  if(redirectingHiddenStep) return;
  redirectingHiddenStep = true;
  window.setTimeout(() => {
    goToWizardStep('task');
    redirectingHiddenStep = false;
    scheduleNewbieWizardSync();
  }, 30);
}

function goToWizardStep(stepId){
  const button = document.querySelector(`[data-wizard-step="${stepId}"]`);
  button?.click();
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
    @media(max-width:520px){body[data-spn-ui-mode="newbie"] #spnWizardFlow .spn-wizard-steps{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}
