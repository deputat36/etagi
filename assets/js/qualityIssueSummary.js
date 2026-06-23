(function () {
  const levels = [
    { key: 'error', label: 'Ошибки' },
    { key: 'warn', label: 'Важно' },
    { key: 'tip', label: 'Советы' }
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    ensureSummaryElement();
    new MutationObserver(updateSummary).observe(list, { childList: true, subtree: true });
    updateSummary();
  }

  function ensureSummaryElement() {
    if (document.getElementById('qualityIssueSummary')) return;

    const qualityHead = document.querySelector('.quality-card .quality-head');
    if (!qualityHead) return;

    qualityHead.insertAdjacentHTML('afterend', '<div id="qualityIssueSummary" class="quality-issue-summary" aria-live="polite"></div>');
  }

  function updateSummary() {
    const summary = document.getElementById('qualityIssueSummary');
    const list = document.getElementById('qualityList');
    if (!summary || !list) return;

    const counts = levels.map((level) => ({
      ...level,
      count: list.querySelectorAll(`.qitem.${level.key}`).length
    }));
    const total = counts.reduce((sum, item) => sum + item.count, 0);

    if (!total) {
      summary.innerHTML = '<span class="quality-summary-chip quality-summary-good">Замечаний нет</span>';
      return;
    }

    summary.innerHTML = counts
      .map((item) => `<span class="quality-summary-chip quality-summary-${item.key}">${item.label}: ${item.count}</span>`)
      .join('');
  }
})();
