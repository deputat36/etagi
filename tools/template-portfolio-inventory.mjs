import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const outputPath = path.join(rootDir, 'docs/template-portfolio-inventory.generated.md');
const registryPath = path.join(dataDir, 'template_portfolio_status.json');
const officeOverridesPath = path.join(dataDir, 'template_office_overrides.json');
const files = fs.readdirSync(dataDir)
  .filter(file => /^templates.*\.json$/.test(file))
  .sort();

const templates = [];
const errors = [];
const registry = readPortfolioRegistry();
const officeOverrides = readOfficeOverrides();

for(const file of files){
  const fullPath = path.join(dataDir, file);
  try{
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if(!Array.isArray(parsed)){
      errors.push(`${file}: корень файла должен быть массивом`);
      continue;
    }
    parsed.forEach((template, index) => templates.push(enrichMetadata({...template, __file:file, __index:index})));
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
const byPortfolioStatus = countBy(templates, template => template.portfolio?.status || 'working');
const officeCount = templates.filter(template => template.office).length;
const officeOverrideCount = templates.filter(template => template.__officeOverride === true).length;
const recommendedCount = templates.filter(template => template.office?.recommended === true).length;
const duplicateIds = duplicateGroups(templates, template => String(template.id || '').trim()).filter(group => group.key);
const duplicateScenarios = duplicateGroups(templates.filter(template => template.office?.scenario), template => template.office.scenario);
const duplicateHeadlines = duplicateGroups(templates, template => normalizeText(template.data?.headline)).filter(group => group.key.length >= 8);
const nearDuplicates = findNearDuplicates(templates);
const missingOffice = templates.filter(template => !template.office);
const missingScenario = templates.filter(template => template.office && !template.office.scenario);
const deprecatedTemplates = templates.filter(template => template.portfolio?.status === 'deprecated');
const testTemplates = templates.filter(template => template.portfolio?.status === 'test');

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
  `- получили office через overrides: ${officeOverrideCount};`,
  `- office-рекомендованных: ${recommendedCount};`,
  `- без office-метаданных: ${missingOffice.length};`,
  `- рабочих: ${statusCount('working')};`,
  `- тестовых: ${statusCount('test')};`,
  `- устаревших: ${statusCount('deprecated')};`,
  `- повторяющихся id: ${duplicateIds.length};`,
  `- повторяющихся office-сценариев: ${duplicateScenarios.length};`,
  `- одинаковых нормализованных заголовков: ${duplicateHeadlines.length};`,
  `- вероятных смысловых дублей: ${nearDuplicates.length}.`,
  '',
  renderCountTable('## По пакетам', 'Пакет', byFile),
  '',
  renderCountTable('## По целям', 'Цель', byGoal),
  '',
  renderCountTable('## Жизненный цикл', 'Статус', byPortfolioStatus),
  '',
  renderCountTable('## Office-уровни', 'Уровень', byLevel),
  '',
  renderCountTable('## Office-риски', 'Риск', byRisk),
  '',
  '## Пакеты без полного office-покрытия',
  '',
  renderOfficeCoverageTable(files, templates),
  '',
  '## Устаревшие шаблоны и замены',
  '',
  renderLifecycleList(deprecatedTemplates, true),
  '',
  '## Тестовые шаблоны',
  '',
  renderLifecycleList(testTemplates, false),
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
  '3. Устаревший шаблон должен ссылаться на конечную рабочую замену.',
  '4. Office-метаданные учитывать вместе с `data/template_office_overrides.json`.',
  '5. Повторяющиеся заголовки допустимы только при разных целях, аудиториях или форматах.',
  '6. После осознанных изменений повторно запустить `npm run templates:inventory`.',
  ''
].join('\n');

fs.writeFileSync(outputPath, markdown, 'utf8');
console.log(`Инвентаризация создана: ${path.relative(rootDir, outputPath).replaceAll('\\', '/')}`);
console.log(`Шаблонов: ${templates.length}; office: ${officeCount}; overrides: ${officeOverrideCount}; working: ${statusCount('working')}; test: ${statusCount('test')}; deprecated: ${statusCount('deprecated')}.`);
console.log(`Вероятных смысловых дублей: ${nearDuplicates.length}.`);

function readPortfolioRegistry(){
  try{
    const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    return {
      defaultStatus: parsed.defaultStatus || 'working',
      packageDefaults: parsed.packageDefaults && typeof parsed.packageDefaults === 'object' ? parsed.packageDefaults : {},
      templates: parsed.templates && typeof parsed.templates === 'object' ? parsed.templates : {}
    };
  } catch(error){
    errors.push(`template_portfolio_status.json: ${error.message}`);
    return {defaultStatus:'working', packageDefaults:{}, templates:{}};
  }
}

function readOfficeOverrides(){
  try{
    const parsed = JSON.parse(fs.readFileSync(officeOverridesPath, 'utf8'));
    return {
      templates: parsed.templates && typeof parsed.templates === 'object' ? parsed.templates : {}
    };
  } catch(error){
    errors.push(`template_office_overrides.json: ${error.message}`);
    return {templates:{}};
  }
}

function enrichMetadata(template){
  return enrichOffice(enrichPortfolio(template));
}

function enrichPortfolio(template){
  const packageRule = normalizeRule(registry.packageDefaults?.[template.__file]);
  const templateRule = normalizeRule(registry.templates?.[template.id]);
  return {
    ...template,
    portfolio: {
      status: templateRule.status || packageRule.status || registry.defaultStatus || 'working',
      reason: templateRule.reason || packageRule.reason || '',
      replacementId: templateRule.replacementId || ''
    }
  };
}

function enrichOffice(template){
  const override = officeOverrides.templates?.[template.id];
  if(!override || typeof override !== 'object' || Array.isArray(override)) return template;
  const tags = Array.isArray(override.tags) ? override.tags.map(tag => String(tag || '').trim()).filter(Boolean) : [];
  const office = override.office && typeof override.office === 'object' && !Array.isArray(override.office) ? override.office : null;
  if(!tags.length && !office) return template;
  return {
    ...template,
    tags: [...new Set([...(Array.isArray(template.tags) ? template.tags : []), ...tags])],
    office: office ? {...(template.office || {}), ...office} : template.office,
    __officeOverride: true
  };
}

function normalizeRule(rule){
  if(typeof rule === 'string') return {status:rule, reason:'', replacementId:''};
  if(!rule || typeof rule !== 'object' || Array.isArray(rule)) return {status:'', reason:'', replacementId:''};
  return {
    status: String(rule.status || '').trim(),
    reason: String(rule.reason || '').trim(),
    replacementId: String(rule.replacementId || '').trim()
  };
}

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

function statusCount(status){
  return byPortfolioStatus.find(([key]) => key === status)?.[1] || 0;
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
    const viaOverrides = packageItems.filter(item => item.__officeOverride === true).length;
    const deprecated = packageItems.filter(item => item.portfolio?.status === 'deprecated').length;
    const test = packageItems.filter(item => item.portfolio?.status === 'test').length;
    return `| ${escapeCell(file)} | ${packageItems.length} | ${withOffice} | ${viaOverrides} | ${percent(withOffice, packageItems.length)}% | ${test} | ${deprecated} |`;
  });
  return [
    '| Пакет | Всего | С office | Через overrides | Покрытие | Тест | Устарело |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...rows
  ].join('\n');
}

