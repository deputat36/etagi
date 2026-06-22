import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const storagePath = path.join(rootDir, 'assets/js/storage.js');
const appPath = path.join(rootDir, 'assets/js/app.js');
const errors = [];

const storageSource = readRequired(storagePath);
const appSource = readRequired(appPath);

if (storageSource) {
  checkStorageFallback('loadAutoSave', 'return null;');
  checkStorageFallback('loadNamed', 'return null;');
  checkStorageFallback('saveNamed', 'return false;');
  checkStorageFallback('saveProfile', 'return false;');
  checkStorageFallback('loadProfile', 'return null;');
  checkStorageFallback('listSavedLayouts', 'return [];');
  checkStorageFallback('saveLayout', 'return null;');
  checkStorageFallback('deleteLayout', 'return null;');
  checkStorageFallback('listFavoriteTemplates', 'return [];');
  checkStorageFallback('toggleFavoriteTemplate', 'return null;');
}

if (appSource) {
  checkAppMessage('Не удалось сохранить последний макет. Возможно, в браузере закончилось место.');
  checkAppMessage('Не удалось сохранить макет. Возможно, в браузере закончилось место.');
  checkAppMessage('Не удалось удалить макет. Возможно, браузер запретил изменение сохранений.');
  checkAppMessage('Не удалось изменить избранное. Возможно, в браузере закончилось место.');
  checkAppMessage('Не удалось сохранить профиль СПН. Возможно, в браузере закончилось место.');

  checkAppSnippet('const saved = saveNamed(state);', 'app.js: кнопка последнего макета должна проверять результат saveNamed');
  checkAppSnippet('if(!item){ setStatus(\'Не удалось сохранить макет.', 'app.js: сохранение именованного макета должно проверять результат saveLayout');
  checkAppSnippet('const next = deleteLayout(id);', 'app.js: удаление макета должно проверять результат deleteLayout');
  checkAppSnippet('if(!favorites){ setStatus(\'Не удалось изменить избранное.', 'app.js: избранное должно проверять результат toggleFavoriteTemplate');
  checkAppSnippet('const saved = saveProfile(profile);', 'app.js: профиль СПН должен проверять результат saveProfile');
}

if (errors.length) {
  console.error('\nОшибки защиты браузерных сохранений:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка защиты браузерных сохранений пройдена.');

function checkStorageFallback(functionName, fallbackReturn) {
  const source = getFunctionSource(storageSource, functionName);
  if (!source) {
    errors.push(`assets/js/storage.js: функция ${functionName} не найдена`);
    return;
  }
  if (!source.includes('try')) {
    errors.push(`assets/js/storage.js: ${functionName} должен использовать try/catch`);
  }
  if (!source.includes('catch')) {
    errors.push(`assets/js/storage.js: ${functionName} должен перехватывать ошибки localStorage`);
  }
  if (!source.includes(fallbackReturn)) {
    errors.push(`assets/js/storage.js: ${functionName} должен безопасно возвращать ${fallbackReturn}`);
  }
}

function checkAppMessage(message) {
  if (!appSource.includes(message)) {
    errors.push(`assets/js/app.js: нет пользовательского сообщения — ${message}`);
  }
}

function checkAppSnippet(snippet, message) {
  if (!appSource.includes(snippet)) errors.push(message);
}

function getFunctionSource(source, functionName) {
  const startPattern = new RegExp(`(?:export\\s+)?function\\s+${functionName}\\s*\\(`);
  const startMatch = startPattern.exec(source);
  if (!startMatch) return '';

  const openBrace = source.indexOf('{', startMatch.index);
  if (openBrace < 0) return '';

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return source.slice(startMatch.index, index + 1);
  }

  return '';
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
