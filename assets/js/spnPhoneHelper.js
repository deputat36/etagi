document.addEventListener('DOMContentLoaded', () => {
  const phone = document.getElementById('agentPhone');
  const anchor = document.getElementById('contactCtaEditor') || phone?.closest('label');
  if(!phone || !anchor || document.getElementById('spnPhoneHelper')) return;
  anchor.insertAdjacentHTML('afterend', renderHelper());
  bindHelper();
  updatePhoneState();
});

function renderHelper(){
  return `<div class="spn-phone-helper" id="spnPhoneHelper">
    <div class="spn-phone-helper-head">
      <b>Телефон для отклика</b>
      <span id="phoneHelperStatus">—</span>
    </div>
    <div class="spn-phone-actions">
      <button type="button" id="phoneFormatBtn">Форматировать</button>
      <button type="button" id="phoneShowEverywhereBtn">Везде показать</button>
      <button type="button" id="phoneTearsOnlyBtn">Только отрывные</button>
    </div>
    <p>Проверьте номер перед печатью. Для массовой расклейки безопаснее оставить телефон и в контактах, и на отрывных листочках.</p>
  </div>`;
}

function bindHelper(){
  document.getElementById('spnPhoneHelper')?.addEventListener('click', event => {
    if(event.target.closest('#phoneFormatBtn')) formatPhone();
    if(event.target.closest('#phoneShowEverywhereBtn')) showPhoneEverywhere();
    if(event.target.closest('#phoneTearsOnlyBtn')) showTearsOnly();
    window.setTimeout(updatePhoneState, 50);
  });
  ['agentPhone','showContact','tearOffs'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', updatePhoneState);
    el.addEventListener('change', updatePhoneState);
  });
}

function formatPhone(){
  const raw = value('agentPhone');
  const formatted = normalizeRussianPhone(raw);
  if(!formatted){
    focusField('agentPhone');
    setStatus('Введите телефон: например 89003006454.');
    return;
  }
  setValue('agentPhone', formatted);
  setStatus('Телефон отформатирован.');
}

function showPhoneEverywhere(){
  setChecked('showContact', true);
  setChecked('tearOffs', true);
  if(!value('agentPhone')) focusField('agentPhone');
  setStatus('Телефон будет виден в контактах и на отрывных листочках.');
}

function showTearsOnly(){
  setChecked('showContact', false);
  setChecked('tearOffs', true);
  if(!value('agentPhone')) focusField('agentPhone');
  setStatus('Большой блок контактов скрыт, отрывные телефоны оставлены.');
}

function updatePhoneState(){
  const helper = document.getElementById('spnPhoneHelper');
  const status = document.getElementById('phoneHelperStatus');
  if(!helper || !status) return;
  const phone = value('agentPhone');
  const contact = checked('showContact');
  const tears = checked('tearOffs');
  const hasVisiblePhone = Boolean(phone) && (contact || tears);
  helper.classList.toggle('ok', hasVisiblePhone);
  helper.classList.toggle('warn', !hasVisiblePhone);
  if(!phone){
    status.textContent = 'номер не заполнен';
    return;
  }
  if(!contact && !tears){
    status.textContent = 'номер скрыт';
    return;
  }
  if(contact && tears){
    status.textContent = 'виден везде';
    return;
  }
  status.textContent = tears ? 'только отрывные' : 'только контакты';
}

function normalizeRussianPhone(raw){
  const text = String(raw || '').trim();
  const digits = text.replace(/\D/g, '');
  if(!digits) return '';
  let normalized = digits;
  if(digits.length === 10) normalized = `7${digits}`;
  if(digits.length === 11 && digits.startsWith('8')) normalized = `7${digits.slice(1)}`;
  if(normalized.length !== 11 || !normalized.startsWith('7')) return text;
  return `+7 ${normalized.slice(1,4)} ${normalized.slice(4,7)}-${normalized.slice(7,9)}-${normalized.slice(9,11)}`;
}

function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function checked(id){
  return Boolean(document.getElementById(id)?.checked);
}
function setValue(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function setChecked(id, checked){
  const el = document.getElementById(id);
  if(!el) return;
  el.checked = Boolean(checked);
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function focusField(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.focus();
  el.scrollIntoView({behavior:'smooth', block:'center'});
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
