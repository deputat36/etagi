(function () {
  const priorities = [
    { key: 'error', label: 'Сначала исправьте ошибку' },
    { key: 'warn', label: 'Потом важное замечание' },
    { key: 'tip', label: 'Затем можно улучшить' }
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    new MutationObserver(updatePriority).observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-quality-suppressed']
    });
    updatePriority();
  }

  function updatePriority() {
    const hint = document.getElementById('qualityPriorityHint');
    const list = document.getElementById('qualityList');
    if (!hint || !list) return;

    const priority = getTopPriority(list);
    if (!priority) {
      hint.className = 'quality-priority-hint good';
      hint.innerHTML = '<b>Порядок действий</b><span>Критичных задач нет. Перед печатью проверьте телефон, QR и масштаб 100%.</span>';
      return;
    }

    hint.className = `quality-priority-hint ${priority.level}`;
    hint.innerHTML = `<b>${priority.label}</b><span>${escapeHtml(priority.title)}. После этого снова нажмите «Проверить».</span>`;
  }

  function getTopPriority(list) {
    for (const priority of priorities) {
      const item = Array.from(list.querySelectorAll(`.qitem.${priority.key}`))
        .find((entry) => !entry.dataset.qualitySuppressed);
      if (!item) continue;

      return {
        level: priority.key,
        label: priority.label,
        title: item.querySelector('b')?.textContent?.trim() || 'замечание в макете'
      };
    }
    return null;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[char]));
  }
})();
