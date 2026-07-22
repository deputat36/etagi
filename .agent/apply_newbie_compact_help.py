from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    source = file_path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: ожидалось одно совпадение, найдено {count}')
    file_path.write_text(source.replace(old, new, 1), encoding='utf-8')


# Режим «Новичок»: вернуть помощь в компактном виде, не меняя режимы Быстро/Расширенно.
replace_once(
    'assets/css/spn-ui-mode.css',
    'body[data-spn-ui-mode="newbie"] .advanced,\nbody[data-spn-ui-mode="newbie"] .save-card,\nbody[data-spn-ui-mode="newbie"] .help-card,\nbody[data-spn-ui-mode="newbie"] .spn-field-plan,',
    'body[data-spn-ui-mode="newbie"] .advanced,\nbody[data-spn-ui-mode="newbie"] .save-card,\nbody[data-spn-ui-mode="newbie"] .spn-field-plan,'
)
replace_once(
    'assets/css/spn-ui-mode.css',
    'body[data-spn-ui-mode="newbie"] .spn-result-estimator{display:none!important}\n',
    '''body[data-spn-ui-mode="newbie"] .spn-result-estimator{display:none!important}\nbody[data-spn-ui-mode="newbie"] .help-card{display:block!important;padding:12px}\nbody[data-spn-ui-mode="newbie"] .help-card .step-title{margin-bottom:8px}\nbody[data-spn-ui-mode="newbie"] .help-card .help-grid{grid-template-columns:1fr 1fr}\nbody[data-spn-ui-mode="newbie"] .help-card .help-grid a{display:none!important}\nbody[data-spn-ui-mode="newbie"] .help-card .help-grid a[href="help/quick-start.html"],\nbody[data-spn-ui-mode="newbie"] .help-card .help-grid a[href="help/faq.html"]{display:flex!important}\nbody[data-spn-ui-mode="newbie"] .help-card .help-tips{display:none!important}\n'''
)
replace_once(
    'assets/css/spn-ui-mode.css',
    '@media(max-width:520px){.spn-ui-mode{grid-template-columns:1fr}.spn-ui-mode-actions button{flex:1}}',
    '@media(max-width:520px){.spn-ui-mode{grid-template-columns:1fr}.spn-ui-mode-actions button{flex:1}body[data-spn-ui-mode="newbie"] .help-card .help-grid{grid-template-columns:1fr}}'
)

