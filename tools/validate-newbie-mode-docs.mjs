import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  uiMode: 'assets/js/spnUiMode.js',
  newbieMode: 'assets/js/spnNewbieMode.js',
  wizardPatch: 'assets/js/spnNewbieWizardPatch.js',
  printGuard: 'assets/js/spnNewbiePrintGuard.js',
  checklist: 'docs/newbie-mode-regression-checklist.md',
  readme: 'README.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.uiMode, sources.uiMode, [
  "import './spnNewbieMode.js';",
  "import './spnNewbieModeNotice.js';",
  "import './spnNewbieEmptyState.js';",
  "import './spnNewbiePrintGuide.js';",
  "import './spnNewbieFinalCheck.js';",
  "import './spnNewbiePrintGuardNotice.js';",
  "import './spnNewbiePrintGuard.js';",
  "import './spnWizardFlow.js';",
  "import './spnNewbieWizardPatch.js';",
  "import './spnPhotoLayoutStyle.js';",
  "'newbie'"
]);

requireSnippets(files.newbieMode, sources.newbieMode, [
  "const NEWBIE_QUERY = 'новичку';",
  'scheduleNewbieModeUpdate',
  'guardNewbieSearch',
  'hasUnsafeText',
  'spn-newbie-hidden-template'
]);

requireSnippets(files.wizardPatch, sources.wizardPatch, [
  'scheduleNewbieWizardSync',
  'redirectToCheckStep',
  'redirectingFromSave',
  'data-wizard-step="save"',
  'data-wizard-step="check"'
]);

requireSnippets(files.printGuard, sources.printGuard, [
  'bindPrintGuard',
  "document.getElementById('printBtn')",
  'handlePrintButtonClick',
  'isReadyToPrint',
  'goToFirstMissing'
]);

forbidSnippets(files.printGuard, sources.printGuard, [
  "document.addEventListener('click', handlePrintGuard, true)",
  'stopPropagation()'
]);

requireSnippets(files.checklist, sources.checklist, [
  '# Ручная регрессионная проверка режима «Новичок»',
  'Проверка переключения режимов',
  'Проверка фильтра шаблонов новичка',
  'Проверка мастера шагов',
  'Проверка защиты печати',
  'Проверка фото-раскладки',
  'Что считать регрессией'
]);

requireSnippets(files.readme, sources.readme, [
  'docs/newbie-mode-regression-checklist.md',
  'режим `Новичок` с безопасным фильтром шаблонов',
  'ручная регрессионная проверка режима «Новичок»'
]);

if (errors.length) {
  console.error('\nNewbie mode documentation errors:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Newbie mode documentation check passed.');

function requireSnippets(file, source, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: missing required snippet — ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets) {
  for (const snippet of snippets) {
    if (source.includes(snippet)) errors.push(`${file}: forbidden snippet found — ${snippet}`);
  }
}

function readRequired(file) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${file}: file not found`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
