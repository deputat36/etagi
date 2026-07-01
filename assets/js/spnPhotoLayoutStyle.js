const STYLE_ID = 'spnPhotoLayoutStyle';

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  updatePhotoLayoutClasses();
  observeSheet();
  observePrintControls();
});

function observeSheet(){
  const sheet = document.getElementById('printSheet');
  if(!sheet) return;
  new MutationObserver(updatePhotoLayoutClasses).observe(sheet, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
}

function observePrintControls(){
  ['printPresetRow', 'photoModeRow', 'layoutModeGrid'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('click', () => window.setTimeout(updatePhotoLayoutClasses, 80));
  });
}

function updatePhotoLayoutClasses(){
  const sheet = document.getElementById('printSheet');
  if(!sheet) return;

  const flyers = [...sheet.querySelectorAll('.flyer')];
  const count = flyers.length || getActivePrintCount();
  const layout = getActiveLayoutMode();
  const photoMode = getActivePhotoMode();

  sheet.classList.forEach(name => {
    if(name.startsWith('sheet-count-') || name.startsWith('sheet-photo-') || name.startsWith('sheet-layout-')) {
      sheet.classList.remove(name);
    }
  });
  sheet.classList.add(`sheet-count-${count}`);
  sheet.classList.add(`sheet-photo-${photoMode}`);
  sheet.classList.add(`sheet-layout-${layout}`);

  flyers.forEach(flyer => {
    flyer.classList.forEach(name => {
      if(name.startsWith('count-') || name.startsWith('photo-mode-') || name.startsWith('layout-')) {
        flyer.classList.remove(name);
      }
    });
    flyer.classList.add(`count-${count}`);
    flyer.classList.add(`photo-mode-${photoMode}`);
    flyer.classList.add(`layout-${layout}`);
  });
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
    .flyer.has-photo.count-1.layout-showcase .photo-box,
    .flyer.has-photo.count-1.layout-photo .photo-box{height:104mm}
    .flyer.has-photo.count-2 .photo-box{height:45mm}
    .flyer.has-photo.count-2.layout-showcase .photo-box,
    .flyer.has-photo.count-2.layout-photo .photo-box{height:52mm}
    .flyer.has-photo.count-3 .photo-box{height:34mm}
    .flyer.has-photo.count-4 .photo-box{height:26mm}
    .flyer.has-photo.count-6 .photo-box,
    .flyer.has-photo.count-8 .photo-box{height:18mm}
    .flyer.has-photo.photo-mode-two.count-1 .photo-box{height:72mm}
    .flyer.has-photo.photo-mode-two.count-2 .photo-box{height:38mm}
    .flyer.has-photo.photo-mode-plan.count-1 .photo-box{height:112mm;background:#fff}
    .flyer.has-photo.photo-mode-plan.count-2 .photo-box{height:56mm;background:#fff}
    .flyer.has-photo.layout-showcase .photos,
    .flyer.has-photo.layout-photo .photos{order:-1}
    .flyer.has-photo.layout-showcase .headline,
    .flyer.has-photo.layout-photo .headline{margin-top:1mm}
    .flyer.has-photo.count-1 .photos.two{grid-template-columns:1fr 1fr}
    .flyer.has-photo.count-2 .photos.two{grid-template-columns:1fr 1fr}
    .flyer.has-photo.count-4 .photos.two,
    .flyer.has-photo.count-6 .photos.two,
    .flyer.has-photo.count-8 .photos.two{grid-template-columns:1fr}
    @media print{
      .flyer.has-photo.count-1 .photo-box{height:86mm}
      .flyer.has-photo.count-2 .photo-box{height:45mm}
    }
  `;
  document.head.appendChild(style);
}
