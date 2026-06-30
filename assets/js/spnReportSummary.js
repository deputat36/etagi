const HISTORY_KEY = 'etagi-raskleyka-distribution-report-history-v1';

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const box = document.getElementById('distributionReportHistory');
  if(!box) return;
  renderSummary(box);
  const observer = new MutationObserver(() => renderSummary(box));
  observer.observe(box, {childList:true});
});

function renderSummary(box){
  const history = readHistory();
  const old = document.getElementById('spnReportSummary');
  if(!history.length){
    if(old) old.remove();
    return;
  }

  const total = history.reduce((acc, item) => {
    acc.sheets += Number(item.sheets) || 0;
    acc.calls += Number(item.calls) || 0;
    acc.leads += Number(item.leads) || 0;
    return acc;
  }, {sheets:0, calls:0, leads:0});

  const signature = `${history.length}:${total.sheets}:${total.calls}:${total.leads}`;
  if(old?.dataset.signature === signature) return;

  const html = `<b>Сводка</b><span>${history.length} отч. · ${total.sheets} лист. · ${total.calls} откл. · ${total.leads} цел.</span>`;
  if(old){
    old.dataset.signature = signature;
    old.innerHTML = html;
    return;
  }
  box.insertAdjacentHTML('afterbegin', `<div id="spnReportSummary" class="spn-report-summary" data-signature="${signature}">${html}</div>`);
}

function readHistory(){
  try{
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){
    return [];
  }
}

function injectStyles(){
  if(document.getElementById('spnReportSummaryStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnReportSummaryStyles';
  style.textContent = `.spn-report-summary{display:grid;gap:3px;border:1px solid #bae6fd;border-radius:11px;background:#f8fafc;padding:7px}.spn-report-summary b{font-size:11px;font-weight:900;color:#0f172a}.spn-report-summary span{font-size:10.5px;line-height:1.25;font-weight:850;color:#1e3a8a}@media print{.spn-report-summary{display:none!important}}`;
  document.head.appendChild(style);
}
