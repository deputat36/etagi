import { spawnSync } from 'node:child_process';

const checks = [
  'tools/validate-storage-safety.mjs',
  'tools/validate-destructive-snapshot.mjs'
];

for(const target of checks){
  const result = spawnSync(process.execPath, [target], {
    cwd:process.cwd(),
    encoding:'utf8',
    stdio:'inherit'
  });
  if(result.error){
    console.error(`Не удалось запустить ${target}: ${result.error.message}`);
    process.exit(1);
  }
  if(result.status !== 0) process.exit(result.status || 1);
}

console.log('Все контракты безопасного хранения пройдены.');
