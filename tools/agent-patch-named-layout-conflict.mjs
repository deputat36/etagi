import fs from 'node:fs';

function replaceOnce(path, before, after) {
  const source = fs.readFileSync(path, 'utf8');
  const first = source.indexOf(before);
  if(first < 0) throw new Error(`Не найден ожидаемый фрагмент в ${path}`);
  if(source.indexOf(before, first + before.length) >= 0) throw new Error(`Ожидаемый фрагмент повторяется в ${path}`);
  fs.writeFileSync(path, source.replace(before, after));
}

replaceOnce(
  'assets/js/app.js',
  `let selectedScenario = 'all';\nconst debouncedSave = debounce(()=>autoSave(state), 500);`,
  `let selectedScenario = 'all';\nlet pendingLayoutConflict = null;\nconst debouncedSave = debounce(()=>autoSave(state), 500);`
);

replaceOnce(
  'assets/js/app.js',
  `  $('deleteNamedLayoutBtn').onclick = deleteSelectedLayout;\n  $('saveLocalBtn').onclick = () => {`,
  `  $('deleteNamedLayoutBtn').onclick = deleteSelectedLayout;\n  $('layoutConflictDialog').addEventListener('click', handleLayoutConflictChoice);\n  $('layoutConflictDialog').addEventListener('cancel', () => {\n    pendingLayoutConflict = null;\n    setStatus('Сохранение макета отменено. Существующая версия не изменена.');\n  });\n  $('saveLocalBtn').onclick = () => {`
);

replaceOnce(
  'assets/js/app.js',
  `function saveCurrentNamedLayout(){
  const name = (state.layoutName || state.headline || state.goal || 'Макет без названия').trim();
  if(!name){ setStatus('Укажите название макета.'); $('layoutName').focus(); return; }
  state.layoutName = name;
  const item = saveLayout(name, state);
  if(!item){ setStatus('Не удалось сохранить макет. Возможно, в браузере закончилось место.'); return; }
  renderSavedLayouts(item.id);
  syncFormFromState();
  setStatus(\`Макет «\${name}» сохранён.\`);
}`,
  `function saveCurrentNamedLayout(){
  const name = (state.layoutName || state.headline || state.goal || 'Макет без названия').trim();
  if(!name){ setStatus('Укажите название макета.'); $('layoutName').focus(); return; }

  const existing = listSavedLayouts().find(item => String(item.name || '').toLowerCase() === name.toLowerCase());
  if(existing){
    pendingLayoutConflict = {name, existingId: existing.id};
    $('layoutConflictName').textContent = name;
    $('layoutConflictDialog').showModal();
    setStatus('Макет с таким названием уже существует. Выберите: обновить его или сохранить копию.');
    return;
  }

  persistNamedLayout(name, 'saved');
}
function handleLayoutConflictChoice(event){
  const button = event.target.closest('[data-layout-conflict-action]');
  if(!button) return;

  const action = button.dataset.layoutConflictAction;
  const pending = pendingLayoutConflict;
  pendingLayoutConflict = null;
  $('layoutConflictDialog').close();

  if(!pending || action === 'cancel'){
    setStatus('Сохранение макета отменено. Существующая версия не изменена.');
    return;
  }

  if(action === 'copy'){
    const copyName = makeLayoutCopyName(pending.name);
    persistNamedLayout(copyName, 'copy');
    return;
  }

  persistNamedLayout(pending.name, 'updated');
}
function persistNamedLayout(name, mode){
  state.layoutName = name;
  const item = saveLayout(name, state);
  if(!item){ setStatus('Не удалось сохранить макет. Возможно, в браузере закончилось место.'); return; }
  renderSavedLayouts(item.id);
  syncFormFromState();
  if(mode === 'copy') setStatus(\`Сохранена отдельная копия «\${name}». Исходный макет не изменён.\`);
  else if(mode === 'updated') setStatus(\`Макет «\${name}» обновлён.\`);
  else setStatus(\`Макет «\${name}» сохранён.\`);
}
function makeLayoutCopyName(name){
  const names = new Set(listSavedLayouts().map(item => String(item.name || '').toLowerCase()));
  let index = 1;
  let candidate = \`\${name} — копия\`;
  while(names.has(candidate.toLowerCase())){
    index += 1;
    candidate = \`\${name} — копия \${index}\`;
  }
  return candidate;
}`
);

replaceOnce(
  'index.html',
  `  </dialog>\n\n  <script type="module" src="assets/js/app.js?v=3.85.0"></script>`,
  `  </dialog>\n\n  <dialog id="layoutConflictDialog" class="print-dialog" aria-labelledby="layoutConflictTitle">\n    <h3 id="layoutConflictTitle">Макет с таким названием уже существует</h3>\n    <p>Макет «<strong id="layoutConflictName"></strong>» уже сохранён в этом браузере. Выберите, что сделать с текущими изменениями.</p>\n    <div class="main-actions">\n      <button type="button" data-layout-conflict-action="cancel">Отмена</button>\n      <button type="button" data-layout-conflict-action="copy">Сохранить копию</button>\n      <button class="primary dark" type="button" data-layout-conflict-action="update">Обновить существующий</button>\n    </div>\n  </dialog>\n\n  <script type="module" src="assets/js/app.js?v=3.85.0"></script>`
);

