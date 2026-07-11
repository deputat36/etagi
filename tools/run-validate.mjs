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
  const command = String(scripts[scriptName] || '').trim();
  if (!command || command === 'npm run validate' || command === 'node tools/run-validate.mjs') {
    console.error(`Invalid recursive validation script: ${scriptName}`);
    process.exit(1);
  }
}

for (const scriptName of validateNames) {
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 8 * 1024 * 1024,
    shell: process.platform === 'win32'
  });

  if (result.error) {
    console.error(`\n✗ ${scriptName}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\n✗ npm run ${scriptName}`);
    if (result.stdout?.trim()) console.error(result.stdout.trim());
    if (result.stderr?.trim()) console.error(result.stderr.trim());
    process.exit(result.status || 1);
  }

  console.log(`✓ ${scriptName}`);
}

console.log(`All ${validateNames.length} validation scripts passed.`);
