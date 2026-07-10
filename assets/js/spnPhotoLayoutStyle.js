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

    .flyer.has-photo.layout-photo_left.count-1,
    .flyer.has-photo.layout-photo_left.count-2{
      display:grid;
      grid-template-columns:minmax(0,42%) minmax(0,58%);
      grid-auto-rows:min-content;
      align-content:start;
      column-gap:3mm;
      row-gap:2mm;
    }
    .flyer.has-photo.layout-photo_left .brand-row{grid-column:1 / -1;grid-row:1}
    .flyer.has-photo.layout-photo_left .photos{
      grid-column:1;
      grid-row:2 / span 6;
      align-self:stretch;
      width:100%;
      margin:0;
      overflow:hidden;
      border-radius:14px;
      border:1px solid #cbd5e1;
      background:#e2e8f0;
    }
    .flyer.has-photo.layout-photo_left.count-1 .photos{height:150mm}
    .flyer.has-photo.layout-photo_left.count-2 .photos{height:66mm}
    .flyer.has-photo.layout-photo_left .photos.two{grid-template-columns:1fr;grid-template-rows:1fr 1fr;gap:1mm}
    .flyer.has-photo.layout-photo_left .photo-box{height:100%;min-height:0;border:0;border-radius:0}
    .flyer.has-photo.layout-photo_left .headline{grid-column:2;grid-row:2;margin:0;align-self:start}
    .flyer.has-photo.layout-photo_left .subline{grid-column:2;grid-row:3}
    .flyer.has-photo.layout-photo_left .desc{grid-column:2;grid-row:4}
    .flyer.has-photo.layout-photo_left .meta{grid-column:2;grid-row:5;grid-template-columns:1fr}
    .flyer.has-photo.layout-photo_left .benefits{grid-column:2;grid-row:6}
    .flyer.has-photo.layout-photo_left .custom-block{grid-column:2;grid-row:7}
    .flyer.has-photo.layout-photo_left .contact{grid-column:1 / -1;grid-row:8;margin-top:0}
    .flyer.has-photo.layout-photo_left .qr-row{grid-column:1 / -1;grid-row:9}
    .flyer.has-photo.layout-photo_left .tears{grid-column:1 / -1;grid-row:10}
    .flyer.has-photo.layout-photo_left.count-1 .headline{font-size:calc(24pt * var(--headline-scale));line-height:.92}
    .flyer.has-photo.layout-photo_left.count-2 .headline{font-size:calc(16pt * var(--headline-scale));line-height:.94}
    .flyer.has-photo.layout-photo_left.count-2 .desc{font-size:8pt}
    .flyer.has-photo.layout-photo_left.count-2 .benefit{font-size:7.2pt}
    .flyer.has-photo.layout-photo_left.photo-mode-plan .photo-box img{object-fit:contain;background:#fff}

    .flyer.has-photo.layout-photo_card.count-1,
    .flyer.has-photo.layout-photo_card.count-2{
      display:grid;
      grid-template-columns:minmax(0,1fr);
      grid-auto-rows:min-content;
      align-content:start;
      row-gap:2mm;
    }
    .flyer.has-photo.layout-photo_card .brand-row{grid-column:1;grid-row:1}
    .flyer.has-photo.layout-photo_card .photos{
      grid-column:1;
      grid-row:2;
      width:100%;
      margin:0;
      padding:1.2mm;
      gap:1.2mm;
      overflow:hidden;
      border:1px solid #cbd5e1;
      border-radius:16px;
      background:#fff;
      box-shadow:0 2mm 5mm rgba(15,23,42,.14);
    }
    .flyer.has-photo.layout-photo_card.count-1 .photos{height:124mm}
    .flyer.has-photo.layout-photo_card.count-2 .photos{height:58mm}
    .flyer.has-photo.layout-photo_card .photo-box{height:100%;min-height:0;border:0;border-radius:12px}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .headline{
      grid-column:1;
      grid-row:2;
      align-self:end;
      z-index:2;
      margin:0 4mm 4mm;
      padding:3mm 4mm;
      border-radius:12px;
      color:#fff;
      background:linear-gradient(180deg,rgba(15,23,42,.68),rgba(15,23,42,.9));
      text-shadow:0 1px 2px rgba(0,0,0,.45);
    }
    .flyer.has-photo.layout-photo_card.count-1:not(.photo-mode-plan) .headline{font-size:calc(24pt * var(--headline-scale));line-height:.92}
    .flyer.has-photo.layout-photo_card.count-2:not(.photo-mode-plan) .headline{font-size:calc(16pt * var(--headline-scale));line-height:.94}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .subline{grid-column:1;grid-row:3}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .desc{grid-column:1;grid-row:4}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .meta{grid-column:1;grid-row:5}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .benefits{grid-column:1;grid-row:6}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .custom-block{grid-column:1;grid-row:7}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .contact{grid-column:1;grid-row:8;margin-top:0}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .qr-row{grid-column:1;grid-row:9}
    .flyer.has-photo.layout-photo_card:not(.photo-mode-plan) .tears{grid-column:1;grid-row:10}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .headline{grid-column:1;grid-row:3;margin:0;color:#111827;text-shadow:none;background:none;padding:0}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .subline{grid-column:1;grid-row:4}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .desc{grid-column:1;grid-row:5}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .meta{grid-column:1;grid-row:6}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .benefits{grid-column:1;grid-row:7}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .custom-block{grid-column:1;grid-row:8}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .contact{grid-column:1;grid-row:9;margin-top:0}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .qr-row{grid-column:1;grid-row:10}
    .flyer.has-photo.layout-photo_card.photo-mode-plan .photo-box img{object-fit:contain;background:#fff}
    .flyer.has-photo.layout-photo_card.count-2 .desc{font-size:8pt}
    .flyer.has-photo.layout-photo_card.count-2 .benefit{font-size:7.2pt}

    @media print{
      .flyer.has-photo.count-1 .photo-box{height:86mm}
      .flyer.has-photo.count-2 .photo-box{height:45mm}
      .flyer.has-photo.count-1.layout-showcase:not(.photo-mode-plan) .photo-box{height:112mm}
      .flyer.has-photo.count-1.layout-photo:not(.photo-mode-plan) .photo-box{height:96mm}
      .flyer.has-photo.count-2.layout-showcase:not(.photo-mode-plan) .photo-box{height:58mm}
      .flyer.has-photo.count-2.layout-photo:not(.photo-mode-plan) .photo-box{height:50mm}
      .flyer.has-photo.layout-photo_left.count-1 .photo-box,
      .flyer.has-photo.layout-photo_left.count-2 .photo-box,
      .flyer.has-photo.layout-photo_card.count-1 .photo-box,
      .flyer.has-photo.layout-photo_card.count-2 .photo-box{height:100%}
      .flyer.has-photo.layout-photo_left.count-1 .photos{height:150mm}
      .flyer.has-photo.layout-photo_left.count-2 .photos{height:66mm}
      .flyer.has-photo.layout-photo_card.count-1 .photos{height:124mm}
      .flyer.has-photo.layout-photo_card.count-2 .photos{height:58mm}
    }
  `;
  document.head.appendChild(style);
}
