import json
import pathlib
import re

root = pathlib.Path('.')


def read_json(path):
    return json.loads((root / path).read_text(encoding='utf-8'))


def write_json(path, data):
    (root / path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


approved = {
    'buyer_mortgage': {
        'headline': 'КВАРТИРА\nС ИПОТЕКОЙ',
        'description': 'Оценивайте свои финансовые возможности и риски.',
        'benefits': 'Подбор объекта\nПредварительный расчёт\nИпотечный специалист',
    },
    'newbuild_mortgage': {
        'headline': 'НОВОСТРОЙКА\nС ИПОТЕКОЙ',
        'description': 'Оценивайте свои финансовые возможности и риски.',
        'benefits': 'Актуальные квартиры\nПредварительный расчёт\nИпотечный специалист',
    },
    'service_mortgage': {
        'headline': 'КОНСУЛЬТАЦИЯ\nПО ИПОТЕКЕ',
        'description': 'Оценивайте свои финансовые возможности и риски.',
        'benefits': 'Разбор ситуации\nПредварительный расчёт\nПодготовка к заявке',
    },
    'newbuild_family_mortgage': {
        'headline': 'СЕМЕЙНАЯ\nИПОТЕКА И\nНОВОСТРОЙКА',
        'description': 'Оценивайте свои финансовые возможности и риски.',
        'benefits': 'Проверка условий\nАктуальные квартиры\nИпотечный специалист',
    },
    'buyer_maternity_capital': {
        'headline': 'КВАРТИРА\nС МАТКАПИТАЛОМ',
        'description': 'Подскажу, какие варианты можно рассматривать, и помогу пройти сделку без лишней путаницы.',
        'benefits': 'Разбор условий\nПодбор объекта\nСопровождение документов',
    },
}

for path in ['data/templates.json', 'data/templates_extra.json']:
    items = read_json(path)
    changed = False
    for item in items:
        if item.get('id') in approved:
            item['data'].update(approved[item['id']])
            changed = True
    if changed:
        write_json(path, items)

manager_notes = {
    'buyer_mortgage': 'Использовать только с актуальными ипотечными программами: не указывать ставку, платёж или одобрение без индивидуального расчёта; предупреждение «Оценивайте свои финансовые возможности и риски.» не сокращать; перед тиражом проверить актуальные условия.',
    'newbuild_mortgage': 'Использовать только после проверки актуальной программы и наличия квартиры; не указывать ставку, платёж, первоначальный взнос, конкретные банки или бесплатность; предупреждение «Оценивайте свои финансовые возможности и риски.» не сокращать.',
    'service_mortgage': 'Использовать как приглашение к первичной консультации: расчёт только предварительный, заявку и решение банка не обещать; предупреждение «Оценивайте свои финансовые возможности и риски.» не сокращать.',
    'buyer_maternity_capital': 'Перед тиражом проверить действующие правила СФР; при ипотеке — требования банка; по конкретной сделке подключать профильных специалистов. Не использовать устаревшие суммы или обещания автоматического одобрения СФР/банка.',
    'newbuild_family_mortgage': 'Перед тиражом проверить актуальную программу семейной ипотеки, клиента, объект и банк; не печатать ставку, первоначальный взнос, платёж или обещание одобрения; предупреждение «Оценивайте свои финансовые возможности и риски.» не сокращать.',
}

overrides = read_json('data/template_office_overrides.json')
for tid, note in manager_notes.items():
    entry = overrides['templates'][tid]
    entry['office']['managerNote'] = note
    entry['office']['recommended'] = False
    entry['office']['level'] = 'manager'
    entry['office']['risk'] = 'high'
write_json('data/template_office_overrides.json', overrides)

reasons = {
    'buyer_mortgage': 'Утверждённая редакция исключает конкретные ставки, платежи и гарантии; шаблон остаётся test и используется только с актуальной проверкой ипотечных условий и полным предупреждением.',
    'newbuild_mortgage': 'Утверждённая редакция не обещает ставку, платёж, взнос, банки или бесплатность; перед использованием проверяются программа и наличие квартиры, предупреждение сохраняется полностью.',
    'service_mortgage': 'Утверждённая редакция ограничена первичной ипотечной консультацией и предварительным расчётом; заявка и решение банка не обещаются, предупреждение сохраняется полностью.',
    'buyer_maternity_capital': 'Рекламный текст утверждён без изменений; перед массовой печатью требуется актуальная проверка правил СФР и, при ипотеке, требований банка.',
    'newbuild_family_mortgage': 'Утверждённая редакция не содержит ставки, платежа, взноса или гарантии одобрения; перед использованием проверяются программа, клиент, объект и банк, предупреждение сохраняется полностью.',
}

portfolio = read_json('data/template_portfolio_status.json')
for tid, reason in reasons.items():
    rule = portfolio['templates'][tid]
    rule['status'] = 'test'
    rule.pop('replacementId', None)
    rule['reason'] = reason
write_json('data/template_portfolio_status.json', portfolio)

# Evidence: keep schema, replace only fields sourced from JSON/office policy.
evidence_path = root / 'docs/manager-sensitive-template-evidence-3.86.0.md'
evidence = evidence_path.read_text(encoding='utf-8')
evidence_updates = {
    'buyer_mortgage': ('КВАРТИРА / С ИПОТЕКОЙ', approved['buyer_mortgage']['description'], 'Подбор объекта / Предварительный расчёт / Ипотечный специалист', manager_notes['buyer_mortgage']),
    'newbuild_mortgage': ('НОВОСТРОЙКА / С ИПОТЕКОЙ', approved['newbuild_mortgage']['description'], 'Актуальные квартиры / Предварительный расчёт / Ипотечный специалист', manager_notes['newbuild_mortgage']),
    'service_mortgage': ('КОНСУЛЬТАЦИЯ / ПО ИПОТЕКЕ', approved['service_mortgage']['description'], 'Разбор ситуации / Предварительный расчёт / Подготовка к заявке', manager_notes['service_mortgage']),
    'buyer_maternity_capital': ('КВАРТИРА / С МАТКАПИТАЛОМ', approved['buyer_maternity_capital']['description'], 'Разбор условий / Подбор объекта / Сопровождение документов', manager_notes['buyer_maternity_capital']),
    'newbuild_family_mortgage': ('СЕМЕЙНАЯ / ИПОТЕКА И / НОВОСТРОЙКА', approved['newbuild_family_mortgage']['description'], 'Проверка условий / Актуальные квартиры / Ипотечный специалист', manager_notes['newbuild_family_mortgage']),
}

for tid, (headline, description, benefits, note) in evidence_updates.items():
    pattern = rf'(## `{re.escape(tid)}` —[^\n]*\n)(.*?)(?=\n## `|\Z)'
    match = re.search(pattern, evidence, flags=re.S)
    if not match:
        raise RuntimeError(f'evidence section missing: {tid}')
    section = match.group(2)
    for p, repl in {
        r'^- Заголовок:.*$': f'- Заголовок: {headline}',
        r'^- Описание:.*$': f'- Описание: {description}',
        r'^- Преимущества:.*$': f'- Преимущества: {benefits}',
        r'^- Ограничение менеджера:.*$': f'- Ограничение менеджера: {note}',
    }.items():
        section, n = re.subn(p, repl, section, flags=re.M)
        if n != 1:
            raise RuntimeError(f'evidence line mismatch {tid}: {p} -> {n}')
    evidence = evidence[:match.start(2)] + section + evidence[match.end(2):]

evidence_path.write_text(evidence, encoding='utf-8')

# Manager review: exactly five decisions for PR 1. Overall status stays NOT PASSED.
review_path = root / 'docs/manager-sensitive-template-review-3.86.0.md'
review = review_path.read_text(encoding='utf-8')
decisions = {
    'buyer_mortgage': ('Утверждённая редакция реализована в issue #120; шаблон остаётся test.', 'Полное ипотечное предупреждение сохранено; единая юридическая проверка применимости и площади остаётся отдельным незакрытым условием.'),
    'newbuild_mortgage': ('Утверждённая редакция реализована в issue #120; шаблон остаётся test.', 'Полное ипотечное предупреждение сохранено; единая юридическая проверка применимости и площади остаётся отдельным незакрытым условием.'),
    'service_mortgage': ('Утверждённая редакция реализована в issue #120; шаблон остаётся test.', 'Полное ипотечное предупреждение сохранено; единая юридическая проверка применимости и площади остаётся отдельным незакрытым условием.'),
    'buyer_maternity_capital': ('Утвердить без изменения рекламного текста; policy синхронизирована в issue #120.', 'Перед тиражом проверять актуальные правила СФР и требования банка; устаревшие суммы не использовать.'),
    'newbuild_family_mortgage': ('Утверждённая редакция реализована в issue #120; шаблон остаётся test.', 'Полное ипотечное предупреждение сохранено; единая юридическая проверка применимости и площади остаётся отдельным незакрытым условием.'),
}

for tid, (decision, comment) in decisions.items():
    pattern = rf'(### \d+\. `{re.escape(tid)}`[^\n]*\n)(.*?)(?=\n### \d+\.|\n## Итог менеджера)'
    match = re.search(pattern, review, flags=re.S)
    if not match:
        raise RuntimeError(f'review section missing: {tid}')
    section = match.group(2)
    section, n1 = re.subn(r'- \[ \] Решение и необходимые изменения зафиксированы\.', '- [x] Решение и необходимые изменения зафиксированы.', section, count=1)
    section, n2 = re.subn(r'Решение: .*', f'Решение: {decision}', section, count=1)
    section, n3 = re.subn(r'Комментарий: .*', f'Комментарий: {comment}', section, count=1)
    if (n1, n2, n3) != (1, 1, 1):
        raise RuntimeError(f'review line mismatch {tid}: {(n1, n2, n3)}')
    review = review[:match.start(2)] + section + review[match.end(2):]

review_path.write_text(review, encoding='utf-8')

# Add a narrow regression contract to the existing validator.
validator_path = root / 'tools/validate-manager-sensitive-review.mjs'
validator = validator_path.read_text(encoding='utf-8')
if 'const issue120Approved = {' not in validator:
    contract = """
const issue120Approved = {
  buyer_mortgage: {headline:'КВАРТИРА\\nС ИПОТЕКОЙ', description:'Оценивайте свои финансовые возможности и риски.', benefits:'Подбор объекта\\nПредварительный расчёт\\nИпотечный специалист'},
  newbuild_mortgage: {headline:'НОВОСТРОЙКА\\nС ИПОТЕКОЙ', description:'Оценивайте свои финансовые возможности и риски.', benefits:'Актуальные квартиры\\nПредварительный расчёт\\nИпотечный специалист'},
  service_mortgage: {headline:'КОНСУЛЬТАЦИЯ\\nПО ИПОТЕКЕ', description:'Оценивайте свои финансовые возможности и риски.', benefits:'Разбор ситуации\\nПредварительный расчёт\\nПодготовка к заявке'},
  buyer_maternity_capital: {headline:'КВАРТИРА\\nС МАТКАПИТАЛОМ', description:'Подскажу, какие варианты можно рассматривать, и помогу пройти сделку без лишней путаницы.', benefits:'Разбор условий\\nПодбор объекта\\nСопровождение документов'},
  newbuild_family_mortgage: {headline:'СЕМЕЙНАЯ\\nИПОТЕКА И\\nНОВОСТРОЙКА', description:'Оценивайте свои финансовые возможности и риски.', benefits:'Проверка условий\\nАктуальные квартиры\\nИпотечный специалист'}
};
const issue120MortgageIds = ['buyer_mortgage','newbuild_mortgage','service_mortgage','newbuild_family_mortgage'];
""".strip() + '\n\n'
    validator = validator.replace('const errors = [];\n', 'const errors = [];\n\n' + contract, 1)
    checks = """
for(const [id, expected] of Object.entries(issue120Approved)){
  const group = templateGroups.get(id) || [];
  if(group.length !== 1) continue;
  const template = group[0];
  const office = template.office || {};
  const rule = portfolio.templates?.[id] || {};
  for(const [field, expectedValue] of Object.entries(expected)){
    if(template.data?.[field] !== expectedValue) errors.push(`${id}: issue #120 требует точное значение data.${field}`);
  }
  if(template.portfolioStatus !== 'test') errors.push(`${id}: issue #120 требует status=test`);
  if(rule && typeof rule === 'object' && 'replacementId' in rule) errors.push(`${id}: issue #120 запрещает replacementId`);
  if(office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) errors.push(`${id}: issue #120 требует office manager/high/recommended=false`);
}
for(const id of issue120MortgageIds){
  const template = (templateGroups.get(id) || [])[0];
  if(!template) continue;
  if(template.data?.description !== 'Оценивайте свои финансовые возможности и риски.') errors.push(`${id}: ипотечное предупреждение issue #120 должно быть полным`);
  const text = normalize([template.data?.headline, template.data?.description, template.data?.benefits].join(' '));
  if(/\\b\\d+(?:[.,]\\d+)?\\s*%|гарантир|одобрен|бесплатн|точн\\w*\\s+платеж/.test(text)) errors.push(`${id}: issue #120 запрещает ставки, гарантии, бесплатность и точный платёж`);
}
const maternity = (templateGroups.get('buyer_maternity_capital') || [])[0];
if(maternity){
  const text = normalize([maternity.data?.headline, maternity.data?.description, maternity.data?.benefits].join(' '));
  if(/\\b\\d[\\d\\s]{3,}\\s*(?:руб|₽)|автоматическ\\w*\\s+одобр|гарантир/.test(text)) errors.push('buyer_maternity_capital: issue #120 запрещает устаревшие суммы и гарантии одобрения');
}
""".strip() + '\n\n'
    validator = validator.replace('if(errors.length){\n', checks + 'if(errors.length){\n', 1)

validator_path.write_text(validator, encoding='utf-8')
