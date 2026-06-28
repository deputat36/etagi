import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const appSource = readRequired('assets/js/app.js');
const qualitySource = readRequired('assets/js/quality.js');
const extraActionsSource = readRequired('assets/js/qualityExtraActions.js');
const errors = [];

checkIssueAction('Нет канала отклика', 'null', "'showContact'", 'замечание без канала отклика должно исправляться прямой кнопкой, а не старым штатным включением контактов');
checkIssueAction('Длинный дополнительный блок', 'null', "'showCustomBlock'", 'длинный дополнительный блок должен исправляться только кнопкой сокращения');
checkIssueAction('Дополнительный блок перегружает мини-макет', 'null', "'showCustomBlock'", 'перегруженный дополнительный блок должен исправляться только кнопкой сокращения');
checkIssueAction('Ссылка для QR слишком длинная', 'null', "'shortQr'", 'длинная QR-ссылка должна вести к замене ссылки без дублирующей штатной кнопки');
checkIssueAction('Фото включено, но не загружено', 'null', "'noPhoto'", 'пустое первое фото должно вести к загрузке файла, а не выключать фото');
checkIssueAction('Второе фото не загружено', 'null', "'onePhoto'", 'пустое второе фото должно вести к загрузке файла, а не менять режим фото');

check(qualitySource, 'assets/js/quality.js', [
  "const visibleBrandText = state.showBrand ? `${brandName} ${brandSideText}`.trim() : ''",
  '${state.description} ${state.benefits} ${state.customBlockTitle}',
  '${state.customBlockTitle} ${state.customBlockText} ${visibleBrandText}'
]);

check(appSource, 'assets/js/app.js', [
  'state.headline = cleanBrandText(state.headline)',
  'state.description = cleanBrandText(state.description)',
  'state.benefits = cleanBrandText(state.benefits)',
  'state.customBlockTitle = cleanBrandText(state.customBlockTitle)',
  'state.customBlockText = cleanBrandText(state.customBlockText)',
  'function cleanBrandText(text)',
  ".replace(/\\s+([,.;:!?])/g, '$1')",
  ".replace(/\\s{2,}/g, ' ')"
]);

check(extraActionsSource, 'assets/js/qualityExtraActions.js', [
  "if (button.dataset.fix === 'shortHeadline') {",
  "if (button.dataset.fix === 'shortDesc') {",
  'event.preventDefault()',
  'event.stopPropagation()',
  'trimHeadlineForPrint()',
  'trimDescriptionForPrint()',
  'function trimHeadlineForPrint() {',
  'setInputValue(input, shorten(input.value, getHeadlineLimit()))',
  'function trimDescriptionForPrint() {',
  'setInputValue(input, shorten(input.value, getDescriptionLimit()))',
  'setInputValue(input, shorten(getHeadlineSuggestion(), getHeadlineLimit()))',
  'function getHeadlineLimit() {',
  "document.querySelector('[data-count].active')?.dataset.count",
  'return count >= 6 ? 38 : 48',
  'const limit = getDescriptionLimit()',
  'const prefixLimit = Math.max(0, limit - sentence.length - 1)',
  'setInputValue(input, shorten(next, limit))',
  'function getDescriptionLimit() {',
  'if (count >= 6) return 150',
  'if (count >= 4) return 260',
  'return Number.POSITIVE_INFINITY',
  "setInputValue(input, nextLines.slice(0, 3).join('\\n'))",
  "{ title: 'Нет канала отклика', action: 'responseChannel', label: 'Настроить отклик' }",
  "if (action === 'responseChannel') setResponseChannel();",
  'function setResponseChannel()',
  'getPhoneInfo(getPhoneValue())',
  "enableCheckbox('showContact');",
  'Контакты включены',
  "{ title: 'Ссылка для QR слишком длинная', action: 'shortQrLink', label: 'Заменить ссылку' }",
  "if (action === 'shortQrLink') focusQrField();",
  'function focusQrField(statusText =',
  "document.getElementById('qrLink')",
  'input.select?.();',
  'Вставьте короткую ссылку для QR',
  "{ title: 'Фото включено, но не загружено', action: 'focusPhotoOne', label: 'Перейти к фото' }",
  "{ title: 'Второе фото не загружено', action: 'focusPhotoTwo', label: 'Перейти ко второму фото' }",
  "if (action === 'focusPhotoOne') focusPhotoField('photoOne'",
  "if (action === 'focusPhotoTwo') focusPhotoField('photoTwo'",
  'function focusPhotoField(inputId, statusText)',
  'Фото оставлено включённым'
]);

forbid(extraActionsSource, 'assets/js/qualityExtraActions.js', [
  "window.setTimeout(trimHeadlineForPrint, 180)",
  "window.setTimeout(trimDescriptionForPrint, 180)",
  'shorten(getHeadlineSuggestion(), 54)',
  'const next = current && !includesText(current, sentence) ? `${current} ${sentence}` : current || sentence',
  "nextLines.slice(0, 4).join('\\n')",
  "button.dataset.fix === 'shortQr'",
  "button.dataset.fix === 'showContact'",
  'function hasPhoneValue()',
  'function hasLikelyPhoneValue()'
]);

forbid(qualitySource, 'assets/js/quality.js', [
  "title:'Нет канала отклика', text:'В макете нет контактов, отрывных телефонов и QR. Для расклейки это почти всегда ошибка.', action:'showContact'",
  "action:'noPhoto'",
  "action:'onePhoto'"
]);

forbid(appSource, 'assets/js/app.js', [
  "noPhoto:'Убрать фото'",
  "onePhoto:'Оставить 1 фото'",
  "shortQr:'Проверить QR'",
  "showContact:'Вернуть контакты'",
  "if(action === 'noPhoto')",
  "if(action === 'onePhoto')",
  "if(action === 'shortQr')",
  "if(action === 'showContact') state.showContact = true;"
]);

if (errors.length) {
  console.error('\nОшибки действий замечаний качества:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка действий замечаний качества пройдена.');

function checkIssueAction(title, expectedAction, forbiddenAction, message) {
  if (!hasIssueAction(title, expectedAction)) {
    errors.push(`assets/js/quality.js: ${message}`);
  }
  if (hasIssueAction(title, forbiddenAction)) {
    errors.push(`assets/js/quality.js: у замечания «${title}» найдено запрещённое действие ${forbiddenAction}`);
  }
}

function hasIssueAction(title, actionValue) {
  const pattern = new RegExp(`issues\\.push\\(\\{[^}]*title\\s*:\\s*['\"]${escapeRegExp(title)}['\"][^}]*action\\s*:\\s*${escapeRegExp(actionValue)}[^}]*\\}\\)`);
  return pattern.test(qualitySource);
}

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function forbid(source, file, snippets) {
  for (const snippet of snippets) {
    if (source.includes(snippet)) errors.push(`${file}: найдено устаревшее поведение ${snippet}`);
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readRequired(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) {
    errors.push(`${toProjectPath(filePath)} не найден`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
