from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(relative_path: str, old: str, new: str) -> None:
    path = ROOT / relative_path
    source = path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{relative_path}: ожидался один точный фрагмент, найдено {count}')
    path.write_text(source.replace(old, new, 1), encoding='utf-8')


# Каждая рабочая ситуация получает явный сценарий, который не нужно выбирать повторно.
scenario_by_id = {
    'owner-price': 'owner',
    'direct-buyer': 'owner',
    'entrance-soft': 'entrance',
    'object-sale': 'object',
    'tellerman-sad': 'newbuild',
    'newbuild-mortgage': 'newbuild',
    'buyer-family': 'buyer',
    'safe-deal': 'all',
    'brand-district': 'photo',
    'blank-custom': 'all',
}
for situation_id, scenario in scenario_by_id.items():
    path = ROOT / 'assets/js/spnWizard.js'
    source = path.read_text(encoding='utf-8')
    marker = f"    id: '{situation_id}',"
    start = source.find(marker)
    if start < 0:
        raise SystemExit(f'assets/js/spnWizard.js: не найдена ситуация {situation_id}')
    goal_pos = source.find("    goal: '", start)
    goal_end = source.find('\n', goal_pos)
    if goal_pos < 0 or goal_end < 0:
        raise SystemExit(f'assets/js/spnWizard.js: не найден goal ситуации {situation_id}')
    insertion = f"\n    scenario: '{scenario}',"
    if source[goal_end:goal_end + len(insertion)] == insertion:
        continue
    source = source[:goal_end] + insertion + source[goal_end:]
    path.write_text(source, encoding='utf-8')

replace_once(
    'assets/js/spnWizard.js',
    """        goal: item.goal,
        query: item.query,""",
    """        goal: item.goal,
        scenario: item.scenario,
        query: item.query,"""
)

replace_once(
    'assets/js/spnWizard.js',
    """${situations.map(item => `<button type="button" data-spn-situation="${item.id}"><span>${item.title}</span><small>${item.hint}</small></button>`).join('')}""",
    """${situations.map(item => `<button type="button" data-spn-situation="${item.id}" data-spn-scenario="${item.scenario || 'all'}"><span>${item.title}</span><small>${item.hint}</small></button>`).join('')}"""
)

# Режим интерфейса сообщает приложению, когда дополнительный фильтр надо скрыть или вернуть.
replace_once(
    'assets/js/spnUiMode.js',
    """  const status = document.getElementById('statusLine');
  if(status) status.textContent = `Режим: ${modeTitle(next)}.`;
}""",
    """  const status = document.getElementById('statusLine');
  if(status) status.textContent = `Режим: ${modeTitle(next)}.`;
  document.dispatchEvent(new CustomEvent('spn:ui-mode-change', {detail:{mode:next}}));
}"""
)

# Приложение использует сценарий ситуации, скрывает ручной фильтр в простых режимах и синхронизирует шаблон.
replace_once(
    'assets/js/app.js',
    """  document.addEventListener('spn:workflow-selection', applyWorkflowSelection);
}""",
    """  document.addEventListener('spn:workflow-selection', applyWorkflowSelection);
  document.addEventListener('spn:ui-mode-change', handleUiModeChange);
}"""
)

replace_once(
    'assets/js/app.js',
    """  state.goal = nextGoal;
  state.templateId = '';
  selectedScenario = 'all';
  $('templateSearch').value = String(detail.query || '');""",
    """  state.goal = nextGoal;
  state.templateId = '';
  selectedScenario = scenarioPresets.some(item => item.id === detail.scenario) ? detail.scenario : 'all';
  $('templateSearch').value = String(detail.query || '');"""
)

