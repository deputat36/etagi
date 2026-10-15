const STYLE_ID = 'spnPreviewQuickBarStyles';
const PREVIEW_BLOCKS = [
  ['headline', '.headline', 'Заголовок', 'showHeadline'],
  ['price', '.subline', 'Цена', 'showPrice'],
  ['photo', '.photos', 'Фото', 'showPhoto'],
  ['description', '.desc', 'Описание', 'showDescription'],
  ['meta', '.meta', 'Параметры', 'showMeta'],
  ['benefits', '.benefits', 'Преимущества', 'showBenefits'],
  ['customBlock', '.custom-block', 'Дополнительный блок', 'showCustomBlock'],
  ['contact', '.contact', 'Контакты', 'showContact'],
  ['brand', '.brand-row', 'Фирменная строка', 'showBrand'],
  ['qr', '.qr-row', 'QR', 'showQr'],
  ['tears', '.tears', 'Отрывные телефоны', 'tearOffs']
];

window.addEventListener('DOMContentLoaded', () => {
  const previewTop = document.querySelector('.workspace .preview-top');
  const controls = previewTop?.querySelector('.zoom-control');
  const previewStatus = document.getElementById('previewStatus');

  if(!previewTop || !controls || document.getElementById('spnJumpToPrintBtn')) return;

  injectStyles();
  previewTop.classList.add('spn-preview-quickbar');
  previewTop.setAttribute('aria-label', 'Состояние макета и управление предпросмотром');
  previewStatus?.setAttribute('aria-live', 'polite');
  previewStatus?.setAttribute('aria-atomic', 'true');

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'spnJumpToPrintBtn';
  button.className = 'spn-jump-to-print';
  button.textContent = 'К печати';
  button.setAttribute('aria-label', 'Перейти к проверке и настройкам печати');
  button.addEventListener('click', jumpToPrintControls);
  controls.prepend(button);
  bindPreviewEditing(previewTop);
});

