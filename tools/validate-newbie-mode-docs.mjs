import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  package: 'package.json',
  index: 'index.html',
  uiMode: 'assets/js/spnUiMode.js',
  uiModeCss: 'assets/css/spn-ui-mode.css',
  browserSmoke: 'tools/browser-smoke.html',
  newbieMode: 'assets/js/spnNewbieMode.js',
  officeFilters: 'assets/js/spnOfficeTemplateFilters.js',
  templateBadges: 'assets/js/spnTemplateCardBadges.js',
  managerNotice: 'assets/js/spnManagerTemplateNotice.js',
  managerReview: 'assets/js/spnManagerReview.js',
  photoLayout: 'assets/js/spnPhotoLayoutStyle.js',
  wizardFlow: 'assets/js/spnWizardFlow.js',
  wizardPatch: 'assets/js/spnNewbieWizardPatch.js',
  printGuard: 'assets/js/spnNewbiePrintGuard.js',
  finalCheck: 'assets/js/spnNewbieFinalCheck.js',
  mediaReadiness: 'assets/js/spnMediaReadiness.js',
  clarityPanel: 'assets/js/spnClarityPanel.js',
  wizardStatus: 'assets/js/spnWizardStepStatus.js',
  checklist: 'docs/newbie-mode-regression-checklist.md',
  fullScenarioChecklist: 'docs/full-scenario-regression-checklist.md',
  rollbackPlan: 'docs/newbie-mode-rollback-plan.md',
  releaseNote: 'docs/releases/3.85.0.md',
  readme: 'README.md',
  visibilityAudit: 'docs/ui-mode-visibility-audit.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);
const packageVersion = readPackageVersion(sources.package);

requireSnippets(files.index, sources.index, [
  `assets/js/spnUiMode.js?v=${packageVersion}`
]);
forbidSnippets(files.index, sources.index, [
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
  "import './spnManagerTemplateNotice.js';",
  "'newbie'"
]);

requireSnippets(files.uiModeCss, sources.uiModeCss, [
  'body[data-spn-ui-mode="quick"] .start-card',
  'body[data-spn-ui-mode="newbie"] .start-card',
  'body[data-spn-ui-mode="newbie"] #templateDensityFilter',
  'body[data-spn-ui-mode="quick"] .help-card',
  'body[data-spn-ui-mode="newbie"] .help-card .help-grid a[href="help/quick-start.html"]',
  'body[data-spn-ui-mode="newbie"] .help-card .help-grid a[href="help/faq.html"]',
  'body[data-spn-ui-mode="newbie"] .help-card .help-tips',
  'body[data-spn-ui-mode="quick"] .save-card [data-save-transfer-section="layout-file"]',
  'body[data-spn-ui-mode="quick"] .save-card .save-transfer-intro',
  'body[data-spn-ui-mode="quick"] .save-card .save-transfer-privacy',
  'body[data-spn-ui-mode="quick"] .block-manager',
  'body[data-spn-ui-mode="newbie"] .block-manager',
  'body[data-spn-ui-mode="newbie"] .quick-actions'
]);
requireSnippets(files.browserSmoke, sources.browserSmoke, [
  'режим Быстро: одна точка выбора через рабочую ситуацию',
  'режим Новичок: повторная задача и лишняя плотность скрыты',
  'режим Расширенно: ручная задача и фильтры доступны',
  "win.getComputedStyle(startCard).display === 'none'",
  "win.getComputedStyle(densityFilter).display === 'none'",
  'режим Быстро: справочный блок скрыт',
  'режим Новичок: компактная помощь доступна',
  'режим Расширенно: полный центр помощи доступен',
  'режим Быстро: доступен компактный файл одного макета',
  'режим Новичок: отдельное сохранение скрыто',
  'режим Новичок: ручная компоновка и автоизменение текста скрыты',
  'режим Новичок: финальная проверка сохраняет выбранный формат А4',
  'режим Новичок: print guard сохраняет выбранный формат А4',
  'режим Новичок: Фото и QR согласованы между финальной проверкой и print guard',
  'режим Быстро: ручная компоновка скрыта, быстрые текстовые действия доступны',
  'режим Расширенно: ручная компоновка доступна',
  'режим Расширенно: полный блок сохранения доступен'
]);

