import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const outputPath = path.join(rootDir, 'docs/template-portfolio-inventory.generated.md');
const files = fs.readdirSync(dataDir)
  .filter(file => /^templates.*\.json$/.test(file))
  .sort();

const templates = [];
const errors = [];

for(const file of files){
  const fullPath = path.join(dataDir, file);
  try{
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if(!Array.isArray(parsed)){
      errors.push(`${file}: корень файла должен быть массивом`);
      continue;
    }
    parsed.forEach((template, index) => templates.push({...template, __file:file, __index:index}));
  } catch(error){
    errors.push(`${file}: ${error.message}`);
  }
}

if(errors.length){
  console.error('Ошибки чтения шаблонов:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const byFile = countBy(templates, template => template.__file);
const byGoal = countBy(templates, template => template.goal || 'unknown');
const byLevel = countBy(templates.filter(template => template.office), template => template.office?.level || 'unknown');
const byRisk = countBy(templates.filter(template => template.office), template => template.office?.risk || 'unknown');
const officeCount = templates.filter(template => template.office).length;
const recommendedCount = templates.filter(template => template.office?.recommended === true).length;
const duplicateIds = duplicateGroups(templates, template => String(template.id || '').trim()).filter(group => group.key);
const duplicateScenarios = duplicateGroups(templates.filter(template => template.office?.scenario), template => template.office.scenario);
const duplicateHeadlines = duplicateGroups(templates, template => normalizeText(template.data?.headline)).filter(group => group.key.length >= 8);
const nearDuplicates = findNearDuplicates(templates);
const missingOffice = templates.filter(template => !template.office);
const missingScenario = templates.filter(template => template.office && !template.office.scenario);

const markdown = [
  '# Автоматическая инвентаризация библиотеки шаблонов',
  '',
  `Сформировано: ${new Date().toISOString()}`,
  '',
  '## Общий итог',
  '',
  `- файлов шаблонов: ${files.length};`,
  `- шаблонов: ${templates.length};`,
  `- с office-метаданными: ${officeCount} (${percent(officeCount, templates.length)}%);`,
  `- office-рекомендованных: ${recommendedCount};`,
  `- без office-метаданных: ${missingOffice.length};`,
  `- повторяющихся id: ${duplicateIds.length};`,
  `- повторяющихся office-сценариев: ${duplicateScenarios.length};`,
  `- одинаковых нормализованных заголовков: ${duplicateHeadlines.length};`,
  `- вероятных смысловых дублей: ${nearDuplicates.length}.`,
  '',
  renderCountTable('## По пакетам', 'Пакет', byFile),
  '',
  renderCountTable('## По целям', 'Цель', byGoal),
  '',
  renderCountTable('## Office-уровни', 'Уровень', byLevel),
  '',
  renderCountTable('## Office-риски', 'Риск', byRisk),
  '',
  '## Пакеты без полного office-покрытия',
  '',
  renderOfficeCoverageTable(files, templates),
  '',
  '## Вероятные смысловые дубли',
  '',
  renderNearDuplicates(nearDuplicates),
  '',
  '## Одинаковые заголовки',
  '',
  renderDuplicateGroups(duplicateHeadlines),
  '',
  '## Повторяющиеся office-сценарии',
  '',
  renderDuplicateGroups(duplicateScenarios),
  '',
  '## Шаблоны без office-метаданных',
  '',
  renderTemplateList(missingOffice),
  '',
  '## Office-метаданные без scenario',
  '',
  renderTemplateList(missingScenario),
  '',
  '## Как использовать отчёт',
  '',
  '1. Не удалять шаблон только из-за сходства: сначала проверить реальную рабочую задачу.',
  '2. Для вероятного дубля определить основной рабочий вариант, тестовый вариант или устаревший вариант.',
  '3. Office-метаданные добавлять сначала в пакеты с реальным офисным использованием.',
  '4. Повторяющиеся заголовки допустимы только при разных целях, аудиториях или форматах.',
  '5. После осознанных изменений повторно запустить `npm run templates:inventory`.',
  ''
].join('\n');

fs.writeFileSync(outputPath, markdown, 'utf8');
console.log(`Инвентаризация создана: ${path.relative(rootDir, outputPath).replaceAll('\\', '/')}`);
console.log(`Шаблонов: ${templates.length}; office: ${officeCount}; вероятных дублей: ${nearDuplicates.length}.`);

function findNearDuplicates(items){
  const result = [];
  for(let leftIndex = 0; leftIndex < items.length; leftIndex += 1){
    const left = items[leftIndex];
    for(let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1){
      const right = items[rightIndex];
      if(left.id === right.id) continue;
      const leftText = templateMeaningText(left);
      const rightText = templateMeaningText(right);
      if(!leftText || !rightText) continue;
      const similarity = jaccard(tokenize(leftText), tokenize(rightText));
      const sameGoal = left.goal === right.goal;
      if(similarity >= (sameGoal ? 0.72 : 0.82)){
        result.push({left, right, similarity});
      }
    }
  }
  return result.sort((a, b) => b.similarity - a.similarity);
}

function templateMeaningText(template){
  return normalizeText([
    template.title,
    template.note,
    template.data?.headline,
    template.data?.description,
    template.data?.benefits,
    template.data?.customBlockTitle,
    template.data?.customBlockText
  ].filter(Boolean).join(' '));
}

function tokenize(text){
  return new Set(normalizeText(text)
    .replace(/[^a-zа-яё0-9 ]+/gi, ' ')
    .split(' ')
    .filter(token => token.length >= 4));
}

function jaccard(left, right){
  if(!left.size || !right.size) return 0;
  let intersection = 0;
  for(const token of left) if(right.has(token)) intersection += 1;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function duplicateGroups(items, keyFn){
  const groups = new Map();
  for(const item of items){
    const key = keyFn(item);
    const list = groups.get(key) || [];
    list.push(item);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([key, list]) => ({key, list}))
    .sort((a, b) => b.list.length - a.list.length || a.key.localeCompare(b.key, 'ru'));
}

function countBy(items, keyFn){
  const counts = new Map();
  for(const item of items){
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ru'));
}

function renderCountTable(title, firstColumn, rows){
  return [
    title,
    '',
    `| ${firstColumn} | Количество |`,
    '|---|---:|',
    ...rows.map(([key, count]) => `| ${escapeCell(key)} | ${count} |`)
  ].join('\n');
}

function renderOfficeCoverageTable(templateFiles, items){
  const rows = templateFiles.map(file => {
    const packageItems = items.filter(item => item.__file === file);
    const withOffice = packageItems.filter(item => item.office).length;
    return `| ${escapeCell(file)} | ${packageItems.length} | ${withOffice} | ${percent(withOffice, packageItems.length)}% |`;
  });
  return [
    '| Пакет | Всего | С office | Покрытие |',
    '|---|---:|---:|---:|',
    ...rows
  ].join('\n');
}

function renderNearDuplicates(groups){
  if(!groups.length) return 'Вероятные смысловые дубли не найдены.';
  return [
    '| Сходство | Первый шаблон | Второй шаблон |',
    '|---:|---|---|',
    ...groups.map(group => `| ${(group.similarity * 100).toFixed(0)}% | ${templateRef(group.left)} | ${templateRef(group.right)} |`)
  ].join('\n');
}

function renderDuplicateGroups(groups){
  if(!groups.length) return 'Повторы не найдены.';
  return groups.map(group => [
    `### ${escapeCell(group.key || 'пустое значение')}`,
    '',
    ...group.list.map(item => `- ${templateRef(item)};`)
  ].join('\n')).join('\n\n');
}

function renderTemplateList(items){
  if(!items.length) return 'Нет.';
  return items
    .sort((a, b) => String(a.__file).localeCompare(String(b.__file), 'ru') || String(a.id).localeCompare(String(b.id), 'ru'))
    .map(item => `- ${templateRef(item)};`)
    .join('\n');
}

function templateRef(template){
  return `${escapeCell(template.id || 'без id')} — ${escapeCell(template.title || 'без названия')} (${escapeCell(template.__file)})`;
}

function normalizeText(value){
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

function percent(value, total){
  return total ? Math.round((value / total) * 100) : 0;
}

function escapeCell(value){
  return String(value ?? '').replaceAll('|', '\\|').replace(/\r?\n/g, ' ');
}