function bindPreviewEditing(previewTop){
  const sheet = document.getElementById('printSheet');
  if(!sheet) return;
  previewTop.insertAdjacentHTML('beforeend', `
    <div class="spn-preview-edit-actions" aria-label="Редактирование макета">
      <button type="button" data-preview-open="photo" aria-controls="photoOne">Фото</button>
      <button type="button" data-preview-open="qr" aria-controls="qrLink">QR и ссылка</button>
      <button type="button" data-preview-open="blocks" aria-controls="spnBlockControls">Состав макета</button>
    </div>
    <div id="spnPreviewBlockActions" class="spn-preview-block-actions" role="toolbar" aria-label="Действия с выбранным блоком" hidden>
      <b id="spnPreviewBlockName" aria-live="polite"></b>
      <button type="button" data-preview-move="up" aria-label="Поднять блок">↑</button>
      <button type="button" data-preview-move="down" aria-label="Опустить блок">↓</button>
      <button type="button" data-preview-toggle>Скрыть</button>
      <button type="button" data-preview-done>Готово</button>
    </div>`);
  const blockActions = document.getElementById('spnPreviewBlockActions');
  let selected = null;
  let syncFrame = 0;
  const orderButton = direction => selected && document.querySelector(`#blockOrderList button[data-block-id="${selected[0]}"][data-block-move="${direction}"]`);
  const syncActions = () => {
    blockActions.hidden = !selected;
    const hint = document.getElementById('spnInlinePreviewHint');
    if(hint) hint.hidden = Boolean(selected);
    if(!selected) return;
    const input = document.getElementById(selected[3]);
    const name = document.getElementById('spnPreviewBlockName');
    if(name.textContent !== selected[2]) name.textContent = selected[2];
    blockActions.querySelector('[data-preview-toggle]').textContent = input?.checked ? 'Скрыть' : 'Показать';
    for(const button of blockActions.querySelectorAll('[data-preview-move]')){
      const original = orderButton(button.dataset.previewMove);
      button.disabled = !original || original.disabled;
    }
  };
  previewTop.addEventListener('click', event => {
    const open = event.target.closest('[data-preview-open]');
    if(open){
      const type = open.dataset.previewOpen;
      const target = type === 'blocks'
        ? document.querySelector('#spnBlockControls [data-spn-block-toggle]')
        : document.getElementById(type === 'qr' ? 'qrLink' : 'photoOne');
      openEditor(type === 'blocks' ? 'content' : 'media', target);
      return;
    }
    const move = event.target.closest('[data-preview-move]');
    if(move) orderButton(move.dataset.previewMove)?.click();
    if(event.target.closest('[data-preview-toggle]') && selected){
      const input = document.getElementById(selected[3]);
      if(input){
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', {bubbles:true}));
        setStatus(`Блок «${selected[2]}» ${input.checked ? 'показан' : 'скрыт'}.`);
      }
    }
    if(event.target.closest('[data-preview-done]')) selected = null;
    syncActions();
  });
  const selectBlock = event => {
    const block = event.target.closest(PREVIEW_BLOCKS.map(item => item[1]).join(','));
    if(!block) return;
    selected = PREVIEW_BLOCKS.find(item => block.matches(item[1]));
    syncActions();
  };
  let pointerSelecting = false;
  sheet.addEventListener('pointerdown', event => {
    if(event.button !== 0) return;
    pointerSelecting = true;
    if(event.target.closest('[data-preview-control]')) event.preventDefault();
  });
  sheet.addEventListener('pointerup', event => {
    pointerSelecting = false;
    if(event.button !== 0) return;
    const control = event.target.closest('[data-preview-control]');
    if(!control) return;
    document.activeElement?.blur();
    selectBlock({target:control});
    activateMediaControl(control);
  });
  for(const type of ['pointercancel', 'pointerleave']) sheet.addEventListener(type, () => { pointerSelecting = false; });
  sheet.addEventListener('focusin', event => { if(!pointerSelecting) selectBlock(event); });
  sheet.addEventListener('click', event => {
    selectBlock(event);
    if(event.detail === 0) activateMediaControl(event.target.closest('[data-preview-control]'));
  });
  sheet.addEventListener('keydown', event => {
    pointerSelecting = false;
    const control = event.target.closest('[data-preview-control]');
    if(!control || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    activateMediaControl(control);
  });
  document.addEventListener('spn:form-synced', () => {
    window.cancelAnimationFrame(syncFrame);
    syncFrame = window.requestAnimationFrame(syncActions);
  });
  for(const container of [document.querySelector('.media-card'), document.getElementById('spnBlockControls')]){
    if(!container) continue;
    container.insertAdjacentHTML('beforeend', '<button type="button" class="spn-preview-return" data-preview-return>К макету</button>');
    container.addEventListener('click', event => {
      if(!event.target.closest('[data-preview-return]')) return;
      document.querySelector('.workspace')?.scrollIntoView({behavior:'smooth', block:'start'});
      const editable = sheet.querySelector('[data-inline-field="headline"]') || sheet.querySelector('[data-inline-field]');
      editable?.focus({preventScroll:true});
    });
  }
}

function activateMediaControl(control){
  if(!control) return;
  if(control.dataset.previewControl === 'qr') openEditor('media', document.getElementById('qrLink'));
  else document.getElementById(control.dataset.previewControl)?.click();
}

function openEditor(step, target){
  if(!target) return;
  document.dispatchEvent(new CustomEvent('spn:wizard-open-step', {detail:{id:step}}));
  document.dispatchEvent(new CustomEvent('spn:reveal-form-field', {detail:{id:target.id}}));
  target.closest('details')?.setAttribute('open', '');
  window.requestAnimationFrame(() => {
    target.scrollIntoView({behavior:'smooth', block:'center'});
    target.focus({preventScroll:true});
  });
}

function jumpToPrintControls(){
  document.dispatchEvent(new CustomEvent('spn:wizard-open-step', {detail:{id:'check'}}));
  const printCard = document.querySelector('.sidebar .print-card');
  const qualityButton = document.getElementById('qualityBtn');
  const printButton = document.getElementById('printBtn');
  const target = qualityButton || printButton;

  if(!printCard || !target) return;

  printCard.scrollIntoView({block:'center', behavior:'smooth'});
  window.setTimeout(() => target.focus(), 280);
  setStatus('Проверьте макет и затем нажмите «Печать / PDF».');
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .workspace .preview-top.spn-preview-quickbar{
      position:sticky;
      top:-1px;
      z-index:20;
      margin:-4px -4px 10px;
      padding:10px 8px;
      border-bottom:1px solid #e2e8f0;
      background:rgba(255,255,255,.97);
      backdrop-filter:blur(8px);
      flex-wrap:wrap;
    }
    .spn-preview-quickbar .preview-status{gap:6px}
    .spn-preview-quickbar .stat{font-size:12px;padding:6px 9px}
    .spn-preview-quickbar .zoom-control{flex-wrap:wrap;justify-content:flex-end}
    .spn-preview-edit-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;flex-basis:100%;width:100%;margin-top:8px}
    .spn-preview-edit-actions button,.spn-preview-block-actions button,.spn-preview-return{min-height:44px;border:1px solid #d8e0ea;background:#fff;color:#111827;font-size:13px;box-shadow:none}
    .spn-preview-edit-actions button:focus-visible,.spn-preview-block-actions button:focus-visible,.spn-preview-return:focus-visible{outline:2px solid var(--red);outline-offset:2px}
    .spn-preview-block-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex-basis:100%;width:100%;padding-top:8px;border-top:1px solid #e2e8f0}
    .spn-preview-block-actions[hidden]{display:none}
    .spn-preview-block-actions b{font-size:13px;flex:1;min-width:100px}
    .spn-preview-block-actions button{min-width:44px}
    .spn-preview-block-actions button:disabled{opacity:.4;cursor:default}
    .spn-preview-return{margin-top:10px;width:100%;color:var(--red)}
    #printSheet [data-preview-control]{cursor:pointer}
    #printSheet [data-preview-control]:focus-visible{outline:2px solid var(--red);outline-offset:1px}
    .spn-jump-to-print{
      background:var(--accent);
      color:#fff;
      border:1px solid var(--accent);
      padding:9px 13px;
      box-shadow:none;
    }
    .spn-jump-to-print:hover{box-shadow:0 7px 16px rgba(15,23,42,.12)}
    .spn-jump-to-print:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 32%,transparent);outline-offset:2px}
    @media(max-width:640px){
      .workspace .preview-top.spn-preview-quickbar{display:grid;grid-template-columns:1fr;gap:8px}
      .spn-preview-quickbar .zoom-control{justify-content:flex-start;width:100%}
      .spn-preview-quickbar .zoom-control input{min-width:120px;flex:1}
      .spn-jump-to-print{min-height:44px;flex:1}
      .spn-preview-quickbar .stat{font-size:12.5px;line-height:1.2}
      .spn-preview-block-actions{display:grid;grid-template-columns:44px 44px minmax(0,1fr) minmax(0,1fr)}
      .spn-preview-block-actions b{grid-column:1/-1;min-width:0}
    }
    @media print{.spn-jump-to-print,.spn-preview-return{display:none!important}#printSheet [data-preview-control]{outline:none!important;cursor:default!important}}
  `;
  document.head.appendChild(style);
}
