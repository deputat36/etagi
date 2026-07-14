# Контрольный CI полной trust office-разметки

Служебный документ для запуска актуального `main` после завершения office-разметки всех 6 шаблонов `templates_trust.json`.

Проверяется:

```text
validate → browser-smoke → print-screenshot × 5 → collect-print-screenshots
```

Особое внимание:

- безопасная формулировка рыночного ориентира вместо обещания «реальной цены»;
- `trust_service_documents_check` имеет manager / high / test;
- `trust_private_neighbor_question` имеет manager / high / test;
- новичку не выдаются юридически чувствительные и неподтверждённые сценарии как основные.

PR служебный. Полезный код уже находится в `main`.
