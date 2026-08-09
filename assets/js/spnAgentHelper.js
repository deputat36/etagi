document.addEventListener('DOMContentLoaded', () => {
  const name = document.getElementById('agentName');
  const nameLabel = name?.closest('label');
  if(!name || !nameLabel || document.getElementById('spnAgentHelper')) return;
  nameLabel.insertAdjacentHTML('afterend', renderHelper());
  bindHelper();
  renderNameIdeas();
});

function renderHelper(){
  return `<div class="spn-agent-helper" id="spnAgentHelper">
    <div class="spn-agent-helper-head">
      <b>Подпись специалиста</b>
      <button type="button" id="agentNameNormalizeBtn">Привести имя</button>
    </div>
    <div class="spn-agent-ideas" id="spnAgentIdeas"></div>
    <p>Эта строка печатается под телефоном. Лучше писать коротко: имя, роль или локальная привязка.</p>
  </div>`;
}

function bindHelper(){
  document.getElementById('spnAgentHelper')?.addEventListener('click', event => {
    const idea = event.target.closest('[data-agent-idea]');
    const normalize = event.target.closest('#agentNameNormalizeBtn');
    if(idea){
      setValue('agentName', idea.dataset.agentIdea);
      setStatus('Подпись специалиста обновлена.');
    }
    if(normalize){
      normalizeAgentName();
    }
    window.setTimeout(renderNameIdeas, 50);
  });
  document.getElementById('agentName')?.addEventListener('input', renderNameIdeas);
  document.getElementById('agentName')?.addEventListener('change', renderNameIdeas);
}

function renderNameIdeas(){
  const box = document.getElementById('spnAgentIdeas');
  if(!box) return;
  const base = getShortName() || 'Специалист';
  const ideas = [
    base,
    `${base}, специалист по недвижимости`,
    `${base}, Этажи Борисоглебск`,
    'Специалист по недвижимости',
    'Ваш специалист по недвижимости',
    'Команда Этажи Борисоглебск'
  ];
  box.innerHTML = [...new Set(ideas)].map(item => `<button type="button" data-agent-idea="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('');
}

function normalizeAgentName(){
  const raw = value('agentName');
  if(!raw){
    focusField('agentName');
    setStatus('Введите имя специалиста.');
    return;
  }
  setValue('agentName', toTitleCase(raw));
  setStatus('Имя специалиста приведено к аккуратному виду.');
}

function getShortName(){
  const raw = value('agentName');
  if(!raw) return '';
  const clean = toTitleCase(raw).replace(/\s+/g, ' ').trim();
  const parts = clean.split(' ').filter(Boolean);
  return parts[0] || clean;
}

function toTitleCase(text){
  return String(text || '').toLowerCase().replace(/(^|[\s-])([а-яёa-z])/gi, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}
function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function setValue(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
function focusField(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.focus();
  el.scrollIntoView({behavior:'smooth', block:'center'});
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value){
  return escapeHtml(value).replace(/`/g, '&#96;');
}
