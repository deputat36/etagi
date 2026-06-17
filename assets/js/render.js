import { esc, nl } from './utils.js';
import { createQrSvg } from './qr.js';

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
  if(state.colorMode === 'economy') classes.push('color-economy');
  if(state.colorMode === 'bw') classes.push('bw');
  if(state.colorMode === 'private') classes.push('private');
  if(state.layoutDensity === 'dense' || Number(state.printCount) >= 4) classes.push('compact');
  if(!state.showContact) classes.push('no-contact');
  const benefits = nl(state.benefits).slice(0, Number(state.printCount)>=4 ? 3 : 5);
  return `<article class="${classes.join(' ')}">
    ${state.showBrand && state.colorMode !== 'private' ? `<div class="brand-row"><div class="brand"><span class="brand-mark">Э</span><span>Этажи</span></div><div class="site">etagi.com</div></div>` : ''}
    ${state.showHeadline ? `<div class="headline">${esc(state.headline)}</div>` : ''}
    ${state.showPrice && state.price ? `<div class="subline">${esc(state.price)}</div>` : ''}
    ${state.showPhoto ? renderPhotos(state) : ''}
    ${state.showDescription && state.description ? `<div class="desc">${esc(state.description)}</div>` : ''}
    ${state.showMeta ? renderMeta(state) : ''}
    ${state.showBenefits && benefits.length ? `<div class="benefits">${benefits.map(x=>`<div class="benefit">${esc(x)}</div>`).join('')}</div>` : ''}
    ${state.showContact ? `<div class="contact">
      <div class="phone">${esc(state.agentPhone || 'ВАШ ТЕЛЕФОН')}</div>
      <div class="person">${esc(state.agentName || 'Специалист по недвижимости')}</div>
      <div class="cta">Позвоните — подскажу по объекту и условиям</div>
      ${state.showQr ? renderQr(state) : ''}
    </div>` : ''}
    ${state.tearOffs && state.showContact ? renderTears(state) : ''}
  </article>`;
}

function renderPhotos(state){
  if(state.photoMode === 'none') return '';
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
function renderQr(state){
  if(!state.qrLink) return '';
  const qr = createQrSvg(state.qrLink);
  const caption = esc(state.qrCaption || 'Открыть ссылку');
  if(!qr.ok){
    return `<div class="qr-row"><div class="qr-box qr-error">QR</div><span>${caption}<br>ссылка слишком длинная</span></div>`;
  }
  return `<div class="qr-row"><div class="qr-box real-qr">${qr.svg}</div><span>${caption}</span></div>`;
}
function renderTears(state){
  const phone = esc(state.agentPhone || 'телефон');
  return `<div class="tears">${Array.from({length:5},()=>`<div class="tear">${phone}</div>`).join('')}</div>`;
}
function markOverflow(sheet){
  sheet.querySelectorAll('.flyer').forEach(f=>{
    f.classList.toggle('overflow', f.scrollHeight > f.clientHeight + 2 || f.scrollWidth > f.clientWidth + 2);
  });
}
