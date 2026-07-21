const checks = [
  './validate-release-candidate.mjs',
  './validate-print-release-docs.mjs'
];

for(const check of checks){
  await import(new URL(check, import.meta.url));
}

console.log('Проверка release candidate и актуальной печатной документации пройдена.');
