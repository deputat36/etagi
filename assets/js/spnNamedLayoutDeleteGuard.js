import { loadLayout } from './storage.js';

let pendingLayoutId = '';
let pendingLayoutName = '';
let allowNativeDelete = false;

document.addEventListener('DOMContentLoaded', initNamedLayoutDeleteGuard);

export function initNamedLayoutDeleteGuard(){
  const deleteButton = document.getElementById('deleteNamedLayoutBtn');
  if(!deleteButton || deleteButton.dataset.deleteGuardBound === 'true') return;

  deleteButton.dataset.deleteGuardBound = 'true';
  ensureDeleteDialog();
  deleteButton.addEventListener('click', interceptDelete, true);
}

export function openNamedLayoutDeleteConfirmation(){
  const select = document.getElementById('savedLayouts');
  const id = select?.value || '';
  if(!id) return false;

  const item = loadLayout(id);
  pendingLayoutId = id;
  pendingLayoutName = item?.name || select.selectedOptions?.[0]?.textContent?.split(' — ')[0]?.trim() || 'Выбранный макет';

  const dialog = document.getElementById('namedLayoutDeleteDialog');
  const name = document.getElementById('namedLayoutDeleteName');
  if(!dialog || !name) return false;

  name.textContent = `«${pendingLayoutName}»`;
  dialog.showModal();
  document.getElementById('cancelNamedLayoutDeleteBtn')?.focus({preventScroll:true});
  return true;
}

function interceptDelete(event){
  if(allowNativeDelete) return;
  if(!document.getElementById('savedLayouts')?.value) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  openNamedLayoutDeleteConfirmation();
}

function ensureDeleteDialog(){
  if(document.getElementById('namedLayoutDeleteDialog')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <dialog id="namedLayoutDeleteDialog" class="print-dialog" aria-labelledby="namedLayoutDeleteTitle" aria-describedby="namedLayoutDeleteDescription">
      <h3 id="namedLayoutDeleteTitle">Удалить сохранённый макет?</h3>
      <p id="namedLayoutDeleteDescription">Макет <strong id="namedLayoutDeleteName"></strong> исчезнет из списка этого браузера.</p>
      <p class="muted">Текущий макет на листе не изменится. Это действие нельзя отменить до появления отдельного восстановления удалённых макетов.</p>
      <div class="main-actions">
        <button id="cancelNamedLayoutDeleteBtn" type="button">Оставить макет</button>
        <button class="primary dark" id="confirmNamedLayoutDeleteBtn" type="button">Удалить макет</button>
      </div>
    </dialog>`);

  const dialog = document.getElementById('namedLayoutDeleteDialog');
  document.getElementById('cancelNamedLayoutDeleteBtn')?.addEventListener('click', cancelNamedLayoutDelete);
  document.getElementById('confirmNamedLayoutDeleteBtn')?.addEventListener('click', confirmNamedLayoutDelete);
  dialog?.addEventListener('cancel', event => {
    event.preventDefault();
    cancelNamedLayoutDelete();
  });
  dialog?.addEventListener('close', () => {
    if(!allowNativeDelete) document.getElementById('deleteNamedLayoutBtn')?.focus({preventScroll:true});
  });
}

function cancelNamedLayoutDelete(){
  const name = pendingLayoutName;
  clearPendingDelete();
  document.getElementById('namedLayoutDeleteDialog')?.close('cancel');
  setStatus(name ? `Удаление макета «${name}» отменено.` : 'Удаление макета отменено.');
}

function confirmNamedLayoutDelete(){
  const select = document.getElementById('savedLayouts');
  const deleteButton = document.getElementById('deleteNamedLayoutBtn');
  if(!pendingLayoutId || !select || !deleteButton){
    cancelNamedLayoutDelete();
    return;
  }

  const id = pendingLayoutId;
  allowNativeDelete = true;
  document.getElementById('namedLayoutDeleteDialog')?.close('confirm');
  select.value = id;
  deleteButton.click();
  allowNativeDelete = false;
  clearPendingDelete();
  deleteButton.focus({preventScroll:true});
}

function clearPendingDelete(){
  pendingLayoutId = '';
  pendingLayoutName = '';
}

function setStatus(message){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = message;
}
