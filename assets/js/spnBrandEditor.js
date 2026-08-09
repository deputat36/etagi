import { getLayoutExtra, setLayoutExtraValue } from './layoutExtras.js';

const brandNamePresets = ['Этажи', 'Этажи Борисоглебск', 'Агентство Этажи'];
const sidePresets = ['etagi.com', 'Борисоглебск', 'Этажи Борисоглебск', 'Недвижимость'];

document.addEventListener('DOMContentLoaded', () => {
  const showBrand = document.getElementById('showBrand');
  const showBrandLabel = showBrand?.closest('label');
  if(!showBrand || !showBrandLabel || document.getElementById('brandRowEditor')) return;
  showBrandLabel.insertAdjacentHTML('afterend', renderEditor());
  bindEditor();
  restoreBrand();
  updateEditorState();
});

function renderEditor(){
  return `<div class="spn-brand-editor" id="brandRowEditor">
    <div class="spn-brand-editor-grid">
      <label>Текст рядом с логотипом<input id="brandNameText" type="text" maxlength="24" placeholder="Этажи"></label>
      <label>Подпись справа<input id="brandSideText" type="text" maxlength="34" placeholder="etagi.com"></label>
    </div>
    <div class="spn-brand-presets">
      ${brandNamePresets.map(item => `<button type="button" data-brand-name="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('')}
      ${sidePresets.map(item => `<button type="button" data-brand-side="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('')}
    </div>
    <p>Редактируется только текстовая часть брендовой строки. Красная метка «Э» остаётся фирменным якорем макета.</p>
  </div>`;
}

function bindEditor(){
  const name = document.getElementById('brandNameText');
  const side = document.getElementById('brandSideText');
  const showBrand = document.getElementById('showBrand');
  name?.addEventListener('input', () => {
    saveBrand();
    rerenderFlyer();
  });
  side?.addEventListener('input', () => {
    saveBrand();
    rerenderFlyer();
  });
  showBrand?.addEventListener('change', updateEditorState);
  document.getElementById('brandRowEditor')?.addEventListener('click', event => {
    const nameBtn = event.target.closest('[data-brand-name]');
    const sideBtn = event.target.closest('[data-brand-side]');
    if(nameBtn && name){
      name.value = nameBtn.dataset.brandName;
      saveBrand();
      rerenderFlyer();
    }
    if(sideBtn && side){
      side.value = sideBtn.dataset.brandSide;
      saveBrand();
      rerenderFlyer();
    }
  });
}

function restoreBrand(){
  const name = document.getElementById('brandNameText');
  const side = document.getElementById('brandSideText');
  if(name) name.value = loadBrandName();
  if(side) side.value = loadBrandSide();
  rerenderFlyer();
}

function updateEditorState(){
  const editor = document.getElementById('brandRowEditor');
  const showBrand = document.getElementById('showBrand');
  if(!editor || !showBrand) return;
  editor.classList.toggle('disabled', !showBrand.checked);
}

function saveBrand(){
  const name = String(document.getElementById('brandNameText')?.value || 'Этажи').trim() || 'Этажи';
  const side = String(document.getElementById('brandSideText')?.value || 'etagi.com').trim() || 'etagi.com';
  setLayoutExtraValue('brandName', name, {syncInput:false});
  setLayoutExtraValue('brandSideText', side, {syncInput:false});
}

function rerenderFlyer(){
  const showBrand = document.getElementById('showBrand');
  if(!showBrand) return;
  showBrand.dispatchEvent(new Event('change', {bubbles:true}));
  const status = document.getElementById('statusLine');
  if(status) status.textContent = 'Брендовая строка обновлена.';
}

function loadBrandName(){
  return getLayoutExtra(null, 'brandName');
}
function loadBrandSide(){
  return getLayoutExtra(null, 'brandSideText');
}

function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