# Настоящий browser smoke для трёх режимов.
replace_once(
    'tools/browser-smoke.html',
    "        const densityFilter = doc.getElementById('templateDensityFilter');\n",
    "        const densityFilter = doc.getElementById('templateDensityFilter');\n        const helpCard = doc.querySelector('.help-card');\n        const helpLinks = [...doc.querySelectorAll('.help-card .help-grid a')];\n        const helpTips = doc.querySelector('.help-card .help-tips');\n"
)
replace_once(
    'tools/browser-smoke.html',
    "        assert(densityFilter && win.getComputedStyle(densityFilter).display !== 'none', 'в быстром режиме ошибочно скрыт полезный фильтр плотности');\n        pass('режим Быстро: одна точка выбора через рабочую ситуацию');",
    "        assert(densityFilter && win.getComputedStyle(densityFilter).display !== 'none', 'в быстром режиме ошибочно скрыт полезный фильтр плотности');\n        assert(helpCard && win.getComputedStyle(helpCard).display === 'none', 'в быстром режиме показан справочный блок, создающий лишний перегруз');\n        pass('режим Быстро: одна точка выбора через рабочую ситуацию');\n        pass('режим Быстро: справочный блок скрыт');"
)
replace_once(
    'tools/browser-smoke.html',
    "        assert(win.getComputedStyle(densityFilter).display === 'none', 'новичку показан фильтр плотности, который принудительно сбрасывается');\n        pass('режим Новичок: повторная задача и лишняя плотность скрыты');",
    "        assert(win.getComputedStyle(densityFilter).display === 'none', 'новичку показан фильтр плотности, который принудительно сбрасывается');\n        assert(helpCard && win.getComputedStyle(helpCard).display !== 'none', 'новичку скрыта помощь');\n        const visibleNewbieHelp = helpLinks.filter(link => win.getComputedStyle(link).display !== 'none');\n        assert(visibleNewbieHelp.length === 2, `новичку показано ${visibleNewbieHelp.length} справочных ссылок вместо двух`);\n        assert(visibleNewbieHelp.some(link => link.getAttribute('href') === 'help/quick-start.html'), 'новичку недоступен быстрый старт');\n        assert(visibleNewbieHelp.some(link => link.getAttribute('href') === 'help/faq.html'), 'новичку недоступны вопросы и ответы');\n        assert(helpTips && win.getComputedStyle(helpTips).display === 'none', 'новичку показан полный список справочных советов');\n        pass('режим Новичок: повторная задача и лишняя плотность скрыты');\n        pass('режим Новичок: компактная помощь доступна');"
)
replace_once(
    'tools/browser-smoke.html',
    "        assert(win.getComputedStyle(densityFilter).display !== 'none', 'в расширенном режиме скрыт фильтр плотности');\n        pass('режим Расширенно: ручная задача и фильтры доступны');",
    "        assert(win.getComputedStyle(densityFilter).display !== 'none', 'в расширенном режиме скрыт фильтр плотности');\n        const visibleAdvancedHelp = helpLinks.filter(link => win.getComputedStyle(link).display !== 'none');\n        assert(helpCard && win.getComputedStyle(helpCard).display !== 'none', 'в расширенном режиме скрыт центр помощи');\n        assert(visibleAdvancedHelp.length === helpLinks.length && helpLinks.length >= 7, 'в расширенном режиме доступен не полный центр помощи');\n        assert(helpTips && win.getComputedStyle(helpTips).display !== 'none', 'в расширенном режиме скрыты справочные советы');\n        pass('режим Расширенно: ручная задача и фильтры доступны');\n        pass('режим Расширенно: полный центр помощи доступен');"
)

# Ручной регрессионный сценарий.
replace_once(
    'docs/newbie-mode-regression-checklist.md',
    '## Проверка пошаговой подготовки\n',
    '''## Проверка компактной помощи\n\n1. В режиме `Быстро` убедиться, что отдельный блок `Помощь` не занимает рабочее место.\n2. Переключиться в `Новичок`.\n3. Убедиться, что внизу боковой панели появился компактный блок `Помощь`.\n4. Проверить, что в нём доступны только `Быстрый старт СПН` и `Вопросы и ответы`.\n5. Убедиться, что длинный список ссылок и справочные советы скрыты.\n6. Переключиться в `Расширенно` и проверить, что вернулись все ссылки центра помощи и три справочных совета.\n\n## Проверка пошаговой подготовки\n'''
)
replace_once(
    'docs/newbie-mode-regression-checklist.md',
    '- В режиме `Новичок` скрыты только технические настройки печати; цветность и обязательные защитные параметры доступны.\n',
    '- В режиме `Новичок` скрыты только технические настройки печати; цветность и обязательные защитные параметры доступны.\n- В режиме `Новичок` доступна компактная помощь с быстрым стартом и FAQ; в `Расширенно` доступен полный центр помощи.\n'
)
replace_once(
    'docs/newbie-mode-regression-checklist.md',
    '- У новичка скрыты цветность, линии реза, безопасные поля или отрывные телефоны.\n',
    '- У новичка скрыты цветность, линии реза, безопасные поля или отрывные телефоны.\n- У новичка полностью скрыта помощь либо показан весь перегруженный центр помощи.\n- В расширенном режиме отсутствуют ссылки или советы полного центра помощи.\n'
)

