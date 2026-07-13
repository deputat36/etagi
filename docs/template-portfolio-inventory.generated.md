# Автоматическая инвентаризация библиотеки шаблонов

Сформировано: 2026-07-13T07:17:26.697Z

## Общий итог

- файлов шаблонов: 10;
- шаблонов: 117;
- с office-метаданными: 55 (47%);
- получили office через overrides: 15;
- получили уникальный ID через aliases: 4;
- office-рекомендованных: 45;
- без office-метаданных: 62;
- рабочих: 95;
- тестовых: 13;
- устаревших: 9;
- исходных повторяющихся id: 4;
- неразрешённых итоговых id: 0;
- повторяющихся office-сценариев: 2;
- одинаковых нормализованных заголовков: 10;
- вероятных смысловых дублей: 0.

## По пакетам

| Пакет | Количество |
|---|---:|
| templates.json | 42 |
| templates_extra.json | 17 |
| templates_borisoglebsk_expanded.json | 12 |
| templates_borisoglebsk.json | 9 |
| templates_entrance.json | 8 |
| templates_ab_tests.json | 6 |
| templates_custom.json | 6 |
| templates_sales.json | 6 |
| templates_trust.json | 6 |
| templates_tellerman_sad.json | 5 |

## По целям

| Цель | Количество |
|---|---:|
| seller | 32 |
| object | 20 |
| service | 15 |
| buyer | 13 |
| newbuild | 13 |
| private | 10 |
| rent | 7 |
| brand | 5 |
| all | 2 |

## Жизненный цикл

| Статус | Количество |
|---|---:|
| working | 95 |
| test | 13 |
| deprecated | 9 |

## Office-уровни

| Уровень | Количество |
|---|---:|
| manager | 28 |
| newbie | 26 |
| experienced | 1 |

## Office-риски

| Риск | Количество |
|---|---:|
| medium | 24 |
| low | 21 |
| high | 10 |

## Пакетные алиасы ID

| Итоговый ID | Исходный ID | Пакет |
|---|---|---|
| extra_brand_area_expert | brand_area_expert | templates_extra.json |
| extra_private_buy_flat | private_buy_flat | templates_extra.json |
| extra_private_sell_flat | private_sell_flat | templates_extra.json |
| extra_service_safe_deal | service_safe_deal | templates_extra.json |

## Исходные повторяющиеся ID

### brand_area_expert

- brand_area_expert — Ваш специалист по району (templates.json, deprecated);
- extra_brand_area_expert — Ваш специалист по району (templates_extra.json, deprecated, alias brand_area_expert → extra_brand_area_expert);

### private_buy_flat

- private_buy_flat — Частное: куплю квартиру (templates.json, test, office override);
- extra_private_buy_flat — Частное: куплю квартиру (templates_extra.json, test, office override, alias private_buy_flat → extra_private_buy_flat);

### private_sell_flat

- private_sell_flat — Частное: продам квартиру (templates.json, test, office override);
- extra_private_sell_flat — Частное: продаётся квартира (templates_extra.json, test, office override, alias private_sell_flat → extra_private_sell_flat);

### service_safe_deal

- service_safe_deal — Безопасная сделка (templates.json, deprecated);
- extra_service_safe_deal — Безопасная сделка (templates_extra.json, deprecated, alias service_safe_deal → extra_service_safe_deal);

## Неразрешённые итоговые ID

Повторы не найдены.

## Пакеты без полного office-покрытия

| Пакет | Всего | С office | Через overrides | Покрытие | Тест | Устарело |
|---|---:|---:|---:|---:|---:|---:|
| templates.json | 42 | 2 | 2 | 5% | 2 | 2 |
| templates_ab_tests.json | 6 | 0 | 0 | 0% | 6 | 0 |
| templates_borisoglebsk.json | 9 | 9 | 0 | 100% | 0 | 0 |
| templates_borisoglebsk_expanded.json | 12 | 12 | 0 | 100% | 0 | 0 |
| templates_custom.json | 6 | 0 | 0 | 0% | 0 | 0 |
| templates_entrance.json | 8 | 8 | 0 | 100% | 0 | 0 |
| templates_extra.json | 17 | 10 | 10 | 59% | 5 | 7 |
| templates_sales.json | 6 | 6 | 0 | 100% | 0 | 0 |
| templates_tellerman_sad.json | 5 | 5 | 0 | 100% | 0 | 0 |
| templates_trust.json | 6 | 3 | 3 | 50% | 0 | 0 |

## Устаревшие шаблоны и замены

| Шаблон | Пакет | Причина | Замена |
|---|---|---|---|
| extra_brand_area_expert — Ваш специалист по району | templates_extra.json | Заменён локальным брендовым шаблоном с фотографией СПН, QR и понятной географией работы. | bgo_brand_local_specialist |
| extra_service_safe_deal — Безопасная сделка | templates_extra.json | Продающий пакет содержит актуальную версию с office-метаданными и обязательной проверкой сложных юридических формулировок. | sales_service_safe_deal |
| object_commercial_space — Коммерческое помещение | templates_extra.json | Локальный объектный шаблон точнее контролирует назначение, вход, коммуникации, ограничения и условия сделки. | bgo_object_commercial_space |
| rent_find_tenant — Сдам квартиру аккуратным жильцам | templates_extra.json | Заменён локальным сценарием помощи собственнику с арендой, где явно контролируются условия услуги и комиссии. | bgo_rent_owner_flat |
| seller_inherited_flat — Наследственная квартира | templates_extra.json | Заменён локальным сценарием наследства с обязательной менеджерской проверкой и безопасной юридической формулировкой. | bgo_service_inheritance_sale_plan |
| seller_sell_buy_chain — Продать и купить взамен | templates_extra.json | Заменён более конкретным сценарием альтернативной продажи и покупки с office-риском и заметкой менеджера. | bgo_seller_exchange_larger_home |
| seller_thinking_about_sale — Думаете о продаже? | templates_extra.json | Смысловой дубль. Продающий вариант имеет office-метаданные, понятный уровень риска и более крупный телефон. | sales_seller_owner_price_hook |
| brand_area_expert — Ваш специалист по району | templates.json | Заменён локальным брендовым шаблоном с фотографией СПН, QR и понятной географией работы. | bgo_brand_local_specialist |
| service_safe_deal — Безопасная сделка | templates.json | Продающий пакет содержит актуальную версию с office-метаданными и обязательной проверкой сложных юридических формулировок. | sales_service_safe_deal |

## Тестовые шаблоны

| Шаблон | Пакет | Причина | Замена |
|---|---|---|---|
| ab_buyer_family_area — Тест: семья ищет район | templates_ab_tests.json | A/B-вариант предназначен для контролируемого теста и сравнения результатов, а не для выдачи новичку как основной шаблон. | — |
| ab_object_neighbor_sold — Тест: продаётся рядом | templates_ab_tests.json | A/B-вариант предназначен для контролируемого теста и сравнения результатов, а не для выдачи новичку как основной шаблон. | — |
| ab_owner_direct_buyer — Тест: есть покупатель | templates_ab_tests.json | A/B-вариант предназначен для контролируемого теста и сравнения результатов, а не для выдачи новичку как основной шаблон. | — |
| ab_owner_private_note — Тест: частная записка | templates_ab_tests.json | A/B-вариант предназначен для контролируемого теста и сравнения результатов, а не для выдачи новичку как основной шаблон. | — |
| ab_owner_soft_price_check — Тест: мягкая оценка цены | templates_ab_tests.json | A/B-вариант предназначен для контролируемого теста и сравнения результатов, а не для выдачи новичку как основной шаблон. | — |
| ab_service_after_viewing — Тест: после просмотра рынка | templates_ab_tests.json | A/B-вариант предназначен для контролируемого теста и сравнения результатов, а не для выдачи новичку как основной шаблон. | — |
| buyer_maternity_capital — Квартира с маткапиталом | templates_extra.json | Сценарий полезен, но условия использования материнского капитала требуют актуальной проверки перед массовой печатью. | — |
| extra_private_buy_flat — Частное: куплю квартиру | templates_extra.json | Частный макет без бренда применяется только по согласованной офисной задаче и после проверки менеджером. | — |
| extra_private_sell_flat — Частное: продаётся квартира | templates_extra.json | Частный объектный макет без бренда требует проверки цены, характеристик, фото и соответствия офисной политике. | — |
| newbuild_family_mortgage — Новостройка и семейная ипотека | templates_extra.json | Условия семейной ипотеки меняются. Перед использованием требуется проверка актуальных условий и менеджерская адаптация текста. | — |
| seller_empty_flat — Куплю пустующую квартиру | templates_extra.json | Сценарий пустующей квартиры полезен, но заголовок «Куплю» допустим только при подтверждённом спросе и после проверки менеджером. | — |
| private_buy_flat — Частное: куплю квартиру | templates.json | Частный макет без бренда применяется только по согласованной офисной задаче и после проверки менеджером. | — |
| private_sell_flat — Частное: продам квартиру | templates.json | Частный объектный макет без бренда требует проверки цены, характеристик, фото и соответствия офисной политике. | — |

