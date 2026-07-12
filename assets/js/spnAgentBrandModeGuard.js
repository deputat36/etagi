const STYLE_ID = 'spnAgentBrandModeGuardStyles';

window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('layoutModeGrid');
  if(!grid) return;
  injectStyles();
  grid.addEventListener('click', prepareAgentBrandMode, true);
});

function prepareAgentBrandMode(event){
  const button = event.target.closest('[data-layout-mode="agent_brand_photo"]');
  if(!button) return;

  const colorMode = document.getElementById('colorMode');
  const showBrand = document.getElementById('showBrand');
  let changed = false;

  if(colorMode && colorMode.value === 'private'){
    colorMode.value = 'brand';
    changed = true;
  }

  if(showBrand && !showBrand.checked){
    showBrand.checked = true;
    changed = true;
  }

  if(!changed) return;

  const syncTarget = colorMode || showBrand;
  syncTarget?.dispatchEvent(new Event('change', {bubbles:true}));
  setStatus('Режим «Фото СПН»: фирменное оформление восстановлено до применения компоновки.');
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = 'body[data-spn-ui-mode="newbie"] [data-layout-mode="agent_brand_photo"]{position:relative}';
  document.head.appendChild(style);
}
