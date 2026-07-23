from pathlib import Path

app_path = Path('assets/js/app.js')
runner_path = Path('tools/run-ui-actions-smoke.mjs')
validator_path = Path('tools/validate-runtime-architecture.mjs')

app = app_path.read_text(encoding='utf-8')
replacements = [
    (
        "let selectedScenario = 'all';\nlet pendingLayoutConflict = null;\nconst debouncedSave = debounce(()=>autoSave(state), 500);\n",
        "let selectedScenario = 'all';\nlet pendingLayoutConflict = null;\nlet qualityTimer = 0;\nconst debouncedSave = debounce(()=>autoSave(state), 500);\n"
    ),
    (
        "  debouncedSave();\n  setTimeout(()=>runQuality(false), 80);\n  applyZoom();\n}\nfunction renderLayoutHints(){\n",
        "  debouncedSave();\n  scheduleQualityReview();\n  applyZoom();\n}\nfunction scheduleQualityReview(delay = 80){\n  cancelScheduledQualityReview();\n  qualityTimer = window.setTimeout(() => {\n    qualityTimer = 0;\n    runQuality(false);\n  }, delay);\n}\nfunction cancelScheduledQualityReview(){\n  if(!qualityTimer) return;\n  window.clearTimeout(qualityTimer);\n  qualityTimer = 0;\n}\nfunction renderLayoutHints(){\n"
    ),
    (
        "function runQuality(show){\n  lastQuality = checkQuality(state, $('printSheet'));\n",
        "function runQuality(show){\n  if(show) cancelScheduledQualityReview();\n  lastQuality = checkQuality(state, $('printSheet'));\n"
    )
]
for old, new in replacements:
    if app.count(old) != 1:
        raise SystemExit('app.js migration anchor mismatch')
    app = app.replace(old, new)
app_path.write_text(app, encoding='utf-8')

runner = runner_path.read_text(encoding='utf-8')
runner_anchor = "  {\n    label:'Form input render smoke',\n    path:'tools/form-input-render-smoke.html',\n    virtualTimeBudget:18000,\n    timeoutMs:30000\n  },\n"
runner_insert = runner_anchor + "  {\n    label:'Quality scheduler smoke',\n    path:'tools/quality-scheduler-smoke.html',\n    virtualTimeBudget:16000,\n    timeoutMs:28000\n  },\n"
if runner.count(runner_anchor) != 1:
    raise SystemExit('UI actions runner anchor mismatch')
runner_path.write_text(runner.replace(runner_anchor, runner_insert), encoding='utf-8')

validator = validator_path.read_text(encoding='utf-8')
files_anchor = "  postPrintWorkspace: 'assets/js/spnPostPrintWorkspace.js',\n  wizardCss: 'assets/css/spn-wizard.css',\n"
files_insert = "  postPrintWorkspace: 'assets/js/spnPostPrintWorkspace.js',\n  app: 'assets/js/app.js',\n  wizardCss: 'assets/css/spn-wizard.css',\n"
if validator.count(files_anchor) != 1:
    raise SystemExit('runtime validator files anchor mismatch')
validator = validator.replace(files_anchor, files_insert)

contract_anchor = "requireSnippets(files.index, sources.index, [\n  \"new URLSearchParams(window.location.search).has('smoke')\",\n"
contract_insert = "requireSnippets(files.app, sources.app, [\n  'let qualityTimer = 0;',\n  'scheduleQualityReview();',\n  'function scheduleQualityReview(delay = 80)',\n  'cancelScheduledQualityReview();',\n  'qualityTimer = window.setTimeout(() => {',\n  'qualityTimer = 0;',\n  'runQuality(false);',\n  'function cancelScheduledQualityReview()',\n  'window.clearTimeout(qualityTimer);',\n  'if(show) cancelScheduledQualityReview();'\n]);\n\nforbidSnippets(files.app, sources.app, [\n  'setTimeout(()=>runQuality(false), 80)',\n  'setTimeout(() => runQuality(false), 80)'\n]);\n\nrequireSnippets(files.index, sources.index, [\n  \"new URLSearchParams(window.location.search).has('smoke')\",\n"
if validator.count(contract_anchor) != 1:
    raise SystemExit('runtime validator contract anchor mismatch')
validator_path.write_text(validator.replace(contract_anchor, contract_insert), encoding='utf-8')
