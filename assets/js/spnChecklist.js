const checks = [
  {
    id: 'phone',
    title: 'Телефон заполнен и виден',
    hint: 'Без телефона расклейка не работает.',
    ok: data => Boolean(data.phone) && data.showContact
  },
  {
    id: 'headline',
    title: 'Есть цепляющий заголовок',
    hint: 'Заголовок должен дать человеку повод остановиться.',
    ok: data => data.headline.length >= 10 && !/ваш заголовок|проверьте свой заголовок/i.test(data.headline)
  },
  {
    id: 'context',
    title: 'Понятно, к кому обращаемся',
    hint: 'Укажите район, дом, объект, цену или ситуацию.',
    ok: data => Boolean(data.area || data.propertyType || data.price)
  },
  {
    id: 'description',
    title: 'Описание короткое и по делу',
    hint: 'Лучше 1–2 предложения без лишней воды.',
    ok: data => data.description.length >= 25 && data.description.length <= 230
  },
  {
    id: 'cta',
    title: 'Есть понятный призыв',
    hint: 'Позвоните, напишите, узнайте цену, обсудим вариант.',
    ok: data => /позвон|напиш|узна|уточн|обсуд|подска|звон/i.test(data.allText)
  },
  {
    id: 'benefits',
    title: 'Есть 2–3 причины откликнуться',
    hint: 'Без давления, по делу, проверка документов, помощь с ипотекой.',
    ok: data => data.benefits.length >= 2
  },
  {
    id: 'trust',
    title: 'Снято опасение человека',
    hint: 'Добавьте: без давления, без обязательств, по делу, объясню простым языком.',
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
  </div>`).join('');
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
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
