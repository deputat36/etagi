import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'artifacts', 'print-screenshots');
const expected = [
  'one-no-photo',
  'two-big-phone',
  'three-tearoffs',
  'one-showcase',
  'two-photo',
  'four-contacts'
];
const scenarios = [];

for(const id of expected){
  const pngPath = path.join(outputDir, `${id}.png`);
  const metaPath = path.join(outputDir, `${id}.json`);

  if(!fs.existsSync(pngPath)) throw new Error(`Не найден ${id}.png после matrix job.`);
  if(!fs.existsSync(metaPath)) throw new Error(`Не найден ${id}.json после matrix job.`);

  const sizeBytes = fs.statSync(pngPath).size;
  if(sizeBytes < 10000) throw new Error(`${id}.png подозрительно мал — ${sizeBytes} байт.`);

  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  if(metadata.id !== id) throw new Error(`${id}.json содержит неверный id.`);
  scenarios.push({...metadata, sizeBytes});
}

fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  viewport: {width:794, height:1123, deviceScaleFactor:1},
  scenarios
}, null, 2), 'utf8');

console.log(`Print screenshot artifacts collected: ${scenarios.length} PNG.`);