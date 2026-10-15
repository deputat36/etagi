const SHEET_ID = 'printSheet';
const HINT_ID = 'spnInlinePreviewHint';
const STYLE_ID = 'spnInlinePreviewEditorStyles';
const EDITABLE_SELECTOR = '[data-inline-field]';
let pointerSelection = null;
const SINGLE_LINE_FIELDS = new Set([
  'brandName',
  'brandSideText',
  'tearOffLabel',
  'agentName',
  'agentPhone',
  'area',
  'propertyType',
  'price',
  'params',
  'customBlockTitle',
  'contactCta',
  'qrCaption',
  'benefits'
]);

document.addEventListener('DOMContentLoaded', () => {
  const sheet = document.getElementById(SHEET_ID);
  if(!sheet || sheet.dataset.inlinePreviewBound === 'true') return;

  sheet.dataset.inlinePreviewBound = 'true';
  injectStyles();
  injectHint();

  sheet.addEventListener('focusin', handleFocusIn);
  sheet.addEventListener('focusout', handleFocusOut);
  sheet.addEventListener('keydown', handleKeydown);
  sheet.addEventListener('paste', handlePaste);
  sheet.addEventListener('pointerdown', rememberPointerSelection);
  sheet.addEventListener('pointercancel', () => { pointerSelection = null; });
});

function handleFocusIn(event){
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable) return;
  editable.__inlineOriginalNodes = [...editable.childNodes].map(node => node.cloneNode(true));
  if(editable.dataset.inlineField === 'tearOffLabel'){
    editable.textContent = document.getElementById('tearOffLabel')?.value || '';
  }
  editable.dataset.inlineOriginal = readEditableText(editable);
  editable.dataset.inlineCancelled = 'false';
}

function restoreOriginalContent(editable){
  editable.replaceChildren(...(editable.__inlineOriginalNodes || []).map(node => node.cloneNode(true)));
}

function handleFocusOut(event){
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable || editable.dataset.inlineCommitting === 'true') return;

  if(editable.dataset.inlineCancelled === 'true'){
    restoreOriginalContent(editable);
    return;
  }
  if(readEditableText(editable) === editable.dataset.inlineOriginal){
    restoreOriginalContent(editable);
    return;
  }

  const nextFocus = describeNextFocus(editable, event.relatedTarget);
  pointerSelection = null;
  commitInlineValue(editable);
  restoreNextFocus(nextFocus);
}

function handleKeydown(event){
  pointerSelection = null;
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable) return;

  if(event.key === 'Escape'){
    event.preventDefault();
    editable.dataset.inlineCancelled = 'true';
    restoreOriginalContent(editable);
    editable.blur();
    setStatus('Изменение на макете отменено.');
    return;
  }

  const field = editable.dataset.inlineField || '';
  const commitByEnter = SINGLE_LINE_FIELDS.has(field) && event.key === 'Enter';
  const commitByShortcut = event.key === 'Enter' && (event.ctrlKey || event.metaKey);
  if(commitByEnter || commitByShortcut){
    event.preventDefault();
    editable.blur();
  }
}

function rememberPointerSelection(event){
  pointerSelection = null;
  if(event.button !== 0) return;
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable) return;
  const doc = editable.ownerDocument;
  const position = doc.caretPositionFromPoint?.(event.clientX, event.clientY);
  const fallback = position ? null : doc.caretRangeFromPoint?.(event.clientX, event.clientY);
  const node = position?.offsetNode || fallback?.startContainer;
  const offset = position?.offset ?? fallback?.startOffset;
  if(!node || !editable.contains(node)) return;
  const range = doc.createRange();
  range.selectNodeContents(editable);
  range.setEnd(node, offset);
  pointerSelection = {editable, offset:range.toString().length};
}

function describeNextFocus(editable, target){
  const sheet = editable.closest(`#${SHEET_ID}`);
  if(!target?.matches?.(EDITABLE_SELECTOR) || !sheet?.contains(target)) return null;
  const flyer = target.closest('.flyer');
  const field = target.dataset.inlineField;
  let index = target.dataset.inlineIndex;
  const matches = [...flyer.querySelectorAll(EDITABLE_SELECTOR)].filter(node => node.dataset.inlineField === field && node.dataset.inlineIndex === index);
  const occurrence = matches.indexOf(target);
  if(field === 'benefits' && editable.dataset.inlineField === field && !normalizeSingleLine(readEditableText(editable)) && Number(index) > Number(editable.dataset.inlineIndex)) index = String(Number(index) - 1);
  return {sheet, target, field, index, occurrence, flyerIndex:[...sheet.querySelectorAll('.flyer')].indexOf(flyer), offset:pointerSelection?.editable === target ? pointerSelection.offset : null};
}

