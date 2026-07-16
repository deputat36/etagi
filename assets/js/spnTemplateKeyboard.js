const CARD_SELECTOR = '[data-template]';
const FAVORITE_SELECTOR = '[data-favorite-template]';
const STYLE_ID = 'spn-template-keyboard-style';

(function initTemplateKeyboardAccessibility(){
  document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('templateList');
    if(!list || list.dataset.templateKeyboardBound === 'true') return;

    list.dataset.templateKeyboardBound = 'true';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Шаблоны расклейки');
    ensureStyle();
    enhanceCards(list);

    list.addEventListener('keydown', event => handleKeydown(event, list));
    list.addEventListener('focusin', event => {
      if(event.target.closest(FAVORITE_SELECTOR)) return;
      const card = event.target.closest(CARD_SELECTOR);
      if(card) setRovingTabStop(list, card);
    });

    const observer = new MutationObserver(() => enhanceCards(list));
    observer.observe(list, {childList:true, subtree:true});
  });
})();

function enhanceCards(list){
  const cards = getCards(list);
  if(!cards.length) return;

  const focusedCard = document.activeElement?.closest?.(CARD_SELECTOR);
  const selectedCard = cards.find(card => card.classList.contains('active')) || null;
  const tabCard = focusedCard && list.contains(focusedCard)
    ? focusedCard
    : selectedCard || cards[0];

  cards.forEach(card => {
    const selected = card.classList.contains('active');
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', selected ? 'true' : 'false');
    card.setAttribute('aria-label', buildCardLabel(card, selected));
    card.tabIndex = card === tabCard ? 0 : -1;
  });
}

function handleKeydown(event, list){
  if(event.target.closest(FAVORITE_SELECTOR)) return;
  const card = event.target.closest(CARD_SELECTOR);
  if(!card) return;

  const cards = getCards(list);
  const index = cards.indexOf(card);
  if(index < 0) return;

  const targetIndex = getTargetIndex(event.key, index, cards.length);
  if(targetIndex !== null){
    event.preventDefault();
    const target = cards[targetIndex];
    setRovingTabStop(list, target);
    target.focus();
    return;
  }

  if(event.key === 'Enter' || event.key === ' '){
    event.preventDefault();
    const templateId = card.dataset.template;
    card.click();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      enhanceCards(list);
      const selected = list.querySelector(`${CARD_SELECTOR}.active`) || list.querySelector(`${CARD_SELECTOR}[data-template="${escapeSelectorValue(templateId)}"]`);
      selected?.focus();
    }));
  }
}

function getTargetIndex(key, index, length){
  if(key === 'ArrowDown' || key === 'ArrowRight') return Math.min(index + 1, length - 1);
  if(key === 'ArrowUp' || key === 'ArrowLeft') return Math.max(index - 1, 0);
  if(key === 'Home') return 0;
  if(key === 'End') return length - 1;
  return null;
}

function setRovingTabStop(list, target){
  getCards(list).forEach(card => { card.tabIndex = card === target ? 0 : -1; });
}

function getCards(list){
  return [...list.querySelectorAll(CARD_SELECTOR)];
}

function buildCardLabel(card, selected){
  const title = card.querySelector('b')?.textContent?.trim() || 'Шаблон';
  const note = card.querySelector('p')?.textContent?.trim() || '';
  return [title, note, selected ? 'выбран' : ''].filter(Boolean).join('. ');
}

function escapeSelectorValue(value){
  if(window.CSS?.escape) return CSS.escape(String(value || ''));
  return String(value || '').replace(/["\\]/g, '\\$&');
}

function ensureStyle(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .tpl-card[role="option"]:focus{outline:none}
    .tpl-card[role="option"]:focus-visible{
      outline:3px solid var(--accent);
      outline-offset:2px;
      box-shadow:0 0 0 5px color-mix(in srgb,var(--accent) 16%,transparent)
    }
  `;
  document.head.appendChild(style);
}