## Вероятные смысловые дубли

Вероятные смысловые дубли не найдены.

## Одинаковые заголовки

### куплю дом

- seller_buy_house — Куплю дом (templates.json, working);
- private_buy_house — Частное: куплю дом (templates.json, working);
- bgo_private_buy_house — Частное: куплю дом в Борисоглебске (templates_borisoglebsk.json, working);

### куплю квартиру

- private_buy_flat — Частное: куплю квартиру (templates.json, test, office override);
- seller_micro_4 — Микро: куплю квартиру (templates.json, working);
- extra_private_buy_flat — Частное: куплю квартиру (templates_extra.json, test, office override, alias private_buy_flat → extra_private_buy_flat);

### безопасная сделка с недвижимостью

- service_safe_deal — Безопасная сделка (templates.json, deprecated);
- extra_service_safe_deal — Безопасная сделка (templates_extra.json, deprecated, alias service_safe_deal → extra_service_safe_deal);

### ваш специалист по району

- brand_area_expert — Ваш специалист по району (templates.json, deprecated);
- extra_brand_area_expert — Ваш специалист по району (templates_extra.json, deprecated, alias brand_area_expert → extra_brand_area_expert);

### коммерческое помещение

- bgo_object_commercial_space — Борисоглебск: коммерческое помещение (templates_borisoglebsk_expanded.json, working);
- object_commercial_space — Коммерческое помещение (templates_extra.json, deprecated);

### куплю квартиру в этом доме

- ab_owner_private_note — Тест: частная записка (templates_ab_tests.json, test);
- entrance_seller_neighbors_buy — Подъезд: куплю у соседей (templates_entrance.json, working);

### продается дом

- object_house_two — Дом: фасад + участок (templates.json, working);
- bgo_object_private_house — Борисоглебск: дом в частном секторе (templates_borisoglebsk.json, working);

### продается квартира

- object_flat_photo — Продам квартиру с фото (templates.json, working);
- extra_private_sell_flat — Частное: продаётся квартира (templates_extra.json, test, office override, alias private_sell_flat → extra_private_sell_flat);

### продается объект

- object_big_photo — Большое фото + телефон (templates.json, working);
- custom_object_photo_showcase — Пустой: объект с фото (templates_custom.json, working);

### сколько стоит ваша квартира?

- seller_price_check — Сколько стоит ваша квартира? (templates.json, working);
- ab_owner_soft_price_check — Тест: мягкая оценка цены (templates_ab_tests.json, test);

## Повторяющиеся office-сценарии

### extra_private_buy_flat

- private_buy_flat — Частное: куплю квартиру (templates.json, test, office override);
- extra_private_buy_flat — Частное: куплю квартиру (templates_extra.json, test, office override, alias private_buy_flat → extra_private_buy_flat);

### extra_private_sell_flat

- private_sell_flat — Частное: продам квартиру (templates.json, test, office override);
- extra_private_sell_flat — Частное: продаётся квартира (templates_extra.json, test, office override, alias private_sell_flat → extra_private_sell_flat);

## Шаблоны без office-метаданных

