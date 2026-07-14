# CI-проверка релиз-кандидата 3.86.0

Статус: ОЖИДАЕТ ПРОВЕРКИ

Проверяемая база: `main` на коммите `ded9531015d891e73a374de5af83cefdae0a3d59`

Проверочная ветка: `ci/verify-3.86.0-gate`

Цель документа — получить наблюдаемый `pull_request`-запуск GitHub Actions после последних изменений release gate, evidence-пакета, README и актуального статуса проекта.

## Почему используется pull request

Подключённый GitHub-коннектор не возвращает workflow runs для обычных push-коммитов `main`, но поддерживает чтение запусков, связанных с pull request. Поэтому отдельный draft PR используется как техническое доказательство, а не как замена ручной приёмки.

## Обязательные jobs

- [ ] `validate` — выполнен `npm run validate`;
- [ ] `browser-smoke` — пройден настоящий Chrome smoke;
- [ ] `print-screenshot / one-no-photo`;
- [ ] `print-screenshot / two-big-phone`;
- [ ] `print-screenshot / one-showcase`;
- [ ] `print-screenshot / two-photo`;
- [ ] `print-screenshot / four-contacts`;
- [ ] `collect-print-screenshots` — собран итоговый artifact.

## Что должно быть подтверждено

- актуальный статус синхронизирован с `package.json`, release candidate и инвентаризацией;
- evidence-пакет 11 чувствительных шаблонов совпадает с исходными JSON и office-политикой;
- релиз остаётся `DRAFT`, версия остаётся `3.85.0`;
- ручные issues #40 и #51 не закрываются автоматическим запуском;
- screenshot matrix создаёт пять независимых PNG и итоговый manifest.

## Правило результата

Запуск считается подтверждённым только после получения конкретного workflow run, успешных статусов всех обязательных jobs и проверки списка artifacts.

Состояние `pending`, пустой список runs, отсутствие check status или частично успешная matrix не являются подтверждением.

После успешного запуска в этот документ вносятся:

- номер и идентификатор workflow run;
- проверенный commit SHA;
- итог каждого job;
- список artifacts;
- дата проверки.
