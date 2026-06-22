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
- пошаговый маршрут работы для СПН;
- усиленная проверка плотных макетов 6–8 на А4;
- сохранение профиля СПН;
- сохранение именованных макетов;
- сохранение расширенных настроек макета: призыв в контактах, подпись отрывных телефонов, брендовая строка;
- управление составом и порядком блоков;
- редактор контактного блока;
- настройка подписи отрывных телефонов;
- настройка брендовой строки;
- настоящий QR без внешнего сервера;
- подсказки по качеству макета;
- сводка перед печатью с телефоном, форматом листа, QR и главными предупреждениями;
- задание на расклейку для исполнителя;
- отчёт после расклейки и фиксация результата;
- HTML-центр помощи для СПН;
- проверка шаблонов, JS и связей файлов через `npm run validate`.

## Структура

```text
index.html                         главная страница генератора
assets/css/app.css                 основной интерфейс
assets/css/ui-improvements.css     дополнительные стили интерфейса
assets/css/preprint-summary.css    сводка перед печатью
assets/css/print.css               стили печати А4
assets/js/app.js                   управление приложением
assets/js/state.js                 состояние и справочники
assets/js/templates.js             загрузка и фильтрация шаблонов
assets/js/render.js                рендер макетов
assets/js/quality.js               контроль качества
assets/js/storage.js               сохранение и загрузка
assets/js/qr.js                    генерация QR
assets/js/layoutRules.js           быстрые режимы и автоподстройка
assets/js/preprintSummary.js       сводка перед печатью
assets/js/spnClarityPanel.js       пошаговый маршрут работы
assets/js/spnContactEditor.js      редактор контактного блока
assets/js/spnTearOffEditor.js      настройка отрывных телефонов
assets/js/spnBrandEditor.js        настройка брендовой строки
assets/js/spnDistributionTaskHelper.js  задание на расклейку
assets/js/spnDistributionReportHelper.js отчёт после расклейки
data/templates.json                базовая библиотека шаблонов
data/templates_custom.json         стартовые пустые шаблоны
data/templates_extra.json          расширенная библиотека шаблонов
data/templates_borisoglebsk.json   локальный пакет Борисоглебска
data/templates_entrance.json       подъездные шаблоны
data/templates_ab_tests.json       A/B-тестовые шаблоны
data/templates_trust.json          доверительные шаблоны
help/index.html                    центр помощи
help/quick-start.html              быстрый старт СПН
help/field-test.html               чек-лист полевого теста
help/ab-tests.html                 A/B-тесты
help/trust.html                    доверие и возражения
help/response-log.html             лист учёта откликов
help/faq.html                      вопросы и ответы
help/call-script.html              скрипт обработки отклика
help/lead-qualification.html       квалификация отклика
help/follow-up.html                план повторного контакта
help/results-analysis.html         анализ результатов расклейки
tools/validate-templates.mjs       проверка шаблонов
tools/validate-js.mjs              проверка JS
tools/validate-assets.mjs          проверка связей файлов
```

## Проверка проекта

Перед публикацией изменений желательно запускать:

```bash
npm run validate
```

Отдельные проверки:

```bash
npm run validate:templates
npm run validate:js
npm run validate:assets
```

## Документация

```text
docs/spn-quick-start.md            быстрый старт для СПН
docs/field-test-checklist.md       чек-лист полевого теста расклеек
docs/template-authoring-guide.md   как добавлять шаблоны
docs/maintenance-guide.md          как сопровождать проект
docs/changelog.md                  история изменений
docs/audit-and-improvement-plan.md аудит и план развития
```

## GitHub Pages

В настройках репозитория включите Pages: Deploy from branch → main → root.
