import './layoutExtrasSync.js';
import { getLayoutExtra, getRawLayoutExtra } from './layoutExtras.js';
import { getPhoneInfo } from './phone.js';

(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function value(id) {
    return String(byId(id)?.value || '').trim();
  }

  function layoutExtra(stateKey) {
    return getLayoutExtra(null, stateKey);
  }

  function rawLayoutExtra(stateKey) {
    return getRawLayoutExtra(stateKey);
  }

  function brandText() {
    const name = layoutExtra('brandName');
    const side = layoutExtra('brandSideText');
    return [name, side].filter(Boolean).join(' / ');
  }

  function printCountValue() {
    const activePrintPreset = document.querySelector('[data-count].active');
    return value('printCount') || activePrintPreset?.dataset?.count || activePrintPreset?.textContent?.trim() || '';
  }

  function checked(id) {
    return Boolean(byId(id)?.checked);
  }

  function selectedText(id) {
    const el = byId(id);
    return el?.selectedOptions?.[0]?.textContent?.trim() || value(id);
  }

  function yesNo(condition) {
    return condition ? 'Да' : 'Нет';
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getQualityInfo() {
    const score = byId('qualityScore')?.textContent?.trim() || 'не проверено';
    const items = Array.from(document.querySelectorAll('#qualityList .qitem'));
    return {
      score,
      errors: items.filter((item) => item.classList.contains('error')).length,
      warnings: items.filter((item) => item.classList.contains('warn')).length
    };
  }

  function hasRenderedPhoto() {
    return Boolean(document.querySelector('#printSheet .photo-box img[src]'));
  }

  function getMainRiskList(quality) {
    const risks = [];
    const phone = value('agentPhone');
    const phoneInfo = getPhoneInfo(phone);
    const contactEnabled = checked('showContact') || checked('tearOffs');
    const qrEnabled = checked('showQr');
    const qrLink = value('qrLink');
    const contactCta = rawLayoutExtra('contactCta');
    const tearLabel = layoutExtra('tearOffLabel');
    const brandLine = brandText();
    const densePrint = ['4', '6', '8'].includes(printCountValue());
    const brandVisible = checked('showBrand') && value('colorMode') !== 'private';

    if (contactEnabled && !phone) {
      risks.push('Не указан телефон для отклика.');
    }

    if (contactEnabled && phone && !phoneInfo.isLikelyPhone) {
      risks.push('Телефон выглядит неполным или ошибочным. Проверьте номер перед печатью.');
    }

    if (phoneInfo.hasExtensionText) {
      risks.push('В поле телефона есть лишний текст. Для отрывных листков лучше оставить только номер.');
    }

    if (checked('showContact') && !contactCta) {
      risks.push('Не заполнен призыв в контактном блоке.');
    }

    if (checked('tearOffs') && tearLabel.length > 24) {
      risks.push('Подпись отрывных листков длинная.');
    }

    if (brandVisible && densePrint && brandLine.length > 34) {
      risks.push('Брендовая строка может быть длинной для плотной печати.');
    }

    if (qrEnabled && !qrLink) {
      risks.push('QR включен, но ссылка не заполнена.');
    }

    if (checked('showPhoto') && !hasRenderedPhoto()) {
      risks.push('Фото включено, но в макете не видно загруженного изображения.');
    }

    if (quality.errors > 0) {
      risks.push('Есть критичные замечания в контроле качества.');
    }

    if (quality.warnings > 0) {
      risks.push(`Есть предупреждения: ${quality.warnings}. Проверьте их перед печатью.`);
    }

    return risks;
  }

  function row(label, text, status) {
    const statusClass = status ? ` print-summary__value--${status}` : '';
    return `<div class="print-summary__row"><span>${escapeHtml(label)}</span><b class="${statusClass}">${escapeHtml(text)}</b></div>`;
  }

  function renderPrintSummary() {
    const root = byId('printSummary');
    if (!root) return;

    const quality = getQualityInfo();
    const risks = getMainRiskList(quality);
    const phone = value('agentPhone');
    const phoneInfo = getPhoneInfo(phone);
    const headline = value('headline') || value('layoutName') || 'Без заголовка';
    const area = value('area') || 'не указан';
    const printCount = printCountValue() || 'не выбрано';
    const status = risks.length ? 'warn' : 'ok';
    const statusText = risks.length ? 'Лучше проверить перед печатью' : 'Критичных замечаний нет';
    const contactCta = layoutExtra('contactCta');
    const tearLabel = layoutExtra('tearOffLabel');
    const brandLine = brandText();
    const brandVisible = checked('showBrand') && value('colorMode') !== 'private';

    root.innerHTML = `
      <div class="print-summary print-summary--${status}">
        <div class="print-summary__head">
          <h4>Сводка макета</h4>
          <strong>${statusText}</strong>
        </div>
        <div class="print-summary__grid">
          ${row('Заголовок', headline)}
          ${row('Телефон', phone || 'не указан', phone && phoneInfo.isLikelyPhone ? 'ok' : 'bad')}
          ${row('Район / адрес', area)}
          ${row('На листе', `${printCount} макетов`)}
          ${row('Деление', selectedText('splitMode') || 'автоматически')}
          ${row('Цветность', selectedText('colorMode') || 'не выбрана')}
          ${row('Призыв', checked('showContact') ? contactCta : 'контакты выключены')}
          ${row('Отрывная подпись', checked('tearOffs') ? tearLabel : 'нет')}
          ${row('Бренд', brandVisible ? brandLine : 'не показывается')}
          ${row('Отрывные телефоны', yesNo(checked('tearOffs')))}
          ${row('QR', checked('showQr') ? (value('qrLink') ? 'Да, ссылка есть' : 'Включен без ссылки') : 'Нет', checked('showQr') && !value('qrLink') ? 'bad' : '')}
          ${row('Оценка качества', quality.score)}
        </div>
        <div class="print-summary__risks">
          <b>Перед печатью:</b>
          <ul>
            ${(risks.length ? risks : ['Проверьте номер телефона глазами.', 'В печати выберите A4, масштаб 100% и фоновые изображения.']).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  function init() {
    const dialog = byId('printDialog');
    const printBtn = byId('printBtn');

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        setTimeout(renderPrintSummary, 120);
      }, true);
    }

    if (dialog) {
      new MutationObserver(() => {
        if (dialog.open) renderPrintSummary();
      }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();