const TEMPLATE_MENU_KEY = 'etagi-raskleyka-template-menu-mode-v1';

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
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

function injectStyles(){
  if(document.getElementById('templateMenuCompactStyles')) return;
  const style = document.createElement('style');
  style.id = 'templateMenuCompactStyles';
  style.textContent = `.template-menu-controls{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:6px;margin:8px 0 7px;padding:8px;border:1px solid #e2e8f0;border-radius:13px;background:#f8fafc}.template-menu-controls b{display:block;font-size:11px;font-weight:900;color:#111827}.template-menu-controls span{display:block;margin-top:2px;font-size:10px;line-height:1.2;color:#64748b;font-weight:700}.template-menu-controls button{padding:7px 8px;border-radius:10px;border:1px solid #dbe3ee;background:#fff;color:#334155;font-size:10px;font-weight:900;box-shadow:none}.template-menu-controls button:hover{transform:none;box-shadow:none;background:#f1f5f9}.template-menu-controls button.active{background:#111827;border-color:#111827;color:#fff}body[data-template-menu-mode="compact"] .template-list{gap:5px;max-height:330px;padding-right:2px}body[data-template-menu-mode="compact"] .tpl-card{position:relative;display:block;min-height:auto;padding:8px 34px 8px 9px;border-radius:12px;background:#fff}body[data-template-menu-mode="compact"] .tpl-card:hover{transform:none;box-shadow:0 4px 12px rgba(15,23,42,.07)}body[data-template-menu-mode="compact"] .tpl-mini{display:none!important}body[data-template-menu-mode="compact"] .tpl-card b{font-size:12.5px;line-height:1.12;margin:0 0 2px;padding-right:0}body[data-template-menu-mode="compact"] .tpl-card p{font-size:10.8px;line-height:1.18;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}body[data-template-menu-mode="compact"] .badges{margin-top:4px;gap:3px;max-height:18px;overflow:hidden}body[data-template-menu-mode="compact"] .badge{font-size:9px;padding:2px 5px}body[data-template-menu-mode="compact"] .favorite-template-btn{position:absolute;top:6px;right:6px;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;border-radius:50%;font-size:13px}body[data-template-menu-mode="compact"] .tpl-card.active{box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 18%,transparent)}@media(max-width:520px){.template-menu-controls{grid-template-columns:1fr 1fr}.template-menu-controls div{grid-column:1/-1}}@media print{.template-menu-controls{display:none!important}}`;
  style.textContent += `@media(max-width:520px){.template-menu-controls span,.template-menu-controls button{font-size:11.5px}.template-menu-controls span{line-height:1.3}body[data-template-menu-mode="compact"] .tpl-card p{font-size:11.5px;line-height:1.25}body[data-template-menu-mode="compact"] .badges{max-height:22px}body[data-template-menu-mode="compact"] .badge{font-size:10.5px;padding:3px 6px}}`;
  document.head.appendChild(style);
}
