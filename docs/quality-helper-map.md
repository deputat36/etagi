# Карта помощников качества

Документ фиксирует, какие вспомогательные JS-модули участвуют в контроле качества и как они подключаются.

## Точка входа

`index.html` подключает основные модули качества напрямую:

- `assets/js/qualityIssueSummary.js` — сводка замечаний в карточке качества;
- `assets/js/qualityPriorityHint.js` — первое активное исправление;
- `assets/js/qualityPrintGuardHint.js` — подсказка и состояние печати;
- `assets/js/qualityIssueFilters.js` — фильтры замечаний;
- `assets/js/preprintSummary.js` — сводка перед печатью;
- `assets/js/qualityExtraActions.js` — быстрые исправления, включая прямой переход к полю ссылки для пустого QR, к полям загрузки для пустых фото и к безопасной настройке канала отклика.

## Единый канал обновлений списка качества

`assets/js/qualityListUpdates.js` создаёт один `MutationObserver` для `#qualityList` и распределяет значимые обновления между подписчиками в одном `requestAnimationFrame`.

Observer реагирует только на:

- добавление или удаление замечаний `.qitem`;
- добавление контейнера, внутри которого появились `.qitem`;
- изменение `data-quality-suppressed` у замечания.

Он не реагирует на:

- добавление внутренних кнопок, меток уровня и декоративных элементов;
- `hidden`, который меняет фильтр замечаний;
- нерелевантные прямые элементы внутри `qualityList`.

Через `subscribeQualityListUpdates()` подключены:

- `qualityQrDeduplicate.js` — сначала подавляет мягкий QR-дубль;
- `spnInkEfficiency.js` — добавляет или удаляет подсказку расхода чернил;
- `qualityLevelLabels.js` — добавляет метки `Ошибка / Важно / Совет`;
- `spnPhotoLayoutQualityActions.js` — добавляет действия для фото-компоновок;
- `qualityIssueFilters.js` — применяет фильтры и скрывает подавленные замечания;
- `qualityIssueSummary.js` — пересчитывает сводку;
- `qualityPriorityHint.js` — выбирает первое активное исправление;
- `qualityPrintGuardHint.js` — обновляет состояние кнопки печати.

Приоритеты подписчиков гарантируют, что QR-дедупликация и добавление системных замечаний выполняются раньше визуальных сводок и защиты печати.

## Цепочка безопасных помощников

`preprintSummary.js` импортирует `layoutExtrasSync.js`.

`layoutExtrasSync.js` импортирует:

- `qrSizeHint.js` — подключает QR-страховку от дублей.

`qrSizeHint.js` импортирует:

- `qualityQrDeduplicate.js` — подавляет мягкий QR-дубль, если есть более важное QR-предупреждение.

`qualityQrDeduplicate.js` импортирует:

- `qualityListUpdates.js` — подписывается на общий канал с наивысшим приоритетом нормализации.

## Подавленные замечания

Подавленное замечание получает `data-quality-suppressed`.

Его обязаны игнорировать:

- `qualityIssueFilters.js`;
- `qualityIssueSummary.js`;
- `qualityPriorityHint.js`;
- `qualityPrintGuardHint.js`;
- `preprintSummary.js`.

Изменение `data-quality-suppressed` обрабатывает общий observer. Атрибут `hidden` намеренно не наблюдается: фильтр сам управляет видимостью и не должен запускать повторный цикл.

## Документация и проверки

Актуальность цепочки helper-модулей закрепляют:

- `tools/validate-quality-helper-imports.mjs` — проверяет порядок загрузки, общий канал, side-effect imports и отсутствие удалённых временных helper-файлов;
- `tools/validate-quality-helper-map.mjs` — проверяет этот документ;
- `tools/validate-readme-quality-docs.mjs` — проверяет README, подключение проверки в `package.json` и покрытие `.github/workflows/validate.yml` для `docs/**` и `README.md`;
- `tools/validate-photo-intent-action.mjs` — проверяет, что штатные фото-замечания сразу ведут к полям загрузки, а не выключают фото;
- `tools/validate-qr-empty-direct-action.mjs` — проверяет, что штатное действие пустого QR сразу ведёт к ссылке, а не выключает QR;
- `tools/validate-response-channel-action.mjs` — проверяет, что замечание без канала отклика обрабатывается прямым действием `responseChannel`, а не старым `showContact`;
- `tools/validate-changelog.mjs` — проверяет, что раздел `3.84.0` содержит ключевые изменения по helper-модулям качества;
- `tools/quality-list-updates-smoke.html` — проверяет один observer, порядок восьми подписчиков, подавление, фильтры, приоритет и защиту печати.

Сопровождение этих правил описано в `docs/maintenance-guide.md`: там зафиксированы принципы безопасных исправлений QR, фото, канала отклика, дополнительного блока и мягкой автоподстройки.

## Устаревшие модули

`responseChannelPhoneGuard.js` удалён.

Причина: канал отклика теперь безопасно обрабатывается напрямую в `qualityExtraActions.js` через действие `responseChannel`. Если телефон пустой или похож на ошибочный, пользователь переходит к полю телефона; если телефон корректный, включаются контакты. Отдельный перехватчик старого `showContact` больше не нужен.

`photoIntentFix.js` удалён.

Причина: пустые фото теперь безопасно обрабатываются напрямую в `qualityExtraActions.js` через действия `focusPhotoOne` и `focusPhotoTwo`. Отдельный временный helper больше не нужен и не должен возвращать знание о старых `noPhoto` и `onePhoto`.

`qrIntentFix.js` удалён.

Причина: пустой QR теперь безопасно обрабатывается напрямую в `qualityExtraActions.js` через действие `focusQrLink`. Отдельный временный helper больше не нужен и не должен возвращать знание о старом `disableQr`.

`qualitySuppressedPriority.js` удалён.

Причина: логика игнорирования подавленных замечаний перенесена в основной `qualityPriorityHint.js`. Возвращать отдельный страховочный модуль не нужно, иначе появится дублирующий наблюдатель и двойная перерисовка подсказки.

## Правило для будущих помощников

Если helper-файл добавляется в `assets/js`, он должен быть явно подключён в одной из цепочек:

- напрямую из `index.html`;
- через `preprintSummary.js`;
- через `layoutExtrasSync.js`;
- через профильный helper вроде `qrSizeHint.js`;
- через импорт `qualityListUpdates.js`, если он реагирует на список замечаний.

Файл, который лежит в `assets/js`, но не подключён ожидаемым импортом, считается нерабочим.

Новый модуль, который только реагирует на изменения `#qualityList`, не должен создавать собственный `MutationObserver`. Он обязан использовать `subscribeQualityListUpdates()` и получить явный приоритет.

Если новый helper меняет поведение быстрых исправлений, печати, QR, фото, канала отклика или автоподстройки, нужно обновить не только эту карту, но и `docs/maintenance-guide.md`.
