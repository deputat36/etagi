import fs from 'node:fs';

const file = 'assets/js/app.js';
let source = fs.readFileSync(file, 'utf8');

const importLine = "import { requestQualityListUpdate } from './qualityListUpdates.js';";
const importAnchor = "import { applyLayoutMode, applyLayoutModePreservingMedia, getLayoutHints } from './layoutRules.js';";
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error('Не найден import anchor для qualityListUpdates');
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const signalLine = "  requestQualityListUpdate(show ? 'manual-quality' : 'automatic-quality');";
const renderAnchor = "  $('qualityList').querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>applyFix(b.dataset.fix));\n  updatePreviewStatus();";
if (!source.includes(signalLine)) {
  if (!source.includes(renderAnchor)) throw new Error('Не найден runQuality anchor для явного сигнала');
  source = source.replace(renderAnchor, `  $('qualityList').querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>applyFix(b.dataset.fix));\n${signalLine}\n  updatePreviewStatus();`);
}

fs.writeFileSync(file, source, 'utf8');
console.log('app.js: явный сигнал общего канала качества добавлен.');
