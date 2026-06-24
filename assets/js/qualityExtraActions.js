import { getLayoutExtra, getLayoutExtraField, setLayoutExtraValue } from './layoutExtras.js';
import { cleanPhoneValue } from './phone.js';

(function () {
  const QUICK_FIX_CTA = 'Позвоните — подскажу детали';
  const TRUST_PHRASE = 'Без давления, по делу, объясню простым языком';
  const DEFAULT_BENEFITS = [
    'Безопасное сопровождение',
    'Помощь с документами',
    'Консультация по цене'
  ];
  const HEADLINE_BY_GOAL = {
    seller: 'Ищу недвижимость для покупки',
    buyer: 'Помогу найти покупателя',
    object: 'Помогу продать недвижимость',
    newbuild: 'Подберу квартиру в новостройке',
    service: 'Помогу с недвижимостью',
    rent: 'Помогу с арендой недвижимости',
    brand: 'Ваш специалист по недвижимости',
    private: 'Частное объявление о недвижимости'
  };
  const DEFAULT_TEAR_LABEL = getLayoutExtraField('tearOffLabel')?.fallback || 'Недвижимость';
  const DEFAULT_BRAND_NAME = getLayoutExtraField('brandName')?.fallback || 'Этажи';
  const DEFAULT_BRAND_SIDE = getLayoutExtraField('brandSideText')?.fallback || 'etagi.com';

  const actions = [
    { title: 'Заголовок не продаёт', action: 'strongHeadline', label: 'Усилить заголовок' },
    { title: 'Слабый крючок в заголовке', action: 'strongHeadline', label: 'Усилить заголовок' },
    { title: 'Нет призыва в контактах', action: 'contactCta', label: 'Заполнить призыв' },
    { title: 'Слабый призыв в контактах', action: 'contactCta', label: 'Усилить призыв' },
    { title: 'Длинный призыв в контактах', action: 'shortContactCta', label: 'Сократить призыв' },
    { title: 'Призыв длинный для мини-макета', action: 'shortContactCta', label: 'Сократить призыв' },
    { title: 'Нет явного призыва', action: 'descriptionCta', label: 'Добавить призыв' },
    { title: 'Мало причин позвонить', action: 'benefits', label: 'Добавить выгоды' },
    { title: 'Много преимуществ для мини-макета', action: 'shortBenefits', label: 'Оставить 3 выгоды' },
    { title: 'Не указан контекст', action: 'focusContext', label: 'Указать район' },
    { title: 'Нет снятия опасения', action: 'trustSignal', label: 'Добавить доверие' },
    { title: 'Дополнительный блок пустой', action: 'disableCustomBlock', label: 'Выключить блок' },
    { title: 'Длинный дополнительный блок', action: 'shortCustomBlock', label: 'Сократить блок' },
    { title: 'Дополнительный блок перегружает мини-макет', action: 'shortCustomBlock', label: 'Сократить блок' },
    { title: 'Параметры занимают много места', action: 'simplifyMeta', label: 'Оставить главное' },
    { title: 'Нет подписи отрывных листков', action: 'tearLabel', label: 'Заполнить подпись' },
    { title: 'Длинная подпись отрывных листков', action: 'shortTearLabel', label: 'Сократить подпись' },
    { title: 'Подпись отрывных длинная для мини-макета', action: 'shortTearLabel', label: 'Сократить подпись' },
    { title: 'Брендовая строка длинновата', action: 'shortBrand', label: 'Укоротить бренд' },
    { title: 'Бренд перегружает мини-макет', action: 'shortBrand', label: 'Укоротить бренд' },
    { title: 'QR включён, но ссылки нет', action: 'disableQr', label: 'Выключить QR' },
    { title: 'Ссылка для QR слишком длинная', action: 'shortQrLink', label: 'Заменить ссылку' },
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

      const ariaLabel = `Исправить: ${title}`;
      item.insertAdjacentHTML('beforeend', `<br><button type="button" class="quality-extra-fix-btn" data-extra-quality-fix="${config.action}" aria-label="${escapeHtml(ariaLabel)}">${escapeHtml(config.label)}</button>`);
    });
  }

  function handleBuiltInFixClick(event) {
    const button = event.target.closest('[data-fix]');
    if (!button) return;

    if (button.dataset.fix === 'phone') {
      window.setTimeout(focusPhoneField, 180);
      return;
    }
    if (button.dataset.fix === 'shortHeadline') {
      event.preventDefault();
      event.stopPropagation();
      trimHeadlineForPrint();
    }
    if (button.dataset.fix === 'shortDesc') {
      event.preventDefault();
      event.stopPropagation();
      trimDescriptionForPrint();
    }
  }

  function handleClick(event) {
    const button = event.target.closest('[data-extra-quality-fix]');
    if (!button) return;

    const action = button.dataset.extraQualityFix;
    if (action === 'strongHeadline') setStrongHeadline();
    if (action === 'contactCta') setContactCta(QUICK_FIX_CTA);
    if (action === 'shortContactCta') setContactCta(shortContactCta());
    if (action === 'descriptionCta') addDescriptionSentence(QUICK_FIX_CTA, 'Призыв добавлен в описание.');
    if (action === 'benefits') setBenefits();
    if (action === 'shortBenefits') trimBenefits();
    if (action === 'focusContext') focusContextField();
    if (action === 'trustSignal') addDescriptionSentence(TRUST_PHRASE, 'Фраза доверия добавлена в описание.');
    if (action === 'disableCustomBlock') disableCustomBlock();
    if (action === 'shortCustomBlock') trimCustomBlock();
    if (action === 'simplifyMeta') simplifyMeta();
    if (action === 'tearLabel') setTearLabel(DEFAULT_TEAR_LABEL);
    if (action === 'shortTearLabel') setTearLabel(shortTearLabel());
    if (action === 'shortBrand') setShortBrand();
    if (action === 'disableQr') disableQr();
    if (action === 'shortQrLink') focusQrField();
    if (action === 'cleanPhone') cleanPhone();
  }

  function setStrongHeadline() {
    const input = document.getElementById('headline');
    if (!input) return;

    enableCheckbox('showHeadline');
    setInputValue(input, shorten(getHeadlineSuggestion(), getHeadlineLimit()));
    setStatus('Заголовок усилен и подогнан под плотность печати. Проверьте смысл.');
  }

  function trimHeadlineForPrint() {
    const input = document.getElementById('headline');
    if (!input) return;

    setInputValue(input, shorten(input.value, getHeadlineLimit()));
    setStatus('Заголовок сокращён под выбранное количество макетов на А4.');
  }

  function getHeadlineLimit() {
    const count = getPrintCount();
    return count >= 6 ? 38 : 48;
  }

  function getHeadlineSuggestion() {
    const activeGoal = document.querySelector('[data-goal].active')?.dataset.goal || '';
    const base = HEADLINE_BY_GOAL[activeGoal] || 'Помогу с недвижимостью';
    const area = String(document.getElementById('area')?.value || '').trim();
    const propertyType = String(document.getElementById('propertyType')?.value || '').trim();
    const context = [propertyType, area].filter(Boolean).join(', ');

    return context ? `${base} — ${context}` : base;
  }

  function setContactCta(text) {
    enableCheckbox('showContact');
    setLayoutExtra('contactCta', text || QUICK_FIX_CTA);
    setStatus('Призыв в контактах исправлен.');
  }

  function addDescriptionSentence(sentence, statusText) {
    const input = document.getElementById('description');
    if (!input) return;

    enableCheckbox('showDescription');
    const current = String(input.value || '').trim();
    const limit = getDescriptionLimit();
    const prefixLimit = Math.max(0, limit - sentence.length - 1);
    const prefix = current && !includesText(current, sentence) ? shorten(current, prefixLimit) : current;
    const next = current && !includesText(current, sentence) ? `${prefix} ${sentence}`.trim() : current || sentence;
    setInputValue(input, shorten(next, limit));
    setStatus(statusText);
  }

  function trimDescriptionForPrint() {
    const input = document.getElementById('description');
    if (!input) return;

    setInputValue(input, shorten(input.value, getDescriptionLimit()));
    setStatus('Описание сокращено под выбранное количество макетов на А4.');
  }

  function getDescriptionLimit() {
    const count = getPrintCount();
    if (count >= 6) return 150;
    if (count >= 4) return 260;
    return Number.POSITIVE_INFINITY;
  }

  function setBenefits() {
    const input = document.getElementById('benefits');
    if (!input) return;

    enableCheckbox('showBenefits');
    const lines = String(input.value || '').split('\n').map((line) => line.trim()).filter(Boolean);
    const nextLines = [...lines];
    DEFAULT_BENEFITS.forEach((line) => {
      if (!nextLines.some((current) => includesText(current, line))) nextLines.push(line);
    });
    setInputValue(input, nextLines.slice(0, 3).join('\n'));
    setStatus('Выгоды добавлены. Проверьте, что они подходят к вашему макету.');
  }

  function trimBenefits() {
    const input = document.getElementById('benefits');
    if (!input) return;

    const lines = String(input.value || '').split('\n').map((line) => line.trim()).filter(Boolean);
    setInputValue(input, lines.slice(0, 3).join('\n'));
    setStatus('Список преимуществ сокращён до трёх строк для мини-макета.');
  }

  function disableCustomBlock() {
    setCheckboxValue('showCustomBlock', false);
    setStatus('Пустой дополнительный блок выключен.');
  }

  function trimCustomBlock() {
    const input = document.getElementById('customBlockText');
    if (!input) return;

    setInputValue(input, shorten(input.value, getCustomBlockLimit()));
    setStatus('Дополнительный блок сокращён под выбранное количество макетов на А4.');
  }

  function getCustomBlockLimit() {
    const count = getPrintCount();
    if (count >= 6) return 70;
    if (count >= 4) return 120;
    return Number.POSITIVE_INFINITY;
  }

  function simplifyMeta() {
    const paramsInput = document.getElementById('params');
    const typeInput = document.getElementById('propertyType');
    if (!paramsInput || !typeInput) return;

    const params = String(paramsInput.value || '').trim();
    const propertyType = String(typeInput.value || '').trim();
    if (params && !includesText(propertyType, params)) {
      setInputValue(typeInput, [propertyType, params].filter(Boolean).join(', '));
    }
    setInputValue(paramsInput, '');
    setStatus('Параметры сохранены в компактной строке вместе с типом объекта.');
  }

  function disableQr() {
    setCheckboxValue('showQr', false);
    setStatus('Пустой QR выключен.');
  }

  function focusQrField() {
    const input = document.getElementById('qrLink');
    if (!input) return;

    input.focus();
    input.select?.();
    input.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    setStatus('Вставьте короткую ссылку для QR: длинные ссылки встроенный QR не печатает надёжно.');
  }

  function focusContextField() {
    const input = document.getElementById('area') || document.getElementById('propertyType');
    if (!input) return;

    input.focus();
    input.select?.();
    input.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    setStatus('Укажите район, дом или тип объекта — это нельзя надёжно заполнить автоматически.');
  }

  function setTearLabel(text) {
    enableCheckbox('tearOffs');
    setLayoutExtra('tearOffLabel', text || DEFAULT_TEAR_LABEL);
    setStatus('Подпись отрывных листков исправлена.');
  }

  function setShortBrand() {
    enableCheckbox('showBrand');
    const values = getShortBrandValues();
    setLayoutExtra('brandName', values.name);
    setLayoutExtra('brandSideText', values.side);
    setStatus('Брендовая строка укорочена без замены введённого названия.');
  }

  function getShortBrandValues() {
    const limit = getBrandLimit();
    const currentName = getLayoutExtra(null, 'brandName') || DEFAULT_BRAND_NAME;
    const currentSide = getLayoutExtra(null, 'brandSideText') || DEFAULT_BRAND_SIDE;
    const maxSide = getPrintCount() >= 6 ? 8 : 9;
    const sideLimit = Math.min(currentSide.length, maxSide);
    const nameLimit = Math.max(4, limit - sideLimit - 1);
    const name = shorten(currentName, nameLimit);
    const side = shorten(currentSide, Math.max(4, limit - name.length - 1));
    return { name, side };
  }

  function getBrandLimit() {
    return getPrintCount() >= 6 ? 26 : 34;
  }

  function cleanPhone() {
    const input = document.getElementById('agentPhone');
    if (!input) return;

    input.value = cleanPhoneValue(input.value);
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

  function getPrintCount() {
    return Number(document.querySelector('[data-count].active')?.dataset.count) || 2;
  }

  function shortContactCta() {
    const current = getLayoutExtra(null, 'contactCta');
    if (!hasCallToAction(current)) return QUICK_FIX_CTA;
    return shorten(current, getContactCtaLimit());
  }

  function getContactCtaLimit() {
    const count = getPrintCount();
    if (count >= 6) return 60;
    if (count >= 4) return 85;
    return Number.POSITIVE_INFINITY;
  }

  function shortTearLabel() {
    const current = getLayoutExtra(null, 'tearOffLabel');
    if (!current) return DEFAULT_TEAR_LABEL;
    return shorten(current, getTearLabelLimit());
  }

  function getTearLabelLimit() {
    const count = getPrintCount();
    if (count >= 6) return 16;
    if (count >= 4) return 24;
    return Number.POSITIVE_INFINITY;
  }

  function setLayoutExtra(stateKey, value) {
    setLayoutExtraValue(stateKey, value, {reveal:true});
  }

  function enableCheckbox(id) {
    setCheckboxValue(id, true);
  }

  function setCheckboxValue(id, checked) {
    const checkbox = document.getElementById(id);
    if (!checkbox || checkbox.checked === checked) return;
    checkbox.checked = checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setInputValue(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setStatus(text) {
    const status = document.getElementById('statusLine');
    if (status) status.textContent = text;
  }

  function hasCallToAction(text) {
    return /позвон|напиш|звон|обсуд|узна|уточн|получ|остав|свяж|спрос|покаж|подска/i.test(String(text || ''));
  }

  function includesText(source, needle) {
    return String(source || '').toLowerCase().includes(String(needle || '').toLowerCase());
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