from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(relative_path: str, old: str, new: str) -> None:
    path = ROOT / relative_path
    source = path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{relative_path}: ожидался один фрагмент, найдено {count}: {old[:100]}')
    path.write_text(source.replace(old, new, 1), encoding='utf-8')


replace_once(
    'assets/css/spn-ui-mode.css',
    '''body[data-spn-ui-mode="quick"] .advanced,
body[data-spn-ui-mode="quick"] .save-card,''',
    '''body[data-spn-ui-mode="quick"] .start-card,
body[data-spn-ui-mode="newbie"] .start-card,
body[data-spn-ui-mode="quick"] .advanced,
body[data-spn-ui-mode="quick"] .save-card,'''
)

replace_once(
    'assets/css/spn-ui-mode.css',
    '''body[data-spn-ui-mode="quick"] .scenario-filter-row,
body[data-spn-ui-mode="newbie"] .scenario-filter-row{display:none!important}''',
    '''body[data-spn-ui-mode="quick"] .scenario-filter-row,
body[data-spn-ui-mode="newbie"] .scenario-filter-row,
body[data-spn-ui-mode="newbie"] #templateDensityFilter{display:none!important}'''
)

replace_once(
    'tools/browser-smoke.html',
    '''        pass('ранние runtime-ошибки не обнаружены');

        const postPrintWorkspace''',
    '''        pass('ранние runtime-ошибки не обнаружены');

        await waitFor(() => doc.body.dataset.spnUiMode === 'quick' && doc.getElementById('spnWizard'), 5000, 'быстрый режим или рабочие ситуации не готовы');
        const startCard = doc.querySelector('.start-card');
        const situationWizard = doc.getElementById('spnWizard');
        const densityFilter = doc.getElementById('templateDensityFilter');
        assert(startCard && win.getComputedStyle(startCard).display === 'none', 'в быстром режиме повторно показан отдельный выбор задачи');
        assert(situationWizard && win.getComputedStyle(situationWizard).display !== 'none', 'в быстром режиме скрыт основной выбор рабочей ситуации');
        assert(densityFilter && win.getComputedStyle(densityFilter).display !== 'none', 'в быстром режиме ошибочно скрыт полезный фильтр плотности');
        pass('режим Быстро: одна точка выбора через рабочую ситуацию');

        const postPrintWorkspace'''
)

replace_once(
    'tools/browser-smoke.html',
    '''        assert(doc.getElementById('spnWizardToggle')?.textContent.trim() === 'Показать все разделы', 'активная кнопка не объясняет возврат всех разделов');
        pass('режим Новичок включён');''',
    '''        assert(doc.getElementById('spnWizardToggle')?.textContent.trim() === 'Показать все разделы', 'активная кнопка не объясняет возврат всех разделов');
        assert(win.getComputedStyle(startCard).display === 'none', 'в режиме Новичок повторно показан отдельный выбор задачи');
        assert(win.getComputedStyle(situationWizard).display !== 'none', 'в режиме Новичок скрыт выбор рабочей ситуации');
        assert(win.getComputedStyle(densityFilter).display === 'none', 'новичку показан фильтр плотности, который принудительно сбрасывается');
        pass('режим Новичок: повторная задача и лишняя плотность скрыты');
        pass('режим Новичок включён');'''
)

replace_once(
    'tools/browser-smoke.html',
    '''        click(doc, '[data-spn-ui-mode="quick"]');
        await waitFor(() => doc.body.dataset.spnUiMode === 'quick', 2000, 'режим Быстро не включился');
        const advancedWorkbench''',
    '''        click(doc, '[data-spn-ui-mode="quick"]');
        await waitFor(() => doc.body.dataset.spnUiMode === 'quick', 2000, 'режим Быстро не включился');
        assert(win.getComputedStyle(startCard).display === 'none', 'после возврата в Быстро снова появился повторный выбор задачи');
        assert(win.getComputedStyle(densityFilter).display !== 'none', 'после возврата в Быстро фильтр плотности не восстановился');
        const advancedWorkbench'''
)

