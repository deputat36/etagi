import pathlib
import re

root = pathlib.Path('.')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match, got {count}')
    return text.replace(old, new, 1)

# --- data/templates.json ---
path = root / 'data/templates.json'
text = path.read_text(encoding='utf-8')
# service_complex_sale advertising stays unchanged by approval.
text = replace_once(
    text,
    '"headline": "КОНСУЛЬТАЦИЯ\\nПО НЕДВИЖИМОСТИ"',
    '"headline": "ПОМОЩЬ\\nС НЕДВИЖИМОСТЬЮ"',
    'service_micro_4 headline'
)
text = replace_once(
    text,
    '"description": "Продажа, покупка, ипотека, документы. Позвоните — подскажу."',
    '"description": "Продажа или покупка: разберём задачу и определим следующий шаг."',
    'service_micro_4 description'
)
path.write_text(text, encoding='utf-8')

# --- data/templates_extra.json: remove false buyer claim ---
path = root / 'data/templates_extra.json'
text = path.read_text(encoding='utf-8')
replacements = [
    ('"title": "Куплю пустующую квартиру"', '"title": "Пустует квартира?"', 'seller_empty title'),
    ('"note": "Для домов, где есть пустующие квартиры или наследственные объекты."', '"note": "Для собственников пустующих квартир: продажа, аренда или подготовка документов без обещания готового покупателя."', 'seller_empty note'),
    ('"tags": ["куплю", "пустая квартира", "подъезд", "экономно"]', '"tags": ["пустая квартира", "подъезд", "экономно"]', 'seller_empty tags'),
    ('"headline": "КУПЛЮ\\nПУСТУЮ\\nКВАРТИРУ"', '"headline": "ПУСТУЕТ\\nКВАРТИРА?"', 'seller_empty headline'),
    ('"description": "Если квартира стоит без дела, помогу оценить варианты: продажа, аренда, подготовка документов."', '"description": "Помогу оценить варианты: продажа, аренда или подготовка документов."', 'seller_empty description'),
    ('"benefits": "Можно без ремонта\\nПодскажу рыночную цену\\nБыстрая связь"', '"benefits": "Можно без ремонта\\nОриентир по цене\\nПонятный план действий"', 'seller_empty benefits'),
]
for old, new, label in replacements:
    text = replace_once(text, old, new, label)
path.write_text(text, encoding='utf-8')

# --- data/templates_trust.json: separate SPN and legal specialist roles ---
path = root / 'data/templates_trust.json'
text = path.read_text(encoding='utf-8')
replacements = [
    ('"headline": "ПРОВЕРЬТЕ\\nДОКУМЕНТЫ\\nДО СДЕЛКИ"', '"headline": "ДОКУМЕНТЫ\\nПЕРЕД СДЕЛКОЙ"', 'trust headline'),
    ('"description": "Перед продажей или покупкой важно понять риски заранее. Подскажу, на что обратить внимание."', '"description": "Помогу собрать исходные данные и передать документы профильному специалисту."', 'trust description'),
    ('"benefits": "Проверка ключевых моментов\\nПоясню простым языком\\nПомогу избежать ошибок"', '"benefits": "Список документов\\nПодключение юриста\\nПонятный следующий шаг"', 'trust benefits'),
    ('"customBlockTitle": "Перед сделкой"', '"customBlockTitle": "Важно"', 'trust block title'),
    ('"customBlockText": "Лучше задать вопрос заранее, чем исправлять ошибку потом."', '"customBlockText": "Итоговая правовая оценка после проверки специалистом."', 'trust block text'),
]
for old, new, label in replacements:
    text = replace_once(text, old, new, label)
path.write_text(text, encoding='utf-8')

# custom_service_consultation advertising placeholder remains unchanged; only policy becomes explicit.

