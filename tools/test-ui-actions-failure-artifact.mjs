import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const failureLogPath = path.join(rootDir, 'browser-smoke-failure.log');
fs.rmSync(failureLogPath, {force:true});

const result = spawnSync(process.execPath, ['tools/run-ui-actions-smoke.mjs', '--failure-fixture'], {
  cwd:rootDir,
  encoding:'utf8',
  timeout:30000,
  env:{...process.env}
});

const errors = [];
if(result.error) errors.push(`не удалось запустить fault-injection: ${result.error.message}`);
if(result.status === 0) errors.push('fault-injection UI smoke неожиданно завершился успешно');
if(!fs.existsSync(failureLogPath)) errors.push('browser-smoke-failure.log не создан');

const failureLog = fs.existsSync(failureLogPath) ? fs.readFileSync(failureLogPath, 'utf8') : '';
const required = [
  'UI actions failure fixture: статус failed.',
  'fault injection: deterministic UI action failure',
  'Последнее действие: fixture.import',
  'Состояние: {"headline":"Fixture","printCount":4,"hasQr":true}'
];
for(const snippet of required){
  if(!failureLog.includes(snippet)) errors.push(`failure log не содержит: ${snippet}`);
}

if(errors.length){
  console.error('UI actions failure artifact test errors:');
  errors.forEach(error => console.error(`- ${error}`));
  if(result.stdout) console.error(`stdout:\n${result.stdout}`);
  if(result.stderr) console.error(`stderr:\n${result.stderr}`);
  process.exit(1);
}

console.log('UI actions failure artifact проверен: последнее действие и состояние сохранены.');
