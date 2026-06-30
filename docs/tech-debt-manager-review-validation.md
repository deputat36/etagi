# Технический долг: проверка manager review

## Контекст

В интерфейс добавлены два helper-модуля:

- `assets/js/spnManagerReview.js` — проверка менеджера перед печатью;
- `assets/js/spnReportSummary.js` — краткая сводка истории отчётов.

`spnManagerReview.js` подключён через `assets/js/spnUiMode.js` и импортирует `spnReportSummary.js`.

## Что уже сделано

- Блок проверки менеджера создан.
- Блок подключён в интерфейс.
- Добавлена инструкция `docs/manager-review.md`.
- README описывает новый модуль.
- Сводка истории отчётов создана и подключена через manager review.

## Что осталось закрепить

Нужно добавить автоматическую проверку, чтобы будущие правки не удалили:

- `assets/js/spnManagerReview.js`;
- импорт `spnManagerReview.js` в `assets/js/spnUiMode.js`;
- импорт `spnReportSummary.js` в `assets/js/spnManagerReview.js`;
- `docs/manager-review.md`;
- строки README про блок проверки менеджера.

## Почему не завершено сейчас

Попытки подключить отдельный `validate:manager-review-docs` в `package.json` и расширить существующий валидатор были заблокированы connector.

## Следующий безопасный шаг

Когда правка `package.json` и валидаторов будет проходить, нужно:

1. Подключить `tools/validate-manager-review-docs.mjs` в `package.json`.
2. Добавить его в общий `npm run validate`.
3. Синхронизировать список проверок в `docs/maintenance-guide.md`.
4. Запустить `npm run validate`.
