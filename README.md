# Генератор расклеек СПН «Этажи»

Статический инструмент для GitHub Pages. Цель — чтобы специалист по недвижимости быстро создавал макеты под разные задачи: куплю, продам, услуги, новостройки, аренда, личный бренд, частные объявления.

## Основной сценарий

1. Выбрать задачу.
2. Выбрать готовый шаблон.
3. Заменить имя, телефон, район, цену и параметры.
4. Добавить фото или QR при необходимости.
5. Проверить качество.
6. Напечатать или сохранить в PDF.

## Что уже умеет генератор

- шаблоны по задачам и сценариям;
- стартовые пустые шаблоны для нестандартных макетов;
- избранные шаблоны;
- счётчики шаблонов по сценариям;
- локальные шаблоны под Борисоглебск;
- отдельный пакет подъездных шаблонов;
- A/B-тестовые шаблоны;
- доверительные шаблоны для работы с возражениями;
- поиск по названию, тегам и видимому тексту макета;
- расширенные печатные пресеты: 1, 2, 3, 4, 6 и 8 макетов на А4;
- быстрые режимы с автоматической перестановкой блоков;
- мягкая автоподстройка, которая сохраняет включённые фото и QR;
- пошаговый маршрут работы для СПН;
- усиленная проверка плотных макетов 6–8 на А4;
- проверка телефона перед печатью и в контроле качества;
- сохранение профиля СПН;
- сохранение последнего макета;
- сохранение нескольких именованных макетов;
- сохранение расширенных настроек макета: призыв в контактах, подпись отрывных телефонов, брендовая строка;
- единый модуль `layoutExtras.js` для чтения, записи, импорта и экспорта расширенных настроек;
- корректный импорт JSON-макетов без смешивания со старым текущим макетом;
- восстановление расширенных настроек при импорте JSON;
- управление составом и порядком блоков;
- редактор контактного блока;
- настройка подписи отрывных телефонов;
- настройка брендовой строки;
- настоящий QR без внешнего сервера;
- подсказки по качеству макета;
- понятные метки замечаний контроля качества: ошибка, важно, совет;
- кликабельная сводка количества ошибок, важных замечаний и советов;
- фильтр замечаний контроля качества по уровню: все, ошибки, важно, советы;
- подсказка, какое замечание контроля качества исправить первым;
- визуальное состояние кнопки печати при ошибках и важных замечаниях;
- переход к первому критичному замечанию при попытке печати с ошибками;
- быстрые исправления заголовков, технических и продающих замечаний контроля качества;
- прямые безопасные действия для пустого QR, фото и отсутствующего канала отклика: выбранные блоки не выключаются автоматически, а пользователь переходит к нужному полю или включает контакты только при корректном телефоне;
- подавление дублирующих QR-замечаний в фильтрах, сводке, приоритете, печатной подсказке и сводке перед печатью;
- сводка перед печатью с телефоном, форматом листа, QR и названиями главных предупреждений;
- задание на расклейку для исполнителя;
- отчёт после расклейки и фиксация результата;
- HTML-центр помощи для СПН;
- проверки шаблонов, JS, связей файлов, дублей HTML-ассетов, сохранений, версий, changelog, расширенных полей, мягкой автоподстройки, helper телефона, helper-карты, README и действий замечаний качества через `npm run validate`.

## Структура

