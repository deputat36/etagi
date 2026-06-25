import './photoIntentFix.js';

(function () {
  const EMPTY_QR_TITLE = 'QR включён, но ссылки нет';
  const BUTTON_TEXT = 'Добавить ссылку';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    list.addEventListener('click', handleQrEmptyClick, true);
    new MutationObserver(updateQrEmptyAction).observe(list, { childList: true, subtree: true });
    updateQrEmptyAction();
  }

  function updateQrEmptyAction() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    list.querySelectorAll('.qitem').forEach((item) => {
      const title = item.querySelector('b')?.textContent?.trim() || '';
      if (title !== EMPTY_QR_TITLE) return;

      const button = item.querySelector('[data-extra-quality-fix="disableQr"]');
      if (!button) return;

      button.textContent = BUTTON_TEXT;
      button.setAttribute('aria-label', 'Исправить: добавить ссылку для QR');
      button.dataset.qrEmptyFix = 'focusQrLink';
    });
  }

  function handleQrEmptyClick(event) {
    const button = event.target.closest('[data-qr-empty-fix="focusQrLink"]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    focusQrLinkField();
  }

  function focusQrLinkField() {
    const input = document.getElementById('qrLink');
    if (!input) return;

    input.focus();
    input.select?.();
    input.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    setStatus('QR оставлен включённым. Вставьте ссылку, которую человек откроет после сканирования.');
  }

  function setStatus(text) {
    const status = document.getElementById('statusLine');
    if (status) status.textContent = text;
  }
})();
