const qualificationModes = {
  hot: {
    title: 'Горячий отклик',
    badge: 'Горячий',
    signs: 'Есть конкретный объект, срок, цена или готовность встретиться / отправить документы.',
    questions: [
      'Какой адрес или район?',
      'Какая цель: продать, купить, узнать цену, проверить документы?',
      'В какие сроки хотите решить вопрос?',
      'Какой следующий шаг вам удобен: звонок, встреча, оценка, просмотр?'
    ],
    next: 'Назначить конкретное действие: встречу, оценку, просмотр, подборку или повторный звонок в точное время.'
  },
  warm: {
    title: 'Тёплый отклик',
    badge: 'Тёплый',
    signs: 'Интерес есть, но человек пока сравнивает, думает, не знает цену или не готов назвать сроки.',
    questions: [
      'Что именно хотите понять сейчас?',
      'Вы уже смотрели цены или предложения?',
      'Что вас останавливает от решения?',
      'Когда можно вернуться к разговору?'
    ],
    next: 'Дать пользу и поставить повторный контакт: отправить ориентир цены, список шагов или подборку вариантов.'
  },
  cold: {
    title: 'Холодный отклик',
    badge: 'Холодный',
    signs: 'Человек просто спросил, не дал вводных, не готов обсуждать детали или ошибся ожиданием.',
    questions: [
      'Что вы хотели уточнить по объявлению?',
      'В какой ситуации может быть актуально вернуться к вопросу?',
      'Можно ли отправить короткую информацию и связаться позже?'
    ],
    next: 'Не давить. Зафиксировать причину, оставить мягкий повод для повторного контакта или закрыть как нецелевой.'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const saveCard = document.querySelector('.save-card');
  if(!saveCard || document.getElementById('spnLeadQualification')) return;
  saveCard.insertAdjacentHTML('beforebegin', renderQualificationShell());
  bindQualificationEvents();
  setQualificationMode('warm');
});

function renderQualificationShell(){
  return `<section class="card spn-lead-qualification" id="spnLeadQualification">
    <div class="quality-head">
      <div class="step-title"><span>●</span>Квалификация отклика</div>
      <button type="button" id="copyLeadNoteBtn">Скопировать заметку</button>
    </div>
    <div class="spn-qual-tabs">
      <button type="button" data-qual-mode="hot">Горячий</button>
      <button type="button" data-qual-mode="warm">Тёплый</button>
      <button type="button" data-qual-mode="cold">Холодный</button>
    </div>
    <div class="spn-qual-box" id="spnQualBox"></div>
    <div class="spn-lead-note">
      <label>Короткая заметка по отклику<textarea id="leadQuickNote" rows="3" placeholder="Например: собственник 2-комн. на Аэродромной, хочет понять цену, перезвонить завтра в 12:00"></textarea></label>
    </div>
    <p class="hint-text">После каждого звонка фиксируйте качество отклика. Так будет понятно, какие макеты дают не просто звонки, а реальные рабочие контакты.</p>
  </section>`;
}

function bindQualificationEvents(){
  document.querySelectorAll('[data-qual-mode]').forEach(btn => {
    btn.addEventListener('click', () => setQualificationMode(btn.dataset.qualMode));
  });
  document.getElementById('copyLeadNoteBtn')?.addEventListener('click', copyLeadNote);
}

function setQualificationMode(mode){
  const current = qualificationModes[mode] ? mode : 'warm';
  document.querySelectorAll('[data-qual-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.qualMode === current));
  const data = qualificationModes[current];
  const box = document.getElementById('spnQualBox');
  if(!box) return;
  box.dataset.mode = current;
  box.innerHTML = `<div class="spn-qual-title"><b>${escapeHtml(data.title)}</b><span>${escapeHtml(data.badge)}</span></div>
    <div class="spn-qual-section"><b>Признаки</b><p>${escapeHtml(data.signs)}</p></div>
    <div class="spn-qual-section"><b>Что спросить</b><ol>${data.questions.map(q => `<li>${escapeHtml(q)}</li>`).join('')}</ol></div>
    <div class="spn-qual-section"><b>Следующий шаг</b><p>${escapeHtml(data.next)}</p></div>`;
}

function copyLeadNote(){
  const mode = document.querySelector('[data-qual-mode].active')?.dataset.qualMode || 'warm';
  const data = qualificationModes[mode];
  const note = value('leadQuickNote');
  const source = getSourceText();
  const text = `Отклик с расклейки\n\nКачество: ${data.badge}\nИсточник: ${source}\nЗаметка: ${note || 'не заполнено'}\nСледующий шаг: ${data.next}`;
  navigator.clipboard?.writeText(text).then(() => setStatus('Заметка по отклику скопирована.')).catch(() => setStatus('Не удалось скопировать заметку.'));
}

function getSourceText(){
  const area = value('area');
  const property = value('propertyType');
  const price = value('price');
  return [area, property, price].filter(Boolean).join(' / ') || 'текущий макет';
}
function value(id){
  return String(document.getElementById(id)?.value || '').trim();
}
function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
