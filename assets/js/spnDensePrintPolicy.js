const DENSE_PRINT_COUNTS = new Set([6, 8]);
let applying = false;

 document.addEventListener('DOMContentLoaded', initDensePrintPolicy);

export function initDensePrintPolicy(){
  const row = document.getElementById('printPresetRow');
  const checkbox = document.getElementById('tearOffs');
  if(!row || !checkbox || row.dataset.densePrintPolicyBound === 'true') return;

  row.dataset.densePrintPolicyBound = 'true';
  row.addEventListener('click', event => {
    const button = event.target.closest('[data-count]');
    if(!button) return;
    window.requestAnimationFrame(applyDensePrintPolicy);
  });

  const observer = new MutationObserver(applyDensePrintPolicy);
  observer.observe(row, {subtree:true, attributes:true, attributeFilter:['class']});
  applyDensePrintPolicy();
}

export function applyDensePrintPolicy(){
  if(applying) return;
  const checkbox = document.getElementById('tearOffs');
  const active = document.querySelector('#printPresetRow [data-count].active');
  const count = Number(active?.dataset.count || 0);
  if(!checkbox || !count) return;

  const dense = DENSE_PRINT_COUNTS.has(count);
  checkbox.disabled = dense;
  const label = checkbox.closest('label');
  if(label){
    label.title = dense
      ? `Отрывные полосы недоступны для формата ${count} на A4: карточки слишком компактные.`
      : '';
  }

  const hint = ensureHint(checkbox);
  hint.hidden = !dense;
  hint.textContent = dense ? `Для ${count} на A4 отрывные полосы выключены, чтобы сохранить читаемость.` : '';

  if(!dense || !checkbox.checked) return;
  applying = true;
  checkbox.checked = false;
  checkbox.dispatchEvent(new Event('change', {bubbles:true}));
  applying = false;
}

function ensureHint(checkbox){
  let hint = document.getElementById('densePrintTearOffHint');
  if(hint) return hint;
  hint = document.createElement('p');
  hint.id = 'densePrintTearOffHint';
  hint.className = 'hint-text';
  hint.hidden = true;
  checkbox.closest('label')?.insertAdjacentElement('afterend', hint);
  return hint;
}