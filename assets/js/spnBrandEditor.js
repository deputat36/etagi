const BRAND_NAME_KEY = 'etagi-raskleyka-brand-name-v1';
const BRAND_SIDE_KEY = 'etagi-raskleyka-brand-side-v1';

const brandNamePresets = ['Этажи', 'Этажи Борисоглебск', 'Агентство Этажи'];
const sidePresets = ['etagi.com', 'Борисоглебск', 'Этажи Борисоглебск', 'Недвижимость'];

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
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
  if(name) name.value = load(BRAND_NAME_KEY, 'Этажи');
  if(side) side.value = load(BRAND_SIDE_KEY, 'etagi.com');
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
  save(BRAND_NAME_KEY, name);
  save(BRAND_SIDE_KEY, side);
}

function rerenderFlyer(){
  const showBrand = document.getElementById('showBrand');
  if(!showBrand) return;
  showBrand.dispatchEvent(new Event('change', {bubbles:true}));
  const status = document.getElementById('statusLine');
  if(status) status.textContent = 'Брендовая строка обновлена.';
}

function save(key, value){
  try{ localStorage.setItem(key, value); } catch(e){}
}
function load(key, fallback){
  try{ return localStorage.getItem(key) || fallback; } catch(e){ return fallback; }
}
function injectStyles(){
  if(document.getElementById('brandRowEditorStyles')) return;
  const style = document.createElement('style');
  style.id = 'brandRowEditorStyles';
  style.textContent = `.spn-brand-editor{margin:-2px 0 9px;padding:9px;border:1px solid #fecaca;border-radius:13px;background:#fff7f7}.spn-brand-editor.disabled{opacity:.58}.spn-brand-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.spn-brand-editor label{display:grid;gap:5px;font-size:11px;font-weight:900;color:#991b1b}.spn-brand-editor input{background:#fff}.spn-brand-presets{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.spn-brand-presets button{padding:6px 7px;border-radius:999px;border:1px solid #fecaca;background:#fff;color:#b91c1c;font-size:10px;font-weight:900;box-shadow:none}.spn-brand-presets button:hover{transform:none;box-shadow:none;background:#fee2e2}.spn-brand-editor p{margin:7px 0 0;color:#64748b;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-brand-editor-grid{grid-template-columns:1fr}}@media print{.spn-brand-editor{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
