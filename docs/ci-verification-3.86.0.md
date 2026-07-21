# CI-проверка релиз-кандидата 3.86.0

Статус: ПРОЙДЕНА

Проверяемая база: `main` на коммите `6158012ad1ae5f4b35952a7ea41308517a147bd3`

Проверочная ветка: `agent/print-format-coverage-smoke`

Pull request: #91

Исторический release-gate Pull request: #52

Успешный workflow run: #1883

Workflow run ID: `29824496781`

Проверенный head SHA: `85406931140f369bcabe297d7dd4ba21ee10c237`

Дата проверки: 21 июля 2026 года

Цель документа — зафиксировать технический срез после завершения этапов сохранности данных и полной автоматической печатной матрицы. Документ не заменяет ручную приёмку issue #40 и менеджерское решение issue #51.

## История усиления release gate

Workflow run #1458 корректно обнаружил пропущенный чувствительный шаблон `seller_empty_flat`. Исправление не ослабило автоматическое обнаружение: шаблон был добавлен двенадцатым элементом в бланк и evidence-пакет.

Исторический run #1474 и Pull request #52 закрепили первый полный release-gate с пятью screenshot-сценариями. После него проект получил дополнительные browser-контракты, защиту данных и форматы 3/6/8.

## Результат run #1883

- [x] `validate` — выполнен полный `npm run validate`;
- [x] `Verify release status details` — подтверждён список ручных блокеров;
- [x] `browser-smoke` — пройден настоящий Chrome smoke;
- [x] `UI actions smoke` — пройдены действия, сохранение и восстановление;
- [x] `cdp-failure-artifact`;
- [x] `ui-actions-failure-artifact`;
- [x] `print-screenshot / one-no-photo`;
- [x] `print-screenshot / two-big-phone`;
- [x] `print-screenshot / three-tearoffs`;
- [x] `print-screenshot / one-showcase`;
- [x] `print-screenshot / two-photo`;
- [x] `print-screenshot / four-contacts`;
- [x] `print-screenshot / six-economy`;
- [x] `collect-print-screenshots`.

## Основной artifact

Итоговый artifact: `print-screenshots`

Artifact ID: `8492754380`

Digest: `sha256:2edc6a1d42effe845a16687d20c6398e7a492f10aec9805f660964d556de5c03`

Проверенное содержимое:

- `one-no-photo.png` и JSON;
- `two-big-phone.png` и JSON;
- `three-tearoffs.png` и JSON;
- `one-showcase.png` и JSON;
- `two-photo.png` и JSON;
- `four-contacts.png` и JSON;
- `six-economy.png` и JSON;
- `manifest.json`.

Все семь сценариев используют `captureMethod: cdp-pipe`.

## Дополнительные печатные доказательства

### Формат 8 на A4

Workflow: `Validate 8 on A4`

Успешный run: #10

Workflow run ID: `29823514538`

Artifact: `print-screenshot-eight-economy`

Artifact ID: `8492331845`

Digest: `sha256:2c502f7c59670f18d5b6329f34c5200dcea41ce330661c384bc40ed7f2f8dfc8`

Проверены восемь карточек 2×4, отсутствие overflow, границы контактов, полный телефон, имя СПН, телефон не меньше 16 px и заголовок не меньше 12 px.

### Единое покрытие форматов

Workflow: `Validate print format coverage`

Успешный run: #7

Workflow run ID: `29824496884`

Последовательно проверены форматы `1 / 2 / 3 / 4 / 6 / 8`:

- точное количество карточек;
- полный телефон и имя СПН;
- отсутствие overflow;
- контакты внутри карточек;
- восемь отрывных полос для 1/2/3/4;
- отключение полос для 6/8;
- минимальные размеры телефона 30/28/24/20/18/16 px.

## Подтверждено

- релиз остаётся `DRAFT`, версия остаётся `3.85.0`;
- evidence-пакет 12 чувствительных шаблонов остаётся обязательным;
- официальные форматы — 1, 2, 3, 4, 6 и 8 на A4;
- значения 10/12 блокируются;
- screenshot matrix и browser coverage проходят;
- ручные issues #40 и #51 не закрыты автоматическим запуском.

## Ограничение результата

Успешный CI подтверждает техническую целостность, browser smoke и автоматическую печатную регрессию. Он не заменяет:

- реальный телефон и рабочий компьютер;
- офисный принтер и фактические поля драйвера;
- проверку читаемости с расстояния;
- QR камерой двух телефонов;
- оценку расхода чернил;
- решение менеджера по чувствительным рекламным формулировкам.
