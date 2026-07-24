const CARD_SELECTOR = '[data-template]';
const FAVORITE_SELECTOR = '[data-favorite-template]';
const FOCUS_RESTORE_STABLE_PASSES = 6;
const FOCUS_RESTORE_MAX_MS = 1500;
let focusRestoreToken = 0;

(function initTemplateKeyboardAccessibility(){
  document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('templateList');
    if(!list || list.dataset.templateKeyboardBound === 'true') return;

    list.dataset.templateKeyboardBound = 'true';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Шаблоны расклейки');
    enhanceCards(list);

    list.addEventListener('keydown', event => handleKeydown(event, list));
    list.addEventListener('focusin', event => {
      if(event.target.closest(FAVORITE_SELECTOR)) return;
      const card = event.target.closest(CARD_SELECTOR);
      if(card) setRovingTabStop(list, card);
    });

    const observer = new MutationObserver(() => enhanceCards(list));
    observer.observe(list, {childList:true});
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
    setAttributeIfChanged(card, 'role', 'option');
    setAttributeIfChanged(card, 'aria-selected', selected ? 'true' : 'false');
    setAttributeIfChanged(card, 'aria-label', buildCardLabel(card, selected));
    setTabIndexIfChanged(card, card === tabCard ? 0 : -1);
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
    restoreSelectedCardFocus(list, templateId);
  }
}

function restoreSelectedCardFocus(list, templateId){
  const token = ++focusRestoreToken;
  const startedAt = performance.now();
  let stableCard = null;
  let stablePasses = 0;

  const attempt = () => {
    if(token !== focusRestoreToken) return;

    enhanceCards(list);
    const selected = findSelectedCard(list, templateId);
    if(selected){
      setRovingTabStop(list, selected);
      focusWithoutScroll(selected);

      if(selected === stableCard && selected.isConnected && document.activeElement === selected){
        stablePasses += 1;
      } else {
        stableCard = selected;
        stablePasses = document.activeElement === selected ? 1 : 0;
      }
    } else {
      stableCard = null;
      stablePasses = 0;
    }

    if(stablePasses >= FOCUS_RESTORE_STABLE_PASSES) return;
    if(performance.now() - startedAt >= FOCUS_RESTORE_MAX_MS) return;

    window.setTimeout(() => window.requestAnimationFrame(attempt), 40);
  };

  window.requestAnimationFrame(attempt);
}

function findSelectedCard(list, templateId){
  return list.querySelector(`${CARD_SELECTOR}.active`)
    || list.querySelector(`${CARD_SELECTOR}[data-template="${escapeSelectorValue(templateId)}"]`);
}

function focusWithoutScroll(element){
  try {
    element.focus({preventScroll:true});
  } catch(error) {
    element.focus();
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
  getCards(list).forEach(card => setTabIndexIfChanged(card, card === target ? 0 : -1));
}

function setAttributeIfChanged(element, name, value){
  if(element.getAttribute(name) === value) return;
  element.setAttribute(name, value);
}

function setTabIndexIfChanged(element, value){
  if(element.tabIndex === value) return;
  element.tabIndex = value;
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