replace_once(
    'assets/js/app.js',
    """function renderPhotoModes(){""",
    """function handleUiModeChange(event){
  const mode = event.detail?.mode || document.body.dataset.spnUiMode || 'quick';
  if(mode !== 'advanced'){
    const activeSituation = document.querySelector('[data-spn-situation].active');
    const activeTemplate = templates.find(item => item.id === state.templateId);
    const contextualScenario = activeSituation?.dataset.spnScenario || inferTemplateScenario(activeTemplate, 'all');
    selectedScenario = scenarioPresets.some(item => item.id === contextualScenario) ? contextualScenario : 'all';
  }
  renderTemplates();
}

function renderPhotoModes(){"""
)

replace_once(
    'assets/js/app.js',
    """  toolbar.insertAdjacentHTML('afterend', '<div class="chip-row scenario-filter-row" id="scenarioFilterRow"></div><div class="template-count-line" id="templateCountLine"></div>');""",
    """  toolbar.insertAdjacentHTML('afterend', '<div class="chip-row scenario-filter-row" id="scenarioFilterRow" aria-label="Дополнительный фильтр шаблонов"></div><div class="template-count-line" id="templateCountLine"></div>');"""
)

replace_once(
    'assets/js/app.js',
    """  row.innerHTML = scenarioPresets.map(item => {
    const count = counts[item.id] || 0;
    const active = selectedScenario === item.id;
    const disabled = item.id !== 'all' && count === 0;
    return `<button type="button" class="chip-btn scenario-chip ${active ? 'active' : ''}" data-scenario="${item.id}" ${disabled ? 'disabled' : ''}>${esc(item.title)} <span class="chip-count">${count}</span></button>`;
  }).join('');""",
    """  row.innerHTML = '<span class="scenario-filter-label">Дополнительный фильтр:</span>' + scenarioPresets.map(item => {
    const count = counts[item.id] || 0;
    const active = selectedScenario === item.id;
    const disabled = item.id !== 'all' && count === 0;
    return `<button type="button" class="chip-btn scenario-chip ${active ? 'active' : ''}" data-scenario="${item.id}" ${disabled ? 'disabled' : ''}>${esc(item.title)} <span class="chip-count">${count}</span></button>`;
  }).join('');"""
)

replace_once(
    'assets/js/app.js',
    """  const scenarioTitle = scenarioPresets.find(item => item.id === selectedScenario)?.title || 'Все';
  const favoriteText = $('showFavoriteTemplatesOnly')?.checked ? ' · только избранные' : '';
  el.textContent = `Найдено шаблонов: ${visibleCount} из ${baseCount}. Сценарий: ${scenarioTitle}${favoriteText}.`;""",
    """  const scenarioTitle = scenarioPresets.find(item => item.id === selectedScenario)?.title || 'Все';
  const favoriteText = $('showFavoriteTemplatesOnly')?.checked ? ' · только избранные' : '';
  const advanced = document.body.dataset.spnUiMode === 'advanced';
  const scenarioText = advanced ? `Дополнительный фильтр: ${scenarioTitle}` : selectedScenario === 'all' ? 'Подбор без дополнительного фильтра' : `Подбор по ситуации: ${scenarioTitle}`;
  el.textContent = `Найдено шаблонов: ${visibleCount} из ${baseCount}. ${scenarioText}${favoriteText}.`;"""
)

replace_once(
    'assets/js/app.js',
    """function templateCard(t){""",
    """function inferTemplateScenario(t, currentScenario = selectedScenario){
  if(!t) return 'all';
  if(currentScenario && currentScenario !== 'all' && matchScenario(t, currentScenario)) return currentScenario;
  const byGoal = {seller:'owner', buyer:'buyer', object:'object', newbuild:'newbuild', private:'private'};
  if(byGoal[t.goal]) return byGoal[t.goal];
  if(t.photo && t.photo !== 'none') return 'photo';
  if(Number(t.printCount) >= 4 || t.density === 'dense') return 'economy';
  return 'all';
}

function templateCard(t){"""
)

