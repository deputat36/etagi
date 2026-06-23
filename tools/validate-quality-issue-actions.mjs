import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const appPath = path.join(rootDir, 'assets/js/app.js');
const qualityPath = path.join(rootDir, 'assets/js/quality.js');
const extraActionsPath = path.join(rootDir, 'assets/js/qualityExtraActions.js');
const errors = [];
const appSource = readRequired(appPath);
const qualitySource = readRequired(qualityPath);
const extraActionsSource = readRequired(extraActionsPath);

if (qualitySource) {
  const issueActionRules = [
    {
      title: 'Длинный дополнительный блок',
      expectedAction: 'null',
      forbiddenAction: "'showCustomBlock'",
      message: 'длинный дополнительный блок должен исправляться только кнопкой сокращения, без штатной кнопки включения блока'
    },
    {
      title: 'Дополнительный блок перегружает мини-макет',
      expectedAction: 'null',
      forbiddenAction: "'showCustomBlock'",
      message: 'перегруженный дополнительный блок должен исправляться только кнопкой сокращения, без штатной кнопки включения блока'
    },
    {
      title: 'Ссылка для QR слишком длинная',
      expectedAction: 'null',
      forbiddenAction: "'shortQr'",
      message: 'длинная QR-ссылка должна исправляться одной понятной кнопкой замены ссылки, без дублирующей штатной кнопки'
    }
  ];

  for (const rule of issueActionRules) {
    if (!hasIssueAction(rule.title, rule.expectedAction)) {
      errors.push(`assets/js/quality.js: ${rule.message}`);
    }
    if (hasIssueAction(rule.title, rule.forbiddenAction)) {
      errors.push(`assets/js/quality.js: у замечания «${rule.title}» найдено запрещённое действие ${rule.forbiddenAction}`);
    }
  }

  const requiredPrivateBrandSnippets = [
    {
      snippet: "const visibleBrandText = state.showBrand ? `${brandName} ${brandSideText}`.trim() : ''",
      message: 'assets/js/quality.js: проверка частного режима должна учитывать только реально включённую бренд-строку'
    },
    {
      snippet: '${state.description} ${state.benefits} ${state.customBlockTitle}',
      message: 'assets/js/quality.js: проверка фирменности должна смотреть преимущества между описанием и доп. блоком'
    },
    {
      snippet: '${state.customBlockTitle} ${state.customBlockText} ${visibleBrandText}',
      message: 'assets/js/quality.js: проверка фирменности должна смотреть доп. блок и видимую бренд-строку'
    }
  ];

  for (const item of requiredPrivateBrandSnippets) {
    if (!qualitySource.includes(item.snippet)) {
      errors.push(item.message);
    }
  }
}

if (appSource) {
  const requiredCleanBrandSnippets = [
    {
      snippet: 'state.headline = cleanBrandText(state.headline)',
      message: 'assets/js/app.js: очистка фирменности должна чистить заголовок'
    },
    {
      snippet: 'state.description = cleanBrandText(state.description)',
      message: 'assets/js/app.js: очистка фирменности должна чистить описание'
    },
    {
      snippet: 'state.benefits = cleanBrandText(state.benefits)',
      message: 'assets/js/app.js: очистка фирменности должна чистить преимущества'
    },
    {
      snippet: 'state.customBlockTitle = cleanBrandText(state.customBlockTitle)',
      message: 'assets/js/app.js: очистка фирменности должна чистить заголовок дополнительного блока'
    },
    {
      snippet: 'state.customBlockText = cleanBrandText(state.customBlockText)',
      message: 'assets/js/app.js: очистка фирменности должна чистить текст дополнительного блока'
    },
    {
      snippet: 'function cleanBrandText(text)',
      message: 'assets/js/app.js: не найден общий helper очистки фирменности'
    },
    {
      snippet: '.replace(/(^|[\\s,.;:!—-]+)(этажи|etagi)(?=$|[\\s,.;:!—-]+)/ig, \' \')',
      message: 'assets/js/app.js: очистка фирменности должна удалять Этажи и etagi вместе с лишними разделителями'
    },
    {
      snippet: ".replace(/\\s+([,.;:!?])/g, '$1')",
      message: 'assets/js/app.js: очистка фирменности должна убирать пробелы перед знаками препинания'
    },
    {
      snippet: '.replace(/^[\\s,.;:!—-]+|[\\s,.;:!—-]+$/g, \'\')',
      message: 'assets/js/app.js: очистка фирменности должна убирать разделители по краям текста'
    },
    {
      snippet: ".replace(/\\s{2,}/g, ' ')",
      message: 'assets/js/app.js: очистка фирменности должна схлопывать двойные пробелы'
    }
  ];

  for (const item of requiredCleanBrandSnippets) {
    if (!appSource.includes(item.snippet)) {
      errors.push(item.message);
    }
  }
}

if (extraActionsSource) {
  const requiredQrActionSnippets = [
    {
      snippet: "{ title: 'Ссылка для QR слишком длинная', action: 'shortQrLink', label: 'Заменить ссылку' }",
      message: 'assets/js/qualityExtraActions.js: для длинной QR-ссылки нужна отдельная понятная кнопка замены ссылки'
    },
    {
      snippet: "if (action === 'shortQrLink') focusQrField();",
      message: 'assets/js/qualityExtraActions.js: дополнительная QR-кнопка должна вести в поле ссылки'
    },
    {
      snippet: 'function focusQrField() {',
      message: 'assets/js/qualityExtraActions.js: не найден helper фокуса QR-ссылки'
    },
    {
      snippet: "document.getElementById('qrLink')",
      message: 'assets/js/qualityExtraActions.js: helper QR должен работать с полем qrLink'
    },
    {
      snippet: 'input.select?.();',
      message: 'assets/js/qualityExtraActions.js: QR-ссылка должна выделяться для быстрой замены'
    },
    {
      snippet: 'Вставьте короткую ссылку для QR',
      message: 'assets/js/qualityExtraActions.js: статус должен объяснять, что нужна короткая ссылка'
    }
  ];

  for (const item of requiredQrActionSnippets) {
    if (!extraActionsSource.includes(item.snippet)) {
      errors.push(item.message);
    }
  }

  const obsoleteQrHandler = "button.dataset.fix === 'shortQr'";
  if (extraActionsSource.includes(obsoleteQrHandler)) {
    errors.push('assets/js/qualityExtraActions.js: найден неиспользуемый обработчик удалённой штатной QR-кнопки');
  }
}

if (errors.length) {
  console.error('\nОшибки действий замечаний качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка действий замечаний качества пройдена.');

function hasIssueAction(title, actionValue) {
  const pattern = new RegExp(`issues\\.push\\(\\{[^}]*title\\s*:\\s*['\"]${escapeRegExp(title)}['\"][^}]*action\\s*:\\s*${escapeRegExp(actionValue)}[^}]*\\}\\)`);
  return pattern.test(qualitySource);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${toProjectPath(filePath)} не найден`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
