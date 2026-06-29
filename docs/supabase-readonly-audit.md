# Read-only аудит Supabase

Дата аудита: 2026-06-29.

Проект Supabase: `deputat36's Project`.
Project ref: `ofewxuqfjhamgerwzull`.
Регион: `eu-west-1`.
Статус проекта: `ACTIVE_HEALTHY`.
PostgreSQL: `17.6.1.121`.

## Ограничения аудита

Аудит выполнен без изменения базы данных.

Прямой read-only SQL через connector был заблокирован safety-системой OpenAI, поэтому использованы доступные штатные инструменты Supabase:

- список проектов;
- список таблиц `public` с колонками и внешними ключами;
- список миграций;
- security advisors.

Не удалось получить через connector:

- performance advisors;
- список extensions;
- список Edge Functions.

## Общее состояние схемы

В одном Supabase-проекте находятся несколько направлений:

- `leader_*` — CRM РА Лидер: клиенты, заявки, заказы, расчёты, КП, производство, дизайн, монтаж, финансы, пользователи, роли и приглашения;
- `nav_*` и `nav_*_v2` — навигатор сделок: профили, сделки, участники, задачи, документы, риски, события, ревью, юридические очереди;
- `parket_*` — заявки и аудит публичной формы Паркет36;
- старые базовые таблицы `clients`, `orders`, `order_items`, `catalog`, `projects`, `profiles`, `deals`, `deal_tasks`, `deal_comments`.

Все просмотренные таблицы в `public` имеют включённый RLS.

## Основные наблюдения

### 1. Проект стал мультидоменным

Supabase используется не одним сайтом, а сразу несколькими проектами. Это удобно для скорости разработки, но повышает риск случайно затронуть чужие таблицы при миграциях.

Рекомендация: новые миграции явно помечать префиксом проекта и не смешивать изменения разных направлений в одной миграции.

### 2. Есть старые и новые версии навигатора сделок

Одновременно присутствуют:

- `nav_profiles`, `nav_deals`, `nav_deal_tasks`, `nav_deal_comments`, `nav_deal_reviews`, `nav_deal_participants`, `nav_deal_events`;
- `nav_user_profiles`, `nav_deals_v2`, `nav_deal_tasks_v2`, `nav_deal_documents_v2`, `nav_deal_risks_v2`, `nav_deal_reviews_v2`, `nav_deal_participants_v2`, `nav_deal_events_v2`.

Рекомендация: считать `nav_*_v2` основной рабочей моделью, а legacy `nav_*` не трогать без отдельной задачи по миграции или архивированию.

### 3. Security advisors показывают много предупреждений по SECURITY DEFINER RPC

Supabase security advisors нашли предупреждения класса `authenticated_security_definer_function_executable`: функции `SECURITY DEFINER` в `public` доступны роли `authenticated` через `/rest/v1/rpc/...`.

Это не всегда ошибка. Для RPC-слоя навигатора такие функции могли быть сделаны намеренно, чтобы централизовать права доступа. Но каждую такую функцию нужно считать повышенно рискованной: она выполняется с правами владельца функции, а не обычного пользователя.

Примеры групп функций из предупреждений:

- legacy helpers: `nav_can_create_deal`, `nav_can_edit_deal`, `nav_can_view_deal`, `nav_current_role`, `nav_is_admin`;
- v2 access helpers: `nav_v2_can_view_deal`, `nav_v2_can_edit_deal`, `nav_v2_is_active_user`, `nav_v2_is_owner_or_admin`, `nav_v2_my_role`;
- v2 write RPC: `nav_v2_add_comment`, `nav_v2_add_task`, `nav_v2_add_document`, `nav_v2_add_expense`, `nav_v2_add_risk`, `nav_v2_update_deal_status`, `nav_v2_update_document_status`, `nav_v2_update_task_status`;
- v2 service/read RPC: `nav_v2_get_dashboard`, `nav_v2_get_deals_list`, `nav_v2_get_deal_card`, `nav_v2_get_lawyer_queue`, `nav_v2_get_security_hardening_health`, `nav_v2_get_rpc_grant_health`;
- demo/admin/profile RPC: `nav_v2_seed_demo_data`, `nav_v2_clear_demo_data`, `nav_v2_list_users`, `nav_v2_update_user_profile`, `nav_v2_link_user_by_email`.

