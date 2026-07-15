const SHEET_ID = 'printSheet';
const HINT_ID = 'spnInlinePreviewHint';
const STYLE_ID = 'spnInlinePreviewEditorStyles';
const EDITABLE_SELECTOR = '[data-inline-field]';
const SINGLE_LINE_FIELDS = new Set([
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
});

function handleFocusIn(event){
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable) return;
  editable.dataset.inlineOriginal = readEditableText(editable);
  editable.dataset.inlineCancelled = 'false';
}

function handleFocusOut(event){
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable || editable.dataset.inlineCommitting === 'true') return;

  if(editable.dataset.inlineCancelled === 'true'){
    editable.textContent = editable.dataset.inlineOriginal || '';
    return;
  }

  commitInlineValue(editable);
}

function handleKeydown(event){
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable) return;

  if(event.key === 'Escape'){
    event.preventDefault();
    editable.dataset.inlineCancelled = 'true';
    editable.textContent = editable.dataset.inlineOriginal || '';
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

function handlePaste(event){
  const editable = event.target.closest(EDITABLE_SELECTOR);
  if(!editable) return;
  event.preventDefault();
  insertPlainText(editable.ownerDocument, event.clipboardData?.getData('text/plain') || '');
}

function commitInlineValue(editable){
  const field = editable.dataset.inlineField || '';
  const inputId = field === 'contactCta' ? 'contactCtaText' : field;
  const input = document.getElementById(inputId);
  if(!field || !input) return;

  editable.dataset.inlineCommitting = 'true';
  const rawValue = readEditableText(editable);
  const value = SINGLE_LINE_FIELDS.has(field) ? normalizeSingleLine(rawValue) : normalizeMultiline(rawValue);

  if(field === 'benefits'){
    input.value = updateBenefitLine(input.value, Number(editable.dataset.inlineIndex), value);
  } else {
    input.value = value;
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
  return String(element.innerText || element.textContent || '').replace(/\u00a0/g, ' ').replace(/\r/g, '');
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
    #printSheet ${EDITABLE_SELECTOR}:hover{box-shadow:0 0 0 .45mm rgba(11,114,185,.2);background:rgba(219,234,254,.28)}
    #printSheet ${EDITABLE_SELECTOR}:focus{box-shadow:0 0 0 .6mm #0b72b9;background:#eff6ff;color:#111827;text-shadow:none}
    #printSheet .contact ${EDITABLE_SELECTOR}:focus{background:#eff6ff!important;color:#111827!important}
    @media print{
      .spn-inline-preview-hint{display:none!important}
      #printSheet ${EDITABLE_SELECTOR}{box-shadow:none!important;outline:0!important;cursor:default!important}
    }
  `;
  document.head.appendChild(style);
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}
