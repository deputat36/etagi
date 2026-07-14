const GROUP_ID = 'spnAdvancedToolsGroup';
const CONTENT_ID = 'spnAdvancedToolsContent';
const STORAGE_KEY = 'etagi-raskleyka-advanced-tools-open-v1';
const TOOL_IDS = ['spnFieldPlan', 'spnLeadQualification', 'spnResultEstimator'];
const MAX_ATTEMPTS = 6;

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  scheduleGrouping(0);
});

function scheduleGrouping(attempt){
  window.requestAnimationFrame(() => {
    if(groupAdvancedTools()) return;
    if(attempt + 1 < MAX_ATTEMPTS) scheduleGrouping(attempt + 1);
  });
}

function groupAdvancedTools(){
  if(document.getElementById(GROUP_ID)) return true;

  const tools = TOOL_IDS.map(id => document.getElementById(id));
  if(tools.some(tool => !tool)) return false;

  const firstTool = tools[0];
  const group = document.createElement('details');
  group.id = GROUP_ID;
  group.className = 'card advanced spn-advanced-tools-group';
  group.open = localStorage.getItem(STORAGE_KEY) === '1';
  group.innerHTML = `<summary>
    <span class="spn-advanced-tools-title"><b>Планирование и результат</b><small>План расклейки, квалификация отклика и итог теста</small></span>
    <span class="spn-advanced-tools-count">3 инструмента</span>
  </summary>
  <div class="spn-advanced-tools-content" id="${CONTENT_ID}"></div>`;

  firstTool.before(group);
  const content = group.querySelector(`#${CONTENT_ID}`);
  tools.forEach(tool => content.append(tool));

  group.addEventListener('toggle', () => {
    localStorage.setItem(STORAGE_KEY, group.open ? '1' : '0');
  });

  return true;
}

function injectStyles(){
  if(document.getElementById('spnAdvancedToolsGroupStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnAdvancedToolsGroupStyles';
  style.textContent = `
    .spn-advanced-tools-group{padding:0;overflow:hidden}
    .spn-advanced-tools-group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;cursor:pointer;list-style:none;background:linear-gradient(180deg,#fff,#f8fafc)}
    .spn-advanced-tools-group>summary::-webkit-details-marker{display:none}
    .spn-advanced-tools-group>summary:focus-visible{outline:3px solid rgba(37,99,235,.28);outline-offset:-3px}
    .spn-advanced-tools-title{display:grid;gap:3px;min-width:0}
    .spn-advanced-tools-title b{font-size:14px;font-weight:900;color:#111827}
    .spn-advanced-tools-title small{font-size:11px;line-height:1.3;color:#64748b;font-weight:700}
    .spn-advanced-tools-count{flex:0 0 auto;padding:5px 8px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#475569;font-size:10px;font-weight:900}
    .spn-advanced-tools-group[open]>summary{border-bottom:1px solid #e2e8f0}
    .spn-advanced-tools-content{display:grid;gap:12px;padding:12px;background:#f8fafc}
    .spn-advanced-tools-content>.card{margin:0;box-shadow:none;border-color:#dbe3ee}
    @media(max-width:640px){.spn-advanced-tools-group>summary{align-items:flex-start}.spn-advanced-tools-count{font-size:9px}.spn-advanced-tools-content{padding:8px}}
    @media print{.spn-advanced-tools-group{display:none!important}}
  `;
  document.head.appendChild(style);
}
