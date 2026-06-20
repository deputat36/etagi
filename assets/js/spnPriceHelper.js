document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const price = document.getElementById('price');
  const priceLabel = price?.closest('label');
  if(!price || !priceLabel || document.getElementById('spnPriceHelper')) return;
  priceLabel.insertAdjacentHTML('afterend', renderHelper());
  bindHelper();
  renderPriceIdeas();
});

function renderHelper(){
  return `<div class="spn-price-helper" id="spnPriceHelper">
    <div class="spn-price-helper-head">
      <b>Цена / бюджет</b>
      <button type="button" id="priceHideBtn">Не показывать</button>
    </div>
    <div class="spn-price-ideas" id="spnPriceIdeas"></div>
    <p>Можно писать не только цену объекта, но и бюджет покупателя: так макет точнее попадает в задачу.</p>
  </div>`;
}

function bindHelper(){
  document.getElementById('spnPriceHelper')?.addEventListener('click', event => {
    const idea = event.target.closest('[data-price-idea]');
    const hide = event.target.closest('#priceHideBtn');
    if(idea){
      setValue('price', idea.dataset.priceIdea);
      setChecked('showPrice', true);
      setStatus('Формулировка цены / бюджета подставлена.');
    }
    if(hide){
      setChecked('showPrice', false);
      setStatus('Блок цены / бюджета скрыт на макете.');
    }
    window.setTimeout(renderPriceIdeas, 50);
  });
  ['price','propertyType','area','showPrice'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', renderPriceIdeas);
    el.addEventListener('change', renderPriceIdeas);
  });
}

function renderPriceIdeas(){
  const box = document.getElementById('spnPriceIdeas');
  const helper = document.getElementById('spnPriceHelper');
  const showPrice = document.getElementById('showPrice');
  if(!box || !helper) return;
  helper.classList.toggle('disabled', showPrice && !showPrice.checked);
  const raw = value('price');
  const amount = normalizeAmount(raw) || '4 000 000 ₽';
  const type = value('propertyType') || 'объект';
  const area = value('area') || 'районе';
  const ideas = [
    amount,
    `до ${amount}`,
    `бюджет до ${amount}`,
    `${amount}, торг обсуждается`,
    `рассмотрим ${type} до ${amount}`,
    `интересует ${area}, до ${amount}`
  ];
  box.innerHTML = ideas.map(item => `<button type="button" data-price-idea="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('');
}

function normalizeAmount(value){
  const text = String(value || '').trim();
  if(!text) return '';
  if(/[а-яa-z₽]/i.test(text)) return text;
  const digits = text.replace(/\D/g, '');
  if(!digits) return text;
  return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
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
function injectStyles(){
  if(document.getElementById('spnPriceHelperStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnPriceHelperStyles';
  style.textContent = `.spn-price-helper{margin:-3px 0 9px;padding:9px;border:1px solid #fed7aa;border-radius:13px;background:#fff7ed}.spn-price-helper.disabled{opacity:.58}.spn-price-helper-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.spn-price-helper-head b{font-size:11px;font-weight:900;color:#9a3412}.spn-price-helper-head button{padding:6px 7px;border-radius:9px;border:1px solid #fed7aa;background:#fff;color:#c2410c;font-size:10px;font-weight:900;box-shadow:none}.spn-price-ideas{display:grid;grid-template-columns:1fr 1fr;gap:5px}.spn-price-ideas button{padding:7px 8px;border-radius:10px;border:1px solid #fed7aa;background:#fff;color:#9a3412;text-align:left;font-size:10px;line-height:1.15;font-weight:900;box-shadow:none}.spn-price-ideas button:hover,.spn-price-helper-head button:hover{transform:none;box-shadow:none;background:#ffedd5}.spn-price-helper p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-price-ideas{grid-template-columns:1fr}}@media print{.spn-price-helper{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
