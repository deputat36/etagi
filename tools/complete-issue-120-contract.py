import pathlib
import re

root = pathlib.Path('.')

evidence_path = root / 'docs/manager-sensitive-template-evidence-3.86.0.md'
evidence = evidence_path.read_text(encoding='utf-8')
shorts = {
    'buyer_mortgage': 'КВАРТИРА С ИПОТЕКОЙ. Оценивайте свои финансовые возможности и риски.',
    'newbuild_mortgage': 'НОВОСТРОЙКА С ИПОТЕКОЙ. Оценивайте свои финансовые возможности и риски.',
    'service_mortgage': 'КОНСУЛЬТАЦИЯ ПО ИПОТЕКЕ. Оценивайте свои финансовые возможности и риски.',
    'buyer_maternity_capital': 'КВАРТИРА С МАТКАПИТАЛОМ. Разберём условия и подберём варианты.',
    'newbuild_family_mortgage': 'СЕМЕЙНАЯ ИПОТЕКА. Оценивайте свои финансовые возможности и риски.',
}
for tid, short in shorts.items():
    line = f'- Короткий запасной текст: {short}'
    if line in evidence:
        continue
    pattern = rf'(## `{re.escape(tid)}` —[^\n]*\n)(.*?)(?=\n## `|\Z)'
    match = re.search(pattern, evidence, flags=re.S)
    if not match:
        raise RuntimeError(f'evidence section missing: {tid}')
    section = match.group(2)
    section, count = re.subn(r'(^- Преимущества:.*$)', rf'\1\n{line}', section, count=1, flags=re.M)
    if count != 1:
        raise RuntimeError(f'benefits line missing in evidence: {tid}')
    evidence = evidence[:match.start(2)] + section + evidence[match.end(2):]
evidence_path.write_text(evidence, encoding='utf-8')

validator_path = root / 'tools/validate-manager-sensitive-review.mjs'
validator = validator_path.read_text(encoding='utf-8')

if 'const issue120ShortTexts = {' not in validator:
    anchor = "const issue120MortgageIds = ['buyer_mortgage','newbuild_mortgage','service_mortgage','newbuild_family_mortgage'];\n"
    block = """
const issue120ShortTexts = {
  buyer_mortgage: 'КВАРТИРА С ИПОТЕКОЙ. Оценивайте свои финансовые возможности и риски.',
  newbuild_mortgage: 'НОВОСТРОЙКА С ИПОТЕКОЙ. Оценивайте свои финансовые возможности и риски.',
  service_mortgage: 'КОНСУЛЬТАЦИЯ ПО ИПОТЕКЕ. Оценивайте свои финансовые возможности и риски.',
  buyer_maternity_capital: 'КВАРТИРА С МАТКАПИТАЛОМ. Разберём условия и подберём варианты.',
  newbuild_family_mortgage: 'СЕМЕЙНАЯ ИПОТЕКА. Оценивайте свои финансовые возможности и риски.'
};
const issue120ReviewDecisions = {
  buyer_mortgage: 'Решение: Утверждённая редакция реализована в issue #120; шаблон остаётся test.',
  newbuild_mortgage: 'Решение: Утверждённая редакция реализована в issue #120; шаблон остаётся test.',
  service_mortgage: 'Решение: Утверждённая редакция реализована в issue #120; шаблон остаётся test.',
  buyer_maternity_capital: 'Решение: Утвердить без изменения рекламного текста; policy синхронизирована в issue #120.',
  newbuild_family_mortgage: 'Решение: Утверждённая редакция реализована в issue #120; шаблон остаётся test.'
};
""".strip() + '\n'
    if anchor not in validator:
        raise RuntimeError('validator anchor for issue120MortgageIds missing')
    validator = validator.replace(anchor, anchor + block, 1)

if 'issue #120: короткий запасной текст' not in validator:
    anchor = "for(const id of issue120MortgageIds){\n"
    block = """
for(const [id, shortText] of Object.entries(issue120ShortTexts)){
  requireSnippets(`issue #120: короткий запасной текст ${id}`, evidence, [
    `- Короткий запасной текст: ${shortText}`
  ]);
  const section = reviewSection(review, id);
  requireSnippets(`issue #120: решение ${id}`, section, [
    '- [x] Решение и необходимые изменения зафиксированы.',
    issue120ReviewDecisions[id]
  ]);
}
for(const id of issue120MortgageIds){
  const section = reviewSection(review, id);
  requireSnippets(`issue #120: незакрытая юридическая проверка ${id}`, section, [
    'единая юридическая проверка применимости и площади остаётся отдельным незакрытым условием.'
  ]);
}

"""
    if anchor not in validator:
        raise RuntimeError('validator loop anchor missing')
    validator = validator.replace(anchor, block + anchor, 1)

if 'function reviewSection(source, id)' not in validator:
    anchor = 'function customBlock(template){\n'
    helper = """
function reviewSection(source, id){
  const text = String(source || '');
  const markerIndex = text.indexOf(`\\`${id}\\``);
  if(markerIndex < 0){
    errors.push(`${id}: в основном бланке не найден раздел решения issue #120`);
    return '';
  }
  const start = text.lastIndexOf('### ', markerIndex);
  const nextHeading = text.indexOf('\\n### ', markerIndex);
  const finalHeading = text.indexOf('\\n## Итог менеджера', markerIndex);
  const end = nextHeading < 0 ? finalHeading : (finalHeading >= 0 && finalHeading < nextHeading ? finalHeading : nextHeading);
  if(start < 0 || end < 0){
    errors.push(`${id}: не удалось выделить границы раздела решения issue #120`);
    return '';
  }
  return text.slice(start, end);
}

"""
    if anchor not in validator:
        raise RuntimeError('validator helper anchor missing')
    validator = validator.replace(anchor, helper + anchor, 1)

validator_path.write_text(validator, encoding='utf-8')
