# Карта помощников качества

Документ фиксирует, какие вспомогательные JS-модули участвуют в контроле качества и как они подключаются.

## Точка входа

`index.html` подключает основные модули качества напрямую:

- `assets/js/qualityIssueSummary.js` — сводка замечаний в карточке качества;
- `assets/js/qualityPriorityHint.js` — первое активное исправление;
- `assets/js/qualityPrintGuardHint.js` — подсказка и состояние печати;
- `assets/js/qualityIssueFilters.js` — фильтры замечаний;
- `assets/js/preprintSummary.js` — сводка перед печатью;
- `assets/js/qualityExtraActions.js` — быстрые исправления.

## Цепочка безопасных помощников

`preprintSummary.js` импортирует `layoutExtrasSync.js`.

`layoutExtrasSync.js` импортирует:

- `qrIntentFix.js` — сохраняет намерение пользователя при пустом QR и переводит к полю ссылки;
- `photoIntentFix.js` — сохраняет намерение пользователя при пустом фото и переводит к полю загрузки;
- `qrSizeHint.js` — подключает QR-страховку от дублей;
- `responseChannelPhoneGuard.js` — не даёт включить контакты без корректного телефона.

`qrSizeHint.js` импортирует:

- `qualityQrDeduplicate.js` — подавляет мягкий QR-дубль, если есть более важное QR-предупреждение.

## Подавленные замечания

Подавленное замечание получает `data-quality-suppressed`.

Его обязаны игнорировать:

- `qualityIssueFilters.js`;
- `qualityIssueSummary.js`;
- `qualityPriorityHint.js`;
- `qualityPrintGuardHint.js`;
- `preprintSummary.js`.

## Устаревшие модули

`qualitySuppressedPriority.js` удалён.

Причина: логика игнорирования подавленных замечаний перенесена в основной `qualityPriorityHint.js`. Возвращать отдельный страховочный модуль не нужно, иначе появится дублирующий наблюдатель и двойная перерисовка подсказки.

## Правило для будущих помощников

Если helper-файл добавляется в `assets/js`, он должен быть явно подключён в одной из цепочек:

- напрямую из `index.html`;
- через `preprintSummary.js`;
- через `layoutExtrasSync.js`;
- через профильный helper вроде `qrSizeHint.js`.

Файл, который лежит в `assets/js`, но не подключён ожидаемым импортом, считается нерабочим.
