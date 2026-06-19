const blockControls = [
  { id:'showBrand', title:'Логотип', hint:'фирменность Этажей' },
  { id:'showHeadline', title:'Заголовок', hint:'главный крючок' },
  { id:'showPrice', title:'Цена / бюджет', hint:'цена или ориентир' },
  { id:'showDescription', title:'Описание', hint:'короткий смысл' },
  { id:'showMeta', title:'Параметры', hint:'район, тип, метраж' },
  { id:'showBenefits', title:'Причины', hint:'почему позвонить' },
  { id:'showCustomBlock', title:'Доп. блок', hint:'важно / бонус / условия' },
  { id:'showPhoto', title:'Фото', hint:'визуал объекта' },
  { id:'showContact', title:'Контакты', hint:'телефон и имя' },
  { id:'showQr', title:'QR', hint:'ссылка / объект' },
  { id:'tearOffs', title:'Отрывные', hint:'листочки с телефоном' }
];

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const blockManager = document.querySelector('.block-manager');
  if(!blockManager || document.getElementById('spnBlockControls')) return;
  blockManager.insertAdjacentHTML('afterend', renderBlockControls());
  bindBlockControls();
  updateBlockControls();
});

function renderBlockControls(){
  return `<div class="spn-block-controls" id="spnBlockControls">
    <div class="spn-block-controls-head">
      <div>
        <b>Блоки на макете</b>
        <span>Включайте только то, что нужно для конкретной расклейки.</span>
      </div>
      <button type="button" id="spnBlockRecommendedBtn">Рекомендовано</button>
    </div>
    <div class="spn-block-controls-grid">
      ${blockControls.map(item => `<button type="button" data-spn-block-toggle="${item.id}">
        <b>${escapeHtml(item.title)}</b>
        <span>${escapeHtml(item.hint)}</span>
      </button>`).join('')}
    </div>
    <div class="spn-block-presets">
      <button type="button" data-spn-block-preset="minimal">Минимум</button>
      <button type="button" data-spn-block-preset="selling">Продающий</button>
      <button type="button" data-spn-block-preset="entrance">Подъезд</button>
      <button type="button" data-spn-block-preset="photo">С фото</button>
    </div>
  </div>`;
}

function bindBlockControls(){
  document.getElementById('spnBlockControls')?.addEventListener('click', event => {
    const toggle = event.target.closest('[data-spn-block-toggle]');
    const preset = event.target.closest('[data-spn-block-preset]');
    const recommended = event.target.closest('#spnBlockRecommendedBtn');
    if(toggle){
      flipExistingControl(toggle.dataset.spnBlockToggle);
      window.setTimeout(updateBlockControls, 70);
    }
    if(preset){
      applyBlockPreset(preset.dataset.spnBlockPreset);
      window.setTimeout(updateBlockControls, 70);
    }
    if(recommended){
      applyRecommendedPreset();
      window.setTimeout(updateBlockControls, 70);
    }
  });

  blockControls.forEach(item => {
    const el = document.getElementById(item.id);
    if(!el) return;
    el.addEventListener('change', updateBlockControls);
    el.addEventListener('input', updateBlockControls);
  });
}

