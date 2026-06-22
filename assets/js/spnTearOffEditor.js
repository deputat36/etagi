import { getLayoutExtra, setLayoutExtraValue } from './layoutExtras.js';

const labelPresets = ['Недвижимость', 'Куплю квартиру', 'Оценка цены', 'Есть покупатель', 'Продажа дома', 'Консультация'];

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const tearCheckbox = document.getElementById('tearOffs');
  const tearLabel = tearCheckbox?.closest('label');
  if(!tearCheckbox || !tearLabel || document.getElementById('tearOffEditor')) return;
  tearLabel.insertAdjacentHTML('afterend', renderEditor());
  bindEditor();
  restoreLabel();
  updateEditorState();
});

function renderEditor(){
  return `<div class="spn-tear-editor" id="tearOffEditor">
    <label>Надпись на отрывном листе<input id="tearOffLabel" type="text" maxlength="28" placeholder="Недвижимость"></label>
    <div class="spn-tear-presets">
      ${labelPresets.map(item => `<button type="button" data-tear-label="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('')}
    </div>
    <p>Короткая надпись будет стоять отдельно от телефона, чтобы номер оставался крупным и читаемым.</p>
  </div>`;
}

function bindEditor(){
  const input = document.getElementById('tearOffLabel');
  const checkbox = document.getElementById('tearOffs');
  input?.addEventListener('input', () => {
    saveLabel(input.value);
    rerenderFlyer();
  });
  checkbox?.addEventListener('change', updateEditorState);
  document.getElementById('tearOffEditor')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-tear-label]');
    if(!btn || !input) return;
    input.value = btn.dataset.tearLabel;
    saveLabel(input.value);
    rerenderFlyer();
  });
}

function restoreLabel(){
  const input = document.getElementById('tearOffLabel');
  if(!input) return;
  input.value = loadLabel();
  rerenderFlyer();
}

function updateEditorState(){
  const editor = document.getElementById('tearOffEditor');
  const checkbox = document.getElementById('tearOffs');
  if(!editor || !checkbox) return;
  editor.classList.toggle('disabled', !checkbox.checked);
}

function rerenderFlyer(){
  const checkbox = document.getElementById('tearOffs');
  if(!checkbox) return;
  checkbox.dispatchEvent(new Event('change', {bubbles:true}));
  const status = document.getElementById('statusLine');
  if(status) status.textContent = 'Надпись на отрывных листочках обновлена.';
}

function saveLabel(value){
  setLayoutExtraValue('tearOffLabel', String(value || 'Недвижимость').trim() || 'Недвижимость', {syncInput:false});
}
function loadLabel(){
  return getLayoutExtra(null, 'tearOffLabel');
}
function injectStyles(){
  if(document.getElementById('tearOffEditorStyles')) return;
  const style = document.createElement('style');
  style.id = 'tearOffEditorStyles';
  style.textContent = `.spn-tear-editor{margin:-2px 0 9px;padding:9px;border:1px solid #dbeafe;border-radius:13px;background:#eff6ff}.spn-tear-editor.disabled{opacity:.58}.spn-tear-editor label{display:grid;gap:5px;font-size:11px;font-weight:900;color:#1e3a8a}.spn-tear-editor input{background:#fff}.spn-tear-presets{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.spn-tear-presets button{padding:6px 7px;border-radius:999px;border:1px solid #bfdbfe;background:#fff;color:#1d4ed8;font-size:10px;font-weight:900;box-shadow:none}.spn-tear-presets button:hover{transform:none;box-shadow:none;background:#dbeafe}.spn-tear-editor p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media print{.spn-tear-editor{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
