import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  backup: 'assets/js/spnWorkspaceBackup.js',
  entry: 'assets/js/spnUiMode.js',
  index: 'index.html',
  smoke: 'tools/browser-smoke.html',
  uiActions: 'tools/ui-actions-smoke.html',
  saveGuide: 'docs/save-and-transfer.md',
  guide: 'docs/workspace-backup.md',
  checklist: 'docs/workspace-backup-regression-checklist.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.backup, sources.backup, [
  "const STORAGE_PREFIX = 'etagi-raskleyka-'",
  "const BACKUP_SCHEMA = 'etagi-raskleyka-workspace-backup'",
  'const BACKUP_VERSION = 1',
  'const MAX_BACKUP_BYTES = 3 * 1024 * 1024',
  'exportWorkspaceBackup',
  'importWorkspaceBackup',
  'collectWorkspaceEntries',
  'writeWorkspaceEntries',
  'removeWorkspaceEntries',
  'rollbackWorkspace(previousEntries)',
  'const previousEntries = collectWorkspaceEntries()',
  '<option value="merge">Объединить с текущими данными</option>',
  '<option value="replace">Заменить рабочее пространство</option>',
  "document.getElementById('workspaceBackupImportMode')?.value === 'replace' ? 'replace' : 'merge'",
  "mode === 'replace'",
  'window.confirm',
  'validateBackup(parsed)',
  "key.startsWith(STORAGE_PREFIX)",
  "typeof item !== 'string'",
  'file.size > MAX_BACKUP_BYTES',
  'window.location.reload()',
  'Фото не входят в полную копию',
  'Полная копия рабочего пространства',
  'Скачать полную копию',
  'Восстановить из полной копии',
  'data-save-transfer-section="workspace"'
]);

forbidSnippets(files.backup, sources.backup, [
  'localStorage.clear(',
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'photoOne',
  'photoTwo'
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnWorkspaceBackup.js';"
]);

requireSnippets(files.index, sources.index, [
  'Сохранение и перенос',
  'data-save-transfer-section="current"',
  'Автосохранение работает в этом браузере',
  'Сохранить ручной резерв',
  'data-save-transfer-section="named"',
  'Сохранить в «Мои макеты»',
  'data-save-transfer-section="layout-file"',
  'Скачать один макет',
  'Открыть файл макета'
]);
forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnWorkspaceBackup.js"',
  "src='assets/js/spnWorkspaceBackup.js'",
  '>Сохранить последний<',
  '>Загрузить последний<',
  '>Скачать файл<',
  '>Открыть файл<'
]);

requireSnippets(files.smoke, sources.smoke, [
  "doc.getElementById('spnWorkspaceBackup')",
  'backup рабочего пространства доступен'
]);
requireSnippets(files.uiActions, sources.uiActions, [
  'сохранение и перенос: четыре назначения объяснены отдельно',
  'Автосохранение работает в этом браузере',
  'Сохранить ручной резерв',
  'Скачать один макет',
  'Скачать полную копию',
  'ручной резерв: сохранение и загрузка'
]);
requireSnippets(files.saveGuide, sources.saveGuide, [
  '# Сохранение и перенос',
  'Автосохранение',
  'Ручной резерв',
  'Мои макеты',
  'Файл одного макета',
  'Полная копия рабочего пространства',
  'Что выбрать'
]);

requireSnippets(files.guide, sources.guide, [
  '# Полная копия рабочего пространства',
  'etagi-raskleyka-',
  'Объединить с текущими данными',
  'Заменить рабочее пространство',
  'проверяет',
  'предыдущие данные',
  'Фото не входят в полную копию',
  'нельзя публиковать'
]);

requireSnippets(files.checklist, sources.checklist, [
  '# Чек-лист проверки backup рабочего пространства',
  'Импорт с объединением',
  'Импорт с заменой',
  'Неверные файлы',
  'Откат при ошибке',
  'Предыдущие данные возвращены без изменений',
  'Приватность'
]);

if(errors.length){
  console.error('\nОшибки backup рабочего пространства:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка backup рабочего пространства пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
  }
}

function forbidSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(source.includes(snippet)) errors.push(`${file}: найден запрещённый фрагмент — ${snippet}`);
  }
}

function readRequired(file){
  const fullPath = path.join(rootDir, file);
  if(!fs.existsSync(fullPath)){
    errors.push(`${file}: файл не найден`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