Рекомендация: не отключать всё массово. Нужен отдельный аудит RPC по категориям:

1. оставить доступными только RPC, которые реально вызываются фронтендом;
2. для write RPC убедиться, что внутри функции есть проверка роли и доступа к конкретной сделке;
3. demo/admin RPC закрыть от обычного `authenticated`, если они не нужны всем авторизованным;
4. для служебных health RPC решить, кто должен их вызывать: только admin/service role или любой авторизованный сотрудник;
5. после каждой DDL-правки повторять security advisors.

Remediation Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

### 4. Leaked Password Protection отключён

Security advisors также показали предупреждение `auth_leaked_password_protection`: защита от скомпрометированных паролей выключена.

Рекомендация: включить leaked password protection в Supabase Auth, если авторизация используется реальными сотрудниками.

Документация Supabase: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### 5. Публичные формы уже отделены аудитом

В схеме есть таблицы аудита публичных отправок:

- `leader_public_lead_audit`;
- `parket_public_lead_audit`.

Это хороший признак: публичные формы не пишут только бизнес-таблицы, а оставляют след отправки, request_id, user_agent, источник и результат.

Рекомендация: для публичных форм держать прямой доступ максимально закрытым, запись выполнять через Edge Function или строго ограниченную RPC/политику.

### 6. Есть развитая CRM РА Лидер

В `leader_*` видны полноценные модули:

- клиенты и лиды;
- структурированные потребности;
- расчёты и позиции расчёта;
- коммерческие предложения;
- заказы и позиции;
- производство;
- дизайн;
- монтаж;
- платежи, расходы и финансы;
- роли, приглашения, настройки уведомлений.

Рекомендация: дальнейшие изменения по РА Лидер вести отдельно от навигатора сделок и генератора расклеек.

## Приоритетный план дальнейших работ

### Приоритет 1. RPC-аудит безопасности навигатора

Составить таблицу всех `nav_v2_*` RPC:

- название;
- кто должен вызывать;
- вызывается ли фронтендом;
- read или write;
- есть ли проверка роли;
- есть ли проверка доступа к конкретной сделке;
- нужен ли `SECURITY DEFINER`;
- кому выдан `EXECUTE`.

### Приоритет 2. Разделить контекст проектов

Не вести в одной задаче изменения для:

- генератора расклеек `etagi`;
- CRM РА Лидер;
- навигатора сделок;
- Паркет36.

Для каждого направления желательно иметь отдельный документ состояния и отдельный backlog.

### Приоритет 3. Проверить публичные формы

Отдельно проверить:

- кто может вставлять в `leader_leads` и `parket_leads`;
- используется ли `request_id` как idempotency key;
- нет ли прямого доступа `anon` к бизнес-таблицам;
- пишется ли аудит для отклонённых и подозрительных отправок.

### Приоритет 4. Проверить устаревшие таблицы

Разобраться, какие таблицы уже legacy:

- `clients`, `orders`, `order_items`, `catalog`, `projects`;
- `profiles`, `deals`, `deal_tasks`, `deal_comments`;
- legacy `nav_*` без `_v2`.

Их не нужно удалять без миграционного плана, но нужно пометить статус: активно используется, legacy read-only, архив, кандидат на удаление.

## Что не делалось

- Не выполнялись DDL-изменения.
- Не менялись RLS-политики.
- Не менялись grants для RPC.
- Не включались и не отключались настройки Auth.
- Не запускались SQL-запросы напрямую, потому connector заблокировал read-only SQL.
