const GROUP_ID = 'spnAdvancedWorkbench';
const GROUP_STATE_KEY = 'etagi-raskleyka-advanced-workbench-open-v1';
const SECTION_IDS = ['spnFieldPlan', 'spnLeadQualification', 'spnResultEstimator'];
const STYLE_ID = 'spnAdvancedWorkbenchStyles';

window.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  if(!sidebar || document.getElementById(GROUP_ID)) return;

  injectStyles();

  const observer = new MutationObserver(() => organizeSections(sidebar, observer));
  observer.observe(sidebar, {childList:true});
  organizeSections(sidebar, observer);
  window.setTimeout(() => observer.disconnect(), 5000);
});

function organizeSections(sidebar, observer){
  if(document.getElementById(GROUP_ID)){
    observer.disconnect();
    return;
  }

  const sections = SECTION_IDS.map(id => document.getElementById(id));
  if(sections.some(section => !section)) return;

  observer.disconnect();

  const details = document.createElement('details');
  details.id = GROUP_ID;
  details.className = 'card spn-advanced-workbench';
  details.open = readOpenState();
  details.innerHTML = `<summary>
    <span><b>Дополнительная аналитика</b><small>План расклейки · квалификация отклика · итог теста</small></span>
    <span class="spn-workbench-count">3 инструмента</span>
  </summary><div class="spn-advanced-workbench-body"></div>`;

  sections[0].insertAdjacentElement('beforebegin', details);
  const body = details.querySelector('.spn-advanced-workbench-body');
  sections.forEach(section => body.append(section));

  details.addEventListener('toggle', () => saveOpenState(details.open));
}

function readOpenState(){
  try{
    return localStorage.getItem(GROUP_STATE_KEY) === '1';
  } catch(error){
    return false;
  }
}

function saveOpenState(open){
  try{
    localStorage.setItem(GROUP_STATE_KEY, open ? '1' : '0');
  } catch(error){}
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-advanced-workbench{padding:0;overflow:hidden}
    .spn-advanced-workbench > summary{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:13px;
      cursor:pointer;
      list-style:none;
      user-select:none;
    }
    .spn-advanced-workbench > summary::-webkit-details-marker{display:none}
    .spn-advanced-workbench > summary::after{content:'▾';font-size:15px;color:#64748b;transition:transform .15s}
    .spn-advanced-workbench[open] > summary::after{transform:rotate(180deg)}
    .spn-advanced-workbench > summary span:first-child{min-width:0;flex:1}
    .spn-advanced-workbench > summary b{display:block;font-size:14px;font-weight:900;color:#1e293b}
    .spn-advanced-workbench > summary small{display:block;margin-top:3px;font-size:11px;line-height:1.25;color:#64748b;font-weight:700}
    .spn-workbench-count{flex:0 0 auto;padding:4px 7px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:10px;font-weight:900}
    .spn-advanced-workbench-body{display:grid;gap:10px;padding:0 10px 10px;border-top:1px solid #e2e8f0;background:#f8fafc}
    .spn-advanced-workbench-body > .card{margin:10px 0 0;border-radius:14px;box-shadow:none;background:#fff}
    body[data-spn-ui-mode="quick"] .spn-advanced-workbench,
    body[data-spn-ui-mode="newbie"] .spn-advanced-workbench{display:none!important}
    @media(max-width:520px){
      .spn-advanced-workbench > summary{align-items:flex-start;flex-wrap:wrap}
      .spn-workbench-count{order:2}
    }
    @media print{.spn-advanced-workbench{display:none!important}}
  `;
  document.head.appendChild(style);
}
