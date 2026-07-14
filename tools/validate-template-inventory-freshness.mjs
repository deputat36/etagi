import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const reportPath = path.join(rootDir, 'docs/template-portfolio-inventory.generated.md');
const generatorPath = path.join(rootDir, 'tools/template-portfolio-inventory.mjs');
const original = readRequired(reportPath);
let generated = '';
let generatorResult = null;

try {
  generatorResult = spawnSync(process.execPath, [generatorPath], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 8 * 1024 * 1024
  });
  generated = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';
} finally {
  fs.writeFileSync(reportPath, original, 'utf8');
}

if(generatorResult?.error){
  console.error(`Не удалось запустить инвентаризацию: ${generatorResult.error.message}`);
  process.exit(1);
}

if(generatorResult?.status !== 0){
  console.error('Генератор инвентаризации завершился ошибкой.');
  if(generatorResult?.stdout?.trim()) console.error(generatorResult.stdout.trim());
  if(generatorResult?.stderr?.trim()) console.error(generatorResult.stderr.trim());
  process.exit(generatorResult?.status || 1);
}

if(normalizeReport(original) !== normalizeReport(generated)){
  console.error('Инвентаризация шаблонов устарела. Запустите npm run templates:inventory и сохраните обновлённый отчёт.');
  console.error('GENERATED_TEMPLATE_INVENTORY_BEGIN');
  console.error(generated.trimEnd());
  console.error('GENERATED_TEMPLATE_INVENTORY_END');
  process.exit(1);
}

console.log('Инвентаризация шаблонов соответствует актуальным данным.');

function normalizeReport(source){
  return String(source || '')
    .replace(/\r\n/g, '\n')
    .replace(/^Сформировано: .*$/m, 'Сформировано: <dynamic>')
    .trim();
}

function readRequired(file){
  if(!fs.existsSync(file)){
    console.error(`Файл не найден: ${path.relative(rootDir, file)}`);
    process.exit(1);
  }
  return fs.readFileSync(file, 'utf8');
}
