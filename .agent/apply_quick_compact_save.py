from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    source = file_path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: ожидалось одно совпадение, найдено {count}')
    file_path.write_text(source.replace(old, new, 1), encoding='utf-8')


# В режиме «Быстро» показываем только безопасную передачу файла одного макета.
replace_once(
    'assets/css/spn-ui-mode.css',
    'body[data-spn-ui-mode="quick"] .advanced,\nbody[data-spn-ui-mode="quick"] .save-card,\nbody[data-spn-ui-mode="quick"] .help-card,',
    'body[data-spn-ui-mode="quick"] .advanced,\nbody[data-spn-ui-mode="quick"] .help-card,'
)
replace_once(
    'assets/css/spn-ui-mode.css',
    'body[data-spn-ui-mode="newbie"] .help-card .help-tips{display:none!important}\n',
    '''body[data-spn-ui-mode="newbie"] .help-card .help-tips{display:none!important}\nbody[data-spn-ui-mode="quick"] .save-card{display:block;padding:12px}\nbody[data-spn-ui-mode="quick"] .save-card .save-transfer-intro,\nbody[data-spn-ui-mode="quick"] .save-card [data-save-transfer-section],\nbody[data-spn-ui-mode="quick"] .save-card .save-transfer-privacy{display:none!important}\nbody[data-spn-ui-mode="quick"] .save-card [data-save-transfer-section="layout-file"]{display:block!important}\nbody[data-spn-ui-mode="quick"] .save-card [data-save-transfer-section="layout-file"] .save-transfer-section-head{margin-bottom:8px}\n'''
)

# Настоящий browser smoke для компактного и полного варианта сохранения.
replace_once(
    'tools/browser-smoke.html',
    "        const helpTips = doc.querySelector('.help-card .help-tips');\n",
    "        const helpTips = doc.querySelector('.help-card .help-tips');\n        const saveCard = doc.querySelector('.save-card');\n        const saveCurrentSection = doc.querySelector('[data-save-transfer-section=\"current\"]');\n        const saveNamedSection = doc.querySelector('[data-save-transfer-section=\"named\"]');\n        const saveLayoutFileSection = doc.querySelector('[data-save-transfer-section=\"layout-file\"]');\n        const savePrivacy = doc.querySelector('.save-transfer-privacy');\n"
)
replace_once(
    'tools/browser-smoke.html',
    "        pass('режим Быстро: справочный блок скрыт');\n",
    "        pass('режим Быстро: справочный блок скрыт');\n        assert(saveCard && win.getComputedStyle(saveCard).display !== 'none', 'в быстром режиме полностью скрыто сохранение и передача макета');\n        assert(saveCurrentSection && win.getComputedStyle(saveCurrentSection).display === 'none', 'в быстром режиме показаны ручные резервы');\n        assert(saveNamedSection && win.getComputedStyle(saveNamedSection).display === 'none', 'в быстром режиме показаны именованные макеты');\n        assert(saveLayoutFileSection && win.getComputedStyle(saveLayoutFileSection).display !== 'none', 'в быстром режиме скрыт файл одного макета');\n        assert(win.getComputedStyle(doc.getElementById('downloadBtn')).display !== 'none', 'в быстром режиме скрыто скачивание макета');\n        assert(win.getComputedStyle(doc.getElementById('uploadBtn')).display !== 'none', 'в быстром режиме скрыто открытие файла макета');\n        assert(savePrivacy && win.getComputedStyle(savePrivacy).display === 'none', 'в быстром режиме показано лишнее описание локальных сохранений');\n        pass('режим Быстро: доступен компактный файл одного макета');\n"
)
replace_once(
    'tools/browser-smoke.html',
    "        pass('режим Новичок: компактная помощь доступна');\n",
    "        pass('режим Новичок: компактная помощь доступна');\n        assert(saveCard && win.getComputedStyle(saveCard).display === 'none', 'новичку показан отдельный блок сохранения вне учебного пути');\n        pass('режим Новичок: отдельное сохранение скрыто');\n"
)
replace_once(
    'tools/browser-smoke.html',
    "        assert(win.getComputedStyle(densityFilter).display !== 'none', 'после возврата в Быстро фильтр плотности не восстановился');\n",
    "        assert(win.getComputedStyle(densityFilter).display !== 'none', 'после возврата в Быстро фильтр плотности не восстановился');\n        assert(saveCard && win.getComputedStyle(saveCard).display !== 'none', 'после возврата в Быстро не восстановился компактный файл макета');\n        assert(saveLayoutFileSection && win.getComputedStyle(saveLayoutFileSection).display !== 'none', 'после возврата в Быстро скрыт раздел файла макета');\n"
)
replace_once(
    'tools/browser-smoke.html',
    "        assert(helpTips && win.getComputedStyle(helpTips).display !== 'none', 'в расширенном режиме скрыты справочные советы');\n        pass('режим Расширенно: ручная задача и фильтры доступны');",
    "        assert(helpTips && win.getComputedStyle(helpTips).display !== 'none', 'в расширенном режиме скрыты справочные советы');\n        assert(saveCard && win.getComputedStyle(saveCard).display !== 'none', 'в расширенном режиме скрыт блок сохранения и переноса');\n        assert(saveCurrentSection && win.getComputedStyle(saveCurrentSection).display !== 'none', 'в расширенном режиме скрыты ручные резервы');\n        assert(saveNamedSection && win.getComputedStyle(saveNamedSection).display !== 'none', 'в расширенном режиме скрыты именованные макеты');\n        assert(saveLayoutFileSection && win.getComputedStyle(saveLayoutFileSection).display !== 'none', 'в расширенном режиме скрыт файл одного макета');\n        assert(savePrivacy && win.getComputedStyle(savePrivacy).display !== 'none', 'в расширенном режиме скрыто пояснение хранения');\n        pass('режим Расширенно: ручная задача и фильтры доступны');"
)
replace_once(
    'tools/browser-smoke.html',
    "        pass('режим Расширенно: полный центр помощи доступен');\n",
    "        pass('режим Расширенно: полный центр помощи доступен');\n        pass('режим Расширенно: полный блок сохранения доступен');\n"
)

