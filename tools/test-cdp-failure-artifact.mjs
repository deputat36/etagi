import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const fakeChromePath = path.join(rootDir, 'tools', 'fake-chrome-cdp-failure.mjs');
const failureLogPath = path.join(rootDir, 'print-screenshots-failure.log');
const screenshotPath = path.join(rootDir, 'artifacts', 'print-screenshots', 'one-showcase.png');
const metadataPath = path.join(rootDir, 'artifacts', 'print-screenshots', 'one-showcase.json');
const errors = [];

if(process.platform === 'win32'){
  console.error('Fault-injection test рассчитан на Linux runner GitHub Actions.');
  process.exit(1);
}

if(!fs.existsSync(fakeChromePath)){
  console.error('Не найден tools/fake-chrome-cdp-failure.mjs.');
  process.exit(1);
}

fs.rmSync(failureLogPath, {force:true});
fs.rmSync(path.dirname(screenshotPath), {recursive:true, force:true});

const previousMode = fs.statSync(fakeChromePath).mode & 0o777;
fs.chmodSync(fakeChromePath, 0o755);

let result;
try{
  result = spawnSync(process.execPath, ['tools/run-print-screenshots.mjs', '--scenario', 'one-showcase'], {
    cwd: rootDir,
    env: {
      ...process.env,
      CHROME_BIN: fakeChromePath
    },
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024
  });
} finally {
  fs.chmodSync(fakeChromePath, previousMode);
}

if(result.error) errors.push(`Screenshot runner не завершился штатно: ${result.error.message}`);
if(result.status === 0) errors.push('Screenshot runner должен завершиться ошибкой при двойном fault injection.');
if(!fs.existsSync(failureLogPath)) errors.push('После двух неудачных попыток не создан print-screenshots-failure.log.');
if(fs.existsSync(screenshotPath)) errors.push('При двойной ошибке не должен оставаться one-showcase.png.');
if(fs.existsSync(metadataPath)) errors.push('При двойной ошибке не должен оставаться one-showcase.json.');

const failureLog = fs.existsSync(failureLogPath)
  ? fs.readFileSync(failureLogPath, 'utf8')
  : '';

if(!failureLog.includes('попытка 2')) errors.push('Failure log должен подтверждать вторую неудачную попытку.');
if(!failureLog.includes('fault injection')) errors.push('Failure log должен содержать диагностику поддельного Chrome.');
if(!/(code=86|EPIPE|ECONNRESET)/.test(failureLog)) {
  errors.push('Failure log должен сохранять код завершения или ошибку CDP pipe.');
}

if(errors.length){
  console.error('\nОшибки fault-injection проверки failure-artifact:');
  errors.forEach(error => console.error(`- ${error}`));
  if(result?.stdout) console.error(`\nstdout runner:\n${result.stdout.trim()}`);
  if(result?.stderr) console.error(`\nstderr runner:\n${result.stderr.trim()}`);
  process.exit(1);
}

console.log('Fault-injection проверка пройдена: runner выполнил две попытки, завершился контролируемой ошибкой и создал print-screenshots-failure.log.');
