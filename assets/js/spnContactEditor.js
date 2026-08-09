import { getLayoutExtra, setLayoutExtraValue } from './layoutExtras.js';

const ctaPresets = [
  'Позвоните — подскажу по объекту и условиям',
  'Позвоните — обсудим спокойно и без давления',
  'Напишите или позвоните — подскажу детали',
  'Уточните цену, спрос и возможные варианты',
  'Помогу разобраться с документами и сделкой',
  'Звонок ни к чему не обязывает'
];

document.addEventListener('DOMContentLoaded', () => {
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
  setLayoutExtraValue('contactCta', String(value || ctaPresets[0]).trim() || ctaPresets[0], {syncInput:false});
}
function loadCta(){
  return getLayoutExtra(null, 'contactCta');
}

function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
