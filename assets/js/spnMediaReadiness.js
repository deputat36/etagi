export function getSpnMediaReadiness(root = document){
  const showPhoto = Boolean(root.getElementById('showPhoto')?.checked);
  const showQr = Boolean(root.getElementById('showQr')?.checked);
  const photoMode = root.querySelector('[data-photo].active')?.dataset.photo || 'none';
  const firstFlyer = root.querySelector('#printSheet .flyer');
  const loadedPhotos = firstFlyer ? firstFlyer.querySelectorAll('.photo-box img').length : 0;
  const qrLink = String(root.getElementById('qrLink')?.value || '').trim();
  const missing = [];

  if(showPhoto){
    if(photoMode === 'none'){
      missing.push({
        code:'photo-mode',
        label:'выберите режим фото',
        target:'.media-card'
      });
    } else {
      const requiredPhotos = photoMode === 'two' ? 2 : 1;
      if(loadedPhotos < requiredPhotos){
        const needsSecond = requiredPhotos === 2 && loadedPhotos === 1;
        missing.push({
          code:needsSecond ? 'photo-two' : 'photo-one',
          label:requiredPhotos === 2
            ? 'загрузите 2 фото'
            : photoMode === 'plan'
              ? 'загрузите планировку'
              : 'загрузите фото',
          target:needsSecond ? '#photoTwo' : '#photoOne'
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
