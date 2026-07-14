# Финальный контроль asset-version и RC gate

Служебный документ для запуска актуального `main`.

Проверяется объединённое состояние:

```text
validate → browser-smoke → print-screenshot × 5 → collect-print-screenshots
```

Критерии:

- 31 CSS/JS entry-ресурс имеет `?v=3.85.0`;
- `assets:stamp` и `validate:asset-version` используют `package.json` как источник версии;
- HTML-контракты качества допускают version-query;
- релиз-кандидат 3.86.0 остаётся `DRAFT`, пока ручная печатная приёмка не пройдена;
- runtime и печатная матрица зелёные.

PR служебный. Полезный код уже находится в `main`.
