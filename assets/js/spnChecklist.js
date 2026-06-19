const checks = [
  {
    id: 'phone',
    title: 'Телефон заполнен и виден',
    hint: 'Без телефона расклейка не работает.',
    action: 'phone',
    actionText: 'Исправить',
    ok: data => Boolean(data.phone) && data.showContact
  },
  {
    id: 'headline',
    title: 'Есть цепляющий заголовок',
    hint: 'Заголовок должен дать человеку повод остановиться.',
    action: 'headline',
    actionText: 'Подставить основу',
    ok: data => data.headline.length >= 10 && !/ваш заголовок|проверьте свой заголовок/i.test(data.headline)
  },
  {
    id: 'context',
    title: 'Понятно, к кому обращаемся',
    hint: 'Укажите район, дом, объект, цену или ситуацию.',
    action: 'context',
    actionText: 'К полям',
    ok: data => Boolean(data.area || data.propertyType || data.price)
  },
  {
    id: 'description',
    title: 'Описание короткое и по делу',
    hint: 'Лучше 1–2 предложения без лишней воды.',
    action: 'description',
    actionText: 'Улучшить',
    ok: data => data.description.length >= 25 && data.description.length <= 230
  },
  {
    id: 'cta',
    title: 'Есть понятный призыв',
    hint: 'Позвоните, напишите, узнайте цену, обсудим вариант.',
    action: 'cta',
    actionText: 'Добавить призыв',
    ok: data => /позвон|напиш|узна|уточн|обсуд|подска|звон/i.test(data.allText)
  },
  {
    id: 'benefits',
    title: 'Есть 2–3 причины откликнуться',
    hint: 'Без давления, по делу, проверка документов, помощь с ипотекой.',
    action: 'benefits',
    actionText: 'Добавить причины',
    ok: data => data.benefits.length >= 2
  },
  {
    id: 'trust',
    title: 'Снято опасение человека',
    hint: 'Добавьте: без давления, без обязательств, по делу, объясню простым языком.',
    action: 'trust',
    actionText: 'Смягчить',
    ok: data => /без давлен|без обязательств|не обязывает|по делу|безопас|провер|документ|простым язык|честн/i.test(data.allText)
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const qualityCard = document.querySelector('.quality-card');
  if(!qualityCard || document.getElementById('spnChecklist')) return;
  qualityCard.insertAdjacentHTML('beforebegin', renderChecklistShell());
  bindChecklistUpdates();
  updateChecklist();
});

function renderChecklistShell(){
  return `<section class="card spn-checklist" id="spnChecklist">
    <div class="quality-head">
      <div class="step-title"><span>★</span>Практическая готовность</div>
      <strong id="spnChecklistScore">—</strong>
    </div>
    <div class="spn-checklist-list" id="spnChecklistList"></div>
    <p class="hint-text">Это быстрый контроль перед печатью: макет должен быть понятным, продающим и удобным для отклика.</p>
  </section>`;
}

function bindChecklistUpdates(){
  const ids = ['agentPhone','headline','description','benefits','customBlockTitle','customBlockText','area','propertyType','price','showContact','tearOffs'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', updateChecklist);
    el.addEventListener('change', updateChecklist);
  });
  const list = document.getElementById('spnChecklistList');
  if(list){
    list.addEventListener('click', event => {
      const btn = event.target.closest('[data-spn-check-action]');
      if(!btn) return;
      applyChecklistFix(btn.dataset.spnCheckAction);
    });
  }
  const target = document.getElementById('qualityList') || document.body;
  const observer = new MutationObserver(updateChecklist);
  observer.observe(target, {childList:true, subtree:true});
}

