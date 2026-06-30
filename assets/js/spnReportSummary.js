const HISTORY_KEY = 'etagi-raskleyka-distribution-report-history-v1';

document.addEventListener('DOMContentLoaded', () => {
  const box = document.getElementById('distributionReportHistory');
  if(!box) return;
  renderSummary(box);
  const observer = new MutationObserver(() => renderSummary(box));
  observer.observe(box, {childList:true});
});

function renderSummary(box){
  const history = readHistory();
  const old = document.getElementById('spnReportSummary');
  if(old) old.remove();
  if(!history.length) return;
  const total = history.reduce((acc, item) => {
    acc.sheets += Number(item.sheets) || 0;
    acc.calls += Number(item.calls) || 0;
    acc.leads += Number(item.leads) || 0;
    return acc;
  }, {sheets:0, calls:0, leads:0});
  box.insertAdjacentHTML('afterbegin', `<div id="spnReportSummary" class="spn-report-summary"><b>Сводка</b><span>${history.length} отч. · ${total.sheets} лист. · ${total.calls} откл. · ${total.leads} цел.</span></div>`);
}

function readHistory(){
  try{
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){
    return [];
  }
}
