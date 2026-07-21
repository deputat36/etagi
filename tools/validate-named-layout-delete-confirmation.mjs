import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  module:'assets/js/spnNamedLayoutDeleteGuard.js',
  storage:'assets/js/storage.js',
  entry:'assets/js/spnUiMode.js',
  runner:'tools/run-ui-actions-smoke.mjs',
  smoke:'tools/named-layout-delete-confirm-smoke.html',
  docs:'docs/named-layout-delete-confirmation.md',
  registry:'data/ui-actions.json',
  storageRunner:'tools/validate-storage-contracts.mjs',
  package:'package.json'
};
const sources = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readRequired(file)]));
const pkg = readJson(files.package, sources.package);
const registry = readJson(files.registry, sources.registry);

requireSnippets(files.module, sources.module, [
  "import { listSavedLayouts, loadLayout, restoreLayout } from './storage.js';",
  "export const DELETED_LAYOUT_KEY = 'etagi-raskleyka-deleted-layout-v1';",
  'export const DELETED_LAYOUT_VERSION = 1;',
  'export function openNamedLayoutDeleteConfirmation()',
  'export function restoreLastDeletedLayout()',
  'export function readDeletedLayoutBackup()',
  "deleteButton.addEventListener('click', interceptDelete, true)",
  'event.stopImmediatePropagation()',
  'dialog.showModal()',
  "document.getElementById('cancelNamedLayoutDeleteBtn')?.focus",
  "dialog?.addEventListener('cancel'",
  "document.getElementById('namedLayoutDeleteDialog')?.close('confirm')",
  'allowNativeDelete = true',
  'deleteButton.click()',
  'allowNativeDelete = false',
  'const deleted = !loadLayout(id);',
  'if(deleted && item)',
  'saveDeletedLayoutBackup(item)',
  'localStorage.setItem(DELETED_LAYOUT_KEY, JSON.stringify(backup))',
  'const restored = restoreLayout(backup.item);',
  'localStorage.removeItem(DELETED_LAYOUT_KEY);',
  'renderSavedLayouts(restored.id);',
  "document.getElementById('savedLayouts')?.focus({preventScroll:true})",
  "button.id = 'restoreDeletedLayoutBtn';",
  "button.addEventListener('click', restoreLastDeletedLayout)",
  'function scheduleDeleteButtonFocus()',
  'window.cancelAnimationFrame(focusFrame)',
  'window.requestAnimationFrame(() =>'
]);
forbidSnippets(files.module, sources.module, [
  'window.confirm(',
  'confirm(',
  'localStorage.removeItem(LAYOUTS_KEY)',
  'deleteLayout('
]);
requireSnippets(files.storage, sources.storage, [
  'export function restoreLayout(item)',
  'const name = makeRestoredLayoutName(originalName, layouts);',
  'const id = originalId && !layouts.some(layout => layout.id === originalId) ? originalId : makeLayoutId(name, layouts);',
  'state:{...stripHeavyFields(item.state), layoutName:name}',
  'JSON.stringify([restored, ...layouts].slice(0, 50))',
  'function makeRestoredLayoutName(name, layouts)',
  '`${name} (восстановлен)`'
]);
requireSnippets(files.entry, sources.entry, ["import './spnNamedLayoutDeleteGuard.js';"]);
requireSnippets(files.runner, sources.runner, [
  "label:'Named layout delete confirmation smoke'",
  "path:'tools/named-layout-delete-confirm-smoke.html'"
]);
requireSnippets(files.smoke, sources.smoke, [
  'удаление: без выбора остаётся штатная подсказка',
  'удаление: кнопка Оставить макет ничего не удаляет',
  'удаление: Escape отменяет действие',
  'удаление: подтверждение удаляет только выбранный макет и создаёт резерв',
  'восстановление: удалённый макет возвращён и загружается',
  'восстановление: конфликт имени создаёт отдельный безопасный макет',
  "click(doc,'[data-spn-ui-mode=\"advanced\"]')",
  "getComputedStyle(doc.querySelector('.save-card')).display!=='none'",
  "doc.activeElement?.id==='cancelNamedLayoutDeleteBtn'",
  'фокус не вернулся к кнопке удаления',
  'Escape не вернул фокус к кнопке удаления',
  'после удаления фокус не вернулся к кнопке',
  'readDeleted(win)===null',
  'assertSameCurrent(doc,currentState',
  'assertSameCurrent(doc,currentBeforeConflict',
  'assert(hasLayout(win,idB)',
  "item.name==='Макет для удаления (восстановлен)'"
]);
requireSnippets(files.docs, sources.docs, [
  '# Подтверждение и восстановление удаления именованного макета',
  'Оставить макет',
  'Удалить макет',
  'Escape равнозначен отмене',
  'Восстановить «Название»',
  'Название (восстановлен)',
  'window.confirm',
  'Named layout delete confirmation smoke'
]);
requireSnippets(files.storageRunner, sources.storageRunner, [
  "'tools/validate-storage-safety.mjs'",
  "'tools/validate-destructive-snapshot.mjs'",
  "'tools/validate-named-layout-delete-confirmation.mjs'"
]);

const actions = Array.isArray(registry?.actions) ? registry.actions : [];
validateAction('layout.named-delete', 'openNamedLayoutDeleteConfirmation');
validateAction('layout.named-delete-cancel', 'cancelNamedLayoutDelete');
validateAction('layout.named-delete-confirm', 'confirmNamedLayoutDelete');
validateAction('layout.named-delete-restore', 'restoreLastDeletedLayout');

if(String(pkg?.scripts?.['validate:storage-safety'] || '').trim() !== 'node tools/validate-storage-contracts.mjs'){
  errors.push(`${files.package}: validate:storage-safety должен запускать node tools/validate-storage-contracts.mjs`);
}

if(errors.length){
  console.error('\nОшибки подтверждения и восстановления удаления именованного макета:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка подтверждения и восстановления удаления именованного макета пройдена.');

function validateAction(id, ownerToken){
  const action = actions.find(item => item.id === id);
  if(!action){
    errors.push(`${files.registry}: отсутствует ${id}`);
    return;
  }
  if(action.owner !== files.module) errors.push(`${files.registry}: ${id} должен принадлежать ${files.module}`);
  if(action.ownerToken !== ownerToken) errors.push(`${files.registry}: у ${id} неверный ownerToken`);
  if(action.verification?.type !== 'browser') errors.push(`${files.registry}: ${id} должен иметь browser-проверку`);
  if(action.verification?.source !== files.smoke) errors.push(`${files.registry}: у ${id} неверный smoke`);
}
function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
  }
}
function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}
function readJson(file, source){
  try { return JSON.parse(source || '{}'); }
  catch(error){ errors.push(`${file}: JSON не читается — ${error.message}`); return null; }
}
function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}