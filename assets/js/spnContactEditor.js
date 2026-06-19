const CONTACT_CTA_KEY = 'etagi-raskleyka-contact-cta-v1';

const ctaPresets = [
  'Позвоните — подскажу по объекту и условиям',
  'Позвоните — обсудим спокойно и без давления',
  'Напишите или позвоните — подскажу детали',
  'Уточните цену, спрос и возможные варианты',
  'Помогу разобраться с документами и сделкой',
  'Звонок ни к чему не обязывает'
];

document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  const phone = document.getElementById('agentPhone');
  const phoneLabel = phone?.closest('label');
  if(!phone || !phoneLabel || document.getElementById('contactCtaEditor')) return;
  phoneLabel.insertAdjacentHTML('afterend', renderEditor());
  bindEditor();
  restoreCta();
});

function renderEditor(){
  return `<div class="spn-contact-editor" id="contactCtaEditor">
    <label>Призыв в блоке контактов<input id="contactCtaText" type="text" maxlength="90" placeholder="Позвоните — подскажу по объекту и условиям"></label>
    <div class="spn-contact-presets">
      ${ctaPresets.map(item => `<button type="button" data-contact-cta="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('')}
    </div>
    <p>Этот текст печатается под именем и телефоном. Делайте его коротким и понятным.</p>
  </div>`;
}

function bindEditor(){
  const input = document.getElementById('contactCtaText');
  input?.addEventListener('input', () => {
    saveCta(input.value);
    rerenderFlyer();
  });
  document.getElementById('contactCtaEditor')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-contact-cta]');
    if(!btn || !input) return;
    input.value = btn.dataset.contactCta;
    saveCta(input.value);
    rerenderFlyer();
  });
}

function restoreCta(){
  const input = document.getElementById('contactCtaText');
  if(!input) return;
  input.value = loadCta();
  rerenderFlyer();
}

function rerenderFlyer(){
  const phone = document.getElementById('agentPhone');
  if(!phone) return;
  phone.dispatchEvent(new Event('input', {bubbles:true}));
  const status = document.getElementById('statusLine');
  if(status) status.textContent = 'Призыв в контактах обновлён.';
}

function saveCta(value){
  try{
    localStorage.setItem(CONTACT_CTA_KEY, String(value || ctaPresets[0]).trim() || ctaPresets[0]);
  } catch(e){}
}
function loadCta(){
  try{
    return localStorage.getItem(CONTACT_CTA_KEY) || ctaPresets[0];
  } catch(e){
    return ctaPresets[0];
  }
}
function injectStyles(){
  if(document.getElementById('contactCtaEditorStyles')) return;
  const style = document.createElement('style');
  style.id = 'contactCtaEditorStyles';
  style.textContent = `.spn-contact-editor{margin:-3px 0 9px;padding:9px;border:1px solid #bbf7d0;border-radius:13px;background:#f0fdf4}.spn-contact-editor label{display:grid;gap:5px;font-size:11px;font-weight:900;color:#166534}.spn-contact-editor input{background:#fff}.spn-contact-presets{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:7px}.spn-contact-presets button{padding:7px 8px;border-radius:10px;border:1px solid #bbf7d0;background:#fff;color:#166534;text-align:left;font-size:10px;line-height:1.15;font-weight:900;box-shadow:none}.spn-contact-presets button:hover{transform:none;box-shadow:none;background:#dcfce7}.spn-contact-editor p{margin:7px 0 0;color:#475569;font-size:10.5px;line-height:1.25;font-weight:700}@media(max-width:520px){.spn-contact-presets{grid-template-columns:1fr}}@media print{.spn-contact-editor{display:none!important}}`;
  document.head.appendChild(style);
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
