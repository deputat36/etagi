# CI-проверка релиз-кандидата 3.86.0

Статус: ПРОЙДЕНА

Проверяемая база: `main` на коммите `ded9531015d891e73a374de5af83cefdae0a3d59`

Проверочная ветка: `ci/verify-3.86.0-gate`

Pull request: #52

Успешный workflow run: #1474

Workflow run ID: `29342160983`

Проверенный head SHA: `985ffb45af54c1ccb3dc4f3af4c97ec69d4a5b5f`

Дата проверки: 14 июля 2026 года

Цель документа — получить наблюдаемый `pull_request`-запуск GitHub Actions после последних изменений release gate, evidence-пакета, README и актуального статуса проекта.

## Почему используется pull request

Подключённый GitHub-коннектор не возвращает workflow runs для обычных push-коммитов `main`, но поддерживает чтение запусков, связанных с pull request. Поэтому отдельный PR используется как техническое доказательство, а не как замена ручной приёмки.

## Первый запуск

Workflow run #1458, ID `29341384135`, корректно завершился ошибкой на job `validate`.

Validator обнаружил, что шаблон `seller_empty_flat` соответствует правилам чувствительного сценария `test / manager / high / recommended=false`, содержит прямой заголовок «Куплю» и упоминание наследственных объектов, но отсутствовал в ручном бланке и evidence-пакете.

Исправление не ослабило автоматическое обнаружение: `seller_empty_flat` добавлен двенадцатым шаблоном во все связанные документы.

## Результат run #1474

- [x] `validate` — выполнен `npm run validate`;
- [x] `browser-smoke` — пройден настоящий Chrome smoke;
- [x] `print-screenshot / one-no-photo`;
- [x] `print-screenshot / two-big-phone`;
- [x] `print-screenshot / one-showcase`;
- [x] `print-screenshot / two-photo`;
- [x] `print-screenshot / four-contacts`;
- [x] `collect-print-screenshots` — собран итоговый artifact.

## Artifacts

Итоговый artifact: `print-screenshots`

Artifact ID: `8314615905`

Digest: `sha256:53fe79556a557486633ad4acbe6e339236e9a3f82b56ad67978b5f78fb405274`

Проверенное содержимое:

- `one-no-photo.png` и `one-no-photo.json`;
- `two-big-phone.png` и `two-big-phone.json`;
- `one-showcase.png` и `one-showcase.json`;
- `two-photo.png` и `two-photo.json`;
- `four-contacts.png` и `four-contacts.json`;
- `manifest.json`.

Все пять сценариев зафиксированы через `captureMethod: cdp-pipe`. Job `one-showcase` завершился успешно после точечного rerun из-за подтверждённой нестабильности окружения; остальные обязательные jobs были успешны без повторного запуска.

## Подтверждено

- актуальный статус синхронизирован с `package.json`, release candidate и инвентаризацией;
- evidence-пакет 12 чувствительных шаблонов совпадает с исходными JSON и office-политикой;
- релиз остаётся `DRAFT`, версия остаётся `3.85.0`;
- ручные issues #40 и #51 не закрыты автоматическим запуском;
- screenshot matrix создала пять независимых PNG и итоговый manifest.

## Ограничение результата

Успешный CI подтверждает техническую целостность, browser smoke и автоматическую печатную screenshot-регрессию. Он не заменяет реальный телефон, рабочий компьютер, офисный принтер, проверку QR камерой и решение менеджера по чувствительным рекламным формулировкам.