# Статический контракт существующего валидатора режима новичка.
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "  readme: 'README.md'\n};",
    "  readme: 'README.md',\n  visibilityAudit: 'docs/ui-mode-visibility-audit.md'\n};"
)
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "  'body[data-spn-ui-mode=\"newbie\"] #templateDensityFilter'\n]);",
    "  'body[data-spn-ui-mode=\"newbie\"] #templateDensityFilter',\n  'body[data-spn-ui-mode=\"quick\"] .help-card',\n  'body[data-spn-ui-mode=\"newbie\"] .help-card .help-grid a[href=\"help/quick-start.html\"]',\n  'body[data-spn-ui-mode=\"newbie\"] .help-card .help-grid a[href=\"help/faq.html\"]',\n  'body[data-spn-ui-mode=\"newbie\"] .help-card .help-tips'\n]);"
)
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "  \"win.getComputedStyle(densityFilter).display === 'none'\"\n]);",
    "  \"win.getComputedStyle(densityFilter).display === 'none'\",\n  'режим Быстро: справочный блок скрыт',\n  'режим Новичок: компактная помощь доступна',\n  'режим Расширенно: полный центр помощи доступен'\n]);"
)
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "requireSnippets(files.newbieMode, sources.newbieMode, [",
    "requireSnippets(files.visibilityAudit, sources.visibilityAudit, [\n  '# Матрица видимости режимов интерфейса',\n  '| Помощь | скрыта | компактно: быстрый старт и FAQ | полностью |',\n  'Сохранение и перенос',\n  'Следующий кандидат для отдельной проверки'\n]);\n\nrequireSnippets(files.newbieMode, sources.newbieMode, ["
)
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "  'Проверка фильтра шаблонов новичка',\n",
    "  'Проверка фильтра шаблонов новичка',\n  'Проверка компактной помощи',\n  'Быстрый старт СПН',\n  'Вопросы и ответы',\n"
)

Path('docs/ui-mode-visibility-audit.md').write_text('''# Матрица видимости режимов интерфейса\n\nДата проверки: 22.07.2026.\n\nМатрица фиксирует ожидаемую видимость основных рабочих блоков. Она нужна, чтобы упрощение интерфейса не превращалось в случайное удаление функций.\n\n| Блок | Быстро | Новичок | Расширенно |\n|---|---|---|---|\n| Рабочая ситуация | видна | видна | видна |\n| Ручной выбор технической задачи | скрыт | скрыт | виден |\n| Фильтр плотности шаблонов | виден | скрыт | виден |\n| Быстрые режимы компоновки | видны | видны | видны |\n| Ручной состав и порядок блоков | скрыт | скрыт | виден |\n| Фото и QR | видны | видны по шагу | видны |\n| Основные настройки печати | видны | видны по шагу | видны |\n| Деление листа и режим проверки печати | видны | скрыты | видны |\n| Контроль качества | виден | виден по шагу | виден |\n| Сохранение и перенос | скрыты | скрыты | видны |\n| Помощь | скрыта | компактно: быстрый старт и FAQ | полностью |\n| Гибкая настройка для опытных | скрыта | скрыта | видна |\n| После печати | компактно, закрыто | открывается на шагах задания и отчёта | компактно, закрыто |\n| Дополнительная аналитика | скрыта | скрыта | компактно, закрыта |\n\n## Решение текущей итерации\n\nПолное скрытие помощи у новичка признано ошибочным: пользователь терял быстрый старт именно в режиме обучения. Полный центр помощи также не подходит, потому что семь ссылок и советы перегружают пошаговый путь. Поэтому новичку доступны только быстрый старт и FAQ.\n\n## Следующий кандидат для отдельной проверки\n\n`Сохранение и перенос` полностью скрыто в режиме `Быстро`. Перед изменением необходимо отдельно определить минимальное действие после подготовки макета: локальное сохранение, файл одного макета или переход в `Расширенно`. Нельзя возвращать весь большой блок без проверки пользовательского сценария.\n''', encoding='utf-8')

print('Миграция компактной помощи новичка применена.')