function renderLifecycleList(items, showReplacement){
  if(!items.length) return 'Нет.';
  return [
    '| Шаблон | Пакет | Причина | Замена |',
    '|---|---|---|---|',
    ...items
      .sort((a, b) => String(a.__file).localeCompare(String(b.__file), 'ru') || String(a.id).localeCompare(String(b.id), 'ru'))
      .map(item => `| ${escapeCell(item.id)} — ${escapeCell(item.title)} | ${escapeCell(item.__file)} | ${escapeCell(item.portfolio.reason)} | ${showReplacement ? escapeCell(item.portfolio.replacementId || '—') : '—'} |`)
  ].join('\n');
}

function renderNearDuplicates(groups){
  if(!groups.length) return 'Вероятные смысловые дубли не найдены.';
  return [
    '| Сходство | Первый шаблон | Второй шаблон | Статусы |',
    '|---:|---|---|---|',
    ...groups.map(group => `| ${(group.similarity * 100).toFixed(0)}% | ${templateRef(group.left)} | ${templateRef(group.right)} | ${escapeCell(group.left.portfolio.status)} / ${escapeCell(group.right.portfolio.status)} |`)
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
  const source = template.__officeOverride ? ', office override' : '';
  return `${escapeCell(template.id || 'без id')} — ${escapeCell(template.title || 'без названия')} (${escapeCell(template.__file)}, ${escapeCell(template.portfolio?.status || 'working')}${source})`;
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
