const STYLE_ID = 'spnLayoutModeAccessibilityStyles';
let syncFrame = 0;

window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('layoutModeGrid');
  if(!grid) return;

  grid.setAttribute('role', 'radiogroup');
  grid.setAttribute('aria-label', 'Выбор компоновки макета');
  injectStyles();
  scheduleSync(grid);

  grid.addEventListener('keydown', event => handleKeydown(event, grid));
  grid.addEventListener('click', () => scheduleSync(grid));

  new MutationObserver(() => scheduleSync(grid)).observe(grid, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'disabled']
  });
});

function handleKeydown(event, grid){
  const buttons = getButtons(grid);
  if(!buttons.length) return;
  const current = event.target.closest('[data-layout-mode]');
  if(!current || !grid.contains(current)) return;

  const index = Math.max(0, buttons.indexOf(current));
  let target = null;

  if(event.key === 'ArrowRight' || event.key === 'ArrowDown') target = buttons[(index + 1) % buttons.length];
  if(event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = buttons[(index - 1 + buttons.length) % buttons.length];
  if(event.key === 'Home') target = buttons[0];
  if(event.key === 'End') target = buttons[buttons.length - 1];
  if(!target) return;

  event.preventDefault();
  target.focus();
  target.click();
  scheduleSync(grid);
}

function scheduleSync(grid){
  window.cancelAnimationFrame(syncFrame);
  syncFrame = window.requestAnimationFrame(() => {
    syncFrame = 0;
    syncButtons(grid);
  });
}

function syncButtons(grid){
  const buttons = getButtons(grid);
  if(!buttons.length) return;
  const active = buttons.find(button => button.classList.contains('active')) || buttons[0];

  buttons.forEach(button => {
    const selected = button === active;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', selected ? 'true' : 'false');
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    button.tabIndex = selected ? 0 : -1;
  });
}

function getButtons(grid){
  return [...grid.querySelectorAll('[data-layout-mode]')].filter(button => !button.disabled && !button.hidden);
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #layoutModeGrid .layout-mode-btn{min-height:58px;padding:10px 11px;text-align:left}
    #layoutModeGrid .layout-mode-btn b{display:block;font-size:12px;line-height:1.15;font-weight:900}
    #layoutModeGrid .layout-mode-btn span{display:block;margin-top:3px;font-size:10.5px;line-height:1.25}
    #layoutModeGrid .layout-mode-btn:focus-visible{outline:3px solid #2563eb;outline-offset:2px;box-shadow:0 0 0 5px rgba(37,99,235,.18)}
    #layoutModeGrid .layout-mode-btn[aria-checked="true"]{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 18%,transparent)}
    @media(max-width:520px){#layoutModeGrid .layout-mode-btn{min-height:64px}}
  `;
  document.head.appendChild(style);
}
