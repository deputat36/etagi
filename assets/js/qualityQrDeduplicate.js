(function () {
  const SOFT_QR_TITLE = 'QR может быть мелким';
  const HARD_QR_TITLE = 'QR слишком мал для мини-макета';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    new MutationObserver(hideSoftQrHintWhenHardHintExists).observe(list, { childList: true, subtree: true });
    hideSoftQrHintWhenHardHintExists();
  }

  function hideSoftQrHintWhenHardHintExists() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    const softItem = findIssueByTitle(list, SOFT_QR_TITLE);
    const hardItem = findIssueByTitle(list, HARD_QR_TITLE);
    if (!softItem) return;

    softItem.hidden = Boolean(hardItem);
  }

  function findIssueByTitle(list, title) {
    return Array.from(list.querySelectorAll('.qitem'))
      .find((item) => item.querySelector('b')?.textContent?.trim() === title) || null;
  }
})();
