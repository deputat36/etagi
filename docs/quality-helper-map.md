# Карта помощников качества

Документ фиксирует, какие вспомогательные JS-модули участвуют в контроле качества и как они подключаются.

## Точка входа

`index.html` подключает основные модули качества напрямую:

- `assets/js/qualityIssueSummary.js` — сводка замечаний в карточке качества;
- `assets/js/qualityPriorityHint.js` — первое активное исправление;
- `assets/js/qualityPrintGuardHint.js` — подсказка и состояние печати;
- `assets/js/qualityIssueFilters.js` — фильтры замечаний;
- `assets/js/preprintSummary.js` — сводка перед печатью;
- `assets/js/qualityExtraActions.js` — быстрые исправления, включая прямой переход к полю ссылки для пустого QR.

## Цепочка безопасных помощников

`preprintSummary.js` импортирует `layoutExtrasSync.js`.

`layoutExtrasSync.js` импортирует:

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

## Документация и проверки

Актуальность цепочки helper-модулей закрепляют:

- `tools/validate-quality-helper-imports.mjs` — проверяет порядок загрузки, side-effect imports и отсутствие удалённых временных helper-файлов;
- `tools/validate-quality-helper-map.mjs` — проверяет этот документ;
- `tools/validate-readme-quality-docs.mjs` — проверяет README, подключение проверки в `package.json` и покрытие `.github/workflows/validate.yml` для `docs/**` и `README.md`;
- `tools/validate-qr-empty-direct-action.mjs` — проверяет, что штатное действие пустого QR сразу ведёт к ссылке, а не выключает QR;
- `tools/validate-changelog.mjs` — проверяет, что раздел `3.84.0` содержит ключевые изменения по helper-модулям качества.

## Устаревшие модули

`qrIntentFix.js` удалён.

Причина: пустой QR теперь безопасно обрабатывается напрямую в `qualityExtraActions.js` через действие `focusQrLink`. Отдельный временный helper больше не нужен и не должен возвращать знание о старом `disableQr`.

`qualitySuppressedPriority.js` удалён.

Причина: логика игнорирования подавленных замечаний перенесена в основной `qualityPriorityHint.js`. Возвращать отдельный страховочный модуль не нужно, иначе появится дублирующий наблюдатель и двойная перерисовка подсказки.

## Правило для будущих помощников

Если helper-файл добавляется в `assets/js`, он должен быть явно подключён в одной из цепочек:

- напрямую из `index.html`;
- через `preprintSummary.js`;
- через `layoutExtrasSync.js`;
- через профильный helper вроде `qrSizeHint.js`.

Файл, который лежит в `assets/js`, но не подключён ожидаемым импортом, считается нерабочим.
