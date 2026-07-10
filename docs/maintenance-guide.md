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

Запустить общую проверку:

```bash
npm run validate
```

Общий скрипт `validate` запускает `tools/run-validate.mjs`, который последовательно выполняет все команды `validate:*` из `package.json`.

Она включает все проверки из `package.json`, включая:

```bash
npm run validate:templates
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

Список выше контролируется через `validate:package-scripts`: каждая команда `validate:*` из `package.json` должна быть указана в этом блоке без лишних и повторов.

Если локально запустить проверки нельзя, в отчёте нужно честно написать, что локальный `npm run validate` не запускался.

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

Проверяются файлы:

```text
data/templates*.json
```

Проверка ищет:

- ошибки JSON;
- отсутствующие обязательные поля;
- неизвестные значения справочников;
- слишком длинные тексты;
- дубли идентификаторов.

### JavaScript

Проверяются файлы:

```text
assets/js/*.js
tools/*.mjs
```

Проверка ловит синтаксические ошибки.

### Связи файлов и DOM

Проверяются:

- CSS и JS в `index.html`;
- файлы шаблонов из `assets/js/templates.js`;
- относительные `import` внутри JS-модулей;
- повторное подключение локальных `script` и `stylesheet` в HTML;
- DOM-привязки формы из `fields`, `checks` и `blockVisibility` в `assets/js/app.js`;
- прямые обращения `$('...')` из `assets/js/app.js` к элементам страницы;
- динамически создаваемые элементы, которые не должны требоваться в исходном HTML.

### Runtime-архитектура

Проверяются:

- единый Promise-кеш `loadTemplates()`;
- отсутствие повторных сетевых загрузок шаблонов разными helper-модулями;
- отсутствие прямых `<script>` для helper-модулей, которые уже входят в `spnUiMode.js`;
- обязательные импорты постоянных SPN-helper-ов;
- актуальные тексты режимов интерфейса;
- наличие актуального master-аудита и runtime-плана.

### Контроль качества

Проверяются:

- быстрые исправления замечаний качества;
- прямые безопасные действия для QR, фото и канала отклика;
- отдельные прямые действия для очистки телефона, placeholder заголовка, плотности доп. блока, контактного призыва, подписи отрывных, бренда и сохранения параметров;
- отсутствие старых fallback-действий, которые могли выключить фото, QR или включить контакты без проверки;
- подавленные замечания качества;
- сводка, фильтры, приоритет и печать с учётом подавленных замечаний.

### Автоподстройка макета

Проверяются:

- обычная автоподстройка;
- мягкая кнопка «Подстроить, сохранив фото и QR»;
- сохранение `photoOne`, `photoTwo`, `qrLink` и `qrCaption`;
- пустой включённый QR;
- режимы фото и режимы подстройки из `assets/js/state.js`;
- порядок блоков, подписи блоков и переключатели видимости.

### Режим «Новичок»

Проверяются:

- подключение ключевых newbie-модулей в `assets/js/spnUiMode.js`;
- безопасный фильтр шаблонов и скрытие рискованных карточек;
- наличие подсказок печати, финальной проверки и notice готовности;
- локальная защита печати только на кнопке `Печать / PDF`;
- отсутствие старого глобального перехвата кликов `document.addEventListener('click', handlePrintGuard, true)`;
- устойчивость патча мастера шагов для режима `Новичок`;
- наличие ручного чек-листа `docs/newbie-mode-regression-checklist.md`;
- наличие полного чек-листа `docs/full-scenario-regression-checklist.md`;
- описание режима и чек-листа в README.

### История отчётов

Проверяются:

- наличие блока истории в `assets/js/spnDistributionReportHelper.js`;
- сохранение отчёта в историю;
- повтор прошлой расклейки;
- CSV-экспорт;
- автоматический вывод по результату;
- описание истории в README и документации.

### CI workflow

Проверяется файл `.github/workflows/validate.yml`:

- запуск на `push`;
- запуск на `pull_request`;
- ручной запуск через `workflow_dispatch`;
- отслеживаемые пути проекта;
- права `contents: read`;
- Node.js 20;
- `timeout-minutes: 5`;
- запуск `npm run validate`.

## Принципы безопасных исправлений

### QR

Если QR включён, но ссылка пустая, генератор не должен сам выключать QR. Правильное действие — перевести пользователя к полю ссылки.

### Фото

Если фото включено, но файл не загружен, генератор не должен сам выключать блок фото и не должен сам переключать режим с двух фото на одно. Правильное действие — перевести пользователя к нужному полю загрузки.

### Канал отклика

Если нет канала отклика, контакты нельзя включать вслепую при пустом, неполном или ошибочном телефоне. Правильное действие — сначала перевести пользователя к телефону.

### Дополнительный блок

Пустой дополнительный блок можно выключать прямым действием. Длинный дополнительный блок нужно сокращать, а не просто включать заново.

### Автоподстройка

Старая кнопка «Подстроить автоматически» сохраняет прежнее право упростить макет ради читаемости. Мягкая кнопка должна сохранять уже включённые фото и QR.

### Режим «Новичок»

Новые helper-модули режима `Новичок` нельзя подключать пачкой без проверки. Каждый модуль должен добавляться отдельным коммитом или после отдельной оценки риска.

Нельзя возвращать глобальные обработчики, которые перехватывают все клики документа и мешают основному интерфейсу. Защита печати должна работать локально и только для кнопки `Печать / PDF`.

Если меняются `spnUiMode.js`, `spnNewbie*.js`, `spnWizardFlow.js` или `spnPhotoLayoutStyle.js`, после автоматической проверки нужно пройти ручной чек-лист `docs/newbie-mode-regression-checklist.md`.

Если меняются Wizard Flow, печать, задание, отчёт или история отчётов, после автоматической проверки нужно пройти полный сценарий `docs/full-scenario-regression-checklist.md`.

### Runtime-модули

Нельзя одновременно подключать один helper отдельным `<script type="module">` и импортировать его через `spnUiMode.js`.

Общие данные, которые используют несколько helper-модулей, должны загружаться через общий кеш или единый runtime-контракт. Нельзя запускать повторные запросы только потому, что каждый helper инициализируется отдельно.

## GitHub Actions

Workflow находится здесь:

```text
.github/workflows/validate.yml
```

Он запускается при изменениях:

```text
index.html
assets/**
data/**
help/**
docs/**
tools/**
README.md
package.json
.github/workflows/validate.yml
```

Workflow должен запускать `npm run validate` на Node.js 20, иметь права только на чтение `contents: read` и ограничение времени выполнения, чтобы зависшая проверка не висела бесконечно.

Если GitHub Actions не возвращает статусы или workflow-runs через connector, это нужно явно указать в отчёте. Для push-коммитов дополнительно проверять combined status. Если и `workflow_runs`, и combined status пустые, считать это ограничением наблюдаемости через connector, а не автоматическим доказательством, что workflow не настроен.