```text
index.html                              главная страница генератора
assets/css/app.css                      основной интерфейс
assets/css/ui-improvements.css          дополнительные стили интерфейса
assets/css/quality-level-labels.css     метки уровней замечаний качества
assets/css/quality-issue-summary.css    сводка количества замечаний качества
assets/css/preprint-summary.css         сводка перед печатью
assets/css/print.css                    стили печати А4
assets/js/app.js                        управление приложением
assets/js/state.js                      состояние и справочники
assets/js/templates.js                  загрузка и фильтрация шаблонов
assets/js/render.js                     рендер макетов
assets/js/quality.js                    контроль качества
assets/js/storage.js                    сохранение и загрузка
assets/js/qr.js                         генерация QR
assets/js/phone.js                      проверка и разбор телефона
assets/js/layoutRules.js                быстрые режимы и автоподстройка
assets/js/layoutExtras.js               единые расширенные поля макета
assets/js/layoutExtrasSync.js           восстановление расширенных настроек и подключение QR-helper
assets/js/qrSizeHint.js                 подключение страховки QR-подсказок
assets/js/qualityQrDeduplicate.js       подавление дублирующих QR-замечаний
assets/js/preprintSummary.js            сводка перед печатью
assets/js/spnClarityPanel.js            пошаговый маршрут работы
assets/js/spnContactEditor.js           редактор контактного блока
assets/js/spnTearOffEditor.js           настройка отрывных телефонов
assets/js/spnBrandEditor.js             настройка брендовой строки
assets/js/qualityLevelLabels.js         метки ошибка/важно/совет в контроле качества
assets/js/qualityIssueSummary.js        счётчики замечаний контроля качества
assets/js/qualityPriorityHint.js        подсказка первого исправления в контроле качества
assets/js/qualityPrintGuardHint.js      состояние кнопки печати по качеству макета
assets/js/qualityIssueFilters.js        фильтр замечаний контроля качества
assets/js/qualityExtraActions.js        быстрые исправления контроля качества, включая канал отклика, пустые QR и фото
assets/js/spnDistributionTaskHelper.js  задание на расклейку
assets/js/spnDistributionReportHelper.js отчёт после расклейки
data/templates.json                     базовая библиотека шаблонов
data/templates_custom.json              стартовые пустые шаблоны
data/templates_extra.json               расширенная библиотека шаблонов
data/templates_borisoglebsk.json        локальный пакет Борисоглебска
data/templates_entrance.json            подъездные шаблоны
data/templates_ab_tests.json            A/B-тестовые шаблоны
data/templates_trust.json               доверительные шаблоны
help/index.html                         центр помощи
help/quick-start.html                   быстрый старт СПН
help/field-test.html                    чек-лист полевого теста
help/ab-tests.html                      A/B-тесты
help/trust.html                         доверие и возражения
help/response-log.html                  лист учёта откликов
help/faq.html                           вопросы и ответы
help/call-script.html                   скрипт обработки отклика
help/lead-qualification.html            квалификация отклика
help/follow-up.html                     план повторного контакта
help/results-analysis.html              анализ результатов расклейки
docs/spn-quick-start.md                 быстрый старт для СПН
docs/field-test-checklist.md            чек-лист полевого теста расклеек
docs/template-authoring-guide.md        как добавлять шаблоны
docs/maintenance-guide.md               как сопровождать проект
docs/quality-helper-map.md              карта helper-модулей качества
docs/quality-regression-checklist.md    ручной чек-лист регрессии качества
docs/changelog.md                       история изменений
docs/audit-and-improvement-plan.md      аудит и план развития
tools/validate-templates.mjs            проверка шаблонов
tools/validate-js.mjs                   проверка JS
tools/validate-assets.mjs               проверка связей файлов
tools/validate-asset-duplicates.mjs     проверка дублей HTML-ассетов
tools/validate-quality-actions.mjs      проверка быстрых исправлений
tools/validate-quality-issue-actions.mjs проверка действий замечаний качества
tools/validate-photo-intent-action.mjs  проверка безопасного действия фото
tools/validate-response-channel-action.mjs проверка безопасного канала отклика
tools/validate-suppressed-quality-items.mjs проверка подавленных замечаний
tools/validate-quality-helper-imports.mjs проверка цепочки helper-импортов
tools/validate-quality-regression-checklist.mjs проверка чек-листа регрессии
tools/validate-quality-helper-map.mjs   проверка карты helper-модулей
tools/validate-readme-quality-docs.mjs  проверка README по helper-документации
tools/validate-qr-empty-direct-action.mjs проверка прямого действия пустого QR
tools/validate-storage-safety.mjs       проверка защиты браузерных сохранений
tools/validate-version-sync.mjs         проверка синхронизации версий
tools/validate-package-scripts.mjs      проверка подключения validate-скриптов
tools/validate-changelog.mjs            проверка истории изменений
tools/validate-layout-extras.mjs        проверка расширенных полей макета
tools/validate-layout-media-preservation.mjs проверка мягкой автоподстройки фото и QR
tools/validate-phone-helper.mjs         проверка общего helper телефона
```

## Проверка проекта

Перед публикацией изменений желательно запускать:

```bash
npm run validate
```

Общая проверка запускает все отдельные проверки:

```bash
npm run validate:templates
npm run validate:js
npm run validate:assets
npm run validate:asset-duplicates
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
```

## Документация

```text
docs/spn-quick-start.md              быстрый старт для СПН
docs/field-test-checklist.md         чек-лист полевого теста расклеек
docs/template-authoring-guide.md     как добавлять шаблоны
docs/maintenance-guide.md            как сопровождать проект
docs/quality-helper-map.md           карта helper-модулей качества
docs/quality-regression-checklist.md ручной чек-лист регрессии качества
docs/changelog.md                    история изменений
docs/audit-and-improvement-plan.md   аудит и план развития
```

## GitHub Pages

В настройках репозитория включите Pages: Deploy from branch → main → root.