function updateBlockControls(){
  blockControls.forEach(item => {
    const btn = document.querySelector(`[data-spn-block-toggle="${item.id}"]`);
    const input = document.getElementById(item.id);
    if(!btn || !input) return;
    const active = Boolean(input.checked);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function flipExistingControl(id){
  const input = document.getElementById(id);
  if(!input) return;
  input.checked = !input.checked;
  input.dispatchEvent(new Event('change', {bubbles:true}));
}

function applyBlockPreset(preset){
  const sets = {
    minimal: {
      showBrand:true, showHeadline:true, showPrice:false, showDescription:true, showMeta:false, showBenefits:false, showCustomBlock:false, showPhoto:false, showContact:true, showQr:false, tearOffs:true
    },
    selling: {
      showBrand:true, showHeadline:true, showPrice:true, showDescription:true, showMeta:true, showBenefits:true, showCustomBlock:true, showPhoto:false, showContact:true, showQr:false, tearOffs:true
    },
    entrance: {
      showBrand:true, showHeadline:true, showPrice:false, showDescription:true, showMeta:true, showBenefits:true, showCustomBlock:false, showPhoto:false, showContact:true, showQr:false, tearOffs:true
    },
    photo: {
      showBrand:true, showHeadline:true, showPrice:true, showDescription:true, showMeta:true, showBenefits:true, showCustomBlock:false, showPhoto:true, showContact:true, showQr:true, tearOffs:false
    }
  };
  applySet(sets[preset] || sets.selling);
  setStatus(`Применён состав блоков: ${getPresetTitle(preset)}.`);
}

function applyRecommendedPreset(){
  const printCount = getPrintCount();
  const text = `${value('templateSearch')} ${value('headline')} ${value('description')} ${document.querySelector('[data-spn-situation].active')?.textContent || ''}`.toLowerCase().replace(/ё/g, 'е');
  if(text.includes('подъезд') || text.includes('сосед') || printCount >= 4){
    applyBlockPreset('entrance');
    return;
  }
  if(text.includes('фото') || text.includes('объект') || text.includes('продам')){
    applyBlockPreset('photo');
    return;
  }
  if(printCount >= 6){
    applyBlockPreset('minimal');
    return;
  }
  applyBlockPreset('selling');
}

function applySet(values){
  Object.entries(values).forEach(([id, checked]) => {
    const input = document.getElementById(id);
    if(!input) return;
    input.checked = Boolean(checked);
    input.dispatchEvent(new Event('change', {bubbles:true}));
  });
}

function getPrintCount(){
  const active = document.querySelector('[data-count].active');
  return Number(active?.dataset.count || 2);
}
function getPresetTitle(id){
  return ({minimal:'минимум', selling:'продающий', entrance:'подъезд', photo:'с фото'}[id] || 'рекомендованный');
}
function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
function injectStyles(){
  if(document.getElementById('spnBlockControlsStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnBlockControlsStyles';
  style.textContent = `.spn-block-controls{margin:0 0 10px;padding:10px;border:1px solid #e2e8f0;border-radius:16px;background:#fff}.spn-block-controls-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}.spn-block-controls-head b{display:block;font-size:12px;line-height:1.15;color:#111827;font-weight:900}.spn-block-controls-head span{display:block;margin-top:3px;color:#64748b;font-size:10.5px;line-height:1.2;font-weight:700}.spn-block-controls-head button{padding:7px 9px;border-radius:10px;border:1px solid #fecaca;background:#fff7f7;color:#b91c1c;font-size:10.5px;font-weight:900;box-shadow:none}.spn-block-controls-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.spn-block-controls-grid button{display:grid;gap:2px;min-height:46px;padding:7px 8px;border-radius:11px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;text-align:left;box-shadow:none}.spn-block-controls-grid button b{font-size:11px;line-height:1.12;font-weight:900}.spn-block-controls-grid button span{font-size:9.8px;line-height:1.15;color:#64748b;font-weight:700}.spn-block-controls-grid button.active{border-color:#16a34a;background:#f0fdf4;color:#166534}.spn-block-controls-grid button.active span{color:#047857}.spn-block-controls-grid button:hover,.spn-block-presets button:hover,.spn-block-controls-head button:hover{transform:none;box-shadow:none;filter:brightness(.98)}.spn-block-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:8px}.spn-block-presets button{padding:7px 5px;border-radius:10px;border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8;font-size:10px;font-weight:900;box-shadow:none}@media(max-width:520px){.spn-block-controls-head{flex-direction:column}.spn-block-controls-grid,.spn-block-presets{grid-template-columns:1fr}}@media print{.spn-block-controls{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
