# Контрольный CI единого asset-version

Служебный документ для запуска актуального `main` после введения единого cache-busting токена для CSS/JS entry-assets.

Проверяется:

```text
validate → browser-smoke → print-screenshot × 5 → collect-print-screenshots
```

Критерии:

- все локальные CSS/JS ссылки в `index.html` имеют `?v=3.85.0`;
- версия совпадает с `package.json`;
- старый токен `newbie-wizard-20260703-1` отсутствует;
- `npm run assets:stamp` и `validate:asset-version` работают;
- HTML-контракты качества допускают единый version-query;
- runtime и печатная матрица остаются зелёными.

PR служебный. Полезный код уже находится в `main`.
