(function () {
  const levelLabels = {
    error: 'Ошибка',
    warn: 'Важно',
    tip: 'Совет'
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    new MutationObserver(enhanceQualityItems).observe(list, { childList: true });
    enhanceQualityItems();
  }

  function enhanceQualityItems() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    list.querySelectorAll('.qitem').forEach((item) => {
      if (item.querySelector('.quality-level')) return;

      const level = getIssueLevel(item);
      const label = levelLabels[level];
      if (!label) return;

      item.insertAdjacentHTML('afterbegin', `<span class="quality-level quality-level-${level}">${label}</span>`);
    });
  }

  function getIssueLevel(item) {
    if (item.classList.contains('error')) return 'error';
    if (item.classList.contains('warn')) return 'warn';
    if (item.classList.contains('tip')) return 'tip';
    return '';
  }
})();
