import { subscribeQualityListUpdates } from './qualityListUpdates.js';

window.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('qualityList');
  if(!list) return;

  subscribeQualityListUpdates(({list: qualityList}) => enhancePhotoLayoutIssues(qualityList), {
    priority: 12,
    label: 'photo-layout-quality-actions'
  });
  list.addEventListener('click', handlePhotoLayoutAction);
});

function enhancePhotoLayoutIssues(list){
  list.querySelectorAll('.qitem').forEach(item => {
    if(item.querySelector('[data-photo-layout-quality-action]')) return;
    const title = item.querySelector('b')?.textContent?.trim() || '';

    if(title === 'Фото-компоновка без фото'){
      appendAction(item, 'focus-photo', 'Загрузить фото');
    }
    if(title === 'Брендовый макет без имени СПН'){
      appendAction(item, 'focus-agent-name', 'Указать имя');
    }
    if(title === 'Отрывные перегружают фотокарточку' || title === 'Отрывные перегружают макет новостройки' || title === 'Отрывные перегружают брендовый макет'){
      appendAction(item, 'disable-tears', 'Выключить отрывные');
    }
  });
}

function appendAction(item, action, label){
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'quality-photo-layout-action';
  button.dataset.photoLayoutQualityAction = action;
  button.textContent = label;
  button.setAttribute('aria-label', label);
  item.append(document.createElement('br'), button);
}

function handlePhotoLayoutAction(event){
  const button = event.target.closest('[data-photo-layout-quality-action]');
  if(!button) return;

  if(button.dataset.photoLayoutQualityAction === 'focus-photo'){
    const input = document.getElementById('photoOne');
    if(!input) return;
    input.scrollIntoView?.({block:'center', behavior:'smooth'});
    input.focus?.();
    setStatus('Фото-компоновка сохранена. Выберите файл в поле Фото 1.');
  }

  if(button.dataset.photoLayoutQualityAction === 'focus-agent-name'){
    const input = document.getElementById('agentName');
    if(!input) return;
    input.scrollIntoView?.({block:'center', behavior:'smooth'});
    input.focus?.();
    input.select?.();
    setStatus('Брендовая компоновка сохранена. Укажите имя специалиста.');
  }

  if(button.dataset.photoLayoutQualityAction === 'disable-tears'){
    const checkbox = document.getElementById('tearOffs');
    if(!checkbox || !checkbox.checked) return;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change', {bubbles:true}));
    setStatus('Отрывные листочки выключены. Контактный блок фотокарточки сохранён.');
  }
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