replace_once(
    'assets/js/app.js',
    """  if(state.showPhoto && state.photoMode !== 'none' && (state.photoOne || state.photoTwo)) state.showPhoto = true;
  syncFormFromState();""",
    """  if(state.showPhoto && state.photoMode !== 'none' && (state.photoOne || state.photoTwo)) state.showPhoto = true;
  selectedScenario = inferTemplateScenario(t);
  syncFormFromState();"""
)

# В простых режимах сценарий становится автоматическим контекстом, а не повторным обязательным выбором.
replace_once(
    'assets/css/spn-ui-mode.css',
    """body[data-spn-ui-mode="newbie"] .spn-newbie-hidden-template{display:none!important}""",
    """body[data-spn-ui-mode="quick"] .scenario-filter-row,
body[data-spn-ui-mode="newbie"] .scenario-filter-row{display:none!important}
.scenario-filter-label{align-self:center;color:#64748b;font-size:11px;font-weight:900}
body[data-spn-ui-mode="newbie"] .spn-newbie-hidden-template{display:none!important}"""
)

# Профильный smoke подтверждает автоматический контекст, скрытие лишнего выбора и синхронизацию шаблона.
replace_once(
    'tools/workflow-selection-smoke.html',
    """        assert(doc.querySelector('[data-scenario="all"]')?.classList.contains('active'), 'после ситуации сценарий не остался Все');""",
    """        assert(doc.querySelector('[data-scenario="newbuild"]')?.classList.contains('active'), 'ситуация не выбрала сценарий Новостройки автоматически');"""
)

replace_once(
    'tools/workflow-selection-smoke.html',
    """        lastAction = 'scenario.newbuild';
        const beforeScenarioLayout = value(doc, 'layoutName');
        const scenarioButton = doc.querySelector('[data-scenario="newbuild"]');
        assert(scenarioButton && !scenarioButton.disabled, 'сценарий Новостройки недоступен после выбора ситуации');
        click(doc, '[data-scenario="newbuild"]');
        await waitFor(() => doc.querySelector('[data-scenario="newbuild"]')?.classList.contains('active'), 2000, 'сценарий Новостройки не стал активным');
        assert(value(doc, 'layoutName') === beforeScenarioLayout, 'сценарный фильтр неожиданно заменил макет');
        assert(explicitTemplateClicks === 0, 'сценарный фильтр вызвал клик по шаблону');
        pass('сценарий: только фильтрует список и не применяет шаблон');""",
    """        lastAction = 'scenario.additional-filter';
        const beforeScenarioLayout = value(doc, 'layoutName');
        click(doc, '[data-scenario="all"]');
        await waitFor(() => doc.querySelector('[data-scenario="all"]')?.classList.contains('active'), 2000, 'дополнительный фильтр Все не стал активным');
        assert(value(doc, 'layoutName') === beforeScenarioLayout, 'сценарный фильтр неожиданно заменил макет');
        assert(explicitTemplateClicks === 0, 'сценарный фильтр вызвал клик по шаблону');
        pass('сценарий: остаётся дополнительным фильтром и не применяет шаблон');"""
)

