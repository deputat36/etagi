# Автоматическая инвентаризация библиотеки шаблонов

Сформировано: 2026-07-14T11:55:54.623Z

## Общий итог

- файлов шаблонов: 10;
- шаблонов: 117;
- с office-метаданными: 108 (92%);
- получили office через overrides: 62;
- получили уникальный ID через aliases: 4;
- office-рекомендованных: 63;
- без office-метаданных: 9;
- рабочих: 69;
- тестовых: 39;
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
| working | 69 |
| test | 39 |
| deprecated | 9 |

## Office-уровни

| Уровень | Количество |
|---|---:|
| manager | 76 |
| newbie | 31 |
| experienced | 1 |

## Office-риски

| Риск | Количество |
|---|---:|
| medium | 43 |
| high | 39 |
| low | 26 |

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
| templates.json | 42 | 40 | 40 | 95% | 23 | 2 |
| templates_ab_tests.json | 6 | 6 | 0 | 100% | 6 | 0 |
| templates_borisoglebsk.json | 9 | 9 | 0 | 100% | 0 | 0 |
| templates_borisoglebsk_expanded.json | 12 | 12 | 0 | 100% | 0 | 0 |
| templates_custom.json | 6 | 6 | 6 | 100% | 3 | 0 |
| templates_entrance.json | 8 | 8 | 0 | 100% | 0 | 0 |
| templates_extra.json | 17 | 10 | 10 | 59% | 5 | 7 |
| templates_sales.json | 6 | 6 | 0 | 100% | 0 | 0 |
| templates_tellerman_sad.json | 5 | 5 | 0 | 100% | 0 | 0 |
| templates_trust.json | 6 | 6 | 6 | 100% | 2 | 0 |

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
| custom_ab_test_short — Пустой: короткий A/B-тест | templates_custom.json | Заготовка предназначена только для контролируемого A/B-сравнения, где меняется один элемент и фиксируется результат. | — |
| custom_private_note — Пустой: частная записка | templates_custom.json | Частная записка без бренда требует согласования цели, текста и офисной политики; её нельзя выдавать как готовый основной шаблон. | — |
| custom_service_consultation — Пустой: консультация | templates_custom.json | Универсальная заготовка может затрагивать оценку, документы и ипотеку. Перед использованием нужно определить конкретную услугу и проверить формулировки. | — |
| buyer_maternity_capital — Квартира с маткапиталом | templates_extra.json | Сценарий полезен, но условия использования материнского капитала требуют актуальной проверки перед массовой печатью. | — |
| extra_private_buy_flat — Частное: куплю квартиру | templates_extra.json | Частный макет без бренда применяется только по согласованной офисной задаче и после проверки менеджером. | — |
| extra_private_sell_flat — Частное: продаётся квартира | templates_extra.json | Частный объектный макет без бренда требует проверки цены, характеристик, фото и соответствия офисной политике. | — |
| newbuild_family_mortgage — Новостройка и семейная ипотека | templates_extra.json | Условия семейной ипотеки меняются. Перед использованием требуется проверка актуальных условий и менеджерская адаптация текста. | — |
| seller_empty_flat — Куплю пустующую квартиру | templates_extra.json | Сценарий пустующей квартиры полезен, но заголовок «Куплю» допустим только при подтверждённом спросе и после проверки менеджером. | — |
| trust_private_neighbor_question — Доверие: вопрос соседям | templates_trust.json | Формулировка о заинтересованном человеке допустима только при подтверждённом спросе и после согласования частного формата расклейки менеджером. | — |
| trust_service_documents_check — Доверие: проверка документов | templates_trust.json | Сценарий затрагивает проверку документов и рисков сделки. Перед использованием требуется согласовать объём консультации и участие квалифицированного специалиста. | — |
| buyer_have_object — Есть объект под ваш запрос | templates.json | Заголовок «Есть объект под ваш запрос» допустим только при наличии актуального объекта или подборки, соответствующей бюджету и критериям клиента. | — |
| buyer_mortgage — Квартира в ипотеку | templates.json | Ипотечные программы, ставки и требования меняются; перед использованием нужно проверить актуальные условия и исключить обещание одобрения. | — |
| buyer_specific_search — Ищу конкретный объект | templates.json | Формулировки «для клиента» и «реальный запрос» требуют фактического покупателя с согласованными параметрами, бюджетом и способом оплаты. | — |
| newbuild_budget — Новостройка под бюджет | templates.json | Расчёт платежа, первоначального взноса и сравнение выгоды зависят от актуальных цен, программ и условий банков и требуют проверки менеджером. | — |
| newbuild_mortgage — Новостройка и ипотека | templates.json | Ипотечные условия для новостроек меняются; платёж, первоначальный взнос и доступные банки нельзя обещать без актуального расчёта. | — |
| newbuild_no_commission — Новостройки без комиссии | templates.json | Утверждение «без комиссии» зависит от конкретного проекта и договора с застройщиком; его нужно подтверждать перед каждым тиражом. | — |
| private_buy_flat — Частное: куплю квартиру | templates.json | Частный макет без бренда применяется только по согласованной офисной задаче и после проверки менеджером. | — |
| private_buy_house — Частное: куплю дом | templates.json | Частный запрос «Куплю дом» без бренда допустим только при подтверждённом спросе и после согласования офисной задачи и формата. | — |
| private_sell_flat — Частное: продам квартиру | templates.json | Частный объектный макет без бренда требует проверки цены, характеристик, фото и соответствия офисной политике. | — |
| private_specific — Частное: ищу конкретный объект | templates.json | Частный поиск квартиры в конкретном доме создаёт впечатление реального покупателя и требует подтверждённого спроса и согласования менеджером. | — |
| rent_need — Сниму квартиру | templates.json | Формулировки «для клиента», «реальный запрос» и «аккуратные арендаторы» допустимы только при подтверждённом нанимателе и согласованных критериях аренды. | — |
| rent_room — Сниму комнату / студию | templates.json | Утверждение «есть клиент на аренду» требует реального нанимателя, бюджета, района, срока и требований; шаблон нельзя использовать как универсальную приманку. | — |
| seller_buy_flat_house — Куплю квартиру в вашем доме | templates.json | Формулировка о готовых клиентах и выходе на сделку допустима только при подтверждённом текущем спросе на конкретный дом или район. | — |
| seller_buy_house — Куплю дом | templates.json | Прямой запрос на дом допустим только при подтверждённом спросе с понятными критериями, способом оплаты и бюджетом. | — |
| seller_buy_land — Куплю участок | templates.json | Прямой запрос на участок требует реального клиентского спроса и проверки назначения земли, района, площади, коммуникаций и бюджета. | — |
| seller_buy_no_repair — Куплю без ремонта | templates.json | Прямой заголовок «Куплю» используется только при реальном спросе на квартиры без ремонта и после проверки менеджером. | — |
| seller_cash_fast — Покупатель с деньгами | templates.json | Утверждение «Есть покупатель с деньгами» требует подтверждённого клиента, бюджета и критериев и не может использоваться как постоянная универсальная приманка. | — |
| seller_micro_4 — Микро: куплю квартиру | templates.json | Короткий массовый заголовок «Куплю квартиру» требует подтверждённого спроса; в плотном формате недостаточно места для существенных уточнений. | — |
| seller_need_2room_family — Нужна 2-комнатная для семьи | templates.json | Конкретный семейный спрос, бюджет и требования должны быть подтверждены перед печатью; шаблон нельзя выдавать как универсальное обещание. | — |
| seller_neighbors — Ваш дом интересен покупателям | templates.json | Утверждение об интересе покупателей к конкретному дому или району должно подтверждаться текущими запросами и рыночными данными. | — |
| service_complex_sale — Сложная продажа | templates.json | Сценарий затрагивает доли, наследство, материнский капитал, обременения и юридическую консультацию; требуется менеджерская и профильная проверка. | — |
| service_micro_4 — Микро: консультация | templates.json | Массовый короткий шаблон объединяет ипотеку и документы без описания объёма услуги; перед печатью требуется выбрать конкретную консультацию и проверить формулировки. | — |
| service_mortgage — Помощь с ипотекой | templates.json | Подача заявки, расчёт платежа и перечень подходящих объектов зависят от актуальных банковских требований и не должны обещаться без проверки. | — |

