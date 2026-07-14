# Контрольный CI актуальности инвентаризации

Служебный документ для проверки актуального `main`.

Первый ожидаемый результат:

```text
validate:template-portfolio → ошибка устаревшего generated-отчёта
```

Artifact `validation-failure` должен содержать актуальную версию между маркерами:

```text
GENERATED_TEMPLATE_INVENTORY_BEGIN
GENERATED_TEMPLATE_INVENTORY_END
```

После сохранения нового отчёта ожидается полный зелёный маршрут:

```text
validate → browser-smoke → 5 print-screenshot job → collect-print-screenshots
```

PR служебный. Полезный код уже находится в `main`.
