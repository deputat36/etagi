import fs from 'node:fs';

function replaceOnce(path, before, after) {
  const source = fs.readFileSync(path, 'utf8');
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Не найден ожидаемый фрагмент в ${path}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Ожидаемый фрагмент повторяется в ${path}`);
  fs.writeFileSync(path, source.replace(before, after));
}

replaceOnce(
  'index.html',
  `<button id="makeShortBtn" type="button">Сделать короче</button>`,
  `<button id="makeShortBtn" type="button" title="Сокращает только описание до 190 символов">Сократить описание</button>`
);

replaceOnce(
  'assets/js/app.js',
  `$('makeShortBtn').onclick = () => { state.description = shorten(state.description, 190); state.showDescription = true; state.layoutMode='manual'; syncFormFromState(); renderAll(); };`,
  `$('makeShortBtn').onclick = shortenDescription;`
);

replaceOnce(
  'assets/js/app.js',
  `function strengthenText(){`,
  `function shortenDescription(){
  const current = String(state.description || '').trim();
  if(!current){
    setStatus('Сначала добавьте описание объекта — сокращать пока нечего.');
    $('description').focus();
    return;
  }
  const next = shorten(current, 190);
  if(next === current){
    setStatus('Описание уже короче 190 символов. Заголовок и преимущества не изменены.');
    $('description').focus();
    return;
  }
  state.description = next;
  state.showDescription = true;
  state.layoutMode='manual';
  syncFormFromState(); renderAll();
  setStatus('Описание сокращено до 190 символов. Заголовок и преимущества не изменены.');
}
function strengthenText(){`
);

replaceOnce(
  'tools/ui-actions-smoke.html',
  `        lastAction = 'text.shorten-description';
        const originalHeadline = 'Заголовок должен сохраниться';
        const originalBenefits = 'Преимущество не должно измениться';
        const longDescription = 'Просторная квартира с удобной планировкой, светлыми комнатами и спокойным двором. '.repeat(5).trim();
        assert(longDescription.length > 190, 'тестовое описание должно быть длиннее лимита');
        setField(win, doc, '#headline', originalHeadline);
        setField(win, doc, '#benefits', originalBenefits);
        setField(win, doc, '#description', longDescription);
        setCheck(win, doc, '#showDescription', false);
        click(doc, '#makeShortBtn');
        await waitFor(() => {
          const value = doc.getElementById('description')?.value || '';
          return value.length > 0 && value.length <= 190 && value !== longDescription;
        }, 3000, 'описание не сократилось до лимита');
        const shortenedDescription = doc.getElementById('description').value;
        assert(shortenedDescription.endsWith('...'), 'сокращённое описание не завершено многоточием');
        assert(doc.getElementById('headline')?.value === originalHeadline, 'сокращение изменило заголовок');
        assert(doc.getElementById('benefits')?.value === originalBenefits, 'сокращение изменило преимущества');
        assert(doc.getElementById('showDescription')?.checked === true, 'сокращённое описание не включено в макете');
        assert(doc.querySelector('#printSheet .desc')?.textContent === shortenedDescription, 'предпросмотр не показывает сокращённое описание');
        pass('текст: сокращение описания до лимита');`,
  `        lastAction = 'text.shorten-label';
        const shortenButton = doc.getElementById('makeShortBtn');
        assert(shortenButton?.textContent.trim() === 'Сократить описание', 'название команды не объясняет, какое поле изменяется');
        assert(shortenButton?.title.includes('только описание'), 'у команды нет пояснения о границах действия');
        pass('текст: название команды объясняет сокращение описания');

        lastAction = 'text.shorten-empty';
        const originalHeadline = 'Заголовок должен сохраниться';
        const originalBenefits = 'Преимущество не должно измениться';
        setField(win, doc, '#headline', originalHeadline);
        setField(win, doc, '#benefits', originalBenefits);
        setField(win, doc, '#description', '   ');
        setCheck(win, doc, '#showDescription', false);
        click(doc, '#makeShortBtn');
        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('сокращать пока нечего'), 1000, 'для пустого описания не показано объяснение');
        assert((doc.getElementById('description')?.value || '').trim() === '', 'пустое описание было неожиданно заполнено');
        assert(doc.getElementById('headline')?.value === originalHeadline, 'пустое сокращение изменило заголовок');
        assert(doc.getElementById('benefits')?.value === originalBenefits, 'пустое сокращение изменило преимущества');
        assert(doc.getElementById('showDescription')?.checked === false, 'пустое сокращение включило блок описания');
        assert(doc.activeElement?.id === 'description', 'после объяснения фокус не перешёл в описание');
        pass('текст: пустое описание получает объяснение и фокус');

        lastAction = 'text.shorten-already-short';
        const shortDescription = 'Короткое описание уже готово.';
        setField(win, doc, '#description', shortDescription);
        setCheck(win, doc, '#showDescription', false);
        click(doc, '#makeShortBtn');
        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('уже короче 190 символов'), 1000, 'для короткого описания не показан результат');
        assert(doc.getElementById('description')?.value === shortDescription, 'короткое описание было неожиданно изменено');
        assert(doc.getElementById('showDescription')?.checked === false, 'команда без изменений включила скрытое описание');
        pass('текст: готовое короткое описание не изменяется');

        lastAction = 'text.shorten-description';
        const longDescription = 'Просторная квартира с удобной планировкой, светлыми комнатами и спокойным двором. '.repeat(5).trim();
        assert(longDescription.length > 190, 'тестовое описание должно быть длиннее лимита');
        setField(win, doc, '#description', longDescription);
        setCheck(win, doc, '#showDescription', false);
        click(doc, '#makeShortBtn');
        await waitFor(() => {
          const value = doc.getElementById('description')?.value || '';
          return value.length > 0 && value.length <= 190 && value !== longDescription;
        }, 3000, 'описание не сократилось до лимита');
        await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Описание сокращено до 190 символов'), 1000, 'не показано подтверждение сокращения');
        const shortenedDescription = doc.getElementById('description').value;
        assert(shortenedDescription.endsWith('...'), 'сокращённое описание не завершено многоточием');
        assert(doc.getElementById('headline')?.value === originalHeadline, 'сокращение изменило заголовок');
        assert(doc.getElementById('benefits')?.value === originalBenefits, 'сокращение изменило преимущества');
        assert(doc.getElementById('showDescription')?.checked === true, 'сокращённое описание не включено в макете');
        assert(doc.querySelector('#printSheet .desc')?.textContent === shortenedDescription, 'предпросмотр не показывает сокращённое описание');
        pass('текст: сокращение описания до лимита');`
);

replaceOnce(
  'data/ui-actions.json',
  `{"id":"text.shorten-description","selector":"#makeShortBtn","kind":"static-button","owner":"assets/js/app.js","ownerToken":"makeShortBtn","effect":"Сокращает только поле описания до установленного лимита.","risk":"replace-text","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"текст: сокращение описания до лимита"}}`,
  `{"id":"text.shorten-description","selector":"#makeShortBtn","kind":"static-button","owner":"assets/js/app.js","ownerToken":"makeShortBtn","effect":"Явно сокращает только описание до 190 символов; для пустого или уже короткого текста объясняет результат без изменения других полей.","risk":"replace-text","verification":{"type":"browser","source":"tools/ui-actions-smoke.html","marker":"текст: сокращение описания до лимита"}}`
);

console.log('Команда сокращения описания уточнена и покрыта регрессионными сценариями.');
