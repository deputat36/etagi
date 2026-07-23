from pathlib import Path

root = Path('.')
app_path = root / 'assets/js/app.js'
runner_path = root / 'tools/run-ui-actions-smoke.mjs'

app = app_path.read_text(encoding='utf-8')
old_sync = """function syncFormFromState(){
  fields.forEach(id => { if($(id)) $(id).value = state[id] ?? ''; });
  checks.forEach(id => { if($(id)) $(id).checked = !!state[id]; });
  document.querySelectorAll('[data-goal]').forEach(b=>b.classList.toggle('active', b.dataset.goal===state.goal));
  document.querySelectorAll('[data-photo]').forEach(b=>b.classList.toggle('active', b.dataset.photo===state.photoMode));
  document.querySelectorAll('[data-count]').forEach(b=>b.classList.toggle('active', Number(b.dataset.count)===Number(state.printCount)));
  document.querySelectorAll('[data-property]').forEach(b=>b.classList.toggle('active', b.dataset.property===state.propertyType));
  document.querySelectorAll('[data-layout-mode]').forEach(b=>b.classList.toggle('active', b.dataset.layoutMode===state.layoutMode));
}
"""
new_sync = """function syncFormFromState(){
  syncFormValuesFromState();
  syncChoiceControlsFromState();
}
function syncFormValuesFromState(){
  fields.forEach(id => { if($(id)) $(id).value = state[id] ?? ''; });
  checks.forEach(id => { if($(id)) $(id).checked = !!state[id]; });
}
function syncChoiceControlsFromState(){
  document.querySelectorAll('[data-goal]').forEach(b=>b.classList.toggle('active', b.dataset.goal===state.goal));
  document.querySelectorAll('[data-photo]').forEach(b=>b.classList.toggle('active', b.dataset.photo===state.photoMode));
  document.querySelectorAll('[data-count]').forEach(b=>b.classList.toggle('active', Number(b.dataset.count)===Number(state.printCount)));
  document.querySelectorAll('[data-property]').forEach(b=>b.classList.toggle('active', b.dataset.property===state.propertyType));
  document.querySelectorAll('[data-layout-mode]').forEach(b=>b.classList.toggle('active', b.dataset.layoutMode===state.layoutMode));
}
"""
if app.count(old_sync) != 1:
    raise SystemExit('syncFormFromState anchor not found exactly once')
app = app.replace(old_sync, new_sync)

old_render = """function readFormAndRender(){
  fields.forEach(id => { state[id] = $(id).type === 'number' || $(id).type === 'range' ? Number($(id).value) : $(id).value; });
  checks.forEach(id => { state[id] = $(id).checked; });
  if(!state.showPhoto) state.photoMode = 'none';
  state.blockOrder = normalizeBlockOrder(state.blockOrder);
  state.layoutMode = 'manual';
  renderAll();
}
function renderAll(){
  syncFormFromState();
  renderBlockOrderControls();
  renderLayoutHints();
  applyCss(state);
  renderTemplates();
  const grid = renderSheet($('printSheet'), state);
  updatePreviewStatus(grid);
  debouncedSave();
  setTimeout(()=>runQuality(false), 80);
  applyZoom();
}
"""
new_render = """function readFormAndRender(){
  fields.forEach(id => { state[id] = $(id).type === 'number' || $(id).type === 'range' ? Number($(id).value) : $(id).value; });
  checks.forEach(id => { state[id] = $(id).checked; });
  if(!state.showPhoto) state.photoMode = 'none';
  state.blockOrder = normalizeBlockOrder(state.blockOrder);
  state.layoutMode = 'manual';
  renderFormChanges();
}
function renderFormChanges(){
  syncChoiceControlsFromState();
  renderWorkspace();
}
function renderAll(){
  syncFormFromState();
  renderTemplates();
  renderWorkspace();
}
function renderWorkspace(){
  renderBlockOrderControls();
  renderLayoutHints();
  applyCss(state);
  const grid = renderSheet($('printSheet'), state);
  updatePreviewStatus(grid);
  debouncedSave();
  setTimeout(()=>runQuality(false), 80);
  applyZoom();
}
"""
if app.count(old_render) != 1:
    raise SystemExit('readFormAndRender/renderAll anchor not found exactly once')
app = app.replace(old_render, new_render)
app_path.write_text(app, encoding='utf-8')

runner = runner_path.read_text(encoding='utf-8')
anchor = """  {
    label:'Fit preview smoke',
    path:'tools/fit-preview-smoke.html',
    virtualTimeBudget:22000,
    timeoutMs:36000
  },
"""
insert = """  {
    label:'Form input render smoke',
    path:'tools/form-input-render-smoke.html',
    virtualTimeBudget:18000,
    timeoutMs:30000
  },
""" + anchor
if runner.count(anchor) != 1:
    raise SystemExit('UI actions runner anchor not found exactly once')
runner = runner.replace(anchor, insert)
runner_path.write_text(runner, encoding='utf-8')

Path('.agent/apply_form_input_render.py').unlink()
