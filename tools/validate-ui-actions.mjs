import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const registryPath = path.join(rootDir, 'data/ui-actions.json');
const indexPath = path.join(rootDir, 'index.html');
const packagePath = path.join(rootDir, 'package.json');
const errors = [];
const allowedKinds = new Set(['static-button', 'dynamic-button', 'dynamic-group', 'command-input']);
const allowedVerificationTypes = new Set(['browser', 'screenshot', 'contract', 'manual', 'planned']);
const requiredDynamicSelectors = [
  '[data-goal]',
  '[data-template]',
  '[data-favorite-template]',
  '[data-scenario]',
  '[data-property]',
  '[data-photo]',
  '[data-count]',
  '[data-layout-mode]',
  '[data-block-move]',
  '[data-spn-ui-mode]',
  '[data-spn-situation]',
  '[data-spn-reset]',
  '[data-wizard-step]',
  '#spnWizardNext',
  '[data-fix]',
  '[data-inline-field]'
];

const registrySource = readRequired(registryPath);
const indexSource = readRequired(indexPath);
const packageSource = readRequired(packagePath);
const registry = parseJson(registrySource, 'data/ui-actions.json');
const pkg = parseJson(packageSource, 'package.json');

if (registry) validateRegistry(registry, indexSource);
if (pkg) validateSmokeCommand(pkg);