# --- office overrides ---
path = root / 'data/template_office_overrides.json'
text = path.read_text(encoding='utf-8')
notes = {
    'Сценарий использовать после первичного разбора ситуации; доли, наследство, материнский капитал, обременения и юридическую консультацию согласовать с профильным специалистом.':
        'Использовать после первичного разбора задачи: сначала определить ситуацию и план, затем доли, наследство, маткапитал, обременения и правовую позицию передать юристу или профильному специалисту; не обещать юридический результат, отсутствие рисков, гарантированный срок или возможность сделки.',
    'Использовать только после проверки: заголовок «Куплю» допустим при подтверждённом спросе; иначе заменить его на предложение оценки и вариантов использования квартиры.':
        'Не использовать от первого лица как покупателя. Если есть реально подтверждённая заявка, применять отдельный объектный сценарий с фактическими критериями и сроком актуальности; здесь не обещать «Куплю», готового покупателя, быструю продажу или точную рыночную цену.',
    'Использовать только после согласования объёма консультации и участия квалифицированного специалиста; не обещать полную юридическую проверку или отсутствие рисков сделки.':
        'Использовать только если офис реально организует передачу документов профильному специалисту; СПН собирает исходные данные и не делает окончательный правовой вывод; не обещать полную юридическую безопасность, отсутствие рисков или гарантированный результат проверки.',
    'До печати выбрать одну конкретную услугу и проверить её объём; юридические, оценочные и ипотечные формулировки согласовать с ответственным специалистом.':
        'Перед печатью полностью заменить заголовок, описание, преимущества и дополнительный блок на текст одной конкретной услуги. Заглушку не печатать; после полной замены текст проверяет менеджер, а ипотечные, документарные и оценочные обещания — профильный специалист.',
    'До массовой печати выбрать конкретный вид консультации; ипотеку, документы и оценку нельзя объединять без определения объёма услуги и участия профильных специалистов.':
        'Использовать как общий вход только в продажу или покупку: разберём задачу и определим следующий шаг. Ипотечные и юридические темы рекламировать отдельными шаблонами с соответствующими условиями и профильными специалистами.',
}
for old, new in notes.items():
    text = replace_once(text, old, new, f'office note {old[:36]}')
path.write_text(text, encoding='utf-8')

# --- portfolio reasons: keep all five in test, no replacementId ---
path = root / 'data/template_portfolio_status.json'
text = path.read_text(encoding='utf-8')
reasons = {
    'Сценарий затрагивает доли, наследство, материнский капитал, обременения и юридическую консультацию; требуется менеджерская и профильная проверка.':
        'Рекламный текст сохранён, но использование допускается только после первичного разбора и с обязательной передачей юридически чувствительных вопросов профильному специалисту.',
    'Сценарий пустующей квартиры полезен, но заголовок «Куплю» допустим только при подтверждённом спросе и после проверки менеджером.':
        'Утверждённая редакция удаляет ложное «Куплю» и готового покупателя; шаблон предлагает собственнику оценить варианты продажи, аренды или подготовки документов.',
    'Сценарий затрагивает проверку документов и рисков сделки. Перед использованием требуется согласовать объём консультации и участие квалифицированного специалиста.':
        'Утверждённая редакция разделяет роли: СПН собирает исходные данные и передаёт документы профильному специалисту, итоговая правовая оценка не обещается.',
    'Универсальная заготовка может затрагивать оценку, документы и ипотеку. Перед использованием нужно определить конкретную услугу и проверить формулировки.':
        'Контролируемая заготовка не является готовой рекламой: перед печатью все смысловые поля заменяются текстом одной услуги и проходят менеджерскую проверку.',
    'Массовый короткий шаблон объединяет ипотеку и документы без описания объёма услуги; перед печатью требуется выбрать конкретную консультацию и проверить формулировки.':
        'Утверждённая массовая редакция ограничена продажей или покупкой; ипотечные и юридические темы вынесены в отдельные шаблоны с нужными условиями.',
}
for old, new in reasons.items():
    text = replace_once(text, old, new, f'portfolio reason {old[:36]}')
path.write_text(text, encoding='utf-8')

