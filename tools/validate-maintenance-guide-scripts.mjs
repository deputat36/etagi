import fs from 'node:fs';

const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const guideSource = fs.readFileSync('docs/maintenance-guide.md', 'utf8');
const errors = [];

const scripts = packageData.scripts || {};
const validateScripts = Object.keys(scripts)
  .filter(name => name.startsWith('validate:'))
  .sort();

for (const scriptName of validateScripts) {
  const command = `npm run ${scriptName}`;
  if (!guideSource.includes(command)) {
    errors.push(`docs/maintenance-guide.md: отсутствует ${command}`);
  }
}

if (!guideSource.includes('npm run validate')) {
  errors.push('docs/maintenance-guide.md: отсутствует общая команда npm run validate');
}

if (errors.length) {
  console.error('\nОшибки списка проверок в регламенте сопровождения:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Список проверок в регламенте сопровождения актуален.');
