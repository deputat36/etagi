const qrCaptionPresets = [
  'Смотреть объект',
  'Открыть объявление',
  'Написать в чат',
  'Получить подборку',
  'Узнать подробнее',
  'Оставить заявку'
];

document.addEventListener('DOMContentLoaded', () => {
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

function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