function updateChecklist(){
  const data = readData();
  const results = checks.map(item => ({...item, passed: item.ok(data)}));
  const passed = results.filter(item => item.passed).length;
  const list = document.getElementById('spnChecklistList');
  const score = document.getElementById('spnChecklistScore');
  if(!list || !score) return;

  score.textContent = `${passed}/${results.length}`;
  score.className = passed >= 6 ? 'score-good' : passed >= 4 ? 'score-mid' : 'score-bad';
  list.innerHTML = results.map(item => `<div class="spn-check-item ${item.passed ? 'done' : 'todo'}">
    <b>${item.passed ? '✓' : '•'} ${escapeHtml(item.title)}</b>
    <span>${escapeHtml(item.hint)}</span>
    ${item.passed ? '' : `<button type="button" data-spn-check-action="${item.action}">${escapeHtml(item.actionText)}</button>`}
  </div>`).join('');
}

function applyChecklistFix(action){
  if(action === 'phone'){
    setChecked('showContact', true);
    focusField('agentPhone');
  }
  if(action === 'headline'){
    const area = value('area') || 'вашем районе';
    setValueIfEmpty('headline', `НЕДВИЖИМОСТЬ В ${area.toUpperCase()}`);
    focusField('headline');
  }
  if(action === 'context'){
    focusField(value('area') ? value('propertyType') ? 'price' : 'propertyType' : 'area');
  }
  if(action === 'description'){
    const description = value('description');
    if(!description){
      setValue('description', 'Позвоните — подскажу по цене, спросу и возможным вариантам без давления.');
    } else if(description.length > 230){
      setValue('description', trimText(description, 210));
    }
    focusField('description');
  }
  if(action === 'cta'){
    appendSentence('description', ' Позвоните — подскажу детали и помогу разобраться.');
    focusField('description');
  }
  if(action === 'benefits'){
    const current = value('benefits');
    const base = ['Без давления', 'По делу и простым языком', 'Помощь с документами'];
    const merged = [...new Set([...current.split('\n').map(x => x.trim()).filter(Boolean), ...base])].slice(0, 4);
    setValue('benefits', merged.join('\n'));
    focusField('benefits');
  }
  if(action === 'trust'){
    appendSentence('customBlockText', ' Можно просто уточнить информацию — звонок ни к чему не обязывает.');
    setValueIfEmpty('customBlockTitle', 'Важно');
    setChecked('showCustomBlock', true);
    focusField('customBlockText');
  }
  updateChecklist();
}

function readData(){
  const headline = value('headline');
  const description = value('description');
  const benefitsText = value('benefits');
  const customBlockTitle = value('customBlockTitle');
  const customBlockText = value('customBlockText');
  const price = value('price');
  const area = value('area');
  const propertyType = value('propertyType');
  return {
    phone: value('agentPhone'),
    headline,
    description,
    benefits: benefitsText.split('\n').map(x => x.trim()).filter(Boolean),
    customBlockTitle,
    customBlockText,
    price,
    area,
    propertyType,
    showContact: checked('showContact'),
    tearOffs: checked('tearOffs'),
    allText: `${headline} ${description} ${benefitsText} ${customBlockTitle} ${customBlockText} ${price} ${area} ${propertyType}`.toLowerCase().replace(/ё/g, 'е')
  };
}

function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function checked(id){
  return Boolean(document.getElementById(id)?.checked);
}
function setValue(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function setValueIfEmpty(id, value){
  if(!value.trim() || document.getElementById(id)?.value.trim()) return;
  setValue(id, value);
}
function setChecked(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.checked = value;
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function appendSentence(id, sentence){
  const current = value(id);
  if(current.toLowerCase().replace(/ё/g, 'е').includes(sentence.trim().toLowerCase().replace(/ё/g, 'е'))) return;
  setValue(id, `${current}${sentence}`.trim());
}
function trimText(text, max){
  const value = String(text || '').trim();
  if(value.length <= max) return value;
  return `${value.slice(0, max).replace(/[\s,.;:!-]+$/, '')}...`;
}
function focusField(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.focus();
  el.scrollIntoView({behavior:'smooth', block:'center'});
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
