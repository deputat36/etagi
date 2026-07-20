import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  module:'assets/js/spnNamedLayoutDeleteGuard.js',
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
  "import { loadLayout } from './storage.js';",
  'export function openNamedLayoutDeleteConfirmation()',
  "deleteButton.addEventListener('click', interceptDelete, true)",
  'event.stopImmediatePropagation()',
  "dialog.showModal()",
  "document.getElementById('cancelNamedLayoutDeleteBtn')?.focus",
  "dialog?.addEventListener('cancel'",
  "document.getElementById('namedLayoutDeleteDialog')?.close('confirm')",
  'allowNativeDelete = true',
  'deleteButton.click()',
  'allowNativeDelete = false',
  'function scheduleDeleteButtonFocus()',
  'window.cancelAnimationFrame(focusFrame)',
  'window.requestAnimationFrame(() =>',
  "document.getElementById('deleteNamedLayoutBtn')?.focus({preventScroll:true})"
]);
forbidSnippets(files.module, sources.module, [
  'window.confirm(',
  'confirm(',
  'localStorage.removeItem(',
  'deleteLayout('
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
  'удаление: подтверждение удаляет только выбранный макет',
  "click(doc,'[data-spn-ui-mode=\"advanced\"]')",
  "getComputedStyle(doc.querySelector('.save-card')).display!=='none'",
  "doc.activeElement?.id==='cancelNamedLayoutDeleteBtn'",
  'фокус не вернулся к кнопке удаления',
  'Escape не вернул фокус к кнопке удаления',
  'после удаления фокус не вернулся к кнопке',
  'assertSameCurrent(doc,currentState',
  'assert(hasLayout(win,idB)'
]);
requireSnippets(files.docs, sources.docs, [
  '# Подтверждение удаления именованного макета',
  'Оставить макет',
  'Удалить макет',
  'Escape равнозначен отмене',
  'window.confirm',
  'Named layout delete confirmation smoke'
]);
requireSnippets(files.storageRunner, sources.storageRunner, [
  "'tools/validate-storage-safety.mjs'",
  "'tools/validate-destructive-snapshot.mjs'",
  "'tools/validate-named-layout-delete-confirmation.mjs'"
]);

const actions = Array.isArray(registry?.actions) ? registry.actions : [];
const deleteAction = actions.find(action => action.id === 'layout.named-delete');
if(!deleteAction) errors.push(`${files.registry}: отсутствует layout.named-delete`);
else {
  if(deleteAction.owner !== files.module) errors.push(`${files.registry}: layout.named-delete должен принадлежать ${files.module}`);
  if(deleteAction.ownerToken !== 'openNamedLayoutDeleteConfirmation') errors.push(`${files.registry}: неверный ownerToken удаления`);
  if(deleteAction.verification?.type !== 'browser') errors.push(`${files.registry}: удаление должно иметь browser-проверку`);
  if(deleteAction.verification?.source !== files.smoke) errors.push(`${files.registry}: неверный smoke удаления`);
}
for(const id of ['layout.named-delete-cancel','layout.named-delete-confirm']){
  if(!actions.some(action => action.id === id)) errors.push(`${files.registry}: отсутствует ${id}`);
}

if(String(pkg?.scripts?.['validate:storage-safety'] || '').trim() !== 'node tools/validate-storage-contracts.mjs'){
  errors.push(`${files.package}: validate:storage-safety должен запускать node tools/validate-storage-contracts.mjs`);
}

if(errors.length){
  console.error('\nОшибки подтверждения удаления именованного макета:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка подтверждения удаления именованного макета пройдена.');

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
