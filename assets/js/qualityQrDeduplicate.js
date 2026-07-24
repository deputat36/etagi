import { subscribeQualityListUpdates } from './qualityListUpdates.js';

(function () {
  const SOFT_QR_TITLE = 'QR может быть мелким';
  const HARD_QR_TITLE = 'QR слишком мал для мини-макета';
  const SUPPRESSED_REASON = 'qr-size-duplicate';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    subscribeQualityListUpdates(hideSoftQrHintWhenHardHintExists, {
      priority: 0,
      label: 'quality-qr-deduplicate'
    });
  }

  function hideSoftQrHintWhenHardHintExists() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    const softItem = findIssueByTitle(list, SOFT_QR_TITLE);
    const hardItem = findIssueByTitle(list, HARD_QR_TITLE);
    if (!softItem) return;

    if (hardItem) {
      softItem.dataset.qualitySuppressed = SUPPRESSED_REASON;
      softItem.hidden = true;
      return;
    }

    if (softItem.dataset.qualitySuppressed === SUPPRESSED_REASON) {
      delete softItem.dataset.qualitySuppressed;
      softItem.hidden = false;
    }
  }

  function findIssueByTitle(list, title) {
    return Array.from(list.querySelectorAll('.qitem'))
      .find((item) => item.querySelector('b')?.textContent?.trim() === title) || null;
  }
})();