requireSnippets(files.visibilityAudit, sources.visibilityAudit, [
  '# Матрица видимости режимов интерфейса',
  '| Помощь | скрыта | компактно: быстрый старт и FAQ | полностью |',
  '| Ручная компоновка и автоподстройка | скрыты | скрыты | видны |',
  '| Быстрые действия с текстом | видны | скрыты | видны |',
  '| Сохранение и перенос | компактно: файл одного макета | скрыты | полностью |',
  'Решение: готовый шаблон не требует ручной компоновки в простом пути',
  'Решение: компактное сохранение в режиме «Быстро»',
  'Следующий кандидат для отдельной проверки'
]);

requireSnippets(files.finalCheck, sources.finalCheck, [
  "import { getSpnMediaReadiness } from './spnMediaReadiness.js';",
  "{ id: 'media', title: 'Фото / QR'",
  'const media = getSpnMediaReadiness()',
  'media.missing.map(entry => entry.label)',
  "title: 'Формат на А4'",
  "const activeCount = document.querySelector('[data-count].active')?.dataset.count || ''",
  "['1','2','4','6','8'].includes(activeCount)",
  "title: activeCount ? `${activeCount} на А4` : 'Формат на А4'",
  "id === 'count'"
]);
forbidSnippets(files.finalCheck, sources.finalCheck, [
  'const countTwo',
  "target: '[data-count=\"2\"]'"
]);

requireSnippets(files.mediaReadiness, sources.mediaReadiness, [
  'export function getSpnMediaReadiness',
  "const firstFlyer = root.querySelector('#printSheet .flyer')",
  "firstFlyer.querySelectorAll('.photo-box img').length",
  "photoMode === 'two' ? 2 : 1",
  "target:needsSecond ? '#photoTwo' : '#photoOne'",
  "code:'qr-link'",
  "target:'#qrLink'",
  'firstTarget:missing[0]?.target'
]);

requireSnippets(files.clarityPanel, sources.clarityPanel, [
  "import { getSpnMediaReadiness } from './spnMediaReadiness.js';",
  'const media = getSpnMediaReadiness()',
  'media.missing.map(item => item.label)'
]);
forbidSnippets(files.clarityPanel, sources.clarityPanel, [
  "document.querySelectorAll('#printSheet .photo-box img').length"
]);

requireSnippets(files.wizardStatus, sources.wizardStatus, [
  "import { getSpnMediaReadiness } from './spnMediaReadiness.js';",
  'const media = getSpnMediaReadiness()',
  'media.missing.map(item => item.label)'
]);
forbidSnippets(files.wizardStatus, sources.wizardStatus, [
  'function hasSelectedPhoto()'
]);

requireSnippets(files.newbieMode, sources.newbieMode, [
  "const NEWBIE_QUERY = 'новичку';",
  'scheduleNewbieModeUpdate',
  'guardNewbieSearch',
  'hasUnsafeText',
  'spn-newbie-hidden-template'
]);

requireSnippets(files.officeFilters, sources.officeFilters, [
  'spn-office-template-card',
  'spn-office-template-card-note',
  'Выберите рабочий сценарий. Это быстрее и безопаснее, чем искать шаблон вручную.',
  "note: 'Начните отсюда'",
  "note: 'Минимум риска'",
  "note: '4 на А4'",
  "note: 'Не новичку'",
  "kind: 'manager'",
  "kind: 'local'"
]);

requireSnippets(files.templateBadges, sources.templateBadges, [
  "import { loadTemplates } from './templates.js';",
  'loadOfficeMetadata',
  'templateMap = new Map',
  'template?.office',
  'office?.managerNote',
  'office?.recommendedPrintCount',
  'office?.risk === \'medium\'',
  'tpl-card-office-reason',
  'Подходит новичку: короткий сценарий, меньше настроек и понятный повод для звонка.',
  'Покажите менеджеру: в макете есть риск, цена, фото, QR или нестандартная формулировка.',
  'Подъездный формат: лучше короткий текст, крупный телефон и 4 на А4.',
  'Новостройки: аккуратно с обещаниями, условиями покупки и ипотекой.'
]);

