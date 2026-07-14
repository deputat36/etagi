# Контрольный CI релиз-кандидата 3.86.0

Служебный документ для проверки актуального `main`.

Ожидаемый маршрут:

```text
validate → browser-smoke → 5 print-screenshot job → collect-print-screenshots
```

Ключевые контракты:

- `validate:release-candidate` принимает текущее состояние `DRAFT`;
- версия остаётся `3.85.0` до ручной печатной приёмки;
- финальный раздел `3.86.0` не появляется в changelog преждевременно;
- `validate:newbie-mode-docs` получает asset-version из `package.json`, а не из исторического токена.

PR служебный. Код и документы уже находятся в `main`.
