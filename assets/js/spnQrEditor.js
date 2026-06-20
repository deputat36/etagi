const qrCaptionPresets = [
  'Смотреть объект',
  'Открыть объявление',
  'Написать в чат',
  'Получить подборку',
  'Узнать подробнее',
  'Оставить заявку'
];

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const qrCaption = document.getElementById('qrCaption');
  const qrCaptionLabel = qrCaption?.closest('label');
  if(!qrCaption || !qrCaptionLabel || document.getElementById('qrCaptionHelper')) return;
  qrCaptionLabel.insertAdjacentHTML('afterend', renderHelper());
  bindHelper();
  updateHelperState();
});

function renderHelper(){
  return `<div class="spn-qr-editor" id="qrCaptionHelper">
    <div class="spn-qr-editor-head">
      <b>Подпись QR</b>
      <button type="button" id="qrCleanLinkBtn">Очистить ссылку</button>
    </div>
    <div class="spn-qr-presets">
      ${qrCaptionPresets.map(item => `<button type="button" data-qr-caption="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('')}
    </div>
    <p>Короткая подпись помогает понять, зачем сканировать QR. Если ссылки нет, QR не будет напечатан.</p>
  </div>`;
}

function bindHelper(){
  const helper = document.getElementById('qrCaptionHelper');
  helper?.addEventListener('click', event => {
    const preset = event.target.closest('[data-qr-caption]');
    const clean = event.target.closest('#qrCleanLinkBtn');
    if(preset){
      setValue('qrCaption', preset.dataset.qrCaption);
      setChecked('showQr', true);
      setStatus('Подпись QR обновлена.');
    }
    if(clean){
      setValue('qrLink', '');
      setStatus('Ссылка QR очищена.');
    }
    updateHelperState();
  });
  ['qrLink','qrCaption','showQr'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', updateHelperState);
    el.addEventListener('change', updateHelperState);
  });
}

function updateHelperState(){
  const helper = document.getElementById('qrCaptionHelper');
  const link = document.getElementById('qrLink');
  const showQr = document.getElementById('showQr');
  if(!helper) return;
  helper.classList.toggle('disabled', showQr && !showQr.checked);
  helper.classList.toggle('empty-link', !String(link?.value || '').trim());
}

function setValue(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function setChecked(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.checked = Boolean(value);
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
function injectStyles(){
  if(document.getElementById('qrCaptionHelperStyles')) return;
  const style = document.createElement('style');
  style.id = 'qrCaptionHelperStyles';
  style.textContent = `.spn-qr-editor{margin:-2px 0 9px;padding:9px;border:1px solid #bfdbfe;border-radius:13px;background:#eff6ff}.spn-qr-editor.disabled{opacity:.58}.spn-qr-editor.empty-link{border-style:dashed}.spn-qr-editor-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.spn-qr-editor-head b{font-size:11px;font-weight:900;color:#1e3a8a}.spn-qr-editor-head button{padding:6px 7px;border-radius:9px;border:1px solid #bfdbfe;background:#fff;color:#1d4ed8;font-size:10px;font-weight:900;box-shadow:none}.spn-qr-presets{display:grid;grid-template-columns:1fr 1fr;gap:5px}.spn-qr-presets button{padding:7px 8px;border-radius:10px;border:1px solid #bfdbfe;background:#fff;color:#1d4ed8;text-align:left;font-size:10px;line-height:1.15;font-weight:900;box-shadow:none}.spn-qr-presets button:hover,.spn-qr-editor-head button:hover{transform:none;box-shadow:none;background:#dbeafe}.spn-qr-editor p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-qr-presets{grid-template-columns:1fr}}@media print{.spn-qr-editor{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
