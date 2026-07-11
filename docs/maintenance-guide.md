# Регламент сопровождения генератора

Документ для безопасного развития проекта `deputat36/etagi` без поломок на GitHub Pages.

## Перед изменениями

1. Получить актуальную версию файла и его `sha`.
2. Не обновлять один путь параллельными запросами.
3. Не создавать дублирующий генератор рядом с основным.
4. Не менять юридические обещания, бренд, сбор данных и крупную архитектуру без отдельного решения.
5. Не удалять рабочую функцию только ради упрощения интерфейса.

## Обязательная статическая проверка

```bash
npm run validate
```

Общий скрипт запускает `tools/run-validate.mjs` и автоматически выполняет все команды `validate:*` из `package.json` в объявленном порядке.

Она включает все проверки из `package.json`, включая:

```bash
npm run validate:templates
npm run validate:template-id-aliases
npm run validate:borisoglebsk-coverage
npm run validate:template-portfolio
npm run validate:template-office-overrides
npm run validate:photo-layout-modes
npm run validate:newbuild-visual-layout
npm run validate:agent-brand-photo-layout
npm run validate:agent-brand-mode-guard
npm run validate:layout-mode-accessibility
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

`validate:package-scripts` контролирует отсутствие пропусков, лишних команд и повторов в этом списке.

## Инвентаризация шаблонов

При ревизии библиотеки запускать:

```bash
npm run templates:inventory
```

Команда создаёт `docs/template-portfolio-inventory.generated.md` и показывает:

- количество шаблонов по пакетам и целям;
- покрытие office-метаданными;
- статусы `working / test / deprecated`;
- вероятные смысловые дубли;
- одинаковые заголовки и повторяющиеся сценарии;
- устаревшие варианты и их рабочие замены;
- исходные ID, итоговые ID и применённые пакетные алиасы.

## Browser smoke

После изменений runtime, загрузчика шаблонов, Wizard Flow, режимов, печати или ключевых helper-модулей запускать:

```bash
npm run smoke:browser
```

Smoke-тест:

- запускает локальный статический сервер;
- использует системный Chrome/Chromium и запускает его асинхронно, чтобы локальный сервер продолжал отвечать;
- устанавливает ранний capture-hook ошибок при `?smoke=1`;
- ждёт шаблоны и лист А4;
- проверяет отсутствие ранних и поздних runtime-ошибок;
- переключает режимы `Новичок`, `Быстро`, `Расширенно`;
- проверяет автозапуск Wizard Flow;
- проходит маршрут `Проверка → Задание → Отчёт`;
- проверяет клавиатурный выбор компоновки через `End`, `Home` и `ArrowRight`;
- проверяет переход `Частное → Фото СПН`;
- не вызывает системную печать.

Если Chrome не найден, путь задаётся через `CHROME_BIN`.

Не заменяйте асинхронный запуск Chrome на `spawnSync`: синхронный процесс блокирует event loop Node.js, локальный сервер перестаёт отдавать `index.html`, а CI завершается по тайм-ауту.

## Ручные проверки

Для режима новичка:

```text
docs/newbie-mode-regression-checklist.md
```

Для полного рабочего пути:

```text
docs/full-scenario-regression-checklist.md
```

Для фото-компоновок:

```text
docs/photo-layout-modes.md
```

Для keyboard/focus выбора компоновки:

```text
docs/layout-mode-accessibility-checklist.md
```

Ручной проход обязателен после изменений старта, выбора шаблона, печати, задания, отчётов, CSV, качества, фото-компоновок и навигации мастера.

## Система шаблонов

Исходные шаблоны находятся в `data/templates*.json`.

Дополнительные метаданные хранятся отдельно:

```text
data/template_portfolio_status.json   жизненный цикл и замены
data/template_office_overrides.json  office-разметка без переписывания больших пакетов
data/template_id_aliases.json        пакетные алиасы повторяющихся исходных ID
```

`assets/js/templates.js` загружает пакеты и три реестра одним общим Promise-кешем.

### Уникальность ID

Каждый итоговый `templateId` обязан быть уникальным во всей библиотеке.

Если два исторических пакета содержат одинаковый исходный ID, более поздний вариант получает явный пакетный алиас в `template_id_aliases.json`. Загрузчик:

1. применяет portfolio и office-правила по исходному ID;
2. назначает итоговый уникальный ID;
3. сохраняет `sourceId` и `sourcePackage` для трассировки;
4. не позволяет более позднему пакету молча перезаписать раннюю карточку.

Новый неразрешённый повтор считается ошибкой `validate:template-id-aliases`, а не допустимым предупреждением.

### Жизненный цикл

```text
working      основной рабочий вариант
test         контролируемый тест или сценарий, требующий актуализации
deprecated   сохранённый для совместимости устаревший вариант
```

Для `deprecated` обязателен конечный `replacementId` со статусом `working`. Нельзя создавать циклы, ссылку на себя или замену другим тестовым/устаревшим шаблоном.

Устаревший шаблон не удаляется автоматически: сохранённые макеты должны продолжать открываться.

### Office-overrides

Реестр `template_office_overrides.json` добавляет к существующему шаблону:

- поисковые теги;
- уровень `newbie / experienced / manager`;
- риск `low / medium / high`;
- office-сценарий;
- рекомендованный формат А4;
- заметку менеджера.

Разметку нельзя добавлять устаревшему шаблону. Высокий риск разрешён только уровню `manager`. Тестовый шаблон должен иметь тег `тестовый`.

## Фото-компоновки

Режимы `photo_left`, `photo_card`, `newbuild_visual` и `agent_brand_photo` определены в `state.js`, применяются через `layoutRules.js` и оформляются модулем `spnPhotoLayoutStyle.js`.

Все четыре режима:

- ограничивают результат 1–2 макетами на А4;
- сохраняют заполненный QR;
- не подставляют отсутствующее фото;
- оставляют телефон и основные характеристики;
- имеют отдельные печатные правила;
- проверяются командой `validate:photo-layout-modes`.

`photo_left` размещает изображение слева и текст справа. `photo_card` накладывает заголовок на обычное фото, но не накладывает его на планировку.

`newbuild_visual` размещает крупный фасад и необрезанную планировку, сохраняет 1–2 макета на А4 и отдельно проверяется командой `validate:newbuild-visual-layout`.

`agent_brand_photo` размещает необрезанный портрет СПН рядом с именем, пользой и крупным телефоном и отдельно проверяется командой `validate:agent-brand-photo-layout`.

При переходе из режима `private` в `agent_brand_photo` scoped-helper `spnAgentBrandModeGuard.js` возвращает фирменный цвет и логотип. Он не меняет фото, QR, телефон, текст или количество макетов. Контракт проверяется `validate:agent-brand-mode-guard` и browser smoke.

## Доступность выбора компоновки

`spnLayoutModeAccessibility.js` работает только внутри `#layoutModeGrid`.

