const STYLE_ID = 'spnPreviewQuickBarStyles';

window.addEventListener('DOMContentLoaded', () => {
  const previewTop = document.querySelector('.workspace .preview-top');
  const controls = previewTop?.querySelector('.zoom-control');
  const previewStatus = document.getElementById('previewStatus');

  if(!previewTop || !controls || document.getElementById('spnJumpToPrintBtn')) return;

  injectStyles();
  previewTop.classList.add('spn-preview-quickbar');
  previewTop.setAttribute('aria-label', 'Состояние макета и управление предпросмотром');
  previewStatus?.setAttribute('aria-live', 'polite');
  previewStatus?.setAttribute('aria-atomic', 'true');

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'spnJumpToPrintBtn';
  button.className = 'spn-jump-to-print';
  button.textContent = 'К печати';
  button.setAttribute('aria-label', 'Перейти к проверке и настройкам печати');
  button.addEventListener('click', jumpToPrintControls);
  controls.prepend(button);
});

function jumpToPrintControls(){
  const printCard = document.querySelector('.sidebar .print-card');
  const qualityButton = document.getElementById('qualityBtn');
  const printButton = document.getElementById('printBtn');
  const target = qualityButton || printButton;

  if(!printCard || !target) return;

  printCard.scrollIntoView({block:'center', behavior:'smooth'});
  window.setTimeout(() => target.focus(), 280);
  setStatus('Проверьте макет и затем нажмите «Печать / PDF».');
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .workspace .preview-top.spn-preview-quickbar{
      position:sticky;
      top:-1px;
      z-index:20;
      margin:-4px -4px 10px;
      padding:10px 8px;
      border-bottom:1px solid #e2e8f0;
      background:rgba(255,255,255,.97);
      backdrop-filter:blur(8px);
    }
    .spn-preview-quickbar .preview-status{gap:6px}
    .spn-preview-quickbar .stat{font-size:12px;padding:6px 9px}
    .spn-preview-quickbar .zoom-control{flex-wrap:wrap;justify-content:flex-end}
    .spn-jump-to-print{
      background:var(--accent);
      color:#fff;
      border:1px solid var(--accent);
      padding:9px 13px;
      box-shadow:none;
    }
    .spn-jump-to-print:hover{box-shadow:0 7px 16px rgba(15,23,42,.12)}
    .spn-jump-to-print:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 32%,transparent);outline-offset:2px}
    @media(max-width:640px){
      .workspace .preview-top.spn-preview-quickbar{display:grid;grid-template-columns:1fr;gap:8px}
      .spn-preview-quickbar .zoom-control{justify-content:flex-start;width:100%}
      .spn-preview-quickbar .zoom-control input{min-width:120px;flex:1}
      .spn-jump-to-print{min-height:44px;flex:1}
      .spn-preview-quickbar .stat{font-size:12.5px;line-height:1.2}
    }
    @media print{.spn-jump-to-print{display:none!important}}
  `;
  document.head.appendChild(style);
}
