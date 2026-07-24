import { subscribeQualityListUpdates } from './qualityListUpdates.js';

const TIP_ATTR = 'data-ink-efficiency-tip';
const SMOKE_MODE = new URLSearchParams(window.location.search).has('smoke');

window.addEventListener('DOMContentLoaded', () => {
  const layoutGrid = document.getElementById('layoutModeGrid');
  const qualityList = document.getElementById('qualityList');

  if(layoutGrid){
    layoutGrid.addEventListener('click', prepareCompactLayoutColor, true);
  }

  if(qualityList){
    subscribeQualityListUpdates(({list}) => handleQualityListUpdate(list), {
      priority: 5,
      label: 'ink-efficiency'
    });
    qualityList.addEventListener('click', handleInkAction);
  }
});

function handleQualityListUpdate(list){
  if(SMOKE_MODE){
    window.__ETAGI_INK_EFFICIENCY_SCHEDULES__ = Number(window.__ETAGI_INK_EFFICIENCY_SCHEDULES__ || 0) + 1;
  }
  updateInkTip(list);
}

function prepareCompactLayoutColor(event){
  const button = event.target.closest('[data-layout-mode="economy"], [data-layout-mode="entrance"]');
  if(!button) return;

  const colorMode = document.getElementById('colorMode');
  if(!colorMode || colorMode.value !== 'brand') return;

  colorMode.value = 'economy';
  colorMode.dispatchEvent(new Event('change', {bubbles:true}));
  setStatus('Для плотной печати включён облегчённый фирменный цвет без больших сплошных заливок.');
}

function updateInkTip(list){
  if(SMOKE_MODE){
    window.__ETAGI_INK_EFFICIENCY_CHECKS__ = Number(window.__ETAGI_INK_EFFICIENCY_CHECKS__ || 0) + 1;
  }

  const existing = list.querySelector(`[${TIP_ATTR}]`);
  const colorMode = document.getElementById('colorMode');
  const showContact = document.getElementById('showContact');
  const activeCount = document.querySelector('#printPresetRow [data-count].active');
  const count = Number(activeCount?.dataset.count) || 2;
  const shouldShow = colorMode?.value === 'brand'
    && Boolean(showContact?.checked)
    && count >= 4
    && hasDarkContactFill();

  if(!shouldShow){
    existing?.remove();
    return;
  }
  if(existing) return;

  const item = document.createElement('div');
  item.className = 'qitem tip ink-efficiency-tip';
  item.setAttribute(TIP_ATTR, '');
  item.innerHTML = '<b>Повышенный расход чернил</b>Контактная зона снова стала тёмной. Экономный цвет вернёт светлый фон, заметную рамку и узкую акцентную полосу без удаления телефона, фото или QR.<br><button type="button" data-ink-efficiency-action="economy">Экономный цвет</button>';
  list.append(item);
}

function hasDarkContactFill(){
  const contact = document.querySelector('#printSheet .flyer .contact');
  if(!contact) return false;
  return relativeLuminance(getComputedStyle(contact).backgroundColor) < 0.82;
}

function relativeLuminance(value){
  const rgb = String(value || '').match(/[\d.]+/g)?.slice(0,3).map(Number) || [0,0,0];
  const channels = rgb.map(channel => {
    const normalized = channel / 255;
    return normalized <= .03928 ? normalized / 12.92 : Math.pow((normalized + .055) / 1.055, 2.4);
  });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
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
