import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const appPath = path.join(rootDir, 'assets/js/app.js');
const qualityPath = path.join(rootDir, 'assets/js/quality.js');
const errors = [];
const appSource = readRequired(appPath);
const qualitySource = readRequired(qualityPath);

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
      snippet: "replace(/этажи|etagi/ig,'')",
      message: 'assets/js/app.js: очистка фирменности должна удалять Этажи и etagi'
    }
  ];

  for (const item of requiredCleanBrandSnippets) {
    if (!appSource.includes(item.snippet)) {
      errors.push(item.message);
    }
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