# Ручной регрессионный сценарий.
replace_once(
    'docs/newbie-mode-regression-checklist.md',
    '## Проверка компактной помощи\n',
    '''## Проверка компактного сохранения в режиме «Быстро»\n\n1. Включить `Быстро`.\n2. Убедиться, что виден компактный блок `Сохранение и перенос`.\n3. Проверить, что в нём отображается только раздел `Файл одного макета`.\n4. Убедиться, что доступны кнопки `Скачать один макет` и `Открыть файл макета`.\n5. Проверить, что ручной резерв, список `Мои макеты` и длинное пояснение локального хранения скрыты.\n6. Переключиться в `Новичок` и убедиться, что отдельный блок сохранения скрыт.\n7. Переключиться в `Расширенно` и проверить, что доступны все три раздела сохранения и переноса.\n\n## Проверка компактной помощи\n'''
)
replace_once(
    'docs/newbie-mode-regression-checklist.md',
    '- В режиме `Новичок` доступна компактная помощь с быстрым стартом и FAQ; в `Расширенно` доступен полный центр помощи.\n',
    '- В режиме `Новичок` доступна компактная помощь с быстрым стартом и FAQ; в `Расширенно` доступен полный центр помощи.\n- В режиме `Быстро` доступен только файл одного макета; в `Новичок` сохранение скрыто, в `Расширенно` доступен полный блок.\n'
)
replace_once(
    'docs/newbie-mode-regression-checklist.md',
    '- В расширенном режиме отсутствуют ссылки или советы полного центра помощи.\n',
    '- В расширенном режиме отсутствуют ссылки или советы полного центра помощи.\n- В режиме `Быстро` полностью скрыт файл одного макета либо показаны все сложные варианты сохранения.\n- В расширенном режиме отсутствует любой из трёх разделов сохранения и переноса.\n'
)

# Обновляем матрицу и фиксируем следующее решение.
replace_once(
    'docs/ui-mode-visibility-audit.md',
    '| Сохранение и перенос | скрыты | скрыты | видны |',
    '| Сохранение и перенос | компактно: файл одного макета | скрыты | полностью |'
)
replace_once(
    'docs/ui-mode-visibility-audit.md',
    '## Решение текущей итерации\n',
    '## Решение: компактная помощь новичку\n'
)
replace_once(
    'docs/ui-mode-visibility-audit.md',
    '## Следующий кандидат для отдельной проверки\n\n`Сохранение и перенос` полностью скрыто в режиме `Быстро`. Перед изменением необходимо отдельно определить минимальное действие после подготовки макета: локальное сохранение, файл одного макета или переход в `Расширенно`. Нельзя возвращать весь большой блок без проверки пользовательского сценария.\n',
    '''## Решение: компактное сохранение в режиме «Быстро»\n\nАвтосохранение уже работает в браузере, поэтому отдельный ручной резерв не нужен в основном быстром пути. Для передачи или согласования достаточно файла одного макета. Именованные макеты и ручные резервы остаются в `Расширенно`.\n\n## Следующий кандидат для отдельной проверки\n\nВ режиме `Новичок` сохранение остаётся скрытым, поскольку учебный маршрут ведёт напрямую от проверки к заданию и отчёту. Отдельно нужно решить, нужен ли новичку безопасный экспорт после завершения первого макета или достаточно перехода в `Быстро`.\n'''
)

# Расширяем существующий статический контракт режима и матрицы.
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "  'body[data-spn-ui-mode=\"newbie\"] .help-card .help-tips'\n]);",
    "  'body[data-spn-ui-mode=\"newbie\"] .help-card .help-tips',\n  'body[data-spn-ui-mode=\"quick\"] .save-card [data-save-transfer-section=\"layout-file\"]',\n  'body[data-spn-ui-mode=\"quick\"] .save-card .save-transfer-intro',\n  'body[data-spn-ui-mode=\"quick\"] .save-card .save-transfer-privacy'\n]);"
)
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "  'режим Расширенно: полный центр помощи доступен'\n]);",
    "  'режим Расширенно: полный центр помощи доступен',\n  'режим Быстро: доступен компактный файл одного макета',\n  'режим Новичок: отдельное сохранение скрыто',\n  'режим Расширенно: полный блок сохранения доступен'\n]);"
)
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "  '| Помощь | скрыта | компактно: быстрый старт и FAQ | полностью |',\n  'Сохранение и перенос',",
    "  '| Помощь | скрыта | компактно: быстрый старт и FAQ | полностью |',\n  '| Сохранение и перенос | компактно: файл одного макета | скрыты | полностью |',\n  'Решение: компактное сохранение в режиме «Быстро»',"
)
replace_once(
    'tools/validate-newbie-mode-docs.mjs',
    "  'Проверка компактной помощи',\n",
    "  'Проверка компактного сохранения в режиме «Быстро»',\n  'Скачать один макет',\n  'Открыть файл макета',\n  'Проверка компактной помощи',\n"
)

print('Миграция компактного сохранения в режиме Быстро применена.')
