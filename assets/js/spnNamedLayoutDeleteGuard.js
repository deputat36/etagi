import { listSavedLayouts, loadLayout, restoreLayout } from './storage.js';

export const DELETED_LAYOUT_KEY = 'etagi-raskleyka-deleted-layout-v1';
export const DELETED_LAYOUT_VERSION = 1;

let pendingLayoutId = '';
let pendingLayoutName = '';
let pendingLayoutItem = null;
let allowNativeDelete = false;
let focusFrame = 0;

document.addEventListener('DOMContentLoaded', initNamedLayoutDeleteGuard);

export function initNamedLayoutDeleteGuard(){
  const deleteButton = document.getElementById('deleteNamedLayoutBtn');
  if(!deleteButton || deleteButton.dataset.deleteGuardBound === 'true') return;

  deleteButton.dataset.deleteGuardBound = 'true';
  ensureDeleteDialog();
  ensureRestoreDeletedUi();
  deleteButton.addEventListener('click', interceptDelete, true);
  updateRestoreDeletedUi(readDeletedLayoutBackup());
}

export function openNamedLayoutDeleteConfirmation(){
  const select = document.getElementById('savedLayouts');
  const id = select?.value || '';
  if(!id) return false;

  const item = loadLayout(id);
  pendingLayoutId = id;
  pendingLayoutItem = item ? structuredClone(item) : null;
  pendingLayoutName = item?.name || select.selectedOptions?.[0]?.textContent?.split(' — ')[0]?.trim() || 'Выбранный макет';

  const dialog = document.getElementById('namedLayoutDeleteDialog');
  const name = document.getElementById('namedLayoutDeleteName');
  if(!dialog || !name) return false;

  name.textContent = `«${pendingLayoutName}»`;
  dialog.showModal();
  document.getElementById('cancelNamedLayoutDeleteBtn')?.focus({preventScroll:true});
  return true;
}

export function restoreLastDeletedLayout(){
  const backup = readDeletedLayoutBackup();
  if(!backup?.item){
    updateRestoreDeletedUi(null);
    setStatus('Последний удалённый макет для восстановления не найден.');
    return false;
  }

  const restored = restoreLayout(backup.item);
  if(!restored){
    setStatus(`Не удалось восстановить макет «${backup.item.name}». Резервная запись сохранена для повторной попытки.`);
    return false;
  }

  localStorage.removeItem(DELETED_LAYOUT_KEY);
  renderSavedLayouts(restored.id);
  updateRestoreDeletedUi(null);
  document.getElementById('savedLayouts')?.focus({preventScroll:true});
  const renamed = restored.name !== backup.item.name;
  setStatus(renamed
    ? `Макет восстановлен как «${restored.name}», потому что исходное название уже занято.`
    : `Макет «${restored.name}» восстановлен и выбран в списке.`);
  window.dispatchEvent(new CustomEvent('etagi:deleted-layout-restored', {detail:{id:restored.id, name:restored.name, renamed}}));
  return true;
}

export function readDeletedLayoutBackup(){
  try{
    const parsed = JSON.parse(localStorage.getItem(DELETED_LAYOUT_KEY) || 'null');
    return parsed?.version === DELETED_LAYOUT_VERSION && parsed.item?.id && parsed.item?.state ? parsed : null;
  } catch(error){
    return null;
  }
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
      <p class="muted">Текущий макет на листе не изменится. После удаления можно восстановить только последнюю удалённую запись.</p>
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
    if(!allowNativeDelete) scheduleDeleteButtonFocus();
  });
}

function ensureRestoreDeletedUi(){
  const controls = document.querySelector('.saved-layout-controls');
  const deleteButton = document.getElementById('deleteNamedLayoutBtn');
  if(!controls || !deleteButton || document.getElementById('restoreDeletedLayoutBtn')) return;

  const button = document.createElement('button');
  button.id = 'restoreDeletedLayoutBtn';
  button.type = 'button';
  button.disabled = true;
  button.setAttribute('aria-describedby', 'restoreDeletedLayoutHint');
  button.textContent = 'Восстановить удалённый';
  button.addEventListener('click', restoreLastDeletedLayout);
  deleteButton.insertAdjacentElement('afterend', button);

  const hint = document.createElement('p');
  hint.id = 'restoreDeletedLayoutHint';
  hint.className = 'muted';
  hint.setAttribute('aria-live', 'polite');
  controls.insertAdjacentElement('afterend', hint);
}

function cancelNamedLayoutDelete(){
  const name = pendingLayoutName;
  clearPendingDelete();
  document.getElementById('namedLayoutDeleteDialog')?.close('cancel');
  scheduleDeleteButtonFocus();
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
  const item = pendingLayoutItem ? structuredClone(pendingLayoutItem) : null;
  allowNativeDelete = true;
  document.getElementById('namedLayoutDeleteDialog')?.close('confirm');
  select.value = id;
  deleteButton.click();
  allowNativeDelete = false;

  const deleted = !loadLayout(id);
  if(deleted && item){
    const backup = saveDeletedLayoutBackup(item);
    updateRestoreDeletedUi(backup || readDeletedLayoutBackup());
    setStatus(backup
      ? `Сохранённый макет «${item.name}» удалён. Последнее удаление можно восстановить.`
      : `Макет «${item.name}» удалён, но браузер не смог сохранить новую резервную запись.`);
  }

  clearPendingDelete();
  scheduleDeleteButtonFocus();
}

function saveDeletedLayoutBackup(item){
  const backup = {
    version:DELETED_LAYOUT_VERSION,
    deletedAt:new Date().toISOString(),
    item:structuredClone(item)
  };
  try{
    localStorage.setItem(DELETED_LAYOUT_KEY, JSON.stringify(backup));
    window.dispatchEvent(new CustomEvent('etagi:deleted-layout-saved', {detail:{id:item.id, name:item.name}}));
    return backup;
  } catch(error){
    return null;
  }
}

function updateRestoreDeletedUi(backup){
  const button = document.getElementById('restoreDeletedLayoutBtn');
  const hint = document.getElementById('restoreDeletedLayoutHint');
  if(!button || !hint) return;

  button.disabled = !backup;
  if(!backup){
    button.textContent = 'Восстановить удалённый';
    hint.textContent = 'Здесь появится последний удалённый именованный макет.';
    return;
  }

  button.textContent = `Восстановить «${backup.item.name}»`;
  const deletedAt = new Date(backup.deletedAt);
  const time = Number.isNaN(deletedAt.getTime()) ? '' : ` · ${deletedAt.toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}`;
  hint.textContent = `Последнее удаление${time}. Восстановление не изменит текущий лист.`;
}

function renderSavedLayouts(selectedId = ''){
  const select = document.getElementById('savedLayouts');
  if(!select) return;

  select.replaceChildren(new Option('Сохранённые макеты', ''));
  for(const item of listSavedLayouts()){
    const date = new Date(item.updatedAt).toLocaleDateString('ru-RU');
    select.add(new Option(`${item.name} — ${date}`, item.id));
  }
  if(selectedId) select.value = selectedId;
}

function scheduleDeleteButtonFocus(){
  window.cancelAnimationFrame(focusFrame);
  focusFrame = window.requestAnimationFrame(() => {
    focusFrame = 0;
    document.getElementById('deleteNamedLayoutBtn')?.focus({preventScroll:true});
  });
}

function clearPendingDelete(){
  pendingLayoutId = '';
  pendingLayoutName = '';
  pendingLayoutItem = null;
}

function setStatus(message){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = message;
}
