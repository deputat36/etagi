const TEMPLATE_MENU_KEY = 'etagi-raskleyka-template-menu-mode-v1';

document.addEventListener('DOMContentLoaded', () => {
  const toolbar = document.getElementById('templateSearch')?.closest('.toolbar-row');
  if(toolbar && !document.getElementById('templateMenuCompactToggle')){
    toolbar.insertAdjacentHTML('afterend', renderMenuControls());
    bindMenuControls();
  }
  applyMode(loadMode());
});

function renderMenuControls(){
  return `<div class="template-menu-controls" id="templateMenuCompactToggle">
    <div>
      <b>Список шаблонов</b>
      <span>Компактный режим показывает больше вариантов и убирает бесполезную мини-карточку.</span>
    </div>
    <button type="button" data-template-menu-mode="compact">Компактно</button>
    <button type="button" data-template-menu-mode="visual">С мини-макетом</button>
  </div>`;
}

function bindMenuControls(){
  document.getElementById('templateMenuCompactToggle')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-template-menu-mode]');
    if(!btn) return;
    const mode = btn.dataset.templateMenuMode === 'visual' ? 'visual' : 'compact';
    applyMode(mode);
    try{ localStorage.setItem(TEMPLATE_MENU_KEY, mode); } catch(e){}
    const status = document.getElementById('statusLine');
    if(status) status.textContent = mode === 'compact' ? 'Включён компактный список шаблонов.' : 'Включён список шаблонов с мини-макетом.';
  });
}

function loadMode(){
  try{
    return localStorage.getItem(TEMPLATE_MENU_KEY) || 'compact';
  } catch(e){
    return 'compact';
  }
}

function applyMode(mode){
  const next = mode === 'visual' ? 'visual' : 'compact';
  document.body.dataset.templateMenuMode = next;
  document.querySelectorAll('[data-template-menu-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.templateMenuMode === next);
  });
}
