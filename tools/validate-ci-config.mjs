import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];
const workflowPath = path.join(rootDir, '.github/workflows/validate.yml');
const source = readRequired(workflowPath);

requireSnippets('.github/workflows/validate.yml', source, [
  'name: Validate project',
  'push:',
  'pull_request:',
  'workflow_dispatch:',
  "- 'index.html'",
  "- 'assets/**'",
  "- 'data/**'",
  "- 'help/**'",
  "- 'docs/**'",
  "- 'tools/**'",
  "- 'README.md'",
  "- 'package.json'",
  "- '.github/workflows/validate.yml'",
  'permissions:',
  'contents: read',
  'runs-on: ubuntu-latest',
  'timeout-minutes: 5',
  'uses: actions/checkout@v4',
  'uses: actions/setup-node@v4',
  "node-version: '20'",
  'run: npm run validate'
]);

if (errors.length) {
  console.error('\nCI config validation errors:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CI config validation passed.');

function requireSnippets(file, text, snippets) {
  for (const snippet of snippets) {
    if (!text.includes(snippet)) errors.push(`${file}: missing required snippet — ${snippet}`);
  }
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${toProjectPath(filePath)}: file not found`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll('\\', '/');
}
