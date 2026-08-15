import pathlib
import re

root = pathlib.Path('.')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match, got {count}')
    return text.replace(old, new, 1)

# --- templates.json: only the two approved template records ---
path = root / 'data/templates.json'
text = path.read_text(encoding='utf-8')
replacements = [
    ('"title": "Новостройки без комиссии"', '"title": "Новостройки с понятными условиями"', 'no_commission title'),
    ('"note": "Ключевой шаблон по новостройкам."', '"note": "Для подбора новостроек с прозрачным объяснением стоимости и порядка услуг."', 'no_commission note'),
    ('"tags": [\n      "новостройки",\n      "без комиссии"\n    ],', '"tags": [\n      "новостройки"\n    ],', 'no_commission tags'),
    ('"headline": "НОВОСТРОЙКИ\\nБЕЗ КОМИССИИ"', '"headline": "НОВОСТРОЙКИ\\nС ПОНЯТНЫМИ\\nУСЛОВИЯМИ"', 'no_commission headline'),
    ('"description": "Подберу квартиру в новостройке по вашему бюджету. Услуги для покупателя часто оплачивает застройщик-партнёр."', '"description": "Подберу актуальные варианты и заранее объясню стоимость и порядок услуг."', 'no_commission description'),
    ('"benefits": "Подбор ЖК\\nПомощь с ипотекой\\nСравнение вариантов"', '"benefits": "Актуальные квартиры\\nСравнение вариантов\\nУсловия по договору"', 'no_commission benefits'),
    ('"description": "Подберу варианты по платежу, первоначальному взносу и сроку сдачи. Расскажу, где условия выгоднее."', '"description": "Подберу варианты по бюджету и сроку сдачи. Сравним актуальные условия покупки."', 'budget description'),
    ('"benefits": "Расчёт платежа\\nПодбор планировки\\nКонсультация бесплатно"', '"benefits": "Сравнение вариантов\\nПодбор планировки\\nПредварительный расчёт"', 'budget benefits'),
]
for old, new, label in replacements:
    text = replace_once(text, old, new, label)
path.write_text(text, encoding='utf-8')

# --- office policy: preserve compact JSON formatting ---
path = root / 'data/template_office_overrides.json'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    'Перед печатью подтвердить по каждому проекту, что покупатель действительно не платит комиссию, проверить договор с застройщиком, актуальные цены, доступные квартиры и условия услуги.',
    'Перед печатью проверить конкретный проект, наличие, цену, договор и действующий прейскурант; заранее объяснить стоимость и порядок услуг; не обещать «без комиссии», «бесплатно» или нулевую стоимость без документального подтверждения для всего тиража.',
    'no_commission managerNote'
)
text = replace_once(
    text,
    'Перед тиражом пересчитать цены, первоначальный взнос и платёж по актуальным программам; формулировку «где выгоднее» использовать только после сравнения доступных проектов и полной стоимости.',
    'Использовать только с актуальной базой квартир и условиями конкретных проектов; расчёт обозначать как предварительный; не обещать «выгоднее», точный платёж, первоначальный взнос или бесплатность без подтверждения.',
    'budget managerNote'
)
path.write_text(text, encoding='utf-8')

# --- portfolio lifecycle: keep test, update only reasons ---
path = root / 'data/template_portfolio_status.json'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    'Утверждение «без комиссии» зависит от конкретного проекта и договора с застройщиком; его нужно подтверждать перед каждым тиражом.',
    'Утверждённая редакция убирает абсолютное обещание «без комиссии»; стоимость и порядок услуг объясняются заранее и проверяются по конкретному проекту, договору и прейскуранту.',
    'no_commission portfolio reason'
)
text = replace_once(
    text,
    'Расчёт платежа, первоначального взноса и сравнение выгоды зависят от актуальных цен, программ и условий банков и требуют проверки менеджером.',
    'Утверждённая редакция убирает «выгоднее», бесплатность и обещание точного платежа; подбор опирается на актуальный бюджет, срок сдачи и предварительный расчёт.',
    'budget portfolio reason'
)
path.write_text(text, encoding='utf-8')

