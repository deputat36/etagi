(function () {
  const FIRST_PHOTO_TITLE = 'Фото включено, но не загружено';
  const SECOND_PHOTO_TITLE = 'Второе фото не загружено';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    list.addEventListener('click', handlePhotoClick, true);
    new MutationObserver(updatePhotoActions).observe(list, { childList: true, subtree: true });
    updatePhotoActions();
  }

  function updatePhotoActions() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    list.querySelectorAll('.qitem').forEach((item) => {
      const title = item.querySelector('b')?.textContent?.trim() || '';

      if (title === FIRST_PHOTO_TITLE) {
        markPhotoButton(item, 'noPhoto', 'photoOne', 'Перейти к фото', 'Исправить: перейти к загрузке фото');
      }

      if (title === SECOND_PHOTO_TITLE) {
        markPhotoButton(item, 'onePhoto', 'photoTwo', 'Перейти ко второму фото', 'Исправить: перейти к загрузке второго фото');
      }
    });
  }

  function markPhotoButton(item, oldAction, inputId, label, ariaLabel) {
    const button = item.querySelector(`[data-fix="${oldAction}"]`);
    if (!button) return;

    button.textContent = label;
    button.setAttribute('aria-label', ariaLabel);
    button.dataset.photoIntentFix = inputId;
  }

  function handlePhotoClick(event) {
    const button = getPhotoButton(event.target);
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const inputId = getPhotoInputId(button);
    const input = document.getElementById(inputId);
    if (!input) return;

    input.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    input.focus?.();
    setStatus(inputId === 'photoTwo'
      ? 'Фото оставлено включённым. Выберите второе фото или переключите режим на одно фото.'
      : 'Фото оставлено включённым. Выберите файл в поле Фото 1.');
  }

  function getPhotoButton(target) {
    const preparedButton = target.closest?.('[data-photo-intent-fix]');
    if (preparedButton) return preparedButton;

    const rawButton = target.closest?.('[data-fix="noPhoto"], [data-fix="onePhoto"]');
    if (!rawButton) return null;

    const item = rawButton.closest('.qitem');
    const title = item?.querySelector('b')?.textContent?.trim() || '';
    return title === FIRST_PHOTO_TITLE || title === SECOND_PHOTO_TITLE ? rawButton : null;
  }

  function getPhotoInputId(button) {
    if (button.dataset.photoIntentFix) return button.dataset.photoIntentFix;
    return button.dataset.fix === 'onePhoto' ? 'photoTwo' : 'photoOne';
  }

  function setStatus(text) {
    const status = document.getElementById('statusLine');
    if (status) status.textContent = text;
  }
})();
