(function () {
  const filters = [
    { key: 'all', label: 'Все' },
    { key: 'error', label: 'Ошибки' },
    { key: 'warn', label: 'Важно' },
    { key: 'tip', label: 'Советы' }
  ];
  let activeFilter = 'all';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    ensureFilterElement();
    document.getElementById('qualityIssueFilters')?.addEventListener('click', handleFilterClick);
    new MutationObserver(updateFilters).observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-quality-suppressed', 'hidden'] });
    updateFilters();
  }

  function ensureFilterElement() {
    if (document.getElementById('qualityIssueFilters')) return;

    const list = document.getElementById('qualityList');
    if (!list) return;

    list.insertAdjacentHTML('beforebegin', `
      <div id="qualityIssueFilters" class="quality-issue-filters" aria-label="Фильтр замечаний качества">
        ${filters.map((filter) => `<button type="button" data-quality-filter="${filter.key}">${filter.label}</button>`).join('')}
      </div>
    `);
  }

  function handleFilterClick(event) {
    const button = event.target.closest('[data-quality-filter]');
    if (!button) return;

    activeFilter = button.dataset.qualityFilter || 'all';
    updateFilters();
  }

  function updateFilters() {
    const list = document.getElementById('qualityList');
    const root = document.getElementById('qualityIssueFilters');
    if (!list || !root) return;

    const allItems = Array.from(list.querySelectorAll('.qitem'));
    const items = allItems.filter((item) => !item.dataset.qualitySuppressed);
    const suppressedItems = allItems.filter((item) => item.dataset.qualitySuppressed);
    const counts = getCounts(items);

    suppressedItems.forEach((item) => { item.hidden = true; });

    if (!counts.total || isReadyOnly(items)) {
      root.hidden = true;
      items.forEach((item) => { item.hidden = false; });
      return;
    }

    root.hidden = false;
    if (activeFilter !== 'all' && !counts[activeFilter]) activeFilter = 'all';

    root.querySelectorAll('[data-quality-filter]').forEach((button) => {
      const key = button.dataset.qualityFilter || 'all';
      const count = key === 'all' ? counts.total : counts[key];
      button.hidden = key !== 'all' && !count;
      button.classList.toggle('active', key === activeFilter);
      button.setAttribute('aria-pressed', String(key === activeFilter));
      button.textContent = `${getFilterLabel(key)} ${count}`;
    });

    items.forEach((item) => {
      const visible = activeFilter === 'all' || item.classList.contains(activeFilter);
      item.hidden = !visible;
    });
  }

  function getCounts(items) {
    return {
      total: items.length,
      error: items.filter((item) => item.classList.contains('error')).length,
      warn: items.filter((item) => item.classList.contains('warn')).length,
      tip: items.filter((item) => item.classList.contains('tip')).length
    };
  }

  function isReadyOnly(items) {
    return items.length === 1 && items[0].textContent.includes('Макет готов');
  }

  function getFilterLabel(key) {
    return filters.find((filter) => filter.key === key)?.label || 'Все';
  }
})();
