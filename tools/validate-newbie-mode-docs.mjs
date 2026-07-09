import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  index: 'index.html',
  uiMode: 'assets/js/spnUiMode.js',
  newbieMode: 'assets/js/spnNewbieMode.js',
  wizardFlow: 'assets/js/spnWizardFlow.js',
  wizardPatch: 'assets/js/spnNewbieWizardPatch.js',
  printGuard: 'assets/js/spnNewbiePrintGuard.js',
  checklist: 'docs/newbie-mode-regression-checklist.md',
  fullScenarioChecklist: 'docs/full-scenario-regression-checklist.md',
  rollbackPlan: 'docs/newbie-mode-rollback-plan.md',
  releaseNote: 'docs/releases/3.85.0.md',
  readme: 'README.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.index, sources.index, [
  'assets/js/spnUiMode.js?v=newbie-wizard-20260703-1'
]);

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

requireSnippets(files.wizardFlow, sources.wizardFlow, [
  "id: 'task'",
  "title: '7. Задание'",
  "sections: ['task']",
  "id: 'report'",
  "title: '8. Отчёт'",
  "sections: ['report']",
  "task: document.getElementById('spnDistributionTask')",
  "report: document.getElementById('spnDistributionReport')",
  'spn-wizard-print-help',
  '2 на А4 — основной офисный вариант',
  "{ count: 1, title: '1 крупно', note: 'фото / витрина' }",
  "{ count: 4, title: '4 экономно', note: 'подъезды' }",
  "{ count: 8, title: '8 мини', note: 'только телефон' }"
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

const oldDocumentGuard = 'document.add' + "EventListener('click', handlePrintGuard, true)";
const oldPropagationStop = 'stop' + 'Propagation()';
forbidSnippets(files.printGuard, sources.printGuard, [oldDocumentGuard, oldPropagationStop]);

requireSnippets(files.checklist, sources.checklist, [
  '# Ручная регрессионная проверка режима «Новичок»',
  'Проверка переключения режимов',
  'Проверка фильтра шаблонов новичка',
  'Проверка мастера шагов',
  'Проверка защиты печати',
  'Проверка фото-раскладки',
  'Что считать регрессией'
]);

requireSnippets(files.fullScenarioChecklist, sources.fullScenarioChecklist, [
  '# Ручная проверка полного сценария генератора расклеек',
  'Новичок → 2 на А4 → безопасный шаблон → телефон → проверка → печать → задание → отчёт',
  'Проверка 3. Wizard Flow',
  'Проверка 8. Защита печати в режиме `Новичок`',
  'Проверка 10. Задание на расклейку',
  'Проверка 11. Отчёт после расклейки',
  'Проверка 12. Повтор и CSV',
  'Что считать регрессией'
]);

requireSnippets(files.rollbackPlan, sources.rollbackPlan, [
  '# План аварийного отката режима «Новичок»',
  'Безопасная базовая конфигурация',
  'Порядок отключения модулей новичка',
  'Минимальная проверка после отката',
  'spnUiMode.js',
  'spnNewbiePrintGuard.js'
]);

requireSnippets(files.releaseNote, sources.releaseNote, [
  '# 3.85.0',
  'Режим `Новичок` возвращён после стабилизации',
  'spnNewbiePrintGuard.js',
  'spnPhotoLayoutStyle.js',
  'spnWizardFlow.js',
  'spnNewbieWizardPatch.js',
  'newbie-wizard-20260703-1',
  'docs/newbie-mode-rollback-plan.md',
  'validate:newbie-mode-docs'
]);

requireSnippets(files.readme, sources.readme, [
  'docs/newbie-mode-regression-checklist.md',
  'docs/newbie-mode-rollback-plan.md',
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