function restoreNextFocus(next){
  if(!next || next.target.isConnected) return;
  // Finish the native focus change before accepting the next input event.
  window.queueMicrotask(() => {
    const doc = next.sheet.ownerDocument;
    if(!next.sheet.isConnected || doc.activeElement !== doc.body) return;
    const flyer = next.sheet.querySelectorAll('.flyer')[next.flyerIndex];
    const replacement = [...(flyer?.querySelectorAll(EDITABLE_SELECTOR) || [])].filter(node => node.dataset.inlineField === next.field && node.dataset.inlineIndex === next.index)[next.occurrence];
    if(!replacement) return;
    replacement.focus({preventScroll:true});
    replacement.dispatchEvent(new CustomEvent('spn:inline-focus-restored', {bubbles:true}));
    if(next.offset === null) return;
    const walker = doc.createTreeWalker(replacement, NodeFilter.SHOW_TEXT);
    let offset = Math.min(next.offset, replacement.textContent.length);
    let node;
    while((node = walker.nextNode())){
      if(offset > node.length){ offset -= node.length; continue; }
      const range = doc.createRange();
      range.setStart(node, offset);
      range.collapse(true);
      const selection = doc.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
  });
}

function handlePaste(event){
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable) return;
  event.preventDefault();
  insertPlainText(editable.ownerDocument, event.clipboardData?.getData('text/plain') || '');
}

function commitInlineValue(editable){
  const field = editable.dataset.inlineField || '';
  const inputId = ({contactCta:'contactCtaText', brandName:'brandNameText'})[field] || field;
  const input = document.getElementById(inputId);
  if(!field || !input) return;

  editable.dataset.inlineCommitting = 'true';
  const rawValue = readEditableText(editable);
  const value = SINGLE_LINE_FIELDS.has(field) ? normalizeSingleLine(rawValue) : normalizeMultiline(rawValue);

  if(field === 'benefits'){
    input.value = updateBenefitLine(input.value, Number(editable.dataset.inlineIndex), value);
  } else {
    input.value = input.maxLength >= 0 ? value.slice(0, input.maxLength) : value;
  }

  input.dispatchEvent(new Event('input', {bubbles:true}));
  setStatus(`Текст «${editable.dataset.inlineLabel || field}» обновлён прямо на макете.`);
}

function updateBenefitLine(source, index, value){
  const lines = String(source || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  if(value){
    while(lines.length <= safeIndex) lines.push('');
    lines[safeIndex] = value;
  } else if(safeIndex < lines.length){
    lines.splice(safeIndex, 1);
  }
  return lines.filter(Boolean).join('\n');
}

function readEditableText(element){
  const text = element.dataset.inlineField === 'tearOffLabel' ? element.textContent : element.innerText || element.textContent;
  return String(text || '').replace(/\u00a0/g, ' ').replace(/\r/g, '');
}

function normalizeSingleLine(value){
  return String(value || '').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function normalizeMultiline(value){
  return String(value || '')
    .split('\n')
    .map(line => line.replace(/\s{2,}/g, ' ').trim())
    .filter((line, index, lines) => line || (index > 0 && index < lines.length - 1))
    .join('\n')
    .trim();
}

function insertPlainText(doc, value){
  const selection = doc.getSelection?.();
  if(!selection || !selection.rangeCount) return;
  selection.deleteFromDocument();
  const range = selection.getRangeAt(0);
  const node = doc.createTextNode(String(value || ''));
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function injectHint(){
  if(document.getElementById(HINT_ID)) return;
  const status = document.getElementById('previewStatus');
  if(!status) return;
  status.insertAdjacentHTML('afterend', `<p class="spn-inline-preview-hint" id="${HINT_ID}"><b>Быстрое редактирование:</b> нажмите на текст в макете, измените его и кликните вне блока. Enter сохраняет короткое поле, Ctrl+Enter — многострочный текст, Esc отменяет.</p>`);
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .spn-inline-preview-hint{margin:7px 0 0;max-width:720px;color:#475569;font-size:11.5px;line-height:1.35;font-weight:700}
    .spn-inline-preview-hint b{color:#1e293b}
    #printSheet ${EDITABLE_SELECTOR}{cursor:text;outline:0;border-radius:3px;transition:box-shadow .12s,background .12s}
    #printSheet ${EDITABLE_SELECTOR}:hover{box-shadow:0 0 0 .45mm rgba(227,6,19,.2)}
    #printSheet ${EDITABLE_SELECTOR}:focus{box-shadow:0 0 0 .6mm var(--red);text-shadow:none}
    @media print{
      .spn-inline-preview-hint{display:none!important}
      #printSheet ${EDITABLE_SELECTOR}{transition:none!important;box-shadow:none!important;outline:0!important;cursor:default!important}
    }
  `;
  document.head.appendChild(style);
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
