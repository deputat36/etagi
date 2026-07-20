import fs from 'node:fs';

function replaceOnce(path, before, after) {
  const source = fs.readFileSync(path, 'utf8');
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Не найден ожидаемый фрагмент в ${path}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Ожидаемый фрагмент повторяется в ${path}`);
  fs.writeFileSync(path, source.replace(before, after));
}

replaceOnce(
  'assets/js/app.js',
  `function strengthenText(){
  if(!state.description) return;
  if(!/позвон|напишите|подскажу/i.test(state.description)) state.description += ' Позвоните — подскажу детали и помогу разобраться.';
  if(!state.benefits) state.benefits = 'Безопасное сопровождение\\nПомощь с документами\\nКонсультация по цене';
  state.showDescription = true;
  state.showBenefits = true;
  state.layoutMode='manual';
  syncFormFromState(); renderAll();
}`,
  `function strengthenText(){
  if(!String(state.description || '').trim()){
    setStatus('Сначала добавьте описание объекта — пустой текст усилить нельзя.');
    $('description').focus();
    return;
  }
  if(!/позвон|напишите|подскажу/i.test(state.description)) state.description += ' Позвоните — подскажу детали и помогу разобраться.';
  if(!state.benefits) state.benefits = 'Безопасное сопровождение\\nПомощь с документами\\nКонсультация по цене';
  state.showDescription = true;
  state.showBenefits = true;
  state.layoutMode='manual';
  syncFormFromState(); renderAll();
  setStatus('Текст усилен: добавлены призыв и базовые преимущества. Проверьте формулировки перед печатью.');
}`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        lastAction = 'text.strengthen';
        setField(win, doc, '#description', 'Квартира готова к просмотру.');`,
  `        lastAction = 'text.strengthen-empty';
        setField(win, doc, '#description', '   ');
        setField(win, doc, '#benefits', 'Существующее преимущество');
        setCheck(win, doc, '#showDescription', false);
        setCheck(win, doc, '#showBenefits', false);
        click(doc, '#makeStrongerBtn');
        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Сначала добавьте описание объекта'), 1000, 'для пустого описания не показано объяснение');
        assert((doc.getElementById('description')?.value || '').trim() === '', 'пустое описание было неожиданно заполнено');
        assert(doc.getElementById('benefits')?.value === 'Существующее преимущество', 'при пустом описании изменились преимущества');
        assert(doc.getElementById('showDescription')?.checked === false, 'при пустом описании включился блок описания');
        assert(doc.getElementById('showBenefits')?.checked === false, 'при пустом описании включился блок преимуществ');
        assert(doc.activeElement?.id === 'description', 'после объяснения фокус не перешёл в описание');
        pass('текст: пустое описание получает объяснение и фокус');

        lastAction = 'text.strengthen';
        setField(win, doc, '#description', 'Квартира готова к просмотру.');`
);

replaceOnce(
  'data/ui-actions.json',
  `{"id":"text.strengthen","selector":"#makeStrongerBtn","kind":"static-button","owner":"assets/js/app.js","ownerToken":"makeStrongerBtn","effect":"Добавляет призыв и базовые преимущества, если описание заполнено.","risk":"replace-text","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"текст: усиление добавляет призыв и преимущества без дублей"}}`,
  `{"id":"text.strengthen","selector":"#makeStrongerBtn","kind":"static-button","owner":"assets/js/app.js","ownerToken":"makeStrongerBtn","effect":"Если описание пустое, объясняет следующий шаг и переводит фокус в поле; иначе добавляет призыв и базовые преимущества.","risk":"replace-text","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"текст: усиление добавляет призыв и преимущества без дублей"}}`
);

console.log('Патч silent no-op команды «Усилить текст» применён.');
