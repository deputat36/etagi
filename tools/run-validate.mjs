import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const failureLogPath = path.join(rootDir, 'validation-failure.log');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const scripts = pkg.scripts || {};
const validateNames = Object.keys(scripts).filter(name => name.startsWith('validate:'));

try { fs.rmSync(failureLogPath, {force:true}); } catch(error){}

if (!validateNames.length) {
  failValidation('No validate:* scripts found in package.json.');
}

for (const scriptName of validateNames) {
  const command = String(scripts[scriptName] || '').trim();
  if (!command || command === 'npm run validate' || command === 'node tools/run-validate.mjs') {
    failValidation(`Invalid recursive validation script: ${scriptName}`);
  }
}

let passedCount = 0;

for (const scriptName of validateNames) {
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 8 * 1024 * 1024,
    shell: process.platform === 'win32'
  });

  if (result.error) {
    failValidation(`✗ ${scriptName}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const details = [
      `✗ npm run ${scriptName} (после ${passedCount} успешных проверок)`,
      result.stdout?.trim(),
      result.stderr?.trim()
    ].filter(Boolean).join('\n\n');
    failValidation(details, result.status || 1);
  }

  passedCount += 1;
}

console.log(`All ${passedCount} validation scripts passed.`);

function failValidation(message, status = 1){
  const text = String(message || 'Validation failed.').trim();
  try { fs.writeFileSync(failureLogPath, `${text}\n`, 'utf8'); } catch(error){}
  console.error(`\n${text}`);
  process.exit(status);
}