Он добавляет:

- `role="radiogroup"` для сетки;
- `role="radio"` и `aria-checked` для кнопок;
- roving `tabindex` — в Tab-порядке остаётся только выбранная компоновка;
- стрелки, `Home` и `End`;
- заметный `focus-visible`;
- увеличенные подписи и минимальную высоту кнопки на мобильном экране.

Helper не добавляет глобальный `keydown` на `document` или `window`. Контракт проверяется `validate:layout-mode-accessibility`, browser smoke и ручным чек-листом.

## Что контролируют проверки

### Шаблоны

- корректность JSON и обязательных полей;
- допустимые справочники;
- уникальность итоговых `templateId`;
- пакетные алиасы исторических повторов;
- уникальность office-сценариев;
- длину текстов;
- локальное покрытие Борисоглебска;
- опасные неподтверждённые обещания;
- жизненный цикл и конечные замены;
- корректность office-overrides.

### Runtime

- единый Promise-кеш `loadTemplates()`;
- отсутствие дублирующих точек подключения;
- существование импортов, CSS, JSON и DOM-id;
- актуальные режимы интерфейса;
- безопасное объединение метаданных шаблонов;
- восстановление фирменности брендового фото-режима после частного макета;
- keyboard/focus и ARIA-состояние выбора компоновки.

### Контроль качества

- быстрые исправления замечаний;
- отсутствие действий, самовольно выключающих фото или QR;
- сохранение фото и QR при мягкой автоподстройке;
- фильтры, приоритеты и печатные подсказки.

### Отчёты

- сохранение, повтор и удаление ошибочной записи;
- CSV;
- отдельные и устойчивые связки;
- сводку менеджеру за 7 дней, 30 дней и всю историю.

## Принципы безопасных исправлений

### QR и фото

Пустой QR должен вести к полю ссылки, а пустое фото — к загрузке. Нельзя автоматически выключать эти блоки.

### Канал отклика

Контакты нельзя включать вслепую при пустом или ошибочном телефоне.

### Режим новичка

Нельзя подключать новые newbie-helper-модули пачкой или возвращать глобальный перехват всех кликов документа.

### Runtime-модули

Один helper нельзя одновременно подключать отдельным `<script type="module">` и импортировать через `spnUiMode.js`.

### Статусы шаблонов

Тестовый шаблон не выдаётся новичку как основной. Устаревший сначала получает причину и рабочую замену, а не удаляется.

## GitHub Actions

Workflow запускается при изменениях `index.html`, `assets/**`, `data/**`, `help/**`, `docs/**`, `tools/**`, `README.md`, `package.json` и самого workflow.

Если connector не возвращает workflow runs или combined status, это считается ограничением наблюдаемости, а не подтверждением успешной проверки. В отчёте нужно честно указать, какие команды фактически не запускались.
