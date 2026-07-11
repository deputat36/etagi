import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  backup: 'assets/js/spnWorkspaceBackup.js',
  entry: 'assets/js/spnUiMode.js',
  index: 'index.html',
  smoke: 'tools/browser-smoke.html',
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
  'Фото не входят в backup'
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

forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnWorkspaceBackup.js"',
  "src='assets/js/spnWorkspaceBackup.js'"
]);

requireSnippets(files.smoke, sources.smoke, [
  "doc.getElementById('spnWorkspaceBackup')",
  'backup рабочего пространства доступен'
]);

requireSnippets(files.guide, sources.guide, [
  '# Backup рабочего пространства',
  'etagi-raskleyka-',
  'Объединить с текущими данными',
  'Заменить рабочее пространство',
  'проверяет',
  'предыдущие данные',
  'Фото не входят в backup',
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
