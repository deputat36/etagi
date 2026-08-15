import pathlib

path = pathlib.Path('tools/validate-manager-sensitive-review.mjs')
text = path.read_text(encoding='utf-8')

if 'const managerSensitivePinnedIds = new Set([' not in text:
    anchor = '\n\nconst review = readRequired(reviewPath);'
    block = """

const managerSensitivePinnedIds = new Set([
  'buyer_mortgage',
  'newbuild_no_commission',
  'newbuild_budget',
  'newbuild_mortgage',
  'service_mortgage',
  'buyer_maternity_capital',
  'newbuild_family_mortgage',
  'service_complex_sale',
  'seller_empty_flat',
  'trust_service_documents_check',
  'custom_service_consultation',
  'service_micro_4'
]);
"""
    if anchor not in text:
        raise RuntimeError('validator read anchor missing')
    text = text.replace(anchor, block + anchor, 1)

old = """function isSensitiveTemplate(template){
  const office = template.office || {};
  if(template.portfolioStatus !== 'test' || office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) return false;

  const catalog = normalize([
"""
new = """function isSensitiveTemplate(template){
  const office = template.office || {};
  if(template.portfolioStatus !== 'test' || office.level !== 'manager' || office.risk !== 'high' || office.recommended !== false) return false;
  if(managerSensitivePinnedIds.has(template.id)) return true;

  const catalog = normalize([
"""
if old not in text:
    raise RuntimeError('isSensitiveTemplate anchor missing')
text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