replace_once(
    'tools/workflow-selection-smoke.html',
    """        assert(doc.querySelector('[data-scenario="newbuild"]')?.classList.contains('active'), 'выбранный шаблон сбросил активный сценарий');
        pass('шаблон: применяется только после явного клика пользователя');

        lastAction = 'task.manual';""",
    """        assert(doc.querySelector('[data-scenario="newbuild"]')?.classList.contains('active'), 'выбранный шаблон не синхронизировал сценарий Новостройки');
        pass('шаблон: применяется явно и синхронизирует сценарий');

        lastAction = 'mode.quick-hides-scenario';
        click(doc, '[data-spn-ui-mode="quick"]');
        await waitFor(() => doc.body.dataset.spnUiMode === 'quick', 2000, 'быстрый режим не включился');
        assert(win.getComputedStyle(doc.getElementById('scenarioFilterRow')).display === 'none', 'повторный сценарный выбор остался видимым в быстром режиме');
        assert(doc.querySelector('[data-scenario="newbuild"]')?.classList.contains('active'), 'быстрый режим потерял автоматический сценарий ситуации');
        assert(doc.getElementById('templateCountLine')?.textContent.includes('Подбор по ситуации: Новостройки'), 'быстрый режим не объясняет автоматический контекст');
        click(doc, '[data-spn-ui-mode="advanced"]');
        await waitFor(() => doc.body.dataset.spnUiMode === 'advanced', 2000, 'расширенный режим не вернулся');
        assert(win.getComputedStyle(doc.getElementById('scenarioFilterRow')).display !== 'none', 'дополнительный фильтр не вернулся в расширенном режиме');
        pass('режимы: повторный сценарный выбор скрыт в простом пути');

        lastAction = 'task.manual';"""
)

replace_once(
    'tools/workflow-selection-smoke.html',
    """        assert(!doc.querySelector('[data-spn-situation].active'), 'ручная задача оставила несогласованную активную ситуацию');
        pass('задача: фильтрует библиотеку без автоматического шаблона');""",
    """        assert(!doc.querySelector('[data-spn-situation].active'), 'ручная задача оставила несогласованную активную ситуацию');
        assert(doc.querySelector('[data-scenario="all"]')?.classList.contains('active'), 'ручная задача не сбросила дополнительный сценарий');
        pass('задача: фильтрует библиотеку без автоматического шаблона');"""
)

# Карта аудита закрывает WF-03 и WF-05.
replace_once(
    'data/workflow-selection-audit.json',
    """    {
      "id": "WF-03",
      "status": "open",
      "severity": "medium",
      "title": "Поиск ситуации и фильтр сценария частично дублируют назначение",
      "impact": "После выбора ситуации пользователь получает поисковое сужение и отдельный сценарный фильтр с похожим смыслом.",
      "recommendation": "В простых режимах показывать сценарий только как дополнительное уточнение либо автоматически выводить его из ситуации."
    },""",
    """    {
      "id": "WF-03",
      "status": "resolved",
      "severity": "medium",
      "title": "Поиск ситуации и фильтр сценария частично дублировали назначение",
      "resolution": "Ситуация теперь сама задаёт широкий сценарный контекст. В режимах Новичок и Быстро повторный ряд скрыт, а в Расширенном режиме он явно называется дополнительным фильтром.",
      "regression": "workflow-selection-smoke: mode.quick-hides-scenario"
    },"""
)

replace_once(
    'data/workflow-selection-audit.json',
    """    {
      "id": "WF-05",
      "status": "open",
      "severity": "low",
      "title": "Шаблон синхронизирует задачу, но не пересчитывает сценарий",
      "impact": "После выбора шаблона активный сценарий может описывать уже не весь текущий контекст.",
      "recommendation": "Определить единый источник истины для задачи и сценария после выбора шаблона."
    },""",
    """    {
      "id": "WF-05",
      "status": "resolved",
      "severity": "low",
      "title": "Шаблон синхронизировал задачу, но не пересчитывал сценарий",
      "resolution": "Явно выбранный шаблон сохраняет подходящий активный дополнительный фильтр либо выводит широкий сценарий из goal, фото или плотности. Скрытый контекст простых режимов возвращается к ситуации или выбранному шаблону.",
      "regression": "workflow-selection-smoke: template.explicit + mode.quick-hides-scenario"
    },"""
)

replace_once(
    'data/workflow-selection-audit.json',
    '"priority": "WF-03 + WF-05",\n    "safeDirection": "Упростить повторяющиеся фильтры ситуации и сценария, затем синхронизировать сценарий после явного выбора шаблона."',
    '"priority": "Этап 4: названия wizard + сохранение и перенос",\n    "safeDirection": "Переименовать неоднозначные сущности пошагового пути и объединить объяснение автосохранения, именованных макетов, файла макета и полного backup."'
)