replaceOnce(
  'data/ui-actions.json',
  `{"id":"layout.named-save","selector":"#saveNamedLayoutBtn","kind":"static-button","owner":"assets/js/app.js","ownerToken":"saveNamedLayoutBtn","effect":"Сохраняет текущий макет под указанным названием.","risk":"overwrite-storage","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"именованные макеты: сохранение и загрузка"}},`,
  `{"id":"layout.named-save","selector":"#saveNamedLayoutBtn","kind":"static-button","owner":"assets/js/app.js","ownerToken":"saveNamedLayoutBtn","effect":"Сохраняет новый именованный макет; при совпадении названия открывает явный выбор без автоматического перезаписывания.","risk":"overwrite-storage","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"именованные макеты: конфликт названия требует выбора"}},\n    {"id":"layout.named-conflict-choice","selector":"[data-layout-conflict-action]","kind":"dynamic-group","owner":"assets/js/app.js","ownerToken":"data-layout-conflict-action","effect":"Отменяет сохранение, обновляет существующий макет или создаёт отдельную копию с уникальным названием.","risk":"overwrite-storage","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"именованные макеты: конфликт названия требует выбора"}},`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        assert(namedLayoutId, 'именованный макет не получил id');
        assert(win.localStorage.getItem('etagi-raskleyka-layouts-v1')?.includes('Smoke именованный макет'), 'именованный макет отсутствует в localStorage');

        lastAction = 'layout.named-load';`,
  `        assert(namedLayoutId, 'именованный макет не получил id');
        assert(win.localStorage.getItem('etagi-raskleyka-layouts-v1')?.includes('Smoke именованный макет'), 'именованный макет отсутствует в localStorage');

        lastAction = 'layout.named-conflict-copy';
        setField(win, doc, '#headline', 'Изменение для отдельной копии');
        click(doc, '#saveNamedLayoutBtn');
        await waitFor(() => doc.getElementById('layoutConflictDialog')?.open, 1000, 'при совпадении названия не открыт выбор действия');
        let storedLayouts = JSON.parse(win.localStorage.getItem('etagi-raskleyka-layouts-v1') || '[]');
        assert(storedLayouts.length === 1, 'макет перезаписан до выбора действия');
        assert(storedLayouts[0]?.state?.headline === 'Заголовок именованного макета', 'исходный макет изменён до подтверждения');
        click(doc, '[data-layout-conflict-action="copy"]');
        await waitFor(() => doc.getElementById('savedLayouts')?.options.length === 3, 3000, 'отдельная копия не появилась в списке');
        storedLayouts = JSON.parse(win.localStorage.getItem('etagi-raskleyka-layouts-v1') || '[]');
        const originalAfterCopy = storedLayouts.find(item => item.id === namedLayoutId);
        const copiedLayout = storedLayouts.find(item => item.id !== namedLayoutId);
        assert(originalAfterCopy?.state?.headline === 'Заголовок именованного макета', 'сохранение копии изменило исходный макет');
        assert(copiedLayout?.name === 'Smoke именованный макет — копия', 'копия не получила понятное уникальное название');
        assert(copiedLayout?.state?.headline === 'Изменение для отдельной копии', 'копия не сохранила текущие изменения');

        lastAction = 'layout.named-conflict-update';
        setField(win, doc, '#layoutName', 'Smoke именованный макет');
        setField(win, doc, '#headline', 'Обновлённый заголовок именованного макета');
        click(doc, '#saveNamedLayoutBtn');
        await waitFor(() => doc.getElementById('layoutConflictDialog')?.open, 1000, 'повторный конфликт названия не показал выбор');
        click(doc, '[data-layout-conflict-action="update"]');
        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('обновлён'), 2000, 'существующий макет не обновлён после явного выбора');
        storedLayouts = JSON.parse(win.localStorage.getItem('etagi-raskleyka-layouts-v1') || '[]');
        assert(storedLayouts.length === 2, 'обновление существующего макета создало лишнюю запись');
        assert(storedLayouts.find(item => item.id === namedLayoutId)?.state?.headline === 'Обновлённый заголовок именованного макета', 'явное обновление не сохранило изменения');
        pass('именованные макеты: конфликт названия требует выбора');

        lastAction = 'layout.named-load';`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        await waitFor(() => doc.getElementById('headline')?.value === 'Заголовок именованного макета' && doc.getElementById('area')?.value === 'Северный smoke', 3000, 'именованный макет не восстановил поля');`,
  `        await waitFor(() => doc.getElementById('headline')?.value === 'Обновлённый заголовок именованного макета' && doc.getElementById('area')?.value === 'Северный smoke', 3000, 'именованный макет не восстановил явно обновлённые поля');`
);

console.log('Явный выбор при совпадении названия макета подключён.');
