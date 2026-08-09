const flatPresets = [
  '1-комн., 35 м², 3/5 эт.',
  '2-комн., 48 м², 2/5 эт.',
  '3-комн., 62 м², 4/9 эт.',
  'студия, 28 м², 6/10 эт.',
  'без ремонта, можно под себя',
  'ремонт, мебель, техника'
];

const housePresets = [
  'дом 80 м², участок 6 сот.',
  'дом 120 м², участок 8 сот.',
  'газ, свет, вода',
  'заезд, двор, хозпостройки',
  'кирпич / блок, 1 этаж',
  'подходит для постоянного проживания'
];

const landPresets = [
  '6 сот., ИЖС',
  '10 сот., ИЖС',
  'ровный участок',
  'свет рядом / по границе',
  'асфальтированный подъезд',
  'рядом жилые дома'
];

const commercialPresets = [
  'помещение 50 м²',
  '1 этаж, отдельный вход',
  'проходное место',
  'свободная планировка',
  'под офис / торговлю / услуги',
  'парковка рядом'
];

document.addEventListener('DOMContentLoaded', () => {
  const params = document.getElementById('params');
  const paramsLabel = params?.closest('label');
  if(!params || !paramsLabel || document.getElementById('spnParamsHelper')) return;
  paramsLabel.insertAdjacentHTML('afterend', renderHelper());
  bindHelper();
  renderParamIdeas();
});

function renderHelper(){
  return `<div class="spn-params-helper" id="spnParamsHelper">
    <div class="spn-params-helper-head">
      <b>Параметры объекта</b>
      <button type="button" id="paramsHideBtn">Не показывать</button>
    </div>
    <div class="spn-params-ideas" id="spnParamsIdeas"></div>
    <p>Параметры лучше писать коротко: комнаты, площадь, этаж, участок или ключевое состояние объекта.</p>
  </div>`;
}

function bindHelper(){
  document.getElementById('spnParamsHelper')?.addEventListener('click', event => {
    const idea = event.target.closest('[data-param-idea]');
    const hide = event.target.closest('#paramsHideBtn');
    if(idea){
      applyIdea(idea.dataset.paramIdea);
      setChecked('showMeta', true);
      setStatus('Параметры объекта подставлены.');
    }
    if(hide){
      setChecked('showMeta', false);
      setStatus('Блок параметров скрыт на макете.');
    }
    window.setTimeout(renderParamIdeas, 50);
  });
  ['params','propertyType','showMeta'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', renderParamIdeas);
    el.addEventListener('change', renderParamIdeas);
  });
}

function renderParamIdeas(){
  const box = document.getElementById('spnParamsIdeas');
  const helper = document.getElementById('spnParamsHelper');
  const showMeta = document.getElementById('showMeta');
  if(!box || !helper) return;
  helper.classList.toggle('disabled', showMeta && !showMeta.checked);
  const ideas = getIdeas();
  box.innerHTML = ideas.map(item => `<button type="button" data-param-idea="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('');
}

function getIdeas(){
  const type = value('propertyType').toLowerCase().replace(/ё/g, 'е');
  const current = value('params');
  if(type.includes('дом') || type.includes('коттедж') || type.includes('таун')) return withCurrent(current, housePresets);
  if(type.includes('участ')) return withCurrent(current, landPresets);
  if(type.includes('коммер') || type.includes('помещ') || type.includes('офис')) return withCurrent(current, commercialPresets);
  return withCurrent(current, flatPresets);
}

function withCurrent(current, presets){
  const clean = String(current || '').trim();
  const list = clean ? [clean, ...presets] : presets;
  return [...new Set(list)].slice(0, 6);
}

function applyIdea(idea){
  setValue('params', idea);
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
