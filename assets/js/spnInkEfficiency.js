const STYLE_ID = 'spnInkEfficiencyStyles';
const TIP_ATTR = 'data-ink-efficiency-tip';

window.addEventListener('DOMContentLoaded', () => {
  const layoutGrid = document.getElementById('layoutModeGrid');
  const qualityList = document.getElementById('qualityList');

  injectStyles();

  if(layoutGrid){
    layoutGrid.addEventListener('click', prepareCompactLayoutColor, true);
  }

  if(qualityList){
    scheduleInkTip(qualityList);
    new MutationObserver(() => scheduleInkTip(qualityList)).observe(qualityList, {
      childList: true,
      subtree: true
    });
    qualityList.addEventListener('click', handleInkAction);
  }
});

let tipFrame = 0;

function prepareCompactLayoutColor(event){
  const button = event.target.closest('[data-layout-mode="economy"], [data-layout-mode="entrance"]');
  if(!button) return;

  const colorMode = document.getElementById('colorMode');
  if(!colorMode || colorMode.value !== 'brand') return;

  colorMode.value = 'economy';
  colorMode.dispatchEvent(new Event('change', {bubbles:true}));
  setStatus('Для плотной печати включён облегчённый фирменный цвет без больших сплошных заливок.');
}

function scheduleInkTip(list){
  window.cancelAnimationFrame(tipFrame);
  tipFrame = window.requestAnimationFrame(() => {
    tipFrame = 0;
    updateInkTip(list);
  });
}

function updateInkTip(list){
  const existing = list.querySelector(`[${TIP_ATTR}]`);
  const colorMode = document.getElementById('colorMode');
  const showContact = document.getElementById('showContact');
  const activeCount = document.querySelector('#printPresetRow [data-count].active');
  const count = Number(activeCount?.dataset.count) || 2;
  const shouldShow = colorMode?.value === 'brand' && Boolean(showContact?.checked) && count >= 4;

  if(!shouldShow){
    existing?.remove();
    return;
  }
  if(existing) return;

  const item = document.createElement('div');
  item.className = 'qitem tip ink-efficiency-tip';
  item.setAttribute(TIP_ATTR, '');
  item.innerHTML = '<b>Повышенный расход чернил</b>При 4 и более макетах тёмная контактная плашка повторяется несколько раз. Экономный цвет сохранит фото и фирменный акцент, но заменит крупные заливки светлым фоном и рамкой.<br><button type="button" data-ink-efficiency-action="economy">Экономный цвет</button>';
  list.append(item);
}

function handleInkAction(event){
  const button = event.target.closest('[data-ink-efficiency-action="economy"]');
  if(!button) return;

  const colorMode = document.getElementById('colorMode');
  if(!colorMode) return;

  colorMode.value = 'economy';
  colorMode.dispatchEvent(new Event('change', {bubbles:true}));
  setStatus('Включён экономный цвет: фото и акценты сохранены, крупные сплошные заливки облегчены.');
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
    .flyer.color-economy{--accent:#0b72b9}
    .flyer.color-economy .brand-mark{
      background:#fff!important;
      color:var(--accent)!important;
      border:.35mm solid currentColor;
    }
    .flyer.color-economy .contact{
      background:#fff!important;
      color:#111827!important;
      border:.55mm solid var(--accent)!important;
      box-shadow:inset 0 1.1mm 0 var(--accent)!important;
    }
    .flyer.color-economy .contact .cta,
    .flyer.color-economy .qr-row span{color:#334155!important}
    .flyer.color-economy .benefit:before{
      background:#fff!important;
      color:var(--accent)!important;
      border:.25mm solid currentColor;
    }
    .flyer.color-economy .meta div{
      background:#f8fafc!important;
      border:.2mm solid #e2e8f0;
    }
    .flyer.color-economy.layout-photo_card:not(.photo-mode-plan) .headline{
      color:#111827!important;
      background:rgba(255,255,255,.94)!important;
      border-left:1.2mm solid var(--accent)!important;
      text-shadow:none!important;
      box-shadow:0 1mm 3mm rgba(15,23,42,.12)!important;
    }
    .flyer.color-economy.layout-agent_brand_photo .agent-brand-identity{
      background:#fff!important;
      border-top:.2mm solid #e2e8f0;
      border-right:.2mm solid #e2e8f0;
      border-bottom:.2mm solid #e2e8f0;
    }
    .flyer.color-economy.layout-newbuild_visual .photos,
    .flyer.color-economy.layout-agent_brand_photo .photos{box-shadow:none!important}
    .ink-efficiency-tip button{background:#fff;border:1px solid #94a3b8;color:#1e293b}
    @media print{
      .flyer.color-economy{
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      }
    }
  `;
  document.head.appendChild(style);
}
