# Регламент сопровождения генератора

Документ для безопасного развития проекта `deputat36/etagi` без поломок на GitHub Pages.

## Перед изменениями

1. Получить актуальную версию файла и его `sha`.
2. Не обновлять один путь параллельными запросами.
3. Не создавать второй генератор рядом с основным.
4. Не менять юридические обещания, бренд, сбор данных и крупную архитектуру без отдельного решения.
5. Не удалять рабочую функцию только ради упрощения интерфейса.
6. Не считать проверку пройденной без фактического результата команды или GitHub Actions.

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
npm run validate:preview-quickbar
npm run validate:advanced-workbench
npm run validate:wizard-step-status
npm run validate:mobile-readability
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
npm run validate:workspace-backup
npm run validate:distribution-field-mode
npm run validate:version-sync
npm run validate:package-scripts
npm run validate:changelog
npm run validate:layout-extras
npm run validate:layout-media-preservation
npm run validate:phone-helper
npm run validate:report-history-docs
npm run validate:newbie-mode-docs
npm run validate:print-screenshots
npm run validate:ink-efficiency
npm run validate:ci-config
```

`validate:package-scripts` контролирует отсутствие пропусков, лишних команд и повторов в этом списке.

## Browser smoke

После изменений runtime, Wizard Flow, режимов, загрузчика, backup, задания, отчёта или печати запускать:

```bash
npm run smoke:browser
```

Smoke использует системный Chrome/Chromium без Playwright и Puppeteer. Он проверяет:

- загрузку шаблонов и листа А4;
- ранние и поздние runtime-ошибки;
- режимы `Новичок / Быстро / Расширенно`;
- маршрут `Проверка → Задание → Отчёт`;
- backup и мобильный режим исполнителя;
- keyboard/focus выбора компоновки;
- восемь компактных статусов мастера и итоги `До печати / После печати`;
- `newbuild_visual`, `photo_left`, `photo_card`, `agent_brand_photo`;
- переход `Частное → Фото СПН`;
- отсутствие обрезки планировки.

При падении создаётся `browser-smoke-failure.log`. Если Chrome не найден, путь задаётся через `CHROME_BIN`.

## Закреплённая панель предпросмотра

`spnPreviewQuickBar.js` улучшает существующий `previewStatus`, не создавая вторую сводку.

Панель:

- закрепляется внутри рабочей области;
- сохраняет показатели формата, компоновки, фото, цветности и качества;
- добавляет `aria-live="polite"`;
- на мобильном экране перестраивается в одну колонку;
- кнопкой `К печати` прокручивает боковую панель к разделу печати;
- переводит фокус на `Проверить`, а не запускает системную печать;
- не обходит print guard.

После изменений панели выполнять:

```bash
npm run validate:preview-quickbar
```

Ручной сценарий: `docs/preview-quickbar.md`.

## Рабочий блок после печати

`spnAdvancedWorkbench.js` объединяет три крупные операционные секции:

```text
План расклейки
Квалификация отклика
Итог теста расклейки
```

Модуль переносит существующие DOM-узлы внутрь одного `<details>`, а не создаёт копии. Поэтому обработчики, поля и журналы сохраняются.

Правила:

- в режиме `Расширенно` блок виден и по умолчанию закрыт;
- в режимах `Быстро` и `Новичок` контейнер полностью скрыт;
- состояние раскрытия хранится под проектным ключом и входит в backup;
- MutationObserver отключается после сборки или не позднее пяти секунд;
- запрещены `cloneNode`, бесконечные таймеры и глобальные click-перехваты.

После изменений выполнять:

```bash
npm run validate:advanced-workbench
```

Ручной сценарий: `docs/advanced-workbench.md`.

## Компактный статус шагов мастера

`spnWizardStepStatus.js` добавляет к восьми кнопкам мастера короткие метки состояния и два общих показателя:

```text
До печати
После печати
```

Правила:

- модуль не блокирует навигацию и печать;
- обязательность фото и QR включается только при выбранном медиа-сценарии;
- сохранение макета остаётся необязательным;
- задание и отчёт считаются отдельно от подготовки листа;
- обновления объединяются через `requestAnimationFrame`;
- события ограничены `.sidebar` и не используют глобальный click-перехват;
- новые ключи `localStorage` не создаются.

После изменений выполнять:

```bash
npm run validate:wizard-step-status
```

Ручной сценарий: `docs/wizard-step-status.md`.

## Мобильная читаемость рабочих подписей

На ширине до 520 px увеличиваются только важные для текущего действия подписи мастера и служебные отметки шаблонов. Desktop-размеры, печатный лист и данные пользователя не меняются.

После изменений выполнять:

```bash
npm run validate:mobile-readability
npm run smoke:browser
```

Ручной сценарий: `docs/mobile-readability.md`.

## Screenshot-регрессия печати

Локальная команда:

```bash
npm run screenshots:print
```

Для одного сценария:

```bash
PRINT_SCREENSHOT_SCENARIO=four-contacts npm run screenshots:print
```

Runner использует Chrome DevTools Protocol через `--remote-debugging-pipe`. Он опрашивает `captureStatus` командой `Runtime.evaluate` и вызывает `Page.captureScreenshot` только после фактического `data-status="passed"`. Снимок по фиксированному таймеру запрещён.

В GitHub Actions каждый лист запускается в отдельном изолированном matrix job Chrome:

```text
one-no-photo
two-big-phone
one-showcase
two-photo
four-contacts
```

Каждый job сохраняет PNG и метафайл. После пяти успешных job команда:

```bash
npm run screenshots:manifest
```

объединяет части, проверяет комплектность и создаёт общий `manifest.json`.

Итоговый artifact `print-screenshots` содержит пять PNG и хранится 7 дней. Частичные artifacts хранятся 1 день. При падении создаётся `print-screenshot-failure-<scenario>`.

Снимки проверяют:

- обрезку текста и фотографий;
- крупный телефон;
- контакты внутри карточек;
- правильное количество макетов;
- разумный расход чернил в плотном сценарии.

Подробности: `docs/print-screenshot-regression.md`.

## Оптимизация расхода чернил

Режим `Экономный цвет` сохраняет фотографии, QR, телефон и фирменный акцент, но облегчает большие повторяющиеся заливки:

- тёмная контактная плашка становится белой с цветной рамкой;
- логомарк становится контурным;
- затемняющий overlay фотокарточки становится светлым;
- крупные декоративные тени убираются.

Компоновки `Экономно` и `Подъезд` переключают исходный фирменный цвет на облегчённый до построения макета. Уже выбранные режимы `Чёрно-белый` и `Частное без бренда` не перезаписываются.

Для 4+ макетов с тёмной фирменной контактной зоной качество показывает рекомендацию `Повышенный расход чернил`. Переключение выполняется только по явному нажатию пользователя.

`four-contacts.png` обязан подтверждать светлый фон контактов, цветную рамку, тёмный читаемый телефон и отсутствие наложений. Подробности: `docs/ink-efficiency.md`.

## Инвентаризация шаблонов

```bash
npm run templates:inventory
```

Команда создаёт `docs/template-portfolio-inventory.generated.md` и показывает пакеты, цели, office-покрытие, жизненный цикл, вероятные дубли, исходные и итоговые ID.

## Система шаблонов

Исходные данные находятся в `data/templates*.json`. Дополнительные реестры:

```text
data/template_portfolio_status.json   жизненный цикл и замены
data/template_office_overrides.json   office-разметка
data/template_id_aliases.json         алиасы исторических повторов ID
```

`assets/js/templates.js` загружает пакеты и реестры одним Promise-кешем.

Правила:

- итоговый `templateId` уникален;
- неразрешённый повтор ID является ошибкой;
- `deprecated` имеет конечный рабочий `replacementId`;
- тестовый шаблон не выдаётся новичку как основной;
- высокий риск разрешён только уровню `manager`;
- шаблоны не удаляются автоматически из-за совместимости сохранений.

## Runtime-модули

Один helper нельзя одновременно подключать отдельным `<script type="module">` и импортировать через `spnUiMode.js`.

Новые модули должны:

- иметь ограниченную область событий и MutationObserver;
- использовать debounce или `requestAnimationFrame` при частых обновлениях;
- не добавлять глобальные перехваты всех кликов и клавиш;
- не создавать бесконечные таймеры;
- не менять данные пользователя без явного действия.

## Фото-компоновки

`photo_left`, `photo_card`, `newbuild_visual` и `agent_brand_photo` рассчитаны на 1–2 макета на А4.

Они должны:

- сохранять заполненный QR;
- не подставлять отсутствующее фото;
- сохранять крупный телефон;
- не обрезать планировку и портрет СПН;
- иметь отдельные печатные стили;
- проходить browser smoke и screenshot-проверку после значимых изменений.

## Backup рабочего пространства

`spnWorkspaceBackup.js` экспортирует все проектные ключи `localStorage` с префиксом `etagi-raskleyka-`.

Импорт поддерживает `merge` и `replace`, требует подтверждения замены и откатывает прежнее состояние при ошибке записи. Нельзя использовать `localStorage.clear()`, сетевую отправку или импорт сторонних ключей.

## Мобильное выполнение расклейки

Полевой режим хранит точки, статус, план и факт листов, отметку фотоотчёта и проблемы локально. Он не хранит фотографии/base64, не завершает задание без фактического количества листов и не затирает прежние заметки отчёта.

## Ручные чек-листы

```text
docs/full-scenario-regression-checklist.md
docs/newbie-mode-regression-checklist.md
docs/photo-layout-modes.md
docs/layout-mode-accessibility-checklist.md
docs/preview-quickbar.md
docs/advanced-workbench.md
docs/wizard-step-status.md
docs/mobile-readability.md
docs/workspace-backup-regression-checklist.md
docs/distribution-field-mode-regression-checklist.md
docs/print-screenshot-regression.md
docs/ink-efficiency.md
```

## GitHub Actions

Workflow выполняет:

```text
validate → browser-smoke → 5 изолированных print-screenshot job → collect-print-screenshots
```

Artifacts ошибок хранятся 3 дня, части PNG — 1 день, итоговый комплект — 7 дней. Если connector не возвращает runs или combined status, это ограничение наблюдаемости, а не подтверждение успешной проверки.
