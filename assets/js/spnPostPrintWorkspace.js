const GROUP_ID = 'spnPostPrintWorkspace';
const GROUP_STATE_KEY = 'etagi-raskleyka-post-print-workspace-open-v1';
const SECTION_IDS = ['spnDistributionTask', 'spnDistributionReport'];
const STYLE_ID = 'spnPostPrintWorkspaceStyles';

let statusFrame = 0;

window.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  if(!sidebar || document.getElementById(GROUP_ID)) return;

  injectStyles();
  const observer = new MutationObserver(() => organizeSections(sidebar, observer));
  observer.observe(sidebar, {childList:true, subtree:true});
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
  details.className = 'card spn-post-print-workspace';
  details.open = readOpenState();
  details.innerHTML = `<summary>
    <span><b>После печати</b><small>Задание · выполнение · отчёт · аналитика</small></span>
    <span class="spn-post-print-status" id="spnPostPrintWorkspaceStatus">позже</span>
  </summary><div class="spn-post-print-workspace-body"></div>`;

  sections[0].insertAdjacentElement('beforebegin', details);
  const body = details.querySelector('.spn-post-print-workspace-body');
  sections.forEach(section => body.append(section));

  details.addEventListener('toggle', () => {
    if(!isWizardForced()) saveOpenState(details.open);
  });
  details.addEventListener('input', scheduleStatusUpdate);
  details.addEventListener('change', scheduleStatusUpdate);

  const modeObserver = new MutationObserver(() => syncWizardState(details));
  modeObserver.observe(document.body, {
    attributes:true,
    attributeFilter:['data-wizard-step', 'data-spn-ui-mode']
  });

  syncWizardState(details);
  scheduleStatusUpdate();
}

function syncWizardState(details){
  const forced = isWizardForced();
  details.dataset.wizardForced = forced ? 'true' : 'false';
  details.open = forced || readOpenState();
  scheduleStatusUpdate();
}

function isWizardForced(){
  return ['task', 'report'].includes(document.body.dataset.wizardStep || '');
}

function scheduleStatusUpdate(){
  window.cancelAnimationFrame(statusFrame);
  statusFrame = window.requestAnimationFrame(() => {
    statusFrame = 0;
    updateStatus();
  });
}

function updateStatus(){
  const target = document.getElementById('spnPostPrintWorkspaceStatus');
  if(!target) return;

  const taskReady = Boolean(value('distributionPlace')) && Number(value('distributionSheets')) > 0;
  const reportReady = Boolean(value('distributionReportDate')) && Boolean(value('distributionReportPlace')) && Number(value('distributionReportSheets')) > 0;
  target.textContent = `${taskReady ? 'задание готово' : 'задание позже'} · ${reportReady ? 'отчёт заполнен' : 'отчёт позже'}`;
  target.dataset.ready = taskReady && reportReady ? 'true' : taskReady || reportReady ? 'partial' : 'false';
}

function value(id){
  return String(document.getElementById(id)?.value || '').trim();
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
    .spn-post-print-workspace{padding:0;overflow:hidden;border-color:#cbd5e1;background:#fff}
    .spn-post-print-workspace > summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px;cursor:pointer;list-style:none;user-select:none}
    .spn-post-print-workspace > summary::-webkit-details-marker{display:none}
    .spn-post-print-workspace > summary::after{content:'▾';font-size:15px;color:#64748b;transition:transform .15s}
    .spn-post-print-workspace[open] > summary::after{transform:rotate(180deg)}
    .spn-post-print-workspace > summary span:first-child{min-width:0;flex:1}
    .spn-post-print-workspace > summary b{display:block;font-size:14px;font-weight:900;color:#1e293b}
    .spn-post-print-workspace > summary small{display:block;margin-top:3px;font-size:11px;line-height:1.25;color:#64748b;font-weight:700}
    .spn-post-print-status{flex:0 0 auto;max-width:180px;padding:5px 8px;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:9.5px;line-height:1.2;font-weight:900;text-align:center}
    .spn-post-print-status[data-ready="partial"]{background:#fef3c7;color:#92400e}
    .spn-post-print-status[data-ready="true"]{background:#dcfce7;color:#166534}
    .spn-post-print-workspace-body{display:grid;gap:10px;padding:0 10px 10px;border-top:1px solid #e2e8f0;background:#f8fafc}
    .spn-post-print-workspace-body > #spnDistributionTask,
    .spn-post-print-workspace-body > #spnDistributionReport{margin:10px 0 0;box-shadow:none}
    body[data-spn-ui-mode="newbie"]:not([data-wizard-step="task"]):not([data-wizard-step="report"]) .spn-post-print-workspace{display:none!important}
    @media(max-width:520px){
      .spn-post-print-workspace > summary{align-items:flex-start;flex-wrap:wrap}
      .spn-post-print-status{max-width:none;width:100%;text-align:left}
    }
    @media print{.spn-post-print-workspace{display:none!important}}
  `;
  document.head.appendChild(style);
}