# --- evidence package ---
evidence_path = root / 'docs/manager-sensitive-template-evidence-3.86.0.md'
evidence = evidence_path.read_text(encoding='utf-8')
updates = {
    'service_complex_sale': {
        'headline': 'СЛОЖНАЯ / ПРОДАЖА?',
        'description': 'Ипотека, маткапитал, встречная покупка, доли, наследство, документы — разберём ситуацию и составим план действий.',
        'benefits': 'План сделки / Юридическая консультация / Контроль сроков',
        'short': 'СЛОЖНАЯ ПРОДАЖА? Разберём ситуацию и составим план.',
        'manager': 'Использовать после первичного разбора задачи: сначала определить ситуацию и план, затем доли, наследство, маткапитал, обременения и правовую позицию передать юристу или профильному специалисту; не обещать юридический результат, отсутствие рисков, гарантированный срок или возможность сделки.',
    },
    'seller_empty_flat': {
        'old_heading': '## `seller_empty_flat` — Куплю пустующую квартиру',
        'heading': '## `seller_empty_flat` — Пустует квартира?',
        'note': 'Для собственников пустующих квартир: продажа, аренда или подготовка документов без обещания готового покупателя.',
        'headline': 'ПУСТУЕТ / КВАРТИРА?',
        'description': 'Помогу оценить варианты: продажа, аренда или подготовка документов.',
        'benefits': 'Можно без ремонта / Ориентир по цене / Понятный план действий',
        'short': 'Пустует квартира? Разберём варианты продажи или аренды.',
        'manager': 'Не использовать от первого лица как покупателя. Если есть реально подтверждённая заявка, применять отдельный объектный сценарий с фактическими критериями и сроком актуальности; здесь не обещать «Куплю», готового покупателя, быструю продажу или точную рыночную цену.',
    },
    'trust_service_documents_check': {
        'headline': 'ДОКУМЕНТЫ / ПЕРЕД СДЕЛКОЙ',
        'description': 'Помогу собрать исходные данные и передать документы профильному специалисту.',
        'benefits': 'Список документов / Подключение юриста / Понятный следующий шаг',
        'short': 'Соберём документы и передадим профильному специалисту.',
        'manager': 'Использовать только если офис реально организует передачу документов профильному специалисту; СПН собирает исходные данные и не делает окончательный правовой вывод; не обещать полную юридическую безопасность, отсутствие рисков или гарантированный результат проверки.',
    },
    'custom_service_consultation': {
        'headline': 'НУЖНА / КОНСУЛЬТАЦИЯ / ПО НЕДВИЖИМОСТИ?',
        'description': 'Замените текст на конкретную услугу: оценка цены, документы, ипотека, продажа или покупка.',
        'benefits': 'Объясним простым языком / Подскажем риски / Поможем с планом действий',
        'short': 'Заглушку не печатать. Нужен индивидуальный согласованный текст одной услуги.',
        'manager': 'Перед печатью полностью заменить заголовок, описание, преимущества и дополнительный блок на текст одной конкретной услуги. Заглушку не печатать; после полной замены текст проверяет менеджер, а ипотечные, документарные и оценочные обещания — профильный специалист.',
    },
    'service_micro_4': {
        'headline': 'ПОМОЩЬ / С НЕДВИЖИМОСТЬЮ',
        'description': 'Продажа или покупка: разберём задачу и определим следующий шаг.',
        'benefits': 'скрыты',
        'short': 'Продажа или покупка — начнём с разбора задачи.',
        'manager': 'Использовать как общий вход только в продажу или покупку: разберём задачу и определим следующий шаг. Ипотечные и юридические темы рекламировать отдельными шаблонами с соответствующими условиями и профильными специалистами.',
    },
}
for tid, cfg in updates.items():
    if cfg.get('old_heading'):
        evidence = replace_once(evidence, cfg['old_heading'], cfg['heading'], f'{tid} evidence heading')
    pattern = rf'(## `{re.escape(tid)}` —[^\n]*\n)(.*?)(?=\n## `|\Z)'
    match = re.search(pattern, evidence, flags=re.S)
    if not match:
        raise RuntimeError(f'evidence section missing: {tid}')
    section = match.group(2)
    if cfg.get('note'):
        section, n = re.subn(r'^- Назначение:.*$', f"- Назначение: {cfg['note']}", section, count=1, flags=re.M)
        if n != 1: raise RuntimeError(f'{tid}: evidence note line missing')
    for key, label in [('headline','Заголовок'),('description','Описание'),('benefits','Преимущества'),('manager','Ограничение менеджера')]:
        section, n = re.subn(rf'^- {label}:.*$', f"- {label}: {cfg[key]}", section, count=1, flags=re.M)
        if n != 1: raise RuntimeError(f'{tid}: evidence {label} line missing')
    short_line = f"- Короткий запасной текст: {cfg['short']}"
    if short_line not in section:
        section, n = re.subn(r'(^- Преимущества:.*$)', rf'\1\n{short_line}', section, count=1, flags=re.M)
        if n != 1: raise RuntimeError(f'{tid}: evidence benefits line missing for short text')
    # For trust template also sync the additional block if evidence has it.
    if tid == 'trust_service_documents_check':
        section, n = re.subn(r'^- Дополнительный блок:.*$', '- Дополнительный блок: Важно — итоговая правовая оценка после проверки специалистом.', section, count=1, flags=re.M)
        if n != 1: raise RuntimeError('trust evidence additional block line missing')
    evidence = evidence[:match.start(2)] + section + evidence[match.end(2):]
