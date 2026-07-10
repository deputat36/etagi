import { loadTemplates } from './templates.js';

const NOTICE_ID = 'spnManagerTemplateNotice';
let templateMap = new Map();

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  insertNotice();
  observeTemplates();
  loadOfficeMetadata();
});

async function loadOfficeMetadata(){
  try{
    const templates = await loadTemplates();
    templateMap = new Map(templates.map(template => [template.id, template]));
    updateNotice();
  }
  catch(error){
    updateNotice();
  }
}

function insertNotice(){
  if(document.getElementById(NOTICE_ID)) return;
  const templateList = document.getElementById('templateList');
  const anchor = templateList?.closest('.card') || document.querySelector('.quality-card');
  if(!anchor) return;
  anchor.insertAdjacentHTML('afterend', `<div class="spn-manager-template-notice" id="${NOTICE_ID}" hidden></div>`);
}

function observeTemplates(){
  const list = document.getElementById('templateList');
  if(!list) return;
  new MutationObserver(updateNotice).observe(list, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
}

function updateNotice(){
  const notice = document.getElementById(NOTICE_ID);
  if(!notice) return;
  const template = getActiveTemplate();
  const office = template?.office;

  if(!template || !office || !needsManagerAttention(office)){
    notice.hidden = true;
    notice.innerHTML = '';
    return;
  }

  notice.hidden = false;
  notice.dataset.risk = office.risk || 'medium';
  notice.innerHTML = `
    <b>${escapeHtml(getNoticeTitle(office))}</b>
    <span>${escapeHtml(template.title || 'Выбранный шаблон')} · риск: ${escapeHtml(riskLabel(office.risk))} · формат: ${escapeHtml(String(office.recommendedPrintCount || template.printCount || '—'))} на А4</span>
    <em>${escapeHtml(office.managerNote || 'Проверьте формулировки, телефон, цену, QR, фото и условия перед печатью.')}</em>
  `;
}

function getActiveTemplate(){
  const id = document.querySelector('.tpl-card.active')?.dataset.template;
  return id ? templateMap.get(id) : null;
}

function needsManagerAttention(office){
  return office.level === 'manager' || office.risk === 'high';
}

function getNoticeTitle(office){
  if(office.level === 'manager') return 'Перед печатью покажите макет менеджеру';
  if(office.risk === 'high') return 'Высокий риск формулировок';
  return 'Проверьте макет перед печатью';
}

function riskLabel(risk){
  if(risk === 'low') return 'низкий';
  if(risk === 'medium') return 'средний';
  if(risk === 'high') return 'высокий';
  return 'не указан';
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function injectStyles(){
  if(document.getElementById('spnManagerTemplateNoticeStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnManagerTemplateNoticeStyles';
  style.textContent = `
    .spn-manager-template-notice{margin:8px 0 10px;padding:9px 10px;border:1px solid #fed7aa;border-radius:14px;background:#fff7ed;color:#9a3412}
    .spn-manager-template-notice[data-risk="high"]{border-color:#fecaca;background:#fef2f2;color:#991b1b}
    .spn-manager-template-notice b{display:block;font-size:12px;font-weight:900;line-height:1.15}
    .spn-manager-template-notice span{display:block;margin-top:4px;font-size:10.5px;line-height:1.25;font-weight:850}
    .spn-manager-template-notice em{display:block;margin-top:5px;font-style:normal;font-size:10.5px;line-height:1.25;font-weight:750}
    @media print{.spn-manager-template-notice{display:none!important}}
  `;
  document.head.appendChild(style);
}
