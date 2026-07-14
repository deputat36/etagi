# Контрольный CI office-политики базовых шаблонов продавца

Проверяется актуальный `main` после первой партии разметки `data/templates.json`.

Ожидается:

- семь прямых заявлений о подтверждённом спросе имеют `test / manager / high`;
- `seller_price_check` имеет `working / newbie / low / recommended`;
- `validate:template-office-overrides` проходит;
- browser smoke и печатная матрица не меняются.

PR служебный. Полезные изменения уже находятся в `main`.
