const BLOCK_ORDERS = {
  readable: ['headline','description','benefits','price','meta','customBlock','contact','photo'],
  economy: ['headline','price','description','benefits','customBlock','contact','meta','photo'],
  photo: ['headline','price','photo','description','benefits','meta','customBlock','contact'],
  showcase: ['headline','photo','price','description','benefits','meta','customBlock','contact'],
  entrance: ['headline','description','customBlock','benefits','contact','price','meta','photo'],
  private: ['headline','description','price','customBlock','benefits','contact','meta','photo']
};

export function applyLayoutMode(state, mode = 'auto'){
  const next = {...state, layoutMode: mode};
  const effectiveMode = mode === 'auto' ? pickAutoMode(next) : mode;

  if(effectiveMode === 'readable') applyReadable(next);
  if(effectiveMode === 'economy') applyEconomy(next);
  if(effectiveMode === 'photo') applyPhoto(next);
  if(effectiveMode === 'showcase') applyShowcase(next);
  if(effectiveMode === 'entrance') applyEntrance(next);
  if(effectiveMode === 'private') applyPrivate(next);

  applyBlockOrder(next, effectiveMode);
  normalizeBlocks(next);
  return next;
}

export function applyLayoutModePreservingMedia(state, mode = 'auto'){
  const mediaIntent = pickMediaIntent(state);
  const next = applyLayoutMode(state, mode);
  next.layoutMode = mode;

  if(mediaIntent.showPhoto){
    next.showPhoto = true;
    next.photoMode = mediaIntent.photoMode;
  }

  if(mediaIntent.showQr){
    next.showQr = true;
  }

  normalizeBlocks(next);
  return next;
}

export function getLayoutHints(state){
  const hints = [];
  const count = Number(state.printCount) || 2;

  if(count >= 4 && state.showPhoto && state.photoMode !== 'none'){
    hints.push('Для 4 макетов на А4 фото часто делает объявление мелким. Лучше выключить фото или печатать 2 на А4.');
  }
  if(count >= 4 && state.showDescription && String(state.description || '').length > 220){
    hints.push('Для экономной расклейки описание лучше сократить до 1–2 коротких предложений.');
  }
  if(state.showQr && state.qrLink && count >= 4){
    hints.push('QR на плотной расклейке может плохо сканироваться. Для QR лучше 1–2 объявления на листе.');
  }
  if(!state.showContact && !state.tearOffs && !(state.showQr && state.qrLink)){
    hints.push('В макете нет контактов, отрывных телефонов и QR. Для расклейки почти всегда нужен канал отклика.');
  }
  if((state.showContact || state.tearOffs) && !String(state.agentPhone || '').trim()){
    hints.push('Заполните телефон СПН: он нужен для контактов или отрывных листочков.');
  }
  if(!state.showHeadline){
    hints.push('Заголовок скрыт. Без него объявление хуже цепляет внимание.');
  }

  return hints.slice(0, 4);
}

function pickMediaIntent(state){
  const photoMode = state.photoMode && state.photoMode !== 'none' ? state.photoMode : 'one';
  return {
    showPhoto: Boolean(state.showPhoto && state.photoMode !== 'none'),
    photoMode,
    showQr: Boolean(state.showQr)
  };
}

function pickAutoMode(state){
  const count = Number(state.printCount) || 2;
  if(state.colorMode === 'private') return 'private';
  if(count >= 4) return 'economy';
  if(count === 1) return 'showcase';
  if(state.photoOne || state.photoMode === 'one' || state.photoMode === 'two' || state.photoMode === 'plan') return 'photo';
  return 'readable';
}

function applyReadable(state){
  state.printCount = 2;
  state.splitMode = 'auto';
  state.layoutDensity = 'airy';
  state.showHeadline = true;
  state.showPrice = true;
  state.showDescription = true;
  state.showMeta = hasMeta(state);
  state.showBenefits = true;
  state.showPhoto = false;
  state.photoMode = 'none';
  state.showQr = false;
  state.showContact = true;
  state.tearOffs = true;
  state.headlineScale = 1.1;
  state.phoneScale = 1.45;
  state.flyerPadding = 6;
  state.pageMargin = 7;
  state.pageGap = 4;
}