# Документация фиксирует завершение цепочки выбора и следующий этап.
replace_once(
    'docs/workflow-selection-audit.md',
    """## Оставшиеся вопросы

WF-03 и WF-05 остаются открытыми:

- WF-03 — поиск ситуации и сценарный фильтр частично дублируют друг друга;
- WF-05 — явный шаблон синхронизирует задачу, но активный сценарий отдельно не пересчитывается.

Следующая безопасная итерация должна упростить повторяющиеся фильтры, а затем определить сценарий после явного выбора шаблона без изменения рекламных текстов и печатной матрицы.""",
    """### WF-03 — исправлено

Рабочая ситуация сама задаёт широкий сценарный контекст. В режимах `Новичок` и `Быстро` повторный ряд сценариев скрыт, а строка результата объясняет автоматический подбор. В `Расширенном` режиме ряд остаётся доступным под названием «Дополнительный фильтр».

### WF-05 — исправлено

Явно выбранный шаблон синхронизирует широкий сценарий с `goal`, фото или плотностью. Если пользователь уже задал подходящий дополнительный фильтр, он сохраняется. При возврате в простой режим скрытый фильтр нормализуется по активной ситуации или фактически выбранному шаблону.

## Итог цепочки выбора

WF-01–WF-06 закрыты автоматическими контрактами. Следующая безопасная итерация этапа 4 — переименовать неоднозначные сущности wizard и объединить объяснение способов сохранения и переноса без изменения рекламных текстов и печатной матрицы."""
)

replace_once(
    'docs/workflow-selection-audit.md',
    """- сценарий только фильтрует;
- шаблон применяется явным кликом;
- ручной выбор задачи не заменяет макет;
- ручной поиск не засчитывается как офисная ситуация;""",
    """- ситуация автоматически задаёт подходящий сценарный контекст;
- сценарий остаётся дополнительным фильтром в расширенном режиме;
- повторный сценарный выбор скрыт в режимах Новичок и Быстро;
- шаблон применяется явным кликом и синхронизирует сценарий;
- ручной выбор задачи не заменяет макет;
- ручной поиск не засчитывается как офисная ситуация;"""
)

