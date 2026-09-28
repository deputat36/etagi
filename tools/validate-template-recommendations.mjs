import fs from 'node:fs';

const recommendations = JSON.parse(fs.readFileSync('data/template_recommendations.json', 'utf8'));
const templateSources = [
  'data/templates.json',
  'data/templates_custom.json',
  'data/templates_sales.json',
  'data/templates_extra.json'
];

const templates = new Set();
for (const file of templateSources) {
  if (!fs.existsSync(file)) continue;
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const item of items) {
    if (item.id) templates.add(item.id);
  }
}

const missing = [];
for (const entries of Object.values(recommendations.recommendations || {})) {
  for (const entry of entries) {
    if (!templates.has(entry.templateId)) {
      missing.push(entry.templateId);
    }
  }
}

if (missing.length) {
  console.error('Missing recommended templates:', [...new Set(missing)]);
  process.exit(1);
}

console.log(`Template recommendations validated: ${templates.size} templates available.`);
