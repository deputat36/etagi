const STYLE_ID = 'spnNewbieWizardPatchStyle';

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
});

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
