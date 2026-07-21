from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(relative_path: str, old: str, new: str) -> None:
    path = ROOT / relative_path
    source = path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{relative_path}: ожидался один фрагмент, найдено {count}: {old[:100]}')
    path.write_text(source.replace(old, new, 1), encoding='utf-8')


def replace_all(relative_path: str, replacements: list[tuple[str, str]]) -> None:
    path = ROOT / relative_path
    source = path.read_text(encoding='utf-8')
    for old, new in replacements:
        if old not in source:
            raise SystemExit(f'{relative_path}: отсутствует фрагмент: {old[:120]}')
        source = source.replace(old, new)
    path.write_text(source, encoding='utf-8')


replace_once(
    'index.html',
    '''      <section class="card save-card">
        <div class="step-title"><span>↓</span>Сохранение</div>
        <label>Название макета<input id="layoutName" type="text" placeholder="Например: Куплю 2-комнатную у школы"></label>
        <div class="saved-layout-controls">
          <select id="savedLayouts" aria-label="Сохранённые макеты"><option value="">Сохранённые макеты</option></select>
          <button id="saveNamedLayoutBtn" type="button">Сохранить как макет</button>
          <button id="loadNamedLayoutBtn" type="button">Загрузить выбранный</button>
          <button id="deleteNamedLayoutBtn" type="button">Удалить выбранный</button>
        </div>
        <div class="quick-actions">
          <button id="saveLocalBtn" type="button">Сохранить последний</button>
          <button id="loadLocalBtn" type="button">Загрузить последний</button>
          <button id="downloadBtn" type="button">Скачать файл</button>
          <button id="uploadBtn" type="button">Открыть файл</button>
        </div>
        <input id="uploadFile" type="file" accept="application/json" hidden>
        <p class="muted">Именованные макеты хранятся в этом браузере. Фото не сохраняются, чтобы не переполнять память браузера.</p>
      </section>''',
    '''      <section class="card save-card" aria-labelledby="saveTransferTitle">
        <div class="step-title" id="saveTransferTitle"><span>↓</span>Сохранение и перенос</div>
        <p class="save-transfer-intro">Выберите способ по задаче: продолжить работу на этом устройстве, сохранить несколько вариантов, передать один макет или перенести всё рабочее пространство.</p>

        <div class="save-transfer-section" data-save-transfer-section="current">
          <div class="save-transfer-section-head">
            <b>Текущая работа</b>
            <span>Автосохранение работает в этом браузере. Ручной резерв создаёт отдельную копию одного текущего макета.</span>
          </div>
          <div class="quick-actions save-transfer-actions">
            <button id="saveLocalBtn" type="button">Сохранить ручной резерв</button>
            <button id="loadLocalBtn" type="button">Открыть ручной резерв</button>
          </div>
        </div>

        <div class="save-transfer-section" data-save-transfer-section="named">
          <div class="save-transfer-section-head">
            <b>Мои макеты</b>
            <span>Несколько макетов с названиями на этом устройстве. Подходит для повторяющихся районов и задач.</span>
          </div>
          <label>Название макета<input id="layoutName" type="text" placeholder="Например: Куплю 2-комнатную у школы"></label>
          <div class="saved-layout-controls">
            <select id="savedLayouts" aria-label="Мои сохранённые макеты"><option value="">Мои сохранённые макеты</option></select>
            <button id="saveNamedLayoutBtn" type="button">Сохранить в «Мои макеты»</button>
            <button id="loadNamedLayoutBtn" type="button">Открыть выбранный</button>
            <button id="deleteNamedLayoutBtn" type="button">Удалить выбранный</button>
          </div>
        </div>

        <div class="save-transfer-section" data-save-transfer-section="layout-file">
          <div class="save-transfer-section-head">
            <b>Файл одного макета</b>
            <span>Для передачи одного макета на другой компьютер. История, задания и остальные сохранения в файл не входят.</span>
          </div>
          <div class="quick-actions save-transfer-actions">
            <button id="downloadBtn" type="button">Скачать один макет</button>
            <button id="uploadBtn" type="button">Открыть файл макета</button>
          </div>
          <input id="uploadFile" type="file" accept="application/json" hidden>
        </div>

        <p class="muted save-transfer-privacy">Локальные сохранения остаются только в этом браузере. Фото не сохраняются, чтобы не переполнять его память.</p>
      </section>'''
)

