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
  `  reader.onload = () => {
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
  reader.onerror = () => setStatus('Браузер не смог прочитать выбранный файл. Выберите JSON-макет заново.');`,
  `  reader.onload = () => {
    try {
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
    }
    finally {
      e.target.value = '';
    }
  };
  reader.onerror = () => {
    e.target.value = '';
    setStatus('Браузер не смог прочитать выбранный файл. Выберите JSON-макет заново.');
  };`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('повреждён'), 2000, 'повреждённый JSON не получил понятную диагностику');
        assert(doc.getElementById('headline').value === stateBeforeInvalidImport.headline, 'повреждённый JSON заменил текущий заголовок');`,
  `        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('повреждён'), 2000, 'повреждённый JSON не получил понятную диагностику');
        await waitFor(() => doc.getElementById('uploadFile')?.files?.length === 0, 1000, 'file input не сброшен после повреждённого JSON');
        assert(doc.getElementById('headline').value === stateBeforeInvalidImport.headline, 'повреждённый JSON заменил текущий заголовок');`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('не похож на макет'), 2000, 'посторонний JSON не получил понятную диагностику');
        assert(doc.getElementById('layoutName').value === stateBeforeInvalidImport.layoutName, 'посторонний JSON заменил текущий макет');`,
  `        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('не похож на макет'), 2000, 'посторонний JSON не получил понятную диагностику');
        await waitFor(() => doc.getElementById('uploadFile')?.files?.length === 0, 1000, 'file input не сброшен после постороннего JSON');
        assert(doc.getElementById('layoutName').value === stateBeforeInvalidImport.layoutName, 'посторонний JSON заменил текущий макет');`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Количество копий на А4'), 2000, 'ошибка типа поля не названа пользователю');
        assert(doc.getElementById('price').value === stateBeforeInvalidImport.price, 'JSON с неверным полем заменил текущую цену');`,
  `        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Количество копий на А4'), 2000, 'ошибка типа поля не названа пользователю');
        await waitFor(() => doc.getElementById('uploadFile')?.files?.length === 0, 1000, 'file input не сброшен после неверного поля');
        assert(doc.getElementById('price').value === stateBeforeInvalidImport.price, 'JSON с неверным полем заменил текущую цену');`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Файл макета открыт без смешивания'), 4000, 'импорт JSON не завершился');
        await waitFor(() => doc.getElementById('contactCtaText')?.value === 'Позвоните по JSON-макету' && doc.getElementById('tearOffLabel')?.value === 'Дом JSON', 4000, 'служебные подписи не восстановились после импорта');`,
  `        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Файл макета открыт без смешивания'), 4000, 'импорт JSON не завершился');
        await waitFor(() => doc.getElementById('uploadFile')?.files?.length === 0, 1000, 'file input не сброшен после успешного импорта');
        await waitFor(() => doc.getElementById('contactCtaText')?.value === 'Позвоните по JSON-макету' && doc.getElementById('tearOffLabel')?.value === 'Дом JSON', 4000, 'служебные подписи не восстановились после импорта');`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        assert(doc.getElementById('brandSideText')?.value === 'json.etagi.test', 'импорт не восстановил боковую подпись бренда');
        pass('JSON: импорт восстанавливает макет без смешивания');`,
  `        assert(doc.getElementById('brandSideText')?.value === 'json.etagi.test', 'импорт не восстановил боковую подпись бренда');

        lastAction = 'layout.file-import-same-file';
        setField(win, doc, '#headline', 'Изменено перед повторным импортом');
        await setFile(win, doc, '#uploadFile', downloadCapture.filename, exportedText, 'application/json');
        await waitFor(() => doc.getElementById('headline')?.value === exportedValues.headline, 4000, 'тот же файл нельзя импортировать повторно');
        await waitFor(() => doc.getElementById('uploadFile')?.files?.length === 0, 1000, 'file input не сброшен после повторного импорта');
        pass('JSON: импорт восстанавливает макет без смешивания и допускает повторный выбор того же файла');`
);

replaceOnce(
  'data/ui-actions.json',
  `{"id":"layout.file-import","selector":"#uploadFile","kind":"command-input","owner":"assets/js/app.js","ownerToken":"uploadFile","effect":"Проверяет формат, версию и типы полей JSON; заменяет состояние только после успешной проверки и объясняет ошибку без потери текущего макета.","risk":"replace-state","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"JSON: импорт восстанавливает макет без смешивания"}}`,
  `{"id":"layout.file-import","selector":"#uploadFile","kind":"command-input","owner":"assets/js/app.js","ownerToken":"uploadFile","effect":"Проверяет формат, версию и типы полей JSON; заменяет состояние только после успешной проверки, объясняет ошибку без потери текущего макета и сбрасывает выбор для повторного импорта того же файла.","risk":"replace-state","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"JSON: импорт восстанавливает макет без смешивания и допускает повторный выбор того же файла"}}`
);

console.log('Сброс file input после импорта подключён и покрыт browser smoke.');
