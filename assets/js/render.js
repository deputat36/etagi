import { esc, nl } from './utils.js';
import { createQrSvg } from './qr.js';

const DEFAULT_BLOCK_ORDER = ['headline','price','photo','description','meta','benefits','customBlock','contact'];
const TEAR_LABEL_KEY = 'etagi-raskleyka-tear-label-v1';

export function applyCss(state){
  const root = document.documentElement;
  root.style.setProperty('--sheet-margin', `${state.pageMargin}mm`);
  root.style.setProperty('--sheet-gap', `${state.pageGap}mm`);
  root.style.setProperty('--flyer-pad', `${state.flyerPadding}mm`);
  root.style.setProperty('--radius', `${state.radius}px`);
  root.style.setProperty('--headline-scale', state.headlineScale);
  root.style.setProperty('--phone-scale', state.phoneScale);
  root.style.setProperty('--photo-fit', state.photoFit);
}

export function getGrid(count, splitMode){
  const n = Number(count) || 2;
  if(n === 1) return {cols:1, rows:1, label:'1 крупный'};
  if(n === 2){
    if(splitMode === 'vertical') return {cols:2, rows:1, label:'слева / справа'};
    return {cols:1, rows:2, label:'сверху / снизу'};
  }
  if(n === 3) return {cols:1, rows:3, label:'3 сверху вниз'};
  if(n === 4) return {cols:2, rows:2, label:'сетка 2×2'};
  if(n === 6) return {cols:2, rows:3, label:'сетка 2×3'};
  if(n === 8) return {cols:2, rows:4, label:'сетка 2×4'};
  if(n === 10) return {cols:2, rows:5, label:'сетка 2×5'};
  if(n === 12) return {cols:2, rows:6, label:'сетка 2×6'};
  return {cols:2, rows:2, label:'сетка'};
}

export function renderSheet(sheet, state){
  const grid = getGrid(state.printCount, state.splitMode);
  sheet.className = 'sheet';
  sheet.classList.toggle('show-cut-lines', Boolean(state.showCutLines));
  sheet.classList.toggle('safe-print-margins', Boolean(state.safePrintMargins));
  sheet.classList.toggle('print-check-mode', Boolean(state.printCheckMode));
  sheet.style.gridTemplateColumns = `repeat(${grid.cols}, 1fr)`;
  sheet.style.gridTemplateRows = `repeat(${grid.rows}, 1fr)`;
  sheet.innerHTML = '';
  for(let i=0;i<Number(state.printCount);i++){
    sheet.insertAdjacentHTML('beforeend', renderFlyer(state));
  }
  requestAnimationFrame(()=>markOverflow(sheet));
  return grid;
}

function renderFlyer(state){
  const classes = ['flyer'];
  const hasPhoto = hasRenderablePhoto(state);
  if(state.colorMode === 'economy') classes.push('color-economy');
  if(state.colorMode === 'bw') classes.push('bw');
  if(state.colorMode === 'private') classes.push('private');
  if(state.layoutDensity === 'dense' || Number(state.printCount) >= 4) classes.push('compact');
  if(!state.showContact) classes.push('no-contact');
  classes.push(hasPhoto ? 'has-photo' : 'no-photo');
  if(state.tearOffs) classes.push('has-tears');
  if(state.showQr && state.qrLink) classes.push('has-qr');
  const blocks = normalizeBlockOrder(state.blockOrder)
    .map(blockId => renderBlock(blockId, state))
    .filter(Boolean)
    .join('');

  return `<article class="${classes.join(' ')}">
    ${state.showBrand && state.colorMode !== 'private' ? `<div class="brand-row"><div class="brand"><span class="brand-mark">Э</span><span>Этажи</span></div><div class="site">etagi.com</div></div>` : ''}
    ${blocks}
    ${state.showQr ? renderQr(state) : ''}
    ${state.tearOffs ? renderTears(state) : ''}
  </article>`;
}

function renderBlock(blockId, state){
  if(blockId === 'headline') return state.showHeadline ? `<div class="headline">${esc(state.headline)}</div>` : '';
  if(blockId === 'price') return state.showPrice && state.price ? `<div class="subline">${esc(state.price)}</div>` : '';
  if(blockId === 'photo') return hasRenderablePhoto(state) ? renderPhotos(state) : '';
  if(blockId === 'description') return state.showDescription && state.description ? `<div class="desc">${esc(state.description)}</div>` : '';
  if(blockId === 'meta') return state.showMeta ? renderMeta(state) : '';
  if(blockId === 'benefits') return state.showBenefits ? renderBenefits(state) : '';
  if(blockId === 'customBlock') return state.showCustomBlock ? renderCustomBlock(state) : '';
  if(blockId === 'contact') return state.showContact ? renderContact(state) : '';
  return '';
}

