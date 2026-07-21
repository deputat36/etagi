const DENSE_PRINT_COUNTS = new Set([6, 8]);
const STYLE_ID = 'spnDensePrintStyles';
let applying = false;

 document.addEventListener('DOMContentLoaded', initDensePrintPolicy);

export function initDensePrintPolicy(){
  ensureDensePrintStyles();
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

function ensureDensePrintStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .flyer.count-8{
      --flyer-pad:2.2mm;
      gap:.65mm;
      border-radius:10px;
    }
    .flyer.count-8 .brand-row{gap:1mm}
    .flyer.count-8 .brand{gap:1mm;font-size:6.3pt}
    .flyer.count-8 .brand-mark{width:4.8mm;height:4.8mm;border-radius:1.2mm;font-size:8pt}
    .flyer.count-8 .site{font-size:4.9pt}
    .flyer.count-8 .headline{font-size:calc(12pt * var(--headline-scale));line-height:.9;letter-spacing:-.045em}
    .flyer.count-8 .subline{font-size:6.2pt;line-height:1}
    .flyer.count-8 .desc{font-size:6.2pt;line-height:1.08}
    .flyer.count-8 .meta{gap:.6mm}
    .flyer.count-8 .meta div{padding:.6mm;font-size:5.4pt;border-radius:4px}
    .flyer.count-8 .benefits{gap:.35mm}
    .flyer.count-8 .benefit{gap:.6mm;font-size:5.6pt;line-height:1.02}
    .flyer.count-8 .benefit:before{width:2.4mm;height:2.4mm;font-size:4.2pt}
    .flyer.count-8 .benefit:nth-child(n+3){display:none}
    .flyer.count-8 .contact{padding:.9mm 1.2mm;gap:.25mm;border-radius:7px}
    .flyer.count-8 .phone{font-size:calc(12pt * var(--phone-scale));line-height:.92}
    .flyer.count-8 .person{font-size:5.8pt;line-height:1}
    .flyer.count-8 .cta{font-size:5.2pt;line-height:1}
    .flyer.count-8 .qr-row{gap:.6mm}
    .flyer.count-8 .qr-box{width:10mm;height:10mm;font-size:4pt}
    .flyer.count-8 .qr-row span{font-size:4.8pt}
  `;
  document.head.appendChild(style);
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
