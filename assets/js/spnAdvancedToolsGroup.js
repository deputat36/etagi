const GROUP_ID = 'spnAdvancedToolsGroup';
const BODY_ID = 'spnAdvancedToolsBody';
const STYLE_ID = 'spnAdvancedToolsGroupStyles';
const TOOL_IDS = ['spnFieldPlan', 'spnLeadQualification', 'spnResultEstimator'];

window.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const saveCard = document.querySelector('.save-card');
  if(!sidebar || !saveCard || document.getElementById(GROUP_ID)) return;

  injectStyles();
  if(groupTools(saveCard)) return;

  const observer = new MutationObserver(() => {
    if(!groupTools(saveCard)) return;
    observer.disconnect();
  });
  observer.observe(sidebar, {childList:true, subtree:true});

  window.setTimeout(() => observer.disconnect(), 5000);
});

function groupTools(saveCard){
  const tools = TOOL_IDS.map(id => document.getElementById(id));
  if(tools.some(tool => !tool)) return false;

  saveCard.insertAdjacentHTML('beforebegin', renderGroup());
  const body = document.getElementById(BODY_ID);
  if(!body) return false;

  tools.forEach(tool => body.appendChild(tool));
  return true;
}

function renderGroup(){
  return `<details class="card spn-advanced-tools-group" id="${GROUP_ID}">
    <summary>
      <span><b>Дополнительные инструменты после печати</b><small>план, квалификация отклика и оценка результата</small></span>
      <span class="spn-advanced-tools-count">3 инструмента</span>
    </summary>
    <div class="spn-advanced-tools-body" id="${BODY_ID}"></div>
  </details>`;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-advanced-tools-group{padding:0;overflow:hidden}
    .spn-advanced-tools-group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;cursor:pointer;list-style:none;font-weight:900}
    .spn-advanced-tools-group>summary::-webkit-details-marker{display:none}
    .spn-advanced-tools-group>summary span:first-child{display:grid;gap:3px}
    .spn-advanced-tools-group>summary small{font-size:11px;line-height:1.3;color:#64748b;font-weight:700}
    .spn-advanced-tools-count{flex:none;padding:6px 9px;border:1px solid #dbe3ee;border-radius:999px;background:#f8fafc;color:#475569;font-size:10px;font-weight:900}
    .spn-advanced-tools-group[open]>summary{border-bottom:1px solid #e2e8f0;background:#f8fafc}
    .spn-advanced-tools-body{display:grid;gap:12px;padding:12px}
    .spn-advanced-tools-body>.card{margin:0;box-shadow:none;border-color:#dbe3ee}
    body[data-spn-ui-mode="quick"] .spn-advanced-tools-group,
    body[data-spn-ui-mode="newbie"] .spn-advanced-tools-group{display:none!important}
    @media(max-width:520px){
      .spn-advanced-tools-group>summary{align-items:flex-start;padding:13px 14px}
      .spn-advanced-tools-count{white-space:nowrap}
    }
    @media print{.spn-advanced-tools-group{display:none!important}}
  `;
  document.head.appendChild(style);
}