requireSnippets(files.managerNotice, sources.managerNotice, [
  "import { loadTemplates } from './templates.js';",
  'spnManagerTemplateNotice',
  'needsManagerAttention',
  "office.level === 'manager'",
  "office.risk === 'high'",
  'Перед печатью покажите макет менеджеру',
  'Высокий риск формулировок',
  'office.managerNote',
  'office.recommendedPrintCount'
]);

requireSnippets(files.managerReview, sources.managerReview, [
  "import { loadTemplates } from './templates.js';",
  'managerReviewOfficeSummary',
  'loadOfficeMetadata',
  'updateOfficeSummary',
  'getActiveTemplate',
  'office?.level === \'manager\'',
  'office?.risk === \'medium\'',
  'office.recommendedPrintCount',
  'office.managerNote',
  'Office-метаданные пока не заданы',
  'Этот шаблон требует проверки менеджера перед массовой печатью.'
]);

requireSnippets(files.photoLayout, sources.photoLayout, [
  'schedulePhotoLayoutUpdate',
  'updatePhotoLayoutClasses',
  'layout-showcase:not(.photo-mode-plan)',
  'layout-photo:not(.photo-mode-plan)',
  'width:calc(100% + var(--flyer-pad) + var(--flyer-pad))',
  'margin:calc(0mm - var(--flyer-pad))',
  'count-1.layout-showcase:not(.photo-mode-plan) .photo-box{height:112mm}',
  'count-1.layout-photo:not(.photo-mode-plan) .photo-box{height:96mm}',
  'count-2.layout-showcase:not(.photo-mode-plan) .photo-box{height:58mm}',
  'count-2.layout-photo:not(.photo-mode-plan) .photo-box{height:50mm}',
  'photo-mode-two.count-1.layout-showcase .photo-box{height:92mm}',
  '@media print'
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
  'spn-wizard-step-help',
  'spn-wizard-next-notice',
  'Что сделать сейчас',
  'updateStepHelp',
  'showNextRecommendation',
  'getStepRecommendations',
  'clearNextNotice',
  'Переход выполнен. Желательно вернуться и проверить',
  'Далее: ${stripStepNumber(nextStep.title)}',
  'выбрать конкретный шаблон',
  'запустить проверку качества и получить не меньше 70 баллов',
  'Для офиса чаще всего подходит 2 на А4',
  'Шаблоны с пометкой «Проверка» покажите менеджеру',
  'Сохраните отчёт в историю, чтобы аналитика показала рабочие и слабые связки.',
  '2 на А4 — основной офисный вариант',
  "title: '1. Задача и формат'",
  "title: '2. Шаблон'",
  "title: '5. Проверка и печать'",
  "title: '6. Сохранение'",
  'Пошаговая подготовка расклейки',
  'Показывать по шагам',
  'Показать все разделы',
  "{ count: 1, title: '1 крупно', note: 'фото / витрина' }",
  "{ count: 4, title: '4 экономно', note: 'подъезды' }",
  "{ count: 8, title: '8 мини', note: 'только телефон' }"
]);
forbidSnippets(files.wizardFlow, sources.wizardFlow, [
  'Мастер расклейки',
  "title: '1. Цель'",
  "title: '2. Заготовка'",
  "title: '5. Проверка'",
  "title: '6. Сохранить'",
  "toggle.textContent = enabled ? 'Пошагово' : 'Все блоки';"
]);

requireSnippets(files.wizardPatch, sources.wizardPatch, [
  'scheduleNewbieWizardSync',
  'bindWizardNavigationPatch',
  'handleNewbieWizardNavigation',
  'pendingNewbieAutoEnable',
  'tryEnableWizardForNewbie',
  'redirectHiddenSaveStep',
  "currentStep === 'check'",
  "goToWizardStep('task')",
  "currentStep === 'task'",
  "goToWizardStep('check')",
  'data-wizard-step="save"'
]);

