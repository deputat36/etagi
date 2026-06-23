(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    const printBtn = document.getElementById('printBtn');
    if (!list || !printBtn) return;

    if (!printBtn.dataset.originalLabel) {
      printBtn.dataset.originalLabel = printBtn.textContent.trim() || 'Печать / PDF';
    }

    new MutationObserver(updatePrintState).observe(list, { childList: true, subtree: true });
    updatePrintState();
  }

  function updatePrintState() {
    const list = document.getElementById('qualityList');
    const printBtn = document.getElementById('printBtn');
    if (!list || !printBtn) return;

    const hasError = Boolean(list.querySelector('.qitem.error'));
    const hasWarning = Boolean(list.querySelector('.qitem.warn'));
    const originalLabel = printBtn.dataset.originalLabel || 'Печать / PDF';

    printBtn.classList.toggle('print-blocked', hasError);
    printBtn.classList.toggle('print-has-warnings', !hasError && hasWarning);

    if (hasError) {
      printBtn.textContent = 'Исправьте ошибки';
      printBtn.title = 'Печать заблокирована: сначала исправьте ошибки в контроле качества.';
      printBtn.setAttribute('aria-label', 'Печать заблокирована. Сначала исправьте ошибки в контроле качества.');
      return;
    }

    printBtn.textContent = originalLabel;
    if (hasWarning) {
      printBtn.title = 'Печатать можно, но перед этим лучше проверить важные замечания.';
      printBtn.setAttribute('aria-label', 'Печать или PDF. Есть важные замечания контроля качества.');
      return;
    }

    printBtn.removeAttribute('title');
    printBtn.setAttribute('aria-label', originalLabel);
  }
})();