evidence_path.write_text(evidence, encoding='utf-8')

# --- manager review: record exactly the five PR3 decisions; overall status stays NOT PASSED pending final reconciliation/legal gate ---
review_path = root / 'docs/manager-sensitive-template-review-3.86.0.md'
review = review_path.read_text(encoding='utf-8')
review = review.replace('### 9. `seller_empty_flat` — куплю пустующую квартиру', '### 9. `seller_empty_flat` — пустует квартира?', 1)
decisions = {
    'service_complex_sale': (
        'Утверждённое условие реализовано в issue #122; рекламный текст сохранён, шаблон остаётся test.',
        'Использование только после первичного разбора с обязательной передачей юридически чувствительных вопросов профильному специалисту.'
    ),
    'seller_empty_flat': (
        'Утверждённая редакция реализована в issue #122; ложное «Куплю» удалено, шаблон остаётся test.',
        'Прямой спрос не заявляется; при реальной заявке использовать отдельный объектный сценарий с подтверждёнными критериями и сроком актуальности.'
    ),
    'trust_service_documents_check': (
        'Утверждённая редакция реализована в issue #122; роли СПН и профильного специалиста разделены.',
        'СПН собирает исходные данные и передаёт документы; итоговая правовая оценка выполняется профильным специалистом.'
    ),
    'custom_service_consultation': (
        'Утверждённое условие реализовано в issue #122; заготовка остаётся test/manager и не является готовой рекламой.',
        'Заглушку не печатать: до печати полностью заменить все смысловые поля текстом одной услуги и пройти менеджерскую проверку.'
    ),
    'service_micro_4': (
        'Утверждённая редакция реализована в issue #122; шаблон остаётся test.',
        'Массовый формат ограничен продажей или покупкой; ипотека и документы вынесены в отдельные шаблоны.'
    ),
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
    if (n1,n2,n3) != (1,1,1):
        raise RuntimeError(f'review line mismatch {tid}: {(n1,n2,n3)}')
    review = review[:match.start(2)] + section + review[match.end(2):]
review_path.write_text(review, encoding='utf-8')

# --- narrow regression contract for issue #122 ---
validator_path = root / 'tools/validate-manager-sensitive-review.mjs'
validator = validator_path.read_text(encoding='utf-8')
if 'const issue122Approved = {' not in validator:
    anchor = '\n\nconst review = readRequired(reviewPath);'
    block = r'''

const issue122Approved = {
  service_complex_sale: {
    headline:'СЛОЖНАЯ\nПРОДАЖА?',
    description:'Ипотека, маткапитал, встречная покупка, доли, наследство, документы — разберём ситуацию и составим план действий.',
    benefits:'План сделки\nЮридическая консультация\nКонтроль сроков',
    shortText:'СЛОЖНАЯ ПРОДАЖА? Разберём ситуацию и составим план.'
  },
  seller_empty_flat: {
    title:'Пустует квартира?', headline:'ПУСТУЕТ\nКВАРТИРА?',
    description:'Помогу оценить варианты: продажа, аренда или подготовка документов.',
    benefits:'Можно без ремонта\nОриентир по цене\nПонятный план действий',
    shortText:'Пустует квартира? Разберём варианты продажи или аренды.'
  },
  trust_service_documents_check: {
    headline:'ДОКУМЕНТЫ\nПЕРЕД СДЕЛКОЙ',
    description:'Помогу собрать исходные данные и передать документы профильному специалисту.',
    benefits:'Список документов\nПодключение юриста\nПонятный следующий шаг',
    customBlockTitle:'Важно', customBlockText:'Итоговая правовая оценка после проверки специалистом.',
    shortText:'Соберём документы и передадим профильному специалисту.'
  },
  custom_service_consultation: {
    headline:'НУЖНА\nКОНСУЛЬТАЦИЯ\nПО НЕДВИЖИМОСТИ?',
    description:'Замените текст на конкретную услугу: оценка цены, документы, ипотека, продажа или покупка.',
    benefits:'Объясним простым языком\nПодскажем риски\nПоможем с планом действий',
    shortText:'Заглушку не печатать. Нужен индивидуальный согласованный текст одной услуги.'
  },
  service_micro_4: {
    headline:'ПОМОЩЬ\nС НЕДВИЖИМОСТЬЮ',
    description:'Продажа или покупка: разберём задачу и определим следующий шаг.',
    benefits:'', shortText:'Продажа или покупка — начнём с разбора задачи.'
  }
};
const issue122ReviewDecisions = {
  service_complex_sale: 'Решение: Утверждённое условие реализовано в issue #122; рекламный текст сохранён, шаблон остаётся test.',
  seller_empty_flat: 'Решение: Утверждённая редакция реализована в issue #122; ложное «Куплю» удалено, шаблон остаётся test.',
  trust_service_documents_check: 'Решение: Утверждённая редакция реализована в issue #122; роли СПН и профильного специалиста разделены.',
  custom_service_consultation: 'Решение: Утверждённое условие реализовано в issue #122; заготовка остаётся test/manager и не является готовой рекламой.',
  service_micro_4: 'Решение: Утверждённая редакция реализована в issue #122; шаблон остаётся test.'
};
'''
    if anchor not in validator:
        raise RuntimeError('validator issue122 constant anchor missing')
    validator = validator.replace(anchor, block + anchor, 1)

if 'issue #122 требует точное значение' not in validator:
    anchor = '\nif(errors.length){\n'
    checks = r'''

for(const [id, expected] of Object.entries(issue122Approved)){
  const template = (templateGroups.get(id) || [])[0];
  if(!template) continue;
  const office = template.office || {};
  const rule = portfolio.templates?.[id] || {};
  if(expected.title && template.title !== expected.title) errors.push(`${id}: issue #122 требует точное значение title`);
  for(const field of ['headline','description','benefits','customBlockTitle','customBlockText']){
    if(field in expected && template.data?.[field] !== expected[field]) errors.push(`${id}: issue #122 требует точное значение data.${field}`);
  }
  if(template.portfolioStatus !== 'test') errors.push(`${id}: issue #122 требует status=test`);
  if(rule && typeof rule === 'object' && 'replacementId' in rule) errors.push(`${id}: issue #122 запрещает replacementId`);
  if(office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) errors.push(`${id}: issue #122 требует office manager/high/recommended=false`);
  requireSnippets(`issue #122: короткий запасной текст ${id}`, evidence, [`- Короткий запасной текст: ${expected.shortText}`]);
  requireSnippets(`issue #122: решение ${id}`, reviewSection(review, id), [
    '- [x] Решение и необходимые изменения зафиксированы.', issue122ReviewDecisions[id]
  ]);
}
const issue122Seller = (templateGroups.get('seller_empty_flat') || [])[0];
if(issue122Seller){
  const ownText = normalize([issue122Seller.title, issue122Seller.note, ...(issue122Seller.tags || []), issue122Seller.data?.headline, issue122Seller.data?.description, issue122Seller.data?.benefits].join(' '));
  if(/\bкуплю\b|готов\w*\s+покупател/.test(ownText)) errors.push('seller_empty_flat: issue #122 запрещает рекламное «Куплю»/«готовый покупатель»');
}
const issue122Trust = (templateGroups.get('trust_service_documents_check') || [])[0];
if(issue122Trust){
  const text = normalize([issue122Trust.data?.description, issue122Trust.data?.benefits, issue122Trust.data?.customBlockText, issue122Trust.office?.managerNote].join(' '));
  if(!/профильн\w*\s+специалист/.test(text) || !/итогов\w*\s+правов/.test(text)) errors.push('trust_service_documents_check: issue #122 требует явного разделения ролей СПН и профильного специалиста');
}
const issue122Custom = (templateGroups.get('custom_service_consultation') || [])[0];
if(issue122Custom){
  const note = normalize(issue122Custom.office?.managerNote || '');
  if(!/полностью\s+замен/.test(note) || !/заглушк\w*\s+не\s+печат/.test(note) || !/менеджер/.test(note)) errors.push('custom_service_consultation: issue #122 требует запрет печати заглушки до полной замены и менеджерской проверки');
}
const issue122Micro = (templateGroups.get('service_micro_4') || [])[0];
if(issue122Micro){
  const ownText = normalize([issue122Micro.data?.headline, issue122Micro.data?.description, issue122Micro.data?.benefits].join(' '));
  if(/ипотек|документ/.test(ownText)) errors.push('service_micro_4: issue #122 запрещает объединять ипотеку и документы в массовом рекламном тексте');
}
'''
    if anchor not in validator:
        raise RuntimeError('validator issue122 check anchor missing')
    validator = validator.replace(anchor, checks + anchor, 1)
validator_path.write_text(validator, encoding='utf-8')