replace_once(
    'tools/browser-smoke.html',
    '''        click(doc, '[data-spn-ui-mode="advanced"]');
        await waitFor(() => doc.body.dataset.spnUiMode === 'advanced', 2000, 'режим Расширенно не включился');
        await waitFor(() => win.getComputedStyle(advancedWorkbench).display !== 'none' ''',
    '''        click(doc, '[data-spn-ui-mode="advanced"]');
        await waitFor(() => doc.body.dataset.spnUiMode === 'advanced', 2000, 'режим Расширенно не включился');
        assert(win.getComputedStyle(startCard).display !== 'none', 'в расширенном режиме скрыт ручной выбор задачи');
        assert(win.getComputedStyle(densityFilter).display !== 'none', 'в расширенном режиме скрыт фильтр плотности');
        pass('режим Расширенно: ручная задача и фильтры доступны');
        await waitFor(() => win.getComputedStyle(advancedWorkbench).display !== 'none' '''
)

replace_once(
    'README.md',
    '''- режим `Новичок` с безопасным фильтром шаблонов;
- маршрут `Задача и формат → Шаблон → Текст → Фото / QR → Проверка и печать → Задание → Отчёт`;''',
    '''- режим `Новичок` с безопасным фильтром шаблонов;
- в режимах `Новичок` и `Быстро` задача определяется рабочей ситуацией без повторного блока выбора;
- ручной выбор задачи и полный набор фильтров остаются в `Расширенном` режиме;
- маршрут `Задача и формат → Шаблон → Текст → Фото / QR → Проверка и печать → Задание → Отчёт`;'''
)

replace_once(
    'docs/newbie-mode-regression-checklist.md',
    '''- при входе в `Новичок` пошаговая подготовка включается автоматически;
- внутри уже активного режима `Новичок` можно нажать `Показать все разделы`;''',
    '''- при входе в `Новичок` пошаговая подготовка включается автоматически;
- отдельный блок `Выберите задачу` скрыт, потому что задача задаётся рабочей ситуацией;
- фильтр плотности скрыт, потому что режим новичка всегда использует безопасное значение `Все`;
- внутри уже активного режима `Новичок` можно нажать `Показать все разделы`;'''
)

replace_once(
    'docs/newbie-mode-regression-checklist.md',
    '''3. Нажать `Расширенно`.
4. Убедиться, что расширенные настройки доступны.''',
    '''3. Нажать `Расширенно`.
4. Убедиться, что снова видны ручной выбор задачи, фильтр плотности и расширенные настройки.'''
)

replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    '''  uiMode: 'assets/js/spnUiMode.js',
  newbieMode: 'assets/js/spnNewbieMode.js',''',
    '''  uiMode: 'assets/js/spnUiMode.js',
  uiModeCss: 'assets/css/spn-ui-mode.css',
  browserSmoke: 'tools/browser-smoke.html',
  newbieMode: 'assets/js/spnNewbieMode.js','''
)

replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    '''requireSnippets(files.newbieMode, sources.newbieMode, [''',
    '''requireSnippets(files.uiModeCss, sources.uiModeCss, [
  'body[data-spn-ui-mode="quick"] .start-card',
  'body[data-spn-ui-mode="newbie"] .start-card',
  'body[data-spn-ui-mode="newbie"] #templateDensityFilter'
]);
requireSnippets(files.browserSmoke, sources.browserSmoke, [
  'режим Быстро: одна точка выбора через рабочую ситуацию',
  'режим Новичок: повторная задача и лишняя плотность скрыты',
  'режим Расширенно: ручная задача и фильтры доступны',
  "win.getComputedStyle(startCard).display === 'none'",
  "win.getComputedStyle(densityFilter).display === 'none'"
]);

requireSnippets(files.newbieMode, sources.newbieMode, ['''
)

replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    '''  'Проверка фильтра шаблонов новичка',
  'Проверка пошаговой подготовки',''',
    '''  'Проверка фильтра шаблонов новичка',
  'отдельный блок `Выберите задачу` скрыт',
  'фильтр плотности скрыт',
  'Проверка пошаговой подготовки','''
)

replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    '''  'режим `Новичок` с безопасным фильтром шаблонов',
  'ручная регрессионная проверка режима «Новичок»',''',
    '''  'режим `Новичок` с безопасным фильтром шаблонов',
  'в режимах `Новичок` и `Быстро` задача определяется рабочей ситуацией без повторного блока выбора',
  'ручной выбор задачи и полный набор фильтров остаются в `Расширенном` режиме',
  'ручная регрессионная проверка режима «Новичок»','''
)
