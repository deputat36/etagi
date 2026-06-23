import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const qualityPath = path.join(rootDir, 'assets/js/quality.js');
const errors = [];
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
