import { getPhoneInfo } from './phone.js';

(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    list.addEventListener('click', handleShowContactClick, true);
  }

  function handleShowContactClick(event) {
    const button = event.target.closest('[data-fix="showContact"]');
    if (!button) return;

    const phoneInput = document.getElementById('agentPhone');
    const phoneInfo = getPhoneInfo(phoneInput?.value || '');
    if (phoneInfo.isLikelyPhone) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    phoneInput?.focus();
    phoneInput?.select?.();
    phoneInput?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    setStatus('Сначала укажите полный телефон для отклика. Контакты не включены, чтобы не создать новую ошибку.');
  }

  function setStatus(text) {
    const status = document.getElementById('statusLine');
    if (status) status.textContent = text;
  }
})();
