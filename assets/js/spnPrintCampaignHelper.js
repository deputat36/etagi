const campaignPresets = {
  test: {
    title: 'Тест 2 листа',
    hint: 'проверить отклик без лишнего расхода',
    values: { printCount: 2, splitMode: 'auto', tearOffs: true, showCutLines: true, safePrintMargins: true, printCheckMode: false, showPhoto: false, showQr: false }
  },
  entrance: {
    title: 'Подъезд',
    hint: 'понятно, компактно, с отрывными',
    values: { printCount: 4, splitMode: 'auto', tearOffs: true, showCutLines: true, safePrintMargins: true, printCheckMode: false, showPhoto: false, showQr: false }
  },
  mass: {
    title: 'Массовая расклейка',
    hint: 'экономно, больше объявлений на листе',
    values: { printCount: 8, splitMode: 'auto', tearOffs: true, showCutLines: true, safePrintMargins: true, printCheckMode: false, showPhoto: false, showQr: false }
  },
  object: {
    title: 'Объект с фото',
    hint: 'для продажи квартиры, дома или участка',
    values: { printCount: 2, splitMode: 'auto', tearOffs: true, showCutLines: true, safePrintMargins: true, printCheckMode: false, showPhoto: true, showQr: true }
  },
  stand: {
    title: 'Стенд / офис',
    hint: 'крупно, без отрывных листочков',
    values: { printCount: 1, splitMode: 'auto', tearOffs: false, showCutLines: false, safePrintMargins: true, printCheckMode: false, showPhoto: true, showQr: true }
  },
  check: {
    title: 'Проверка печати',
    hint: 'поля, рез, контроль переполнения',
    values: { printCheckMode: true, showCutLines: true, safePrintMargins: true }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const row = document.getElementById('printPresetRow');
  if(!row || document.getElementById('spnPrintCampaignHelper')) return;
  row.insertAdjacentHTML('afterend', renderHelper());
  bindHelper();
  updateCampaignStatus();
});

function renderHelper(){
  return `<div class="spn-print-campaign-helper" id="spnPrintCampaignHelper">
    <div class="spn-print-campaign-head">
      <b>Сценарий печати</b>
      <span id="printCampaignStatus">—</span>
    </div>
    <div class="spn-print-campaign-grid">
      ${Object.entries(campaignPresets).map(([id, item]) => `<button type="button" data-print-campaign="${id}"><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.hint)}</span></button>`).join('')}
    </div>
    <p>Сценарий печати меняет количество макетов на А4, отрывные телефоны, линии реза, фото и QR.</p>
  </div>`;
}

function bindHelper(){
  document.getElementById('spnPrintCampaignHelper')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-print-campaign]');
    if(!btn) return;
    applyCampaign(btn.dataset.printCampaign);
    window.setTimeout(updateCampaignStatus, 70);
  });
  ['splitMode','tearOffs','showCutLines','safePrintMargins','printCheckMode','showPhoto','showQr'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('change', updateCampaignStatus);
    el.addEventListener('input', updateCampaignStatus);
  });
  document.addEventListener('click', event => {
    if(event.target.closest('[data-count]')) window.setTimeout(updateCampaignStatus, 70);
  });
}

function applyCampaign(id){
  const preset = campaignPresets[id];
  if(!preset) return;
  const values = preset.values || {};
  if(values.printCount) clickPrintCount(values.printCount);
  if(values.splitMode) setValue('splitMode', values.splitMode);
  ['tearOffs','showCutLines','safePrintMargins','printCheckMode','showPhoto','showQr'].forEach(key => {
    if(Object.prototype.hasOwnProperty.call(values, key)) setChecked(key, values[key]);
  });
  if(values.showPhoto === true){
    const activePhoto = document.querySelector('[data-photo].active')?.dataset.photo || 'one';
    clickPhotoMode(activePhoto === 'none' ? 'one' : activePhoto);
  }
  if(values.showPhoto === false){
    clickPhotoMode('none');
  }
  setStatus(`Применён сценарий печати: ${preset.title}.`);
}

function updateCampaignStatus(){
  const status = document.getElementById('printCampaignStatus');
  const helper = document.getElementById('spnPrintCampaignHelper');
  if(!status || !helper) return;
  const count = getPrintCount();
  const tears = checked('tearOffs');
  const photo = checked('showPhoto');
  const qr = checked('showQr');
  const check = checked('printCheckMode');
  let text = `${count} на А4`;
  if(check) text += ' · проверка';
  if(tears) text += ' · отрывные';
  if(photo) text += ' · фото';
  if(qr) text += ' · QR';
  status.textContent = text;
  helper.dataset.printCount = String(count);
}

function clickPrintCount(count){
  const btn = document.querySelector(`[data-count="${count}"]`);
  if(btn){
    btn.click();
    return;
  }
}
function clickPhotoMode(mode){
  const btn = document.querySelector(`[data-photo="${mode}"]`);
  if(btn){
    btn.click();
    return;
  }
  setChecked('showPhoto', mode !== 'none');
}
function getPrintCount(){
  return Number(document.querySelector('[data-count].active')?.dataset.count || 2);
}
function checked(id){
  return Boolean(document.getElementById(id)?.checked);
}
function setChecked(id, checked){
  const el = document.getElementById(id);
  if(!el) return;
  el.checked = Boolean(checked);
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function setValue(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
function injectStyles(){
  if(document.getElementById('spnPrintCampaignHelperStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnPrintCampaignHelperStyles';
  style.textContent = `.spn-print-campaign-helper{margin:8px 0 10px;padding:9px;border:1px solid #e2e8f0;border-radius:13px;background:#f8fafc}.spn-print-campaign-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.spn-print-campaign-head b{font-size:11px;font-weight:900;color:#111827}.spn-print-campaign-head span{font-size:10px;font-weight:900;color:#475569}.spn-print-campaign-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}.spn-print-campaign-grid button{display:grid;gap:2px;min-height:42px;padding:7px 8px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#111827;text-align:left;box-shadow:none}.spn-print-campaign-grid button b{font-size:10.5px;line-height:1.1;font-weight:900}.spn-print-campaign-grid button span{font-size:9.7px;line-height:1.15;color:#64748b;font-weight:700}.spn-print-campaign-grid button:hover{transform:none;box-shadow:none;background:#f1f5f9}.spn-print-campaign-helper p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-print-campaign-grid{grid-template-columns:1fr}}@media print{.spn-print-campaign-helper{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
