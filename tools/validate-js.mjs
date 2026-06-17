import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const searchDirs = ['assets/js', 'tools'];
const files = [];

for (const dir of searchDirs) {
  const fullDir = path.join(rootDir, dir);
  if (!fs.existsSync(fullDir)) continue;
  collectFiles(fullDir, files);
}

const jsFiles = files
  .filter(file => /\.(js|mjs)$/i.test(file))
  .sort();

const errors = [];

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: rootDir,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    errors.push({
      file: path.relative(rootDir, file),
      output: `${result.stdout || ''}${result.stderr || ''}`.trim()
    });
  }
}

console.log(`Проверено JS-файлов: ${jsFiles.length}`);

if (errors.length) {
  console.error('\nОшибки синтаксиса JS:');
  for (const error of errors) {
    console.error(`\n${error.file}`);
    console.error(error.output || 'Неизвестная ошибка');
  }
  process.exit(1);
}

console.log('Проверка JS-синтаксиса пройдена.');

function collectFiles(dir, out) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) collectFiles(fullPath, out);
    else out.push(fullPath);
  }
}