## Вероятные смысловые дубли

Вероятные смысловые дубли не найдены.

## Одинаковые заголовки

### куплю дом

- seller_buy_house — Куплю дом (templates.json, test, office override);
- private_buy_house — Частное: куплю дом (templates.json, test, office override);
- bgo_private_buy_house — Частное: куплю дом в Борисоглебске (templates_borisoglebsk.json, working);

### куплю квартиру

- private_buy_flat — Частное: куплю квартиру (templates.json, test, office override);
- seller_micro_4 — Микро: куплю квартиру (templates.json, test, office override);
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

- object_house_two — Дом: фасад + участок (templates.json, working, office override);
- bgo_object_private_house — Борисоглебск: дом в частном секторе (templates_borisoglebsk.json, working);

### продается квартира

- object_flat_photo — Продам квартиру с фото (templates.json, working, office override);
- extra_private_sell_flat — Частное: продаётся квартира (templates_extra.json, test, office override, alias private_sell_flat → extra_private_sell_flat);

### продается объект

- object_big_photo — Большое фото + телефон (templates.json, working, office override);
- custom_object_photo_showcase — Пустой: объект с фото (templates_custom.json, working, office override);

### сколько стоит ваша квартира?

- seller_price_check — Сколько стоит ваша квартира? (templates.json, working, office override);
- ab_owner_soft_price_check — Тест: мягкая оценка цены (templates_ab_tests.json, test);

## Повторяющиеся office-сценарии

### extra_private_buy_flat

- private_buy_flat — Частное: куплю квартиру (templates.json, test, office override);
- extra_private_buy_flat — Частное: куплю квартиру (templates_extra.json, test, office override, alias private_buy_flat → extra_private_buy_flat);

### extra_private_sell_flat

- private_sell_flat — Частное: продам квартиру (templates.json, test, office override);
- extra_private_sell_flat — Частное: продаётся квартира (templates_extra.json, test, office override, alias private_sell_flat → extra_private_sell_flat);

## Шаблоны без office-метаданных

- extra_brand_area_expert — Ваш специалист по району (templates_extra.json, deprecated, alias brand_area_expert → extra_brand_area_expert);
- extra_service_safe_deal — Безопасная сделка (templates_extra.json, deprecated, alias service_safe_deal → extra_service_safe_deal);
- object_commercial_space — Коммерческое помещение (templates_extra.json, deprecated);
- rent_find_tenant — Сдам квартиру аккуратным жильцам (templates_extra.json, deprecated);
- seller_inherited_flat — Наследственная квартира (templates_extra.json, deprecated);
- seller_sell_buy_chain — Продать и купить взамен (templates_extra.json, deprecated);
- seller_thinking_about_sale — Думаете о продаже? (templates_extra.json, deprecated);
- brand_area_expert — Ваш специалист по району (templates.json, deprecated);
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
