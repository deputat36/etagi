import fs from 'node:fs';

const workflowSource = read('.github/workflows/validate.yml');
const errors = [];

check(workflowSource, '.github/workflows/validate.yml', [
  'run: npm run validate',
  "- 'index.html'",
  "- 'assets/**'",
  "- 'data/**'",
  "- 'help/**'",
  "- 'tools/**'",
  "- 'package.json'",
  "- '.github/workflows/validate.yml'"
]);

if (!workflowSource.includes("- 'docs/**'")) {
  errors.push(".github/workflows/validate.yml: docs/** не указан в paths, изменения changelog могут не запускать проверки автоматически");
}

if (errors.length) {
  console.error('\nОшибки покрытия GitHub Actions проверками:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Проверка покрытия GitHub Actions пройдена.');

function check(source, file, snippets) {
  for (const snippet of snippets) {
    if (!source.includes(snippet)) errors.push(`${file}: отсутствует ${snippet}`);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