function renderBenefits(state){
  const benefits = nl(state.benefits).slice(0, Number(state.printCount)>=4 ? 3 : 5);
  if(!benefits.length) return '';
  return `<div class="benefits">${benefits.map(x=>`<div class="benefit">${esc(x)}</div>`).join('')}</div>`;
}

function hasRenderablePhoto(state){
  if(!state.showPhoto || state.photoMode === 'none') return false;
  if(state.photoMode === 'two') return Boolean(state.photoOne || state.photoTwo);
  return Boolean(state.photoOne);
}
function renderPhotos(state){
  const img1 = state.photoOne ? `<img src="${state.photoOne}" alt="Фото 1">` : '';
  const img2 = state.photoTwo ? `<img src="${state.photoTwo}" alt="Фото 2">` : '';
  if(state.photoMode === 'two') return `<div class="photos two"><div class="photo-box">${img1}</div><div class="photo-box">${img2}</div></div>`;
  if(state.photoMode === 'plan') return `<div class="photos plan"><div class="photo-box">${img1}</div></div>`;
  return `<div class="photos"><div class="photo-box">${img1}</div></div>`;
}
function renderMeta(state){
  const items = [];
  if(state.area) items.push(['Район', state.area]);
  if(state.propertyType) items.push(['Тип', state.propertyType]);
  if(state.params) items.push(['Параметры', state.params]);
  if(!items.length) return '';
  return `<div class="meta">${items.slice(0,4).map(([k,v])=>`<div>${esc(k)}<br>${esc(v)}</div>`).join('')}</div>`;
}
function renderCustomBlock(state){
  const title = String(state.customBlockTitle || '').trim();
  const text = String(state.customBlockText || '').trim();
  if(!title && !text) return '';
  return `<div class="custom-block">${title ? `<b>${esc(title)}</b>` : ''}${text ? `<span>${esc(text)}</span>` : ''}</div>`;
}
function renderContact(state){
  return `<div class="contact">
    <div class="phone">${esc(state.agentPhone || 'ВАШ ТЕЛЕФОН')}</div>
    <div class="person">${esc(state.agentName || 'Специалист по недвижимости')}</div>
    <div class="cta">Позвоните — подскажу по объекту и условиям</div>
  </div>`;
}
function renderQr(state){
  if(!state.qrLink) return '';
  const qr = createQrSvg(state.qrLink);
  const caption = esc(state.qrCaption || 'Открыть ссылку');
  if(!qr.ok){
    return `<div class="qr-row qr-standalone"><div class="qr-box qr-error">QR</div><span>${caption}<br>ссылка слишком длинная</span></div>`;
  }
  return `<div class="qr-row qr-standalone"><div class="qr-box real-qr">${qr.svg}</div><span>${caption}</span></div>`;
}
function renderTears(state){
  const phone = esc(state.agentPhone || 'телефон');
  const topic = splitTearTopic(getTearOffLabel(state)).map(part => `<span>${esc(part)}</span>`).join('');
  return `<div class="tears">${Array.from({length:8},()=>`<div class="tear"><span class="tear-topic">${topic}</span><span class="tear-phone">${phone}</span></div>`).join('')}</div>`;
}
function getTearOffLabel(state){
  const fromState = String(state.tearOffLabel || '').trim();
  if(fromState) return fromState;
  const fromInput = typeof document !== 'undefined' ? String(document.getElementById('tearOffLabel')?.value || '').trim() : '';
  if(fromInput) return fromInput;
  try{
    return localStorage.getItem(TEAR_LABEL_KEY) || 'Недвижимость';
  } catch(e){
    return 'Недвижимость';
  }
}
function splitTearTopic(value){
  const clean = String(value || 'Недвижимость').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(Boolean);
  if(words.length >= 2) return [words.slice(0, -1).join(' '), words.at(-1)].filter(Boolean).slice(0, 2);
  if(clean.length > 10){
    const cut = Math.ceil(clean.length / 2);
    return [`${clean.slice(0, cut)}-`, clean.slice(cut)].filter(Boolean);
  }
  return [clean];
}
function normalizeBlockOrder(order){
  const safe = Array.isArray(order) ? order.filter(id => DEFAULT_BLOCK_ORDER.includes(id)) : [];
  return [...new Set([...safe, ...DEFAULT_BLOCK_ORDER])];
}
function markOverflow(sheet){
  sheet.querySelectorAll('.flyer').forEach(f=>{
    f.classList.toggle('overflow', f.scrollHeight > f.clientHeight + 2 || f.scrollWidth > f.clientWidth + 2);
  });
}