- ab_buyer_family_area — Тест: семья ищет район (templates_ab_tests.json, test);
- ab_object_neighbor_sold — Тест: продаётся рядом (templates_ab_tests.json, test);
- ab_owner_direct_buyer — Тест: есть покупатель (templates_ab_tests.json, test);
- ab_owner_private_note — Тест: частная записка (templates_ab_tests.json, test);
- ab_owner_soft_price_check — Тест: мягкая оценка цены (templates_ab_tests.json, test);
- ab_service_after_viewing — Тест: после просмотра рынка (templates_ab_tests.json, test);
- custom_ab_test_short — Пустой: короткий A/B-тест (templates_custom.json, working);
- custom_blank_entrance — Пустой: подъездный формат (templates_custom.json, working);
- custom_blank_readable — Пустой: читаемый макет (templates_custom.json, working);
- custom_object_photo_showcase — Пустой: объект с фото (templates_custom.json, working);
- custom_private_note — Пустой: частная записка (templates_custom.json, working);
- custom_service_consultation — Пустой: консультация (templates_custom.json, working);
- extra_brand_area_expert — Ваш специалист по району (templates_extra.json, deprecated, alias brand_area_expert → extra_brand_area_expert);
- extra_service_safe_deal — Безопасная сделка (templates_extra.json, deprecated, alias service_safe_deal → extra_service_safe_deal);
- object_commercial_space — Коммерческое помещение (templates_extra.json, deprecated);
- rent_find_tenant — Сдам квартиру аккуратным жильцам (templates_extra.json, deprecated);
- seller_inherited_flat — Наследственная квартира (templates_extra.json, deprecated);
- seller_sell_buy_chain — Продать и купить взамен (templates_extra.json, deprecated);
- seller_thinking_about_sale — Думаете о продаже? (templates_extra.json, deprecated);
- trust_private_neighbor_question — Доверие: вопрос соседям (templates_trust.json, working);
- trust_seller_no_pressure — Доверие: без давления (templates_trust.json, working);
- trust_service_documents_check — Доверие: проверка документов (templates_trust.json, working);
- brand_area_expert — Ваш специалист по району (templates.json, deprecated);
- brand_consult — Консультация по недвижимости (templates.json, working);
- brand_empty — Полупустой имиджевый (templates.json, working);
- buyer_have_object — Есть объект под ваш запрос (templates.json, working);
- buyer_mortgage — Квартира в ипотеку (templates.json, working);
- buyer_need_family — Подберу квартиру для семьи (templates.json, working);
- buyer_specific_search — Ищу конкретный объект (templates.json, working);
- newbuild_budget — Новостройка под бюджет (templates.json, working);
- newbuild_family — Новостройка для семьи (templates.json, working);
- newbuild_mortgage — Новостройка и ипотека (templates.json, working);
- newbuild_no_commission — Новостройки без комиссии (templates.json, working);
- newbuild_two_photo — Фасад + планировка (templates.json, working);
- object_big_photo — Большое фото + телефон (templates.json, working);
- object_flat_photo — Продам квартиру с фото (templates.json, working);
- object_flat_two_photos — Квартира: 2 фото (templates.json, working);
- object_house_two — Дом: фасад + участок (templates.json, working);
- object_land — Продам участок (templates.json, working);
- object_micro_4 — Микро: объект в продаже (templates.json, working);
- object_new_price — Новая цена (templates.json, working);
- object_qr — Объект с QR (templates.json, working);
- private_buy_house — Частное: куплю дом (templates.json, working);
- private_specific — Частное: ищу конкретный объект (templates.json, working);
- rent_need — Сниму квартиру (templates.json, working);
- rent_owner — Помогу сдать квартиру (templates.json, working);
- rent_room — Сниму комнату / студию (templates.json, working);
- seller_buy_flat_house — Куплю квартиру в вашем доме (templates.json, working);
- seller_buy_house — Куплю дом (templates.json, working);
- seller_buy_land — Куплю участок (templates.json, working);
- seller_buy_no_repair — Куплю без ремонта (templates.json, working);
- seller_cash_fast — Покупатель с деньгами (templates.json, working);
- seller_micro_4 — Микро: куплю квартиру (templates.json, working);
- seller_need_2room_family — Нужна 2-комнатная для семьи (templates.json, working);
- seller_neighbors — Ваш дом интересен покупателям (templates.json, working);
- seller_price_check — Сколько стоит ваша квартира? (templates.json, working);
- service_complex_sale — Сложная продажа (templates.json, working);
- service_estimate — Оценка недвижимости (templates.json, working);
- service_intercity — Сделка в другом городе (templates.json, working);
- service_micro_4 — Микро: консультация (templates.json, working);
- service_mortgage — Помощь с ипотекой (templates.json, working);
- service_safe_deal — Безопасная сделка (templates.json, deprecated);

## Office-метаданные без scenario

Нет.

## Как использовать отчёт

1. Не удалять шаблон только из-за сходства: сначала проверить реальную рабочую задачу.
2. Для вероятного дубля определить основной рабочий вариант, тестовый вариант или устаревший вариант.
3. Устаревший шаблон должен ссылаться на конечную рабочую замену.
4. Office-метаданные учитывать вместе с `data/template_office_overrides.json`.
5. Исходные повторы ID разрешать только через `data/template_id_aliases.json`.
6. Неразрешённых итоговых ID всегда должно быть 0.
7. Повторяющиеся заголовки допустимы только при разных целях, аудиториях или форматах.
8. После осознанных изменений повторно запустить `npm run templates:inventory`.
