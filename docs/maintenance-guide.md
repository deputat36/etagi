# Регламент сопровождения генератора

Документ для аккуратного развития проекта без поломок на GitHub Pages.

## Перед изменениями

1. Убедиться, что работа идёт в репозитории `deputat36/etagi`.
2. Проверить, какой файл меняется и зачем.
3. Если меняется существующий файл — сначала получить актуальную версию и `sha`.
4. Не обновлять один и тот же файл параллельно несколькими запросами.
5. Не создавать дублирующий проект рядом с основным генератором.
6. Если правка меняет смысл продукта, юридические обещания, бренд, сбор данных или крупную архитектуру — сначала согласовать решение.

## После изменений

### Быстрые статические проверки

```bash
npm run validate
```

Общий скрипт `validate` запускает `tools/run-validate.mjs`, который последовательно выполняет все команды `validate:*` из `package.json`.

Он включает:

```bash
npm run validate:templates
npm run validate:borisoglebsk-coverage
npm run validate:js
npm run validate:assets
npm run validate:asset-duplicates
npm run validate:runtime-architecture
npm run validate:quality-actions
npm run validate:quality-issue-actions
npm run validate:phone-cleanup-action
npm run validate:headline-placeholder-action
npm run validate:custom-block-density-action
npm run validate:contact-cta-density-action
npm run validate:tear-label-density-action
npm run validate:brand-density-action
npm run validate:meta-preservation-action
npm run validate:photo-intent-action
npm run validate:response-channel-action
npm run validate:suppressed-quality-items
npm run validate:quality-helper-imports
npm run validate:quality-regression-checklist
npm run validate:quality-helper-map
npm run validate:readme-quality-docs
npm run validate:qr-empty-direct-action
npm run validate:storage-safety
npm run validate:version-sync
npm run validate:package-scripts
npm run validate:changelog
npm run validate:layout-extras
npm run validate:layout-media-preservation
npm run validate:phone-helper
npm run validate:report-history-docs
npm run validate:newbie-mode-docs
npm run validate:ci-config
```

Список контролируется через `validate:package-scripts`: каждая команда `validate:*` из `package.json` должна быть указана в этом блоке без лишних и повторов.

### Браузерный smoke-тест

После изменений runtime, Wizard Flow, режимов, загрузки шаблонов или ключевых helper-модулей дополнительно запускать:

```bash
npm run smoke:browser
```

Smoke-тест:

- запускает временный локальный статический сервер;
- находит системный Chrome/Chromium;
- открывает приложение в headless-режиме;
- ждёт шаблоны и предпросмотр А4;
- переключает `Новичок`, `Быстро`, `Расширенно`;
- проверяет автозапуск Wizard Flow;
- проходит маршрут `Проверка → Задание → Отчёт`;
- не вызывает реальную системную печать.

Если Chrome/Chromium не найден, можно указать путь через переменную `CHROME_BIN`.

Если локально запустить проверки нельзя, в отчёте нужно честно указать, какие команды не запускались.

## Ручные проверки

Автоматическая проверка не заменяет ручной проход по интерфейсу.

Для режима `Новичок` использовать:

```text
docs/newbie-mode-regression-checklist.md
```

Для всего рабочего пути СПН использовать:

```text
docs/full-scenario-regression-checklist.md
```

Полный сценарий нужно проходить после изменений, которые затрагивают старт, выбор шаблона, Wizard Flow, печать, задание на расклейку, отчёт, историю отчётов, CSV или контроль качества.

## Что проверяет проект

### Шаблоны

Проверяются файлы `data/templates*.json`:

- ошибки JSON;
- обязательные поля;
- значения справочников;
- слишком длинные тексты;
- дубли идентификаторов;
- office-метаданные ключевых пакетов.

Отдельная проверка Борисоглебска контролирует:

- подключение основного и расширенного локальных пакетов;
- не менее 20 локальных сценариев;
- минимальное покрытие целей seller, buyer, object, newbuild, service, rent, brand и private;
- обязательные `templateId` и уникальные office-сценарии;
- теги `Борисоглебск`, `новичку`, `менеджер`, `рекомендовано` в соответствии с office-метаданными;
- запрет неподтверждённых обещаний готового покупателя, гарантированных сроков, цены, ипотеки и результата.

