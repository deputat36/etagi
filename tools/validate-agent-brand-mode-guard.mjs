import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const files = {
  guard: 'assets/js/spnAgentBrandModeGuard.js',
  entry: 'assets/js/spnUiMode.js',
  smoke: 'tools/browser-smoke.html'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.guard, sources.guard, [
  "[data-layout-mode=\"agent_brand_photo\"]",
  'window.requestAnimationFrame(() => normalizeAgentBrandMode(button))',
  'function normalizeAgentBrandMode(button)',
  "colorMode.value === 'private'",
  "colorMode.value = 'brand'",
  'showBrand.checked = true',
  "dispatchEvent(new Event('change', {bubbles:true}))",
  'window.requestAnimationFrame(() => button.click())'
]);

requireSnippets(files.entry, sources.entry, [
  "import './spnAgentBrandModeGuard.js';"
]);

requireSnippets(files.smoke, sources.smoke, [
  '[data-layout-mode="private"]',
  "doc.getElementById('colorMode')?.value === 'private'",
  '[data-layout-mode="agent_brand_photo"]',
  "doc.getElementById('colorMode')?.value === 'brand'",
  "doc.getElementById('showBrand')?.checked",
  'private → agent_brand_photo: фирменность восстановлена'
]);

if(errors.length){
  console.error('\nОшибки защиты брендового фото-режима:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка перехода Частное → Фото СПН пройдена.');

function requireSnippets(file, source, snippets){
  for(const snippet of snippets){
    if(!source.includes(snippet)) errors.push(`${file}: отсутствует обязательный контракт — ${snippet}`);
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