# Статический контракт расширяется UI mode, CSS и двумя закрытыми findings.
replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  app:'assets/js/app.js',
  docs:'docs/workflow-selection-audit.md',""",
    """  app:'assets/js/app.js',
  uiMode:'assets/js/spnUiMode.js',
  uiModeCss:'assets/css/spn-ui-mode.css',
  docs:'docs/workflow-selection-audit.md',"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  for(const id of ['WF-01','WF-02','WF-04','WF-06']){
    if(byId.get(id)?.status !== 'resolved') errors.push(`${files.audit}: ${id} должен иметь status=resolved`);
  }
  for(const id of ['WF-03','WF-05']){
    if(byId.get(id)?.status !== 'open') errors.push(`${files.audit}: ${id} должен оставаться open`);
  }
  if(audit.decisionForNextPr?.priority !== 'WF-03 + WF-05') errors.push(`${files.audit}: следующий приоритет должен быть WF-03 + WF-05`);""",
    """  for(const id of ['WF-01','WF-02','WF-03','WF-04','WF-05','WF-06']){
    if(byId.get(id)?.status !== 'resolved') errors.push(`${files.audit}: ${id} должен иметь status=resolved`);
  }
  if(audit.decisionForNextPr?.priority !== 'Этап 4: названия wizard + сохранение и перенос') errors.push(`${files.audit}: неверный следующий приоритет этапа 4`);"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  'situationId: item.id,',
  'printCount: item.printCount,',""",
    """  'situationId: item.id,',
  'scenario: item.scenario,',
  'data-spn-scenario="${item.scenario || \'all\'}"',
  'printCount: item.printCount,',"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  'function applyWorkflowSelection(event)',
  "state.templateId = '';",
  "$('templateSearch').value = String(detail.query || '');",""",
    """  'function applyWorkflowSelection(event)',
  "state.templateId = '';",
  "selectedScenario = scenarioPresets.some(item => item.id === detail.scenario) ? detail.scenario : 'all';",
  "$('templateSearch').value = String(detail.query || '');","""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  'state.printCount = nextPrintCount;',
  "new CustomEvent('spn:task-selection'",
  'selectedScenario = btn.dataset.scenario;',""",
    """  'state.printCount = nextPrintCount;',
  'function handleUiModeChange(event)',
  'inferTemplateScenario(activeTemplate, \'all\')',
  'function inferTemplateScenario(t, currentScenario = selectedScenario)',
  'selectedScenario = inferTemplateScenario(t);',
  "new CustomEvent('spn:task-selection'",
  'selectedScenario = btn.dataset.scenario;',"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  'WF-04 — исправлено',
  'WF-06 — исправлено',
  'Текущий макет не заменяется до явного выбора шаблона.',
  'WF-03 и WF-05 остаются открытыми'""",
    """  'WF-03 — исправлено',
  'WF-04 — исправлено',
  'WF-05 — исправлено',
  'WF-06 — исправлено',
  'Текущий макет не заменяется до явного выбора шаблона.',
  'WF-01–WF-06 закрыты автоматическими контрактами'"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """  'сценарий: только фильтрует список и не применяет шаблон',
  'шаблон: применяется только после явного клика пользователя',""",
    """  'сценарий: остаётся дополнительным фильтром и не применяет шаблон',
  'шаблон: применяется явно и синхронизирует сценарий',
  'режимы: повторный сценарный выбор скрыт в простом пути',"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    """forbidSnippets(files.smoke, sources.smoke, ['fetch(', 'XMLHttpRequest', 'localStorage.setItem']);""",
    """forbidSnippets(files.smoke, sources.smoke, ['fetch(', 'XMLHttpRequest', 'localStorage.setItem']);
requireSnippets(files.uiMode, sources.uiMode, [
  "new CustomEvent('spn:ui-mode-change'",
  'detail:{mode:next}'
]);
requireSnippets(files.uiModeCss, sources.uiModeCss, [
  'body[data-spn-ui-mode="quick"] .scenario-filter-row',
  'body[data-spn-ui-mode="newbie"] .scenario-filter-row',
  '.scenario-filter-label'
]);"""
)

replace_once(
    'tools/validate-workflow-selection-audit.mjs',
    "console.log('Исправления WF-01, WF-02, WF-04 и WF-06 подтверждены; WF-03 и WF-05 остаются следующими.');",
    "console.log('Цепочка выбора WF-01–WF-06 упрощена и подтверждена; следующий этап — названия wizard и сохранение/перенос.');"
)

# Профильный workflow должен запускаться при изменениях режима и его CSS.
for section in ('push', 'pull_request'):
    pass
replace_once(
    '.github/workflows/validate-workflow-selection.yml',
    """      - 'assets/js/app.js'
      - 'assets/js/spnWizard.js'
      - 'data/workflow-selection-audit.json'""",
    """      - 'assets/js/app.js'
      - 'assets/js/spnWizard.js'
      - 'assets/js/spnUiMode.js'
      - 'assets/css/spn-ui-mode.css'
      - 'data/workflow-selection-audit.json'"""
)
replace_once(
    '.github/workflows/validate-workflow-selection.yml',
    """      - 'assets/js/app.js'
      - 'assets/js/spnWizard.js'
      - 'data/workflow-selection-audit.json'""",
    """      - 'assets/js/app.js'
      - 'assets/js/spnWizard.js'
      - 'assets/js/spnUiMode.js'
      - 'assets/css/spn-ui-mode.css'
      - 'data/workflow-selection-audit.json'"""
)
