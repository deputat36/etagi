from pathlib import Path

path = Path('.agent/apply_workflow_scenario_context.py')
source = path.read_text(encoding='utf-8')
old = '''# Профильный workflow должен запускаться при изменениях режима и его CSS.
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
'''
new = '''# Профильный workflow должен запускаться при изменениях режима и его CSS.
workflow_path = ROOT / '.github/workflows/validate-workflow-selection.yml'
workflow_source = workflow_path.read_text(encoding='utf-8')
workflow_old = """      - 'assets/js/app.js'
      - 'assets/js/spnWizard.js'
      - 'data/workflow-selection-audit.json'"""
workflow_new = """      - 'assets/js/app.js'
      - 'assets/js/spnWizard.js'
      - 'assets/js/spnUiMode.js'
      - 'assets/css/spn-ui-mode.css'
      - 'data/workflow-selection-audit.json'"""
if workflow_source.count(workflow_old) != 2:
    raise SystemExit(f'.github/workflows/validate-workflow-selection.yml: ожидалось два блока путей, найдено {workflow_source.count(workflow_old)}')
workflow_path.write_text(workflow_source.replace(workflow_old, workflow_new), encoding='utf-8')
'''
if source.count(old) != 1:
    raise SystemExit(f'Не найден единственный проблемный блок миграции: {source.count(old)}')
source = source.replace(old, new, 1)

replacements = [
    (
        r'''  'data-spn-scenario="${item.scenario || \'all\'}"',''',
        r'''  `data-spn-scenario="\${item.scenario || 'all'}"`,''',
        'контракт data-spn-scenario'
    ),
    (
        r'''  'inferTemplateScenario(activeTemplate, \'all\')',''',
        r'''  `inferTemplateScenario(activeTemplate, 'all')`,''',
        'контракт inferTemplateScenario'
    )
]
for bad, good, label in replacements:
    if source.count(bad) != 1:
        raise SystemExit(f'Не найден проблемный {label}: {source.count(bad)}')
    source = source.replace(bad, good, 1)

path.write_text(source, encoding='utf-8')
