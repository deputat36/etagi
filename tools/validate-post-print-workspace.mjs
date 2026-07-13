import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  helper: 'assets/js/spnPostPrintWorkspace.js',
  entry: 'assets/js/spnUiMode.js',
  index: 'index.html',
  smoke: 'tools/browser-smoke.html',
  guide: 'docs/post-print-workspace.md'
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.helper, sources.helper, [
  "const GROUP_ID = 'spnPostPrintWorkspace'",
  "const GROUP_STATE_KEY = 'etagi-raskleyka-post-print-workspace-open-v1'",
  "const SECTION_IDS = ['spnDistributionTask', 'spnDistributionReport']",
  'new MutationObserver(() => organizeSections(sidebar, observer))',
  "observer.observe(sidebar, {childList:true, subtree:true})",
  'window.setTimeout(() => observer.disconnect(), 5000)',
  "details.className = 'card spn-post-print-workspace'",
  'После печати',
  'Задание · выполнение · отчёт · аналитика',
  "sections[0].insertAdjacentElement('beforebegin', details)",
  'sections.forEach(section => body.append(section))',
  "details.addEventListener('toggle'",
  "attributeFilter:['data-wizard-step', 'data-spn-ui-mode']",
  "const newbieMode = document.body.dataset.spnUiMode === 'newbie'",
  "const wizardStep = document.body.dataset.wizardStep || ''",
  "return newbieMode && ['task', 'report'].includes(wizardStep)",
  "details.dataset.wizardForced = forced ? 'true' : 'false'",
  'details.open = forced || readOpenState()',
  'задание готово',
  'отчёт заполнен',
  'localStorage.setItem(GROUP_STATE_KEY',
  'body[data-spn-ui-mode="newbie"]:not([data-wizard-step="task"]):not([data-wizard-step="report"])',
  '@media print'
]);

forbidSnippets(files.helper, sources.helper, [
  'cloneNode(',
  'outerHTML',
  'setInterval(',
  "document.addEventListener('click'",
  "window.addEventListener('click'",
  'window.print(',
  'localStorage.clear('
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnPostPrintWorkspace.js';"
]);

forbidSnippets(files.index, sources.index, [
  'src="assets/js/spnPostPrintWorkspace.js"',
  "src='assets/js/spnPostPrintWorkspace.js'"
]);

requireSnippets(files.smoke, sources.smoke, [
  "'#spnPostPrintWorkspace'",
  'После печати: исходно закрыт',
  'После печати: автоматически открыт для задания',
  'После печати: открыт для отчёта',
  'После печати: live-статус задания и отчёта готов',
  'После печати: восстановлено закрытое состояние',
  'После печати: ручное раскрытие сохраняет рабочие разделы',
  "postPrintWorkspace.dataset.wizardForced === 'true'",
  "postPrintWorkspace.dataset.wizardForced === 'false'",
  'postPrintWorkspace.contains(doc.getElementById',
  'spnPostPrintWorkspaceStatus'
]);

requireSnippets(files.guide, sources.guide, [
  '# Компактный блок после печати',
  '`Задание на расклейку`',
  '`Отчёт после расклейки`',
  'режим исполнителя',
  'не создаёт копии',
  'etagi-raskleyka-post-print-workspace-open-v1',
  'На шагах `Задание` и `Отчёт` блок раскрывается автоматически',
  'npm run validate:post-print-workspace'
]);

if(errors.length){
  console.error('\nОшибки компактного блока после печати:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка компактного блока после печати пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
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