replace_all('assets/js/app.js', [
    ("setStatus(saved ? 'Последний макет сохранён в этом браузере.' : 'Не удалось сохранить последний макет. Возможно, в браузере закончилось место.');", "setStatus(saved ? 'Ручной резерв текущего макета сохранён на этом устройстве.' : 'Не удалось сохранить ручной резерв. Возможно, в браузере закончилось место.');"),
    ("setStatus('Последний макет загружен без смешивания с текущим макетом.');", "setStatus('Ручной резерв открыт без смешивания с текущим макетом.');"),
    ("} else setStatus('Последний сохранённый макет не найден.');", "} else setStatus('Ручной резерв текущего макета не найден.');"),
    ("select.innerHTML = '<option value=\"\">Сохранённые макеты</option>'", "select.innerHTML = '<option value=\"\">Мои сохранённые макеты</option>'")
])

replace_all('assets/js/spnWorkspaceBackup.js', [
    ('<div class="spn-workspace-backup" id="spnWorkspaceBackup">', '<section class="spn-workspace-backup save-transfer-section" id="spnWorkspaceBackup" data-save-transfer-section="workspace">'),
    ('<b>Backup рабочего пространства</b>', '<b>Полная копия рабочего пространства</b>'),
    ('<span>Профиль, макеты, избранное, настройки, задания и история отчётов.</span>', '<span>Для переноса всех локальных данных: профиля, макетов, настроек, заданий и истории отчётов.</span>'),
    ('<button type="button" id="exportWorkspaceBackupBtn">Скачать backup</button>', '<button type="button" id="exportWorkspaceBackupBtn">Скачать полную копию</button>'),
    ('<button type="button" id="importWorkspaceBackupBtn">Открыть backup</button>', '<button type="button" id="importWorkspaceBackupBtn">Восстановить из полной копии</button>'),
    ('<p>Фото не входят в backup: генератор намеренно не хранит изображения в localStorage.</p>\n  </div>`;', '<p>Фото не входят в полную копию: генератор намеренно не хранит изображения в localStorage.</p>\n  </section>`;'),
    ('.spn-workspace-backup{margin-top:12px;padding:10px;border:1px solid #c7d2fe;border-radius:14px;background:#eef2ff}', '.save-transfer-intro{margin:0 0 10px;font-size:11.5px;line-height:1.4;color:#475569}.save-transfer-section{margin-top:10px;padding:10px;border:1px solid #dbe3ee;border-radius:14px;background:#f8fafc}.save-transfer-section-head b{display:block;font-size:12px;font-weight:900;color:#1e293b}.save-transfer-section-head span{display:block;margin-top:3px;font-size:10.5px;line-height:1.35;color:#64748b;font-weight:700}.save-transfer-actions{margin-top:8px}.save-transfer-privacy{margin-top:10px}.saved-layout-controls{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.saved-layout-controls select{grid-column:1 / -1}.spn-workspace-backup{border-color:#c7d2fe;background:#eef2ff}'),
    ('.spn-workspace-backup-head b{display:block;font-size:12px;font-weight:900;color:#312e81}', '.spn-workspace-backup-head b{display:block;font-size:12px;font-weight:900;color:#312e81}'),
    ('@media(max-width:520px){.spn-workspace-backup-controls{grid-template-columns:1fr}}', '@media(max-width:520px){.spn-workspace-backup-controls,.saved-layout-controls{grid-template-columns:1fr}.saved-layout-controls select{grid-column:auto}}')
])

