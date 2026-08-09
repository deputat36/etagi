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

function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
