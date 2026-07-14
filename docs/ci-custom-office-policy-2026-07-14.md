# Контрольный CI custom-конструкторов

Служебный документ для запуска актуального `main` после office-разметки всех 6 шаблонов `templates_custom.json`.

Проверяется:

```text
validate → browser-smoke → print-screenshot × 5 → collect-print-screenshots
```

Критерии:

- все `custom_*` имеют manager и not recommended;
- частная записка, универсальная консультация и A/B-заготовка имеют status=test;
- заглушки не выдаются новичку как готовые объявления;
- runtime и печатные сценарии не изменились.

PR служебный. Полезный код уже находится в `main`.