forbidSnippets(files.wizardPatch, sources.wizardPatch, [
  "nextBtn.textContent = isNewbie && step === 'check' ? 'Готово' : 'Далее'",
  "nextBtn.disabled = Boolean(isNewbie && step === 'check')",
  'redirectToCheckStep',
  'redirectingFromSave'
]);

requireSnippets(files.printGuard, sources.printGuard, [
  "import { getSpnMediaReadiness } from './spnMediaReadiness.js';",
  'const media = getSpnMediaReadiness()',
  'if(!media.ready) return go(media.firstTarget)',
  'bindPrintGuard',
  "document.getElementById('printBtn')",
  'handlePrintButtonClick',
  'isReadyToPrint',
  'goToFirstMissing',
  'hasSupportedPrintCount',
  "['1','2','4','6','8'].includes(activeCount)",
  "return go('#printPresetRow')"
]);

const oldDocumentGuard = 'document.add' + "EventListener('click', handlePrintGuard, true)";
const oldPropagationStop = 'stop' + 'Propagation()';
forbidSnippets(files.printGuard, sources.printGuard, [
  oldDocumentGuard,
  oldPropagationStop,
  'const countTwo',
  "[data-count=\"2\"].active",
  "go('[data-count=\"2\"]', { click: true })"
]);

requireSnippets(files.checklist, sources.checklist, [
  '# Ручная регрессионная проверка режима «Новичок»',
  'Проверка переключения режимов',
  'Проверка фильтра шаблонов новичка',
  'Проверка компактного сохранения в режиме «Быстро»',
  'Скачать один макет',
  'Открыть файл макета',
  'Проверка компактной помощи',
  'Быстрый старт СПН',
  'Вопросы и ответы',
  'отдельный блок `Выберите задачу` скрыт',
  'фильтр плотности скрыт',
  'Проверка пошаговой подготовки',
  'Проверка защиты печати',
  'защита ведёт к безопасным полям, но не меняет `4 на А4` на другой формат',
  'печать блокируется только до выполнения обязательных условий и не подменяет выбранный формат А4',
  'Проверка фото-раскладки',
  'фото стало крупной верхней hero-зоной на всю ширину карточки',
  'Витрина',
  'Планировка',
  'Узкая полоса вместо крупного фото',
  'Что считать регрессией'
]);

requireSnippets(files.fullScenarioChecklist, sources.fullScenarioChecklist, [
  '# Ручная проверка полного сценария генератора расклеек',
  'Новичок → 2 на А4 → безопасный шаблон → телефон → проверка → печать → задание → отчёт',
  'Проверка 3. Пошаговая подготовка',
  'показ по шагам включается автоматически при входе в `Новичок`',
  'шаг `Сохранение` скрыт в режиме `Новичок`',
  '`Проверка → Задание` без зацикливания на скрытом шаге',
  'текст кнопки показывает следующий шаг, например `Далее: Шаблон`',
  'Переход выполнен. Желательно вернуться и проверить',
  'при пропущенных данных переход всё равно выполняется',
  'кнопка `Далее` блокирует переход из-за мягкой рекомендации',
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
  'в режимах `Новичок` и `Быстро` задача определяется рабочей ситуацией без повторного блока выбора',
  'ручной выбор задачи и полный набор фильтров остаются в `Расширенном` режиме',
  'ручная регрессионная проверка режима «Новичок»',
  'маршрут `Задача и формат → Шаблон → Текст → Фото / QR → Проверка и печать → Задание → Отчёт`'
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

function readPackageVersion(source) {
  try {
    const version = String(JSON.parse(source).version || '').trim();
    if(!/^\d+\.\d+\.\d+$/.test(version)) errors.push(`${files.package}: version must use X.Y.Z`);
    return version;
  } catch(error) {
    errors.push(`${files.package}: JSON cannot be parsed — ${error.message}`);
    return '';
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
