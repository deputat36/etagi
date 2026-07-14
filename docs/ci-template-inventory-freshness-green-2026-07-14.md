# Контрольный CI актуальной инвентаризации

Служебный документ для проверки обновлённого `main`.

Ожидаемый маршрут:

```text
validate:template-portfolio → freshness success
validate → browser-smoke → 5 print-screenshot job → collect-print-screenshots
```

Критерии:

- generated-отчёт соответствует данным без учёта строки времени;
- проверка восстанавливает исходный файл и не меняет рабочее дерево;
- полный CI остаётся зелёным.

PR служебный. Полезный код уже находится в `main`.
