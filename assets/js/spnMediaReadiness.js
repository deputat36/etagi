import { getQrInfo } from './qr.js';

export function getSpnMediaReadiness(root = document){
  const showPhoto = Boolean(root.getElementById('showPhoto')?.checked);
  const showQr = Boolean(root.getElementById('showQr')?.checked);
  const photoMode = root.querySelector('[data-photo].active')?.dataset.photo || 'none';
  const firstFlyer = root.querySelector('#printSheet .flyer');
  const photoFields = photoMode === 'two' ? ['photoOne', 'photoTwo'] : ['photoOne'];
  const readyPhotos = photoFields.filter(field => {
    const image = firstFlyer?.querySelector(`[data-preview-control="${field}"] img`);
    return image?.complete && image.naturalWidth > 0;
  });
  const loadedPhotos = readyPhotos.length;
  const qrLink = String(root.getElementById('qrLink')?.value || '').trim();
  const missing = [];

  if(showPhoto){
    if(photoMode === 'none'){
      missing.push({
        code:'photo-mode',
        label:'выберите режим фото',
        target:'#photoOne'
      });
    } else {
      for(const field of photoFields.filter(field => !readyPhotos.includes(field))){
        missing.push({
          code:field === 'photoTwo' ? 'photo-two' : 'photo-one',
          label:photoMode === 'two'
            ? field === 'photoTwo' ? 'загрузите фото 2' : 'загрузите фото 1'
            : photoMode === 'plan'
              ? 'загрузите планировку'
              : 'загрузите фото',
          target:`#${field}`
        });
      }
    }
  }

  if(showQr && !qrLink){
    missing.push({
      code:'qr-link',
      label:'добавьте ссылку для QR',
      target:'#qrLink'
    });
  } else if(showQr && !getQrInfo(qrLink).ok){
    missing.push({code:'qr-invalid', label:'сократите ссылку для QR', target:'#qrLink'});
  }

  return {
    required:showPhoto || showQr,
    ready:missing.length === 0,
    missing,
    firstTarget:missing[0]?.target || '.media-card',
    photoMode,
    loadedPhotos,
    qrLink
  };
}

export function bindSpnMediaEvents(update, root = document){
  let queued = false;
  const onImage = event => {
    if(!event.target.matches?.('#printSheet .photo-box img') || queued) return;
    queued = true;
    root.defaultView.requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  root.addEventListener('load', onImage, true);
  root.addEventListener('error', onImage, true);
}
