const areaPresets = [
  'Центр',
  'Северный',
  'Юго-Восточный',
  'район Аэродромной',
  'ул. Бланская',
  'ул. Советская',
  'ул. Пешкова',
  'Борисоглебск'
];

const contextPresets = [
  'рядом школа',
  'тихий двор',
  'центр рядом',
  'остановка рядом',
  'удобный заезд',
  'обжитой район'
];

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const area = document.getElementById('area');
  const areaLabel = area?.closest('label');
  if(!area || !areaLabel || document.getElementById('spnAreaHelper')) return;
  areaLabel.insertAdjacentHTML('afterend', renderHelper());
  bindHelper();
  updateHelperState();
});

function renderHelper(){
  return `<div class="spn-area-helper" id="spnAreaHelper">
    <div class="spn-area-helper-head">
      <b>Район / адрес</b>
      <button type="button" id="areaToHeadlineBtn">В заголовок</button>
    </div>
    <div class="spn-area-presets">
      ${areaPresets.map(item => `<button type="button" data-area-value="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('')}
    </div>
    <div class="spn-area-context">
      ${contextPresets.map(item => `<button type="button" data-area-context="${escapeAttr(item)}">+ ${escapeHtml(item)}</button>`).join('')}
    </div>
    <p>Район или улица помогают человеку понять, что объявление относится именно к его дому или привычной локации.</p>
  </div>`;
}

function bindHelper(){
  document.getElementById('spnAreaHelper')?.addEventListener('click', event => {
    const areaBtn = event.target.closest('[data-area-value]');
    const contextBtn = event.target.closest('[data-area-context]');
    const headlineBtn = event.target.closest('#areaToHeadlineBtn');
    if(areaBtn){
      setValue('area', areaBtn.dataset.areaValue);
      setChecked('showMeta', true);
      setStatus('Район / адрес подставлен.');
    }
    if(contextBtn){
      appendAreaContext(contextBtn.dataset.areaContext);
      setChecked('showMeta', true);
      setStatus('Контекст района добавлен.');
    }
    if(headlineBtn){
      putAreaToHeadline();
    }
    updateHelperState();
  });
  ['area','headline','showMeta'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', updateHelperState);
    el.addEventListener('change', updateHelperState);
  });
}

function appendAreaContext(text){
  const current = value('area');
  const extra = String(text || '').trim();
  if(!extra) return;
  if(!current){
    setValue('area', extra);
    return;
  }
  if(current.toLowerCase().replace(/ё/g, 'е').includes(extra.toLowerCase().replace(/ё/g, 'е'))) return;
  setValue('area', `${current}, ${extra}`);
}

function putAreaToHeadline(){
  const area = value('area');
  const headline = value('headline');
  if(!area){
    focusField('area');
    setStatus('Сначала укажите район или адрес.');
    return;
  }
  if(!headline){
    setValue('headline', `НЕДВИЖИМОСТЬ: ${area.toUpperCase()}`);
    setStatus('Район добавлен в заголовок.');
    return;
  }
  const normalizedHeadline = headline.toLowerCase().replace(/ё/g, 'е');
  const normalizedArea = area.toLowerCase().replace(/ё/g, 'е');
  if(normalizedHeadline.includes(normalizedArea)){
    setStatus('Район уже есть в заголовке.');
    return;
  }
  setValue('headline', `${headline}\n${area}`);
  setStatus('Район добавлен в заголовок второй строкой.');
}

function updateHelperState(){
  const helper = document.getElementById('spnAreaHelper');
  const showMeta = document.getElementById('showMeta');
  if(!helper) return;
  helper.classList.toggle('disabled', showMeta && !showMeta.checked);
  helper.classList.toggle('empty-area', !value('area'));
}

function value(id){
  return String(document.getElementById(id)?.value || '').trim();
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
function injectStyles(){
  if(document.getElementById('spnAreaHelperStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnAreaHelperStyles';
  style.textContent = `.spn-area-helper{margin:-3px 0 9px;padding:9px;border:1px solid #bae6fd;border-radius:13px;background:#f0f9ff}.spn-area-helper.disabled{opacity:.58}.spn-area-helper.empty-area{border-style:dashed}.spn-area-helper-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.spn-area-helper-head b{font-size:11px;font-weight:900;color:#075985}.spn-area-helper-head button{padding:6px 7px;border-radius:9px;border:1px solid #bae6fd;background:#fff;color:#0369a1;font-size:10px;font-weight:900;box-shadow:none}.spn-area-presets,.spn-area-context{display:grid;grid-template-columns:1fr 1fr;gap:5px}.spn-area-context{margin-top:5px}.spn-area-presets button,.spn-area-context button{padding:7px 8px;border-radius:10px;border:1px solid #bae6fd;background:#fff;color:#075985;text-align:left;font-size:10px;line-height:1.15;font-weight:900;box-shadow:none}.spn-area-context button{color:#0369a1;background:#f8fdff}.spn-area-presets button:hover,.spn-area-context button:hover,.spn-area-helper-head button:hover{transform:none;box-shadow:none;background:#e0f2fe}.spn-area-helper p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-area-presets,.spn-area-context{grid-template-columns:1fr}}@media print{.spn-area-helper{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
