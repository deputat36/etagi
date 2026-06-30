import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

const files = {
  helper: 'assets/js/spnManagerReview.js',
  ui: 'assets/js/spnUiMode.js',
  guide: 'docs/manager-review.md',
  readme: 'README.md'
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readRequired(file)])
);

requireSnippets(files.helper, sources.helper, [
  'REVIEW_KEY',
  'spnManagerReview',
  'managerReviewStatus',
  'managerReviewComment',
  'copyManagerReviewBtn',
  'Проверка менеджера',
  'ПРОВЕРКА МЕНЕДЖЕРА'
]);

requireSnippets(files.ui, sources.ui, [
  "import './spnManagerReview.js';"
]);

requireSnippets(files.guide, sources.guide, [
  '# Проверка менеджера в интерфейсе',
  'Что проверяется',
  'Когда проверка обязательна',
  'Скопировать решение'
]);

requireSnippets(files.readme, sources.readme, [
  'блок проверки менеджера перед печатью',
  'assets/js/spnManagerReview.js           проверка менеджера перед печатью'
]);

if (errors.length) {
  console.error('\nManager review documentation errors:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Manager review documentation check passed.');

function requireSnippets(file, source, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: missing required snippet — ${snippet}`);
  }
}

function readRequired(file) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${file}: file not found`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
