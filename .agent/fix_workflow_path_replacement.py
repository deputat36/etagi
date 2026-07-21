from pathlib import Path

path = Path('.agent/apply_workflow_scenario_context.py')
source = path.read_text(encoding='utf-8')
workflow_block = '''# Профильный workflow должен запускаться при изменениях режима и его CSS.
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
if source.count(workflow_block) != 1:
    raise SystemExit(f'Не найден единственный workflow-блок миграции: {source.count(workflow_block)}')
# GitHub Actions не имеет workflows-разрешения. Этот файл обновится отдельно через GitHub connector.
source = source.replace(workflow_block, '', 1)

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