replace_once(
    'assets/js/spnWizardFlow.js',
    "help: 'Сохраните удачный макет с понятным названием: район, цель, формат А4. Это поможет быстро повторить рабочую связку позже.',",
    "help: 'Для работы на этом устройстве используйте автосохранение или «Мои макеты». Для передачи одного макета скачайте его файл, а для переноса всей работы — полную копию рабочего пространства.',"
)

replace_all('tools/ui-actions-smoke.html', [
    ("await waitFor(() => doc.getElementById('contactCtaText') && doc.getElementById('tearOffLabel') && doc.getElementById('brandNameText') && doc.getElementById('brandSideText'), 5000, 'редакторы служебных подписей не появились');", "await waitFor(() => doc.getElementById('contactCtaText') && doc.getElementById('tearOffLabel') && doc.getElementById('brandNameText') && doc.getElementById('brandSideText'), 5000, 'редакторы служебных подписей не появились');\n        await waitFor(() => doc.getElementById('spnWorkspaceBackup'), 5000, 'полная копия рабочего пространства не появилась');\n        const saveCard = doc.querySelector('.save-card');\n        assert(saveCard?.querySelector('.step-title')?.textContent.includes('Сохранение и перенос'), 'раздел не объясняет общее назначение');\n        for(const section of ['current','named','layout-file','workspace']) assert(saveCard?.querySelector(`[data-save-transfer-section=\"${section}\"]`), `не найден способ сохранения ${section}`);\n        assert(saveCard?.textContent.includes('Автосохранение работает в этом браузере'), 'не объяснено автосохранение текущей работы');\n        assert(doc.getElementById('saveLocalBtn')?.textContent.trim() === 'Сохранить ручной резерв', 'не объяснён ручной резерв');\n        assert(doc.getElementById('saveNamedLayoutBtn')?.textContent.includes('Мои макеты'), 'не объяснены именованные макеты');\n        assert(doc.getElementById('downloadBtn')?.textContent.trim() === 'Скачать один макет', 'файл одного макета назван неоднозначно');\n        assert(doc.getElementById('exportWorkspaceBackupBtn')?.textContent.trim() === 'Скачать полную копию', 'полная копия названа неоднозначно');\n        pass('сохранение и перенос: четыре назначения объяснены отдельно');"),
    ("await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Последний макет сохранён'), 3000, 'последний макет не сохранился');", "await waitFor(() => doc.getElementById('statusLine')?.textContent.includes('Ручной резерв текущего макета сохранён'), 3000, 'ручной резерв не сохранился');"),
    ("pass('последний макет: сохранение и загрузка');", "pass('ручной резерв: сохранение и загрузка');")
])

replace_all('data/ui-actions.json', [
    ('"effect":"Сохраняет текущий макет как последний в этом браузере."', '"effect":"Создаёт отдельный ручной резерв одного текущего макета на этом устройстве; автосохранение продолжает работать отдельно."'),
    ('"marker":"последний макет: сохранение и загрузка"', '"marker":"ручной резерв: сохранение и загрузка"'),
    ('"effect":"Заменяет текущее состояние последним сохранённым макетом."', '"effect":"Открывает отдельный ручной резерв и заменяет им текущее состояние после создания защитного снимка."'),
    ('"effect":"Скачивает текущий макет как версионированный JSON-файл со ссылкой на схему и датой экспорта."', '"effect":"Скачивает один текущий макет для передачи или хранения без истории, заданий и остальных локальных данных."'),
    ('"effect":"Открывает системный выбор JSON-файла макета."', '"effect":"Открывает системный выбор файла одного макета; полный backup рабочего пространства обрабатывается отдельным модулем."')
])

replace_all('tools/validate-storage-safety.mjs', [
    ("checkAppMessage('Не удалось сохранить последний макет. Возможно, в браузере закончилось место.');", "checkAppMessage('Не удалось сохранить ручной резерв. Возможно, в браузере закончилось место.');"),
    ('app.js: кнопка последнего макета должна проверять результат saveNamed', 'app.js: кнопка ручного резерва должна проверять результат saveNamed')
])