if (errors.length) {
  console.error('\nОшибки реестра действий интерфейса:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const actions = registry?.actions || [];
const counts = countBy(actions, action => action.verification?.type || 'missing');
console.log(`Реестр действий интерфейса: ${actions.length} действий.`);
console.log(`Проверки: browser=${counts.browser || 0}, screenshot=${counts.screenshot || 0}, contract=${counts.contract || 0}, manual=${counts.manual || 0}, planned=${counts.planned || 0}.`);
console.log('Проверка реестра действий интерфейса пройдена.');

function validateRegistry(data, html) {
  if (data.schemaVersion !== 1) errors.push('data/ui-actions.json: schemaVersion должен быть равен 1');
  if (!String(data.scope || '').trim()) errors.push('data/ui-actions.json: отсутствует scope');
  if (!Array.isArray(data.actions) || !data.actions.length) {
    errors.push('data/ui-actions.json: actions должен быть непустым массивом');
    return;
  }

  const ids = new Set();
  const selectors = new Set();

  for (const [index, action] of data.actions.entries()) {
    const prefix = `data/ui-actions.json: actions[${index}]`;
    const id = String(action?.id || '').trim();
    const selector = String(action?.selector || '').trim();
    const kind = String(action?.kind || '').trim();
    const owner = String(action?.owner || '').trim();
    const ownerToken = String(action?.ownerToken || '').trim();
    const effect = String(action?.effect || '').trim();
    const risk = String(action?.risk || '').trim();
    const verification = action?.verification || {};
    const verificationType = String(verification.type || '').trim();
    const verificationSource = String(verification.source || '').trim();
    const verificationMarker = String(verification.marker || '').trim();

    if (!/^[a-z0-9][a-z0-9.-]+$/.test(id)) errors.push(`${prefix}: некорректный id ${id || '—'}`);
    if (ids.has(id)) errors.push(`${prefix}: id ${id} повторяется`);
    ids.add(id);

    if (!selector) errors.push(`${prefix}: отсутствует selector`);
    if (selectors.has(selector)) errors.push(`${prefix}: selector ${selector} повторяется`);
    selectors.add(selector);

    if (!allowedKinds.has(kind)) errors.push(`${prefix}: неподдерживаемый kind ${kind || '—'}`);
    if (!owner) errors.push(`${prefix}: отсутствует owner`);
    if (!ownerToken) errors.push(`${prefix}: отсутствует ownerToken`);
    if (effect.length < 12) errors.push(`${prefix}: effect должен понятно описывать ожидаемый результат`);
    if (!risk) errors.push(`${prefix}: отсутствует risk`);
    if (!allowedVerificationTypes.has(verificationType)) errors.push(`${prefix}: неподдерживаемый verification.type ${verificationType || '—'}`);
    if (!verificationSource) errors.push(`${prefix}: отсутствует verification.source`);
    if (!verificationMarker) errors.push(`${prefix}: отсутствует verification.marker`);

    validateOwner(prefix, owner, ownerToken);
    validateVerification(prefix, verificationType, verificationSource, verificationMarker, ownerToken);

    if (kind === 'static-button') validateStaticButton(prefix, selector, html);
    if (kind === 'command-input') validateCommandInput(prefix, selector, html);
  }

  for (const buttonId of extractStaticButtonIds(html)) {
    const selector = `#${buttonId}`;
    if (!selectors.has(selector)) errors.push(`index.html: кнопка ${selector} отсутствует в data/ui-actions.json`);
  }

  for (const selector of requiredDynamicSelectors) {
    if (!selectors.has(selector)) errors.push(`data/ui-actions.json: отсутствует обязательная динамическая группа ${selector}`);
  }

  if (!selectors.has('#uploadFile')) errors.push('data/ui-actions.json: командный input #uploadFile должен быть описан отдельно от кнопки #uploadBtn');
}

function validateSmokeCommand(pkg) {
  const command = String(pkg?.scripts?.['smoke:browser'] || '').trim();
  const expected = 'node tools/run-browser-smoke.mjs && node tools/run-ui-actions-smoke.mjs';
  if (command !== expected) {
    errors.push(`package.json: smoke:browser должен последовательно запускать основной smoke и smoke действий — ${expected}`);
  }
}

function validateOwner(prefix, owner, token) {
  if (!owner) return;
  const ownerPath = path.join(rootDir, owner);
  const source = readRequired(ownerPath);
  if (source && token && !source.includes(token)) {
    errors.push(`${prefix}: owner ${owner} не содержит ownerToken ${token}`);
  }
}

function validateVerification(prefix, type, sourcePath, marker, ownerToken) {
  if (!type || !sourcePath || !marker) return;
  if (type === 'planned') {
    if (sourcePath !== 'issue:#66') errors.push(`${prefix}: planned-проверка должна ссылаться на issue:#66`);
    return;
  }

  const fullPath = path.join(rootDir, sourcePath);
  const source = readRequired(fullPath);
  if (!source) return;

  const hasExactMarker = source.includes(marker);
  const hasContractOwnerToken = type === 'contract' && ownerToken && source.includes(ownerToken);
  if (!hasExactMarker && !hasContractOwnerToken) {
    errors.push(`${prefix}: verification.source ${sourcePath} не содержит marker ${marker} или contract ownerToken ${ownerToken || '—'}`);
  }
}

function validateStaticButton(prefix, selector, html) {
  const id = selector.match(/^#([A-Za-z][\w:-]*)$/)?.[1] || '';
  if (!id) {
    errors.push(`${prefix}: static-button должен использовать selector вида #buttonId`);
    return;
  }
  const buttonIds = new Set(extractStaticButtonIds(html));
  if (!buttonIds.has(id)) errors.push(`${prefix}: кнопка ${selector} не найдена в index.html`);
}

function validateCommandInput(prefix, selector, html) {
  const id = selector.match(/^#([A-Za-z][\w:-]*)$/)?.[1] || '';
  if (!id) {
    errors.push(`${prefix}: command-input должен использовать selector вида #inputId`);
    return;
  }
  const pattern = new RegExp(`<input\\b[^>]*\\bid=["']${escapeRegex(id)}["'][^>]*>`, 'i');
  const tag = html.match(pattern)?.[0] || '';
  if (!tag) errors.push(`${prefix}: input ${selector} не найден в index.html`);
  else if (!/\btype=["']file["']/i.test(tag)) errors.push(`${prefix}: command-input ${selector} должен быть type=file`);
}

function extractStaticButtonIds(html) {
  return [...String(html || '').matchAll(/<button\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
}

function parseJson(source, label) {
  if (!source) return null;
  try {
    return JSON.parse(source);
  } catch (error) {
    errors.push(`${label}: JSON не читается — ${error.message}`);
    return null;
  }
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${toProjectPath(filePath)} не найден`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function countBy(items, getter) {
  const result = {};
  for (const item of items) {
    const key = getter(item);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
