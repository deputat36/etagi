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
  `import { $, esc, readFileAsDataURL, downloadText, debounce } from './utils.js';\n`,
  `import { $, esc, readFileAsDataURL, downloadText, debounce } from './utils.js';\nimport { createLayoutFilePayload, parseLayoutFileText } from './layoutFile.js';\n`
);

replaceOnce(
  'assets/js/app.js',
  `$('downloadBtn').onclick = () => downloadText(\`etagi-raskleyka-\${new Date().toISOString().slice(0,10)}.json\`, JSON.stringify(state,null,2));`,
  `$('downloadBtn').onclick = () => downloadText(\`etagi-raskleyka-\${new Date().toISOString().slice(0,10)}.json\`, JSON.stringify(createLayoutFilePayload(state),null,2));`
);

replaceOnce(
  'assets/js/app.js',
  `function loadFromFile(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = cleanLoadedState(imported);
      if($('savedLayouts')) $('savedLayouts').value='';
      syncFormFromState(); renderAll(); setStatus('Файл макета открыт без смешивания с предыдущим макетом.');
    }
    catch(err){ setStatus('Не удалось открыть файл.'); }
  };
  reader.readAsText(file);
}`,
  `function loadFromFile(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const result = parseLayoutFileText(reader.result);
    if(!result.ok){
      setStatus(result.message);
      return;
    }

    state = cleanLoadedState(result.state);
    if($('savedLayouts')) $('savedLayouts').value='';
    syncFormFromState();
    renderAll();

    const notes = [];
    if(result.legacy) notes.push('Старый формат распознан и безопасно обновлён.');
    if(result.warnings.length) notes.push(result.warnings.join(' '));
    setStatus('Файл макета открыт без смешивания с предыдущим макетом.' + (notes.length ? ' ' + notes.join(' ') : ''));
  };
  reader.onerror = () => setStatus('Браузер не смог прочитать выбранный файл. Выберите JSON-макет заново.');
  reader.readAsText(file);
}`
);

replaceOnce(
  'package.json',
  `    "validate:release-candidate": "node tools/validate-release-candidate.mjs",\n    "validate:layout-extras":`,
  `    "validate:release-candidate": "node tools/validate-release-candidate.mjs",\n    "validate:layout-file": "node tools/validate-layout-file.mjs",\n    "validate:layout-extras":`
);

replaceOnce(
  'docs/maintenance-guide.md',
  `npm run validate:release-candidate\nnpm run validate:layout-extras`,
  `npm run validate:release-candidate\nnpm run validate:layout-file\nnpm run validate:layout-extras`
);

replaceOnce(
  'data/ui-actions.json',
  `{"id":"layout.file-download","selector":"#downloadBtn","kind":"static-button","owner":"assets/js/app.js","ownerToken":"downloadBtn","effect":"Скачивает текущий макет как отдельный JSON-файл.","risk":"download","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"JSON: экспорт Blob содержит состояние и служебные поля"}}`,
  `{"id":"layout.file-download","selector":"#downloadBtn","kind":"static-button","owner":"assets/js/app.js","ownerToken":"downloadBtn","effect":"Скачивает текущий макет как версионированный JSON-файл со ссылкой на схему и датой экспорта.","risk":"download","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"JSON: экспорт Blob содержит состояние и служебные поля"}}`
);

replaceOnce(
  'data/ui-actions.json',
  `{"id":"layout.file-import","selector":"#uploadFile","kind":"command-input","owner":"assets/js/app.js","ownerToken":"uploadFile","effect":"Читает выбранный JSON и заменяет текущее состояние макета.","risk":"replace-state","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"JSON: импорт восстанавливает макет без смешивания"}}`,
  `{"id":"layout.file-import","selector":"#uploadFile","kind":"command-input","owner":"assets/js/app.js","ownerToken":"uploadFile","effect":"Проверяет формат, версию и типы полей JSON; заменяет состояние только после успешной проверки и объясняет ошибку без потери текущего макета.","risk":"replace-state","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"JSON: импорт восстанавливает макет без смешивания"}}`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        assert(downloadCapture.blob.type.includes('application/json'), 'экспортированный Blob имеет неверный MIME-тип');
        for(const [id, value] of Object.entries(exportedValues)) assert(exportedState[id] === value, \`в экспортированном JSON неверное поле \${id}\`);`,
  `        assert(downloadCapture.blob.type.includes('application/json'), 'экспортированный Blob имеет неверный MIME-тип');
        assert(exportedState.fileFormat === 'etagi-raskleyka-layout', 'экспорт не содержит идентификатор формата макета');
        assert(exportedState.fileFormatVersion === 1, 'экспорт не содержит версию формата макета');
        assert(exportedState.$schema === 'data/layout-file.schema.json', 'экспорт не содержит ссылку на схему');
        assert(!Number.isNaN(Date.parse(exportedState.exportedAt)), 'экспорт не содержит корректную дату');
        for(const [id, value] of Object.entries(exportedValues)) assert(exportedState[id] === value, \`в экспортированном JSON неверное поле \${id}\`);`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        doc.getElementById('savedLayouts').value = namedLayoutId;
        await setFile(win, doc, '#uploadFile', downloadCapture.filename, exportedText, 'application/json');`,
  `        doc.getElementById('savedLayouts').value = namedLayoutId;

        const stateBeforeInvalidImport = {
          layoutName:doc.getElementById('layoutName').value,
          headline:doc.getElementById('headline').value,
          price:doc.getElementById('price').value,
          customBlockText:doc.getElementById('customBlockText').value,
          savedLayout:doc.getElementById('savedLayouts').value
        };

        lastAction = 'layout.file-import-invalid-json';
        await setFile(win, doc, '#uploadFile', 'broken.json', '{broken', 'application/json');
        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('повреждён'), 2000, 'повреждённый JSON не получил понятную диагностику');
        assert(doc.getElementById('headline').value === stateBeforeInvalidImport.headline, 'повреждённый JSON заменил текущий заголовок');
        assert(doc.getElementById('savedLayouts').value === stateBeforeInvalidImport.savedLayout, 'повреждённый JSON сбросил выбранный сохранённый макет');

        lastAction = 'layout.file-import-foreign-json';
        await setFile(win, doc, '#uploadFile', 'foreign.json', JSON.stringify({foo:'bar'}), 'application/json');
        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('не похож на макет'), 2000, 'посторонний JSON не получил понятную диагностику');
        assert(doc.getElementById('layoutName').value === stateBeforeInvalidImport.layoutName, 'посторонний JSON заменил текущий макет');

        lastAction = 'layout.file-import-invalid-field';
        const invalidFieldText = JSON.stringify({...exportedState, printCount:'4'});
        await setFile(win, doc, '#uploadFile', 'invalid-field.json', invalidFieldText, 'application/json');
        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Количество копий на А4'), 2000, 'ошибка типа поля не названа пользователю');
        assert(doc.getElementById('price').value === stateBeforeInvalidImport.price, 'JSON с неверным полем заменил текущую цену');
        assert(doc.getElementById('customBlockText').value === stateBeforeInvalidImport.customBlockText, 'JSON с неверным полем смешал данные');
        pass('JSON: ошибочные файлы отклоняются без замены макета');

        lastAction = 'layout.file-import';
        await setFile(win, doc, '#uploadFile', downloadCapture.filename, exportedText, 'application/json');`
);

console.log('Интеграция схемы и диагностики JSON-макета применена.');