### JavaScript

Проверяются `assets/js/*.js` и `tools/*.mjs`. Проверка ловит синтаксические ошибки.

### Связи файлов и DOM

Проверяются:

- CSS и JS в `index.html`;
- файлы шаблонов из `assets/js/templates.js`;
- относительные `import` внутри JS-модулей;
- повторные локальные `script` и `stylesheet`;
- DOM-привязки формы из `fields`, `checks` и `blockVisibility`;
- прямые обращения `$('...')`;
- динамически создаваемые элементы.

### Runtime-архитектура

Проверяются:

- единый Promise-кеш `loadTemplates()`;
- отсутствие повторных сетевых загрузок шаблонов;
- отсутствие прямых `<script>` для helper-модулей, которые уже входят в `spnUiMode.js`;
- обязательные импорты постоянных SPN-helper-ов;
- актуальные тексты режимов;
- визуальное разделение цели и формата А4;
- наличие актуального master-аудита.

### Контроль качества

Проверяются:

- быстрые исправления замечаний;
- безопасные действия для QR, фото и канала отклика;
- отсутствие fallback-действий, выключающих фото или QR;
- подавленные замечания;
- сводка, фильтры, приоритет и печатные подсказки.

### Автоподстройка макета

Проверяются:

- обычная автоподстройка;
- кнопка «Подстроить, сохранив фото и QR»;
- сохранение `photoOne`, `photoTwo`, `qrLink`, `qrCaption`;
- режимы фото и подстройки;
- порядок и видимость блоков.

### Режим «Новичок»

Проверяются:

- подключение newbie-модулей;
- безопасный фильтр шаблонов;
- подсказки и notice готовности;
- локальная защита кнопки `Печать / PDF`;
- отсутствие глобального перехвата всех кликов;
- навигация `Проверка → Задание → Отчёт`;
- ручные чек-листы и README.

### История отчётов

Проверяются:

- сохранение отчёта;
- повтор расклейки;
- удаление ошибочной записи;
- CSV;
- автоматический вывод;
- фильтр истории;
- аналитика отдельных и устойчивых связок;
- сводка менеджеру за 7 дней, 30 дней и всю историю;
- документация.

### CI workflow

В `.github/workflows/validate.yml` должны быть два job:

```text
validate
browser-smoke
```

`validate` запускает `npm run validate`.

`browser-smoke`:

- зависит от успешного `validate` через `needs: validate`;
- запускает `npm run smoke:browser`;
- использует Node.js 20;
- имеет ограничение времени;
- работает с правами `contents: read`.

## Принципы безопасных исправлений

### QR

Если QR включён, но ссылка пустая, генератор не должен сам выключать QR. Нужно перевести пользователя к полю ссылки.

### Фото

Если фото включено, но файл не загружен, генератор не должен выключать блок фото или менять режим с двух фото на одно. Нужно перевести пользователя к загрузке.

### Канал отклика

Контакты нельзя включать вслепую при пустом или ошибочном телефоне. Сначала пользователь должен попасть к полю телефона.

### Дополнительный блок

Пустой дополнительный блок можно выключать прямым действием. Длинный блок нужно сокращать.

### Автоподстройка

Обычная автоподстройка может упростить макет ради читаемости. Мягкая кнопка должна сохранять включённые фото и QR.

### Режим «Новичок»

Новые newbie-helper-модули нельзя подключать пачкой без проверки. Нельзя возвращать глобальные обработчики всех кликов документа.

### Runtime-модули

Нельзя одновременно подключать один helper отдельным `<script type="module">` и импортировать его через `spnUiMode.js`.

Общие данные нескольких helper-модулей должны загружаться через общий кеш или runtime-контракт.

## GitHub Actions

Workflow запускается при изменениях `index.html`, `assets/**`, `data/**`, `help/**`, `docs/**`, `tools/**`, `README.md`, `package.json` и самого workflow.

Если GitHub Actions не возвращает статусы через connector, дополнительно проверяется combined status. Пустые результаты считаются ограничением наблюдаемости connector-а, а не доказательством отсутствия workflow.
