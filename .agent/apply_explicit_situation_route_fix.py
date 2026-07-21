from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(relative_path: str, old: str, new: str) -> None:
    path = ROOT / relative_path
    source = path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{relative_path}: ожидался один точный фрагмент, найдено {count}')
    path.write_text(source.replace(old, new, 1), encoding='utf-8')


replace_once(
    'assets/js/spnWizard.js',
    "const selectedSituation = Boolean(document.querySelector('[data-spn-situation].active')) || Boolean(value('templateSearch'));",
    "const selectedSituation = Boolean(document.querySelector('[data-spn-situation].active'));"
)

replace_once(
    'tools/workflow-selection-smoke.html',
    """        lastAction = 'route.search-as-situation';
        click(doc, '[data-spn-reset]');
        await waitFor(() => !doc.querySelector('[data-spn-situation].active') && value(doc, 'templateSearch') === '', 3000, 'сброс ситуации не завершился');
        setField(win, doc, '#templateSearch', 'квартира');
        await waitFor(() => doc.querySelector('#spnRouteSteps span')?.classList.contains('done'), 2000, 'ручной поиск не засчитался как ситуация');
        assert(doc.querySelector('#spnRouteSteps span')?.textContent.includes('Ситуация'), 'первый шаг маршрута имеет другое значение');
        assert(!doc.querySelector('[data-spn-situation].active'), 'ручной поиск неожиданно выбрал офисную ситуацию');
        pass('маршрут: ручной поиск пока засчитывается как выбранная ситуация');""",
    """        lastAction = 'route.search-is-not-situation';
        click(doc, '[data-spn-reset]');
        await waitFor(() => !doc.querySelector('[data-spn-situation].active') && value(doc, 'templateSearch') === '', 3000, 'сброс ситуации не завершился');
        setField(win, doc, '#templateSearch', 'квартира');
        await waitFor(() => value(doc, 'templateSearch') === 'квартира', 2000, 'ручной поиск не применился');
        const situationStep = doc.querySelector('#spnRouteSteps span');
        assert(situationStep?.textContent.includes('Ситуация'), 'первый шаг маршрута имеет другое значение');
        assert(situationStep?.classList.contains('todo'), 'ручной поиск ошибочно закрыл шаг Ситуация');
        assert(doc.getElementById('spnRouteNext')?.textContent.includes('Начните с офисной ситуации'), 'маршрут не предлагает явно выбрать ситуацию');
        assert(!doc.querySelector('[data-spn-situation].active'), 'ручной поиск неожиданно выбрал офисную ситуацию');
        pass('маршрут: ручной поиск не подменяет явный выбор ситуации');"""
)

replace_once(
    'data/workflow-selection-audit.json',
    """    {
      "id": "WF-04",
      "status": "open",
      "severity": "low",
      "title": "Маршрут считает любой поисковый запрос выбранной ситуацией",
      "impact": "Ручной текст в поиске закрывает шаг «Ситуация», хотя офисная ситуация не выбрана.",
      "recommendation": "Разделить явный выбор ситуации и ручной поиск в состоянии маршрута."
    },""",
    """    {
      "id": "WF-04",
      "status": "resolved",
      "severity": "low",
      "title": "Маршрут считал любой поисковый запрос выбранной ситуацией",
      "resolution": "Шаг «Ситуация» теперь зависит только от активной кнопки [data-spn-situation]. Ручной поиск фильтрует библиотеку, но не закрывает офисный шаг и не создаёт ложный прогресс.",
      "regression": "workflow-selection-smoke: route.search-is-not-situation"
    },"""
)

replace_once(
    'data/workflow-selection-audit.json',
    '"priority": "WF-03 + WF-04 + WF-05",\n    "safeDirection": "Упростить повторяющиеся фильтры, перестать считать ручной поиск офисной ситуацией и синхронизировать сценарий после явного выбора шаблона."',
    '"priority": "WF-03 + WF-05",\n    "safeDirection": "Упростить повторяющиеся фильтры ситуации и сценария, затем синхронизировать сценарий после явного выбора шаблона."'
)