# --- evidence: sync current JSON + policy and add approved short fallback ---
evidence_path = root / 'docs/manager-sensitive-template-evidence-3.86.0.md'
evidence = evidence_path.read_text(encoding='utf-8')
updates = {
    'newbuild_no_commission': {
        'old_heading': '## `newbuild_no_commission` — Новостройки без комиссии',
        'heading': '## `newbuild_no_commission` — Новостройки с понятными условиями',
        'note': 'Для подбора новостроек с прозрачным объяснением стоимости и порядка услуг.',
        'headline': 'НОВОСТРОЙКИ / С ПОНЯТНЫМИ / УСЛОВИЯМИ',
        'description': 'Подберу актуальные варианты и заранее объясню стоимость и порядок услуг.',
        'benefits': 'Актуальные квартиры / Сравнение вариантов / Условия по договору',
        'short': 'Новостройки с понятными условиями. Подберу актуальные варианты.',
        'manager': 'Перед печатью проверить конкретный проект, наличие, цену, договор и действующий прейскурант; заранее объяснить стоимость и порядок услуг; не обещать «без комиссии», «бесплатно» или нулевую стоимость без документального подтверждения для всего тиража.',
    },
    'newbuild_budget': {
        'headline': 'НОВОСТРОЙКА / ПОД ВАШ / БЮДЖЕТ',
        'description': 'Подберу варианты по бюджету и сроку сдачи. Сравним актуальные условия покупки.',
        'benefits': 'Сравнение вариантов / Подбор планировки / Предварительный расчёт',
        'short': 'Подберу новостройку по бюджету и сроку сдачи.',
        'manager': 'Использовать только с актуальной базой квартир и условиями конкретных проектов; расчёт обозначать как предварительный; не обещать «выгоднее», точный платёж, первоначальный взнос или бесплатность без подтверждения.',
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
    evidence = evidence[:match.start(2)] + section + evidence[match.end(2):]
evidence_path.write_text(evidence, encoding='utf-8')

# --- manager review: record exactly the two PR2 decisions; overall status remains NOT PASSED ---
review_path = root / 'docs/manager-sensitive-template-review-3.86.0.md'
review = review_path.read_text(encoding='utf-8')
review = review.replace('### 2. `newbuild_no_commission` — новостройки без комиссии', '### 2. `newbuild_no_commission` — новостройки с понятными условиями', 1)
decisions = {
    'newbuild_no_commission': (
        'Утверждённая редакция реализована в issue #121; templateId сохранён, абсолютное обещание «без комиссии» удалено.',
        'Название, текст, tags и managerNote синхронизированы; перед печатью проверять проект, наличие, цену, договор и действующий прейскурант.'
    ),
    'newbuild_budget': (
        'Утверждённая редакция реализована в issue #121; шаблон остаётся test.',
        '«Выгоднее», «бесплатно» и точные платёжные обещания удалены; расчёт обозначается как предварительный.'
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

# --- narrow regression contract for issue #121 ---
validator_path = root / 'tools/validate-manager-sensitive-review.mjs'
validator = validator_path.read_text(encoding='utf-8')
if 'const issue121Approved = {' not in validator:
    anchor = '\n\nconst review = readRequired(reviewPath);'
    block = r'''

const issue121Approved = {
  newbuild_no_commission: {
    title:'Новостройки с понятными условиями',
    headline:'НОВОСТРОЙКИ\nС ПОНЯТНЫМИ\nУСЛОВИЯМИ',
    description:'Подберу актуальные варианты и заранее объясню стоимость и порядок услуг.',
    benefits:'Актуальные квартиры\nСравнение вариантов\nУсловия по договору',
    shortText:'Новостройки с понятными условиями. Подберу актуальные варианты.'
  },
  newbuild_budget: {
    title:'Новостройка под бюджет',
    headline:'НОВОСТРОЙКА\nПОД ВАШ\nБЮДЖЕТ',
    description:'Подберу варианты по бюджету и сроку сдачи. Сравним актуальные условия покупки.',
    benefits:'Сравнение вариантов\nПодбор планировки\nПредварительный расчёт',
    shortText:'Подберу новостройку по бюджету и сроку сдачи.'
  }
};
const issue121ReviewDecisions = {
  newbuild_no_commission: 'Решение: Утверждённая редакция реализована в issue #121; templateId сохранён, абсолютное обещание «без комиссии» удалено.',
  newbuild_budget: 'Решение: Утверждённая редакция реализована в issue #121; шаблон остаётся test.'
};
'''
    if anchor not in validator:
        raise RuntimeError('validator issue121 constant anchor missing')
    validator = validator.replace(anchor, block + anchor, 1)

if 'issue #121 требует точное значение' not in validator:
    anchor = '\nif(errors.length){\n'
    checks = r'''

for(const [id, expected] of Object.entries(issue121Approved)){
  const template = (templateGroups.get(id) || [])[0];
  if(!template) continue;
  const office = template.office || {};
  const rule = portfolio.templates?.[id] || {};
  if(template.title !== expected.title) errors.push(`${id}: issue #121 требует точное значение title`);
  for(const field of ['headline','description','benefits']){
    if(template.data?.[field] !== expected[field]) errors.push(`${id}: issue #121 требует точное значение data.${field}`);
  }
  if(template.portfolioStatus !== 'test') errors.push(`${id}: issue #121 требует status=test`);
  if(rule && typeof rule === 'object' && 'replacementId' in rule) errors.push(`${id}: issue #121 запрещает replacementId`);
  if(office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) errors.push(`${id}: issue #121 требует office manager/high/recommended=false`);
  requireSnippets(`issue #121: короткий запасной текст ${id}`, evidence, [`- Короткий запасной текст: ${expected.shortText}`]);
  requireSnippets(`issue #121: решение ${id}`, reviewSection(review, id), [
    '- [x] Решение и необходимые изменения зафиксированы.',
    issue121ReviewDecisions[id]
  ]);
}
const issue121NoCommission = (templateGroups.get('newbuild_no_commission') || [])[0];
if(issue121NoCommission){
  const ownText = normalize([issue121NoCommission.title, issue121NoCommission.note, ...(issue121NoCommission.tags || []), issue121NoCommission.data?.headline, issue121NoCommission.data?.description, issue121NoCommission.data?.benefits].join(' '));
  if(/без\s+комисси|бесплатн/.test(ownText)) errors.push('newbuild_no_commission: issue #121 запрещает обещание «без комиссии»/«бесплатно» в рекламных данных и tags');
}
const issue121Budget = (templateGroups.get('newbuild_budget') || [])[0];
if(issue121Budget){
  const ownText = normalize([issue121Budget.data?.headline, issue121Budget.data?.description, issue121Budget.data?.benefits].join(' '));
  if(/выгодн|бесплатн|расч[её]т\s+платеж|первоначальн/.test(ownText)) errors.push('newbuild_budget: issue #121 запрещает «выгоднее», бесплатность и обещания платежа/взноса');
}
'''
    if anchor not in validator:
        raise RuntimeError('validator issue121 check anchor missing')
    validator = validator.replace(anchor, checks + anchor, 1)
validator_path.write_text(validator, encoding='utf-8')