replace_once(
    'tools/validate-workspace-backup.mjs',
    """  smoke: 'tools/browser-smoke.html',
  guide: 'docs/workspace-backup.md',""",
    """  smoke: 'tools/browser-smoke.html',
  uiActions: 'tools/ui-actions-smoke.html',
  saveGuide: 'docs/save-and-transfer.md',
  guide: 'docs/workspace-backup.md',"""
)

replace_once(
    'tools/validate-workspace-backup.mjs',
    """  'Фото не входят в backup'
]);""",
    """  'Фото не входят в полную копию',
  'Полная копия рабочего пространства',
  'Скачать полную копию',
  'Восстановить из полной копии',
  'data-save-transfer-section="workspace"'
]);"""
)

replace_once(
    'tools/validate-workspace-backup.mjs',
    """forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnWorkspaceBackup.js"',
  "src='assets/js/spnWorkspaceBackup.js'"
]);""",
    """requireSnippets(files.index, sources.index, [
  'Сохранение и перенос',
  'data-save-transfer-section="current"',
  'Автосохранение работает в этом браузере',
  'Сохранить ручной резерв',
  'data-save-transfer-section="named"',
  'Сохранить в «Мои макеты»',
  'data-save-transfer-section="layout-file"',
  'Скачать один макет',
  'Открыть файл макета'
]);
forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnWorkspaceBackup.js"',
  "src='assets/js/spnWorkspaceBackup.js'",
  '>Сохранить последний<',
  '>Загрузить последний<',
  '>Скачать файл<',
  '>Открыть файл<' 
]);"""
)

replace_once(
    'tools/validate-workspace-backup.mjs',
    """requireSnippets(files.smoke, sources.smoke, [
  "doc.getElementById('spnWorkspaceBackup')",
  'backup рабочего пространства доступен'
]);""",
    """requireSnippets(files.smoke, sources.smoke, [
  "doc.getElementById('spnWorkspaceBackup')",
  'backup рабочего пространства доступен'
]);
requireSnippets(files.uiActions, sources.uiActions, [
  'сохранение и перенос: четыре назначения объяснены отдельно',
  'Автосохранение работает в этом браузере',
  'Сохранить ручной резерв',
  'Скачать один макет',
  'Скачать полную копию',
  'ручной резерв: сохранение и загрузка'
]);
requireSnippets(files.saveGuide, sources.saveGuide, [
  '# Сохранение и перенос',
  'Автосохранение',
  'Ручной резерв',
  'Мои макеты',
  'Файл одного макета',
  'Полная копия рабочего пространства',
  'Что выбрать'
]);"""
)

replace_all('docs/workspace-backup.md', [
    ('# Backup рабочего пространства', '# Полная копия рабочего пространства'),
    ('Полный backup предназначен', 'Полная копия рабочего пространства предназначена'),
    ('## Что входит в backup', '## Что входит в полную копию'),
    ('Фото не входят в backup.', 'Фото не входят в полную копию.'),
    ('## Как скачать backup', '## Как скачать полную копию'),
    ('Найти блок `Сохранение`.', 'Найти блок `Сохранение и перенос`.'),
    ('В разделе `Backup рабочего пространства` нажать `Скачать backup`.', 'В разделе `Полная копия рабочего пространства` нажать `Скачать полную копию`.'),
    ('Нажать `Открыть backup`.', 'Нажать `Восстановить из полной копии`.'),
    ('Backup добавляется', 'Полная копия добавляется'),
    ('содержимым backup', 'содержимым полной копии'),
    ('неизвестный тип backup', 'неизвестный тип полной копии'),
    ('backup не содержит данных проекта', 'полная копия не содержит данных проекта'),
    ('исходный backup лучше сохранить отдельно', 'исходную полную копию лучше сохранить отдельно'),
    ('- backup хранит', '- полная копия хранит'),
    ('неизвестная версия backup', 'неизвестная версия полной копии'),
    ('Создавать backup:', 'Создавать полную копию:')
])