replace_once(
    'docs/workflow-selection-audit.md',
    """## Оставшиеся вопросы

WF-03, WF-04 и WF-05 остаются открытыми:

- WF-03 — поиск ситуации и сценарный фильтр частично дублируют друг друга;
- WF-04 — ручной поисковый запрос пока засчитывается маршрутом как выбранная ситуация;
- WF-05 — явный шаблон синхронизирует задачу, но активный сценарий отдельно не пересчитывается.

Следующая безопасная итерация должна упростить эти три уровня без изменения рекламных текстов и печатной матрицы.""",
    """### WF-04 — исправлено

Ручной поиск теперь только фильтрует библиотеку. Шаг «Ситуация» закрывается исключительно после явного выбора офисной ситуации, поэтому поиск по слову «квартира» больше не создаёт ложный прогресс маршрута.

## Оставшиеся вопросы

WF-03 и WF-05 остаются открытыми:

- WF-03 — поиск ситуации и сценарный фильтр частично дублируют друг друга;
- WF-05 — явный шаблон синхронизирует задачу, но активный сценарий отдельно не пересчитывается.

Следующая безопасная итерация должна упростить повторяющиеся фильтры, а затем определить сценарий после явного выбора шаблона без изменения рекламных текстов и печатной матрицы."""
)

replace_once(
    'docs/workflow-selection-audit.md',
    """- ручной выбор задачи не заменяет макет;
- failure-log содержит последнее действие и снимок состояния.""",
    """- ручной выбор задачи не заменяет макет;
- ручной поиск не засчитывается как офисная ситуация;
- failure-log содержит последнее действие и снимок состояния."""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  for(const id of ['WF-01','WF-02','WF-06']){
    if(byId.get(id)?.status !== 'resolved') errors.push(`${files.audit}: ${id} должен иметь status=resolved`);
  }
  for(const id of ['WF-03','WF-04','WF-05']){
    if(byId.get(id)?.status !== 'open') errors.push(`${files.audit}: ${id} должен оставаться open`);
  }
  if(audit.decisionForNextPr?.priority !== 'WF-03 + WF-04 + WF-05') errors.push(`${files.audit}: следующий приоритет должен быть WF-03 + WF-04 + WF-05`);""",
    """  for(const id of ['WF-01','WF-02','WF-04','WF-06']){
    if(byId.get(id)?.status !== 'resolved') errors.push(`${files.audit}: ${id} должен иметь status=resolved`);
  }
  for(const id of ['WF-03','WF-05']){
    if(byId.get(id)?.status !== 'open') errors.push(`${files.audit}: ${id} должен оставаться open`);
  }
  if(audit.decisionForNextPr?.priority !== 'WF-03 + WF-05') errors.push(`${files.audit}: следующий приоритет должен быть WF-03 + WF-05`);"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  "document.addEventListener('spn:task-selection'",
  "Boolean(document.querySelector('[data-spn-situation].active')) || Boolean(value('templateSearch'))"
]);""",
    """  "document.addEventListener('spn:task-selection'",
  "const selectedSituation = Boolean(document.querySelector('[data-spn-situation].active'));"
]);"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  'WF-06 — исправлено',
  'Текущий макет не заменяется до явного выбора шаблона.',
  'WF-03, WF-04 и WF-05 остаются открытыми'""",
    """  'WF-04 — исправлено',
  'WF-06 — исправлено',
  'Текущий макет не заменяется до явного выбора шаблона.',
  'WF-03 и WF-05 остаются открытыми'"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    "'маршрут: ручной поиск пока засчитывается как выбранная ситуация',",
    "'маршрут: ручной поиск не подменяет явный выбор ситуации',"
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    "forbidSnippets(files.wizard, sources.wizard, [\n  'goalBtn.click()',",
    "forbidSnippets(files.wizard, sources.wizard, [\n  \"Boolean(document.querySelector('[data-spn-situation].active')) || Boolean(value('templateSearch'))\",\n  'goalBtn.click()',"
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    "console.log('Исправления WF-01, WF-02 и WF-06 подтверждены; WF-03, WF-04 и WF-05 остаются следующими.');",
    "console.log('Исправления WF-01, WF-02, WF-04 и WF-06 подтверждены; WF-03 и WF-05 остаются следующими.');"
)
