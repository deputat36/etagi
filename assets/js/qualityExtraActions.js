import { getLayoutExtra, getLayoutExtraField, setLayoutExtraValue } from './layoutExtras.js';

(function () {
  const QUICK_FIX_CTA = 'Позвоните — подскажу детали';
  const DEFAULT_TEAR_LABEL = getLayoutExtraField('tearOffLabel')?.fallback || 'Недвижимость';
  const DEFAULT_BRAND_NAME = getLayoutExtraField('brandName')?.fallback || 'Этажи';
  const DEFAULT_BRAND_SIDE = getLayoutExtraField('brandSideText')?.fallback || 'etagi.com';

  const actions = [
    { title: 'Нет призыва в контактах', action: 'contactCta', label: 'Заполнить призыв' },
    { title: 'Слабый призыв в контактах', action: 'contactCta', label: 'Усилить призыв' },
    { title: 'Длинный призыв в контактах', action: 'shortContactCta', label: 'Сократить призыв' },
    { title: 'Призыв длинный для мини-макета', action: 'shortContactCta', label: 'Сократить призыв' },
    { title: 'Нет подписи отрывных листков', action: 'tearLabel', label: 'Заполнить подпись' },
    { title: 'Длинная подпись отрывных листков', action: 'shortTearLabel', label: 'Сократить подпись' },
    { title: 'Подпись отрывных длинная для мини-макета', action: 'shortTearLabel', label: 'Сократить подпись' },
    { title: 'Брендовая строка длинновата', action: 'shortBrand', label: 'Укоротить бренд' },
    { title: 'Бренд перегружает мини-макет', action: 'shortBrand', label: 'Укоротить бренд' },
    { title: 'В поле телефона есть лишний текст', action: 'cleanPhone', label: 'Оставить только номер' }
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    list.addEventListener('click', handleBuiltInFixClick, true);
    list.addEventListener('click', handleClick);
    new MutationObserver(enhanceQualityList).observe(list, { childList: true, subtree: true });
    enhanceQualityList();
  }

  function enhanceQualityList() {
    const list = document.getElementById('qualityList');
    if (!list) return;

    list.querySelectorAll('.qitem').forEach((item) => {
      if (item.querySelector('[data-extra-quality-fix]')) return;

      const title = item.querySelector('b')?.textContent?.trim() || '';
      const config = actions.find((entry) => entry.title === title);
      if (!config) return;

      item.insertAdjacentHTML('beforeend', `<br><button type="button" data-extra-quality-fix="${config.action}">${escapeHtml(config.label)}</button>`);
    });
  }

  function handleBuiltInFixClick(event) {
    const button = event.target.closest('[data-fix]');
    if (!button || button.dataset.fix !== 'phone') return;

    window.setTimeout(focusPhoneField, 180);
  }

  function handleClick(event) {
    const button = event.target.closest('[data-extra-quality-fix]');
    if (!button) return;

    const action = button.dataset.extraQualityFix;
    if (action === 'contactCta') setContactCta(QUICK_FIX_CTA);
    if (action === 'shortContactCta') setContactCta(shortContactCta());
    if (action === 'tearLabel') setTearLabel(DEFAULT_TEAR_LABEL);
    if (action === 'shortTearLabel') setTearLabel(shortTearLabel());
    if (action === 'shortBrand') setShortBrand();
    if (action === 'cleanPhone') cleanPhone();

    rerunQuality();
  }

  function setContactCta(text) {
    enableCheckbox('showContact');
    setLayoutExtra('contactCta', text || QUICK_FIX_CTA);
    setStatus('Призыв в контактах исправлен.');
  }

  function setTearLabel(text) {
    enableCheckbox('tearOffs');
    setLayoutExtra('tearOffLabel', text || DEFAULT_TEAR_LABEL);
    setStatus('Подпись отрывных листков исправлена.');
  }

  function setShortBrand() {
    enableCheckbox('showBrand');
    const colorMode = document.getElementById('colorMode');
    if (colorMode?.value === 'private') {
      colorMode.value = 'brand';
      colorMode.dispatchEvent(new Event('change', { bubbles: true }));
    }

    setLayoutExtra('brandName', DEFAULT_BRAND_NAME);
    setLayoutExtra('brandSideText', DEFAULT_BRAND_SIDE);
    setStatus('Брендовая строка укорочена.');
  }

  function cleanPhone() {
    const input = document.getElementById('agentPhone');
    if (!input) return;

    const cleaned = String(input.value || '')
      .replace(/[^\d\s()+\-.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    input.value = cleaned;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    focusPhoneField();
    setStatus('Из поля телефона убран лишний текст. Проверьте номер глазами.');
  }

  function focusPhoneField() {
    const input = document.getElementById('agentPhone');
    if (!input) return;

    input.focus();
    input.select?.();
    input.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    setStatus('Введите или проверьте телефон. Для печати лучше полный номер с кодом.');
  }

  function shortContactCta() {
    const current = getLayoutExtra(null, 'contactCta');
    if (!hasCallToAction(current) || current.length > 60) return QUICK_FIX_CTA;
    return shorten(current, 58);
  }

  function shortTearLabel() {
    const current = getLayoutExtra(null, 'tearOffLabel');
    if (!current || current.length > 16) return DEFAULT_TEAR_LABEL;
    return current;
  }

  function setLayoutExtra(stateKey, value) {
    setLayoutExtraValue(stateKey, value, {reveal:true});
  }

  function enableCheckbox(id) {
    const checkbox = document.getElementById(id);
    if (!checkbox || checkbox.checked) return;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function rerunQuality() {
    window.setTimeout(() => {
      document.getElementById('qualityBtn')?.click();
    }, 160);
  }

  function setStatus(text) {
    const status = document.getElementById('statusLine');
    if (status) status.textContent = text;
  }

  function hasCallToAction(text) {
    return /позвон|напиш|звон|обсуд|узна|уточн|получ|остав|свяж|спрос|покаж|подска/i.test(String(text || ''));
  }

  function shorten(text, max) {
    const clean = String(text || '').trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max - 3).replace(/[\s,.;:!-]+$/, '') + '...';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  }
})();
