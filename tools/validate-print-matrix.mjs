const checks = [
  './validate-print-screenshots.mjs',
  './validate-dense-print-policy.mjs'
];

for(const check of checks){
  await import(new URL(check, import.meta.url));
}

console.log('Проверка печатной матрицы и плотных форматов пройдена.');
