const STYLE_ID = 'spnPhotoLayoutStyle';
let updateQueued = false;

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  schedulePhotoLayoutUpdate();
  observeSheet();
  observePrintControls();
});

function observeSheet(){
  const sheet = document.getElementById('printSheet');
  if(!sheet) return;
  new MutationObserver(schedulePhotoLayoutUpdate).observe(sheet, {
    childList: true,
    subtree: true
  });
}

function observePrintControls(){
  ['printPresetRow', 'photoModeRow', 'layoutModeGrid'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('click', () => window.setTimeout(schedulePhotoLayoutUpdate, 80));
  });
}

function schedulePhotoLayoutUpdate(){
  if(updateQueued) return;
  updateQueued = true;
  window.requestAnimationFrame(() => {
    updateQueued = false;
    updatePhotoLayoutClasses();
  });
}

function updatePhotoLayoutClasses(){
  const sheet = document.getElementById('printSheet');
  if(!sheet) return;

  const flyers = [...sheet.querySelectorAll('.flyer')];
  const count = flyers.length || getActivePrintCount();
  const layout = getActiveLayoutMode();
  const photoMode = getActivePhotoMode();

  replacePrefixedClass(sheet, 'sheet-count-', `sheet-count-${count}`);
  replacePrefixedClass(sheet, 'sheet-photo-', `sheet-photo-${photoMode}`);
  replacePrefixedClass(sheet, 'sheet-layout-', `sheet-layout-${layout}`);

  flyers.forEach(flyer => {
    replacePrefixedClass(flyer, 'count-', `count-${count}`);
    replacePrefixedClass(flyer, 'photo-mode-', `photo-mode-${photoMode}`);
    replacePrefixedClass(flyer, 'layout-', `layout-${layout}`);
  });
}

function replacePrefixedClass(element, prefix, nextClass){
  const current = [...element.classList].filter(name => name.startsWith(prefix));
  if(current.length === 1 && current[0] === nextClass) return;
  current.forEach(name => element.classList.remove(name));
  element.classList.add(nextClass);
}

function getActivePrintCount(){
  const active = document.querySelector('#printPresetRow [data-count].active');
  return Number(active?.dataset.count) || 2;
}

function getActiveLayoutMode(){
  const active = document.querySelector('#layoutModeGrid [data-layout-mode].active');
  return safeToken(active?.dataset.layoutMode || 'manual');
}

function getActivePhotoMode(){
  const active = document.querySelector('#photoModeRow [data-photo].active');
  return safeToken(active?.dataset.photo || 'none');
}

function safeToken(value){
  return String(value || 'auto').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .flyer.has-photo.count-1 .photo-box{height:86mm}
    .flyer.has-photo.count-2 .photo-box{height:45mm}
    .flyer.has-photo.count-3 .photo-box{height:34mm}
    .flyer.has-photo.count-4 .photo-box{height:26mm}
    .flyer.has-photo.count-6 .photo-box,
    .flyer.has-photo.count-8 .photo-box{height:18mm}

    .flyer.has-photo.photo-mode-two.count-1 .photo-box{height:72mm}
    .flyer.has-photo.photo-mode-two.count-2 .photo-box{height:38mm}
    .flyer.has-photo.photo-mode-plan.count-1 .photo-box{height:112mm;background:#fff}
    .flyer.has-photo.photo-mode-plan.count-2 .photo-box{height:56mm;background:#fff}

    .flyer.has-photo.count-1.layout-showcase:not(.photo-mode-plan) .photos,
    .flyer.has-photo.count-1.layout-photo:not(.photo-mode-plan) .photos,
    .flyer.has-photo.count-2.layout-showcase:not(.photo-mode-plan) .photos,
    .flyer.has-photo.count-2.layout-photo:not(.photo-mode-plan) .photos{
      order:-2;
      width:calc(100% + var(--flyer-pad) + var(--flyer-pad));
      margin:calc(0mm - var(--flyer-pad)) calc(0mm - var(--flyer-pad)) 1.5mm;
      gap:1px;
      overflow:hidden;
      border-radius:var(--radius) var(--radius) 10px 10px;
      background:#e2e8f0;
    }
    .flyer.has-photo.count-1.layout-showcase:not(.photo-mode-plan) .photo-box,
    .flyer.has-photo.count-1.layout-photo:not(.photo-mode-plan) .photo-box,
    .flyer.has-photo.count-2.layout-showcase:not(.photo-mode-plan) .photo-box,
    .flyer.has-photo.count-2.layout-photo:not(.photo-mode-plan) .photo-box{
      border:0;
      border-radius:0;
    }
    .flyer.has-photo.count-1.layout-showcase:not(.photo-mode-plan) .photo-box{height:112mm}
    .flyer.has-photo.count-1.layout-photo:not(.photo-mode-plan) .photo-box{height:96mm}
    .flyer.has-photo.count-2.layout-showcase:not(.photo-mode-plan) .photo-box{height:58mm}
    .flyer.has-photo.count-2.layout-photo:not(.photo-mode-plan) .photo-box{height:50mm}
    .flyer.has-photo.photo-mode-two.count-1.layout-showcase .photo-box{height:92mm}
    .flyer.has-photo.photo-mode-two.count-1.layout-photo .photo-box{height:82mm}
    .flyer.has-photo.photo-mode-two.count-2.layout-showcase .photo-box{height:50mm}
    .flyer.has-photo.photo-mode-two.count-2.layout-photo .photo-box{height:44mm}

    .flyer.has-photo.layout-showcase .brand-row,
    .flyer.has-photo.layout-photo .brand-row{margin-top:.5mm}
    .flyer.has-photo.layout-showcase .headline,
    .flyer.has-photo.layout-photo .headline{margin-top:1mm}
    .flyer.has-photo.count-1.layout-showcase .headline{font-size:calc(25pt * var(--headline-scale));line-height:.92}
    .flyer.has-photo.count-1.layout-photo .headline{font-size:calc(23pt * var(--headline-scale));line-height:.93}

    .flyer.has-photo.count-1 .photos.two,
    .flyer.has-photo.count-2 .photos.two{grid-template-columns:1fr 1fr}
    .flyer.has-photo.count-4 .photos.two,
    .flyer.has-photo.count-6 .photos.two,
    .flyer.has-photo.count-8 .photos.two{grid-template-columns:1fr}

    @media print{
      .flyer.has-photo.count-1 .photo-box{height:86mm}
      .flyer.has-photo.count-2 .photo-box{height:45mm}
      .flyer.has-photo.count-1.layout-showcase:not(.photo-mode-plan) .photo-box{height:112mm}
      .flyer.has-photo.count-1.layout-photo:not(.photo-mode-plan) .photo-box{height:96mm}
      .flyer.has-photo.count-2.layout-showcase:not(.photo-mode-plan) .photo-box{height:58mm}
      .flyer.has-photo.count-2.layout-photo:not(.photo-mode-plan) .photo-box{height:50mm}
    }
  `;
  document.head.appendChild(style);
}
