from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]


def replace_once(relative_path: str, old: str, new: str) -> None:
    path = ROOT / relative_path
    source = path.read_text(encoding='utf-8')
    if source.count(old) != 1:
        raise SystemExit(f'{relative_path}: ожидался один точный фрагмент, найдено {source.count(old)}')
    path.write_text(source.replace(old, new, 1), encoding='utf-8')


replace_once(
    'assets/js/app.js',
    "  $('uploadFile').onchange = loadFromFile;\n}",
    "  $('uploadFile').onchange = loadFromFile;\n  document.addEventListener('spn:workflow-selection', applyWorkflowSelection);\n}"
)

replace_once(
    'assets/js/app.js',
    """  $('goalGrid').querySelectorAll('[data-goal]').forEach(btn=>btn.onclick=()=>{
    state.goal = btn.dataset.goal;
    selectedScenario = 'all';
    const first = filterTemplates(templates, state.goal)[0];
    if(first) applyTemplate(first);
    renderAll();
  });""",
    """  $('goalGrid').querySelectorAll('[data-goal]').forEach(btn=>btn.onclick=()=>{
    state.goal = btn.dataset.goal;
    state.templateId = '';
    selectedScenario = 'all';
    renderAll();
    document.dispatchEvent(new CustomEvent('spn:task-selection', {detail:{goal:state.goal}}));
    setStatus('Задача выбрана. Текущий макет сохранён — выберите шаблон явно, чтобы заменить текст.');
  });"""
)

replace_once(
    'assets/js/app.js',
    "function renderPhotoModes(){",
    """function applyWorkflowSelection(event){
  const detail = event.detail || {};
  const nextGoal = goals.some(item => item.id === detail.goal) ? detail.goal : state.goal;
  const nextLayoutMode = layoutModes.some(item => item.id === detail.layoutMode) ? detail.layoutMode : '';
  const nextPrintCount = printPresets.some(item => Number(item.count) === Number(detail.printCount)) ? Number(detail.printCount) : state.printCount;

  state.goal = nextGoal;
  state.templateId = '';
  selectedScenario = 'all';
  $('templateSearch').value = String(detail.query || '');
  $('templateDensityFilter').value = 'all';

  if(nextLayoutMode) state = applyLayoutModePreservingMedia(state, nextLayoutMode);
  state.printCount = nextPrintCount;
  state.blockOrder = normalizeBlockOrder(state.blockOrder);
  renderAll();
  setStatus(`Офисный подбор: ${detail.title || 'рабочая ситуация'}. Текущий текст сохранён; выберите подходящий шаблон явно.`);
}

function renderPhotoModes(){"""
)

replace_once(
    'assets/js/spnWizard.js',
    """    wizard.querySelectorAll('[data-spn-situation]').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    renderRecommendation(item);
    updateRoute();

    if(item.goal !== 'all'){
      const goalBtn = document.querySelector(`[data-goal="${item.goal}"]`);
      if(goalBtn) goalBtn.click();
    }

    window.setTimeout(() => {
      search.value = item.query;
      if(density) density.value = 'all';
      search.dispatchEvent(new Event('input', {bubbles:true}));
      if(density) density.dispatchEvent(new Event('change', {bubbles:true}));
      applyRecommendedSettings(item);
      updateRoute();
      setStatus(`Офисный подбор: ${item.title}. ${item.hint}`);
    }, 90);""",
    """    wizard.querySelectorAll('[data-spn-situation]').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    renderRecommendation(item);

    document.dispatchEvent(new CustomEvent('spn:workflow-selection', {
      detail: {
        situationId: item.id,
        goal: item.goal,
        query: item.query,
        printCount: item.printCount,
        layoutMode: item.layoutMode,
        title: item.title,
        hint: item.hint
      }
    }));
    updateRoute();"""
)

replace_once(
    'assets/js/spnWizard.js',
    """  bindRouteUpdates();
  updateRoute();
});""",
    """  document.addEventListener('spn:task-selection', () => {
    wizard.querySelectorAll('[data-spn-situation]').forEach(item => item.classList.remove('active'));
    renderRecommendation(null);
    updateRoute();
  });

  bindRouteUpdates();
  updateRoute();
});"""
)

replace_once(
    'assets/js/spnWizard.js',
    """function applyRecommendedSettings(item){
  if(item.printCount){
    const countBtn = document.querySelector(`[data-count="${item.printCount}"]`);
    if(countBtn) countBtn.click();
  }
  if(item.layoutMode){
    const modeBtn = document.querySelector(`[data-layout-mode="${item.layoutMode}"]`);
    if(modeBtn) modeBtn.click();
  }
}

""",
    ""
)

payloads = {
    'workflow-selection-smoke.html': 'tools/workflow-selection-smoke.html',
    'validate-workflow-selection-audit.mjs': 'tools/validate-workflow-selection-audit.mjs',
    'workflow-selection-audit.json': 'data/workflow-selection-audit.json',
    'workflow-selection-audit.md': 'docs/workflow-selection-audit.md',
}
for source_name, target_name in payloads.items():
    shutil.copyfile(ROOT / '.agent' / source_name, ROOT / target_name)