function applyEconomy(state){
  state.printCount = 4;
  state.splitMode = 'grid';
  state.layoutDensity = 'dense';
  state.showHeadline = true;
  state.showPrice = Boolean(state.price);
  state.showDescription = true;
  state.showMeta = false;
  state.showBenefits = true;
  state.showPhoto = false;
  state.photoMode = 'none';
  state.showQr = false;
  state.showContact = true;
  state.tearOffs = true;
  state.headlineScale = 0.95;
  state.phoneScale = 1.25;
  state.flyerPadding = 4;
  state.pageMargin = 5;
  state.pageGap = 3;
}

function applyPhoto(state){
  state.printCount = Number(state.printCount) >= 4 ? 2 : Number(state.printCount) || 2;
  state.splitMode = 'auto';
  state.layoutDensity = 'normal';
  state.showHeadline = true;
  state.showPrice = true;
  state.showDescription = true;
  state.showMeta = true;
  state.showBenefits = true;
  state.showPhoto = true;
  if(state.photoMode === 'none') state.photoMode = 'one';
  state.showQr = Boolean(state.qrLink);
  state.showContact = true;
  state.tearOffs = Number(state.printCount) !== 1;
  state.headlineScale = 1;
  state.phoneScale = 1.25;
  state.flyerPadding = 5;
  state.pageMargin = 7;
  state.pageGap = 4;
}

function applyShowcase(state){
  state.printCount = 1;
  state.splitMode = 'auto';
  state.layoutDensity = 'airy';
  state.showHeadline = true;
  state.showPrice = true;
  state.showDescription = true;
  state.showMeta = true;
  state.showBenefits = true;
  state.showPhoto = Boolean(state.photoOne || state.photoTwo || state.photoMode !== 'none');
  if(state.showPhoto && state.photoMode === 'none') state.photoMode = 'one';
  state.showQr = Boolean(state.qrLink);
  state.showContact = true;
  state.tearOffs = false;
  state.headlineScale = 1.25;
  state.phoneScale = 1.55;
  state.flyerPadding = 8;
  state.pageMargin = 9;
  state.pageGap = 4;
}

function applyEntrance(state){
  state.printCount = 4;
  state.splitMode = 'grid';
  state.layoutDensity = 'dense';
  state.showHeadline = true;
  state.showPrice = Boolean(state.price);
  state.showDescription = true;
  state.showMeta = false;
  state.showBenefits = true;
  state.showPhoto = false;
  state.photoMode = 'none';
  state.showQr = false;
  state.showContact = true;
  state.tearOffs = true;
  state.headlineScale = 0.95;
  state.phoneScale = 1.35;
  state.flyerPadding = 4;
  state.pageMargin = 5;
  state.pageGap = 3;
}

function applyPrivate(state){
  state.colorMode = 'private';
  state.showBrand = false;
  state.showHeadline = true;
  state.showPrice = true;
  state.showDescription = true;
  state.showMeta = hasMeta(state);
  state.showBenefits = true;
  state.showQr = false;
  state.showContact = true;
  state.tearOffs = true;
  if(Number(state.printCount) > 4) state.printCount = 4;
  state.headlineScale = Number(state.printCount) >= 4 ? 0.95 : 1.05;
  state.phoneScale = Number(state.printCount) >= 4 ? 1.25 : 1.4;
}

function applyBlockOrder(state, mode){
  const order = BLOCK_ORDERS[mode];
  if(!order) return;
  const current = Array.isArray(state.blockOrder) ? state.blockOrder : [];
  const customBlocks = current.filter(id => !order.includes(id));
  state.blockOrder = [...order, ...customBlocks];
}

function normalizeBlocks(state){
  if(!state.showPhoto){
    state.photoMode = 'none';
  }
  if(state.colorMode === 'private'){
    state.showBrand = false;
  }
}

function hasMeta(state){
  return Boolean(state.area || state.propertyType || state.params);
}
