import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const scripts = pkg.scripts || {};
const validateNames = Object.keys(scripts).filter(name => name.startsWith('validate:'));

if (!validateNames.length) {
  console.error('No validate:* scripts found in package.json.');
  process.exit(1);
}

for (const scriptName of validateNames) {
  console.log(`\n> npm run ${scriptName}`);
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('\nAll validation scripts passed.');