replace_once(
    'docs/layout-file-format.md',
    'JSON-файл нужен для переноса одного макета между компьютерами и браузерами. Он не заменяет сохранённые макеты в браузере и не содержит историю работы.',
    'JSON-файл нужен для переноса одного макета между компьютерами и браузерами. Он не заменяет «Мои макеты», не содержит историю, задания и настройки рабочего пространства. Для переноса всех локальных данных используется отдельная полная копия рабочего пространства.'
)

replace_once(
    'README.md',
    '''### Сохранность данных

- отдельное сохранение профиля СПН;
- последний и именованные макеты;
- версионированный JSON-макет с диагностикой ошибок;''',
    '''### Сохранение и перенос

- автосохранение текущей работы на этом устройстве;
- отдельный ручной резерв одного текущего макета;
- раздел «Мои макеты» для нескольких именованных вариантов на этом устройстве;
- файл одного макета для передачи без истории и настроек;
- полная копия рабочего пространства для переноса профиля, макетов, настроек, заданий и отчётов;
- версионированный JSON-макет с диагностикой ошибок;'''
)

replace_once(
    'README.md',
    '### Backup рабочего пространства',
    '### Полная копия рабочего пространства'
)

replace_once(
    'docs/wizard-flow-spec.md',
    '6. Сохранение      → сохранение текущего и именованного макета',
    '6. Сохранение      → автосохранение, ручной резерв, «Мои макеты», файл одного макета и полная копия рабочего пространства'
)

save_guide = '''# Сохранение и перенос

Раздел объединяет все способы сохранить работу, но каждый способ решает отдельную задачу.

## Что выбрать

| Задача | Способ | Где хранится | Что входит |
|---|---|---|---|
| Продолжить текущую работу позже | Автосохранение | В этом браузере | Текущий макет и его настройки |
| Сделать одну дополнительную точку возврата | Ручной резерв | В этом браузере | Один текущий макет |
| Хранить несколько рабочих вариантов | Мои макеты | В этом браузере | Несколько макетов с названиями |
| Передать один макет | Файл одного макета | JSON-файл | Один макет без истории и заданий |
| Перенести всю рабочую среду | Полная копия рабочего пространства | JSON-файл | Профиль, макеты, настройки, задания, отчёты и другие локальные данные |

## Автосохранение

Текущая работа сохраняется автоматически на этом устройстве. Автосохранение помогает продолжить редактирование после перезагрузки страницы, но не является переносимым файлом и зависит от данных браузера.

## Ручной резерв

Кнопка `Сохранить ручной резерв` создаёт отдельную копию одного текущего макета. Это быстрый способ оставить одну точку возврата перед заметными изменениями. Новый ручной резерв заменяет предыдущий ручной резерв.

## Мои макеты

Раздел `Мои макеты` хранит несколько вариантов с понятными названиями. Он подходит для повторяющихся районов, типов объектов и задач. Эти макеты остаются только в текущем браузере.

## Файл одного макета

Кнопка `Скачать один макет` создаёт переносимый JSON-файл одного макета. В него не входят история отчётов, задания, избранное и остальные локальные сохранения. Кнопка `Открыть файл макета` проверяет файл до замены текущей работы.

## Полная копия рабочего пространства

Полная копия предназначена для смены компьютера, восстановления после очистки браузера или регулярного резервирования всей локальной работы. Она включает профиль, макеты, настройки, задания и отчёты. Фото в полную копию не входят.

## Приватность

Все локальные способы зависят от данных текущего браузера. Файлы одного макета и полной копии могут содержать телефоны, адреса и заметки. Их нельзя публиковать в открытом доступе.
'''
(ROOT / 'docs/save-and-transfer.md').write_text(save_guide, encoding='utf-8')
