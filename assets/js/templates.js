const TEMPLATE_FILES = [
  'data/templates.json',
  'data/templates_custom.json',
  'data/templates_sales.json',
  'data/templates_extra.json',
  'data/templates_borisoglebsk.json',
  'data/templates_borisoglebsk_expanded.json',
  'data/templates_tellerman_sad.json',
  'data/templates_entrance.json',
  'data/templates_ab_tests.json',
  'data/templates_trust.json'
];
const TEMPLATE_PORTFOLIO_FILE = 'data/template_portfolio_status.json';
const TEMPLATE_OFFICE_OVERRIDES_FILE = 'data/template_office_overrides.json';
const TEMPLATE_ID_ALIASES_FILE = 'data/template_id_aliases.json';

let templateLoadPromise = null;

export function loadTemplates(){
  if(!templateLoadPromise) templateLoadPromise = loadTemplateFiles();
  return templateLoadPromise;
}

async function loadTemplateFiles(){
  const [loadedPackages, portfolioRegistry, officeOverrides, idAliases] = await Promise.all([
    Promise.all(TEMPLATE_FILES.map(async file => ({file, templates: await loadTemplateFile(file)}))),
    loadTemplatePortfolioRegistry(),
    loadTemplateOfficeOverrides(),
    loadTemplateIdAliases()
  ]);
  const byId = new Map();

  for(const {file, templates} of loadedPackages){
    const packageName = file.split('/').pop();
    for(const item of templates){
      if(!item?.id) continue;
      const withPortfolio = enrichTemplatePortfolio(item, packageName, portfolioRegistry);
      const withOffice = enrichTemplateOffice(withPortfolio, officeOverrides);
      const resolved = applyTemplateIdAlias(withOffice, packageName, idAliases);
      if(byId.has(resolved.id)){
        console.warn(`Повторяющийся templateId пропущен: ${resolved.id} (${packageName}). Добавьте алиас в ${TEMPLATE_ID_ALIASES_FILE}.`);
        continue;
      }
      byId.set(resolved.id, resolved);
    }
  }
  return [...byId.values()];
}

async function loadTemplatePortfolioRegistry(){
  try{
    const res = await fetch(TEMPLATE_PORTFOLIO_FILE, {cache:'no-store'});
    if(!res.ok) return emptyPortfolioRegistry();
    const data = await res.json();
    if(!data || typeof data !== 'object' || Array.isArray(data)) return emptyPortfolioRegistry();
    return {
      defaultStatus: data.defaultStatus || 'working',
      packageDefaults: data.packageDefaults && typeof data.packageDefaults === 'object' ? data.packageDefaults : {},
      templates: data.templates && typeof data.templates === 'object' ? data.templates : {}
    };
  } catch(e){
    console.warn(`Не удалось загрузить реестр статусов шаблонов: ${TEMPLATE_PORTFOLIO_FILE}`, e);
    return emptyPortfolioRegistry();
  }
}

async function loadTemplateOfficeOverrides(){
  try{
    const res = await fetch(TEMPLATE_OFFICE_OVERRIDES_FILE, {cache:'no-store'});
    if(!res.ok) return emptyOfficeOverrides();
    const data = await res.json();
    if(!data || typeof data !== 'object' || Array.isArray(data)) return emptyOfficeOverrides();
    return {
      templates: data.templates && typeof data.templates === 'object' ? data.templates : {}
    };
  } catch(e){
    console.warn(`Не удалось загрузить реестр office-разметки: ${TEMPLATE_OFFICE_OVERRIDES_FILE}`, e);
    return emptyOfficeOverrides();
  }
}

async function loadTemplateIdAliases(){
  try{
    const res = await fetch(TEMPLATE_ID_ALIASES_FILE, {cache:'no-store'});
    if(!res.ok) return emptyIdAliases();
    const data = await res.json();
    if(!data || typeof data !== 'object' || Array.isArray(data)) return emptyIdAliases();
    return {
      packages: data.packages && typeof data.packages === 'object' ? data.packages : {}
    };
  } catch(e){
    console.warn(`Не удалось загрузить реестр алиасов шаблонов: ${TEMPLATE_ID_ALIASES_FILE}`, e);
    return emptyIdAliases();
  }
}

function enrichTemplatePortfolio(template, packageName, registry){
  const packageRule = normalizePortfolioRule(registry.packageDefaults?.[packageName]);
  const templateRule = normalizePortfolioRule(registry.templates?.[template.id]);
  return {
    ...template,
    portfolio: {
      status: templateRule.status || packageRule.status || registry.defaultStatus || 'working',
      reason: templateRule.reason || packageRule.reason || '',
      replacementId: templateRule.replacementId || ''
    }
  };
}

function enrichTemplateOffice(template, registry){
  const override = normalizeOfficeOverride(registry.templates?.[template.id]);
  if(!override.tags.length && !override.office) return template;
  return {
    ...template,
    tags: [...new Set([...(Array.isArray(template.tags) ? template.tags : []), ...override.tags])],
    office: override.office ? {...(template.office || {}), ...override.office} : template.office
  };
}

function applyTemplateIdAlias(template, packageName, registry){
  const sourceId = String(template.id || '').trim();
  const alias = String(registry.packages?.[packageName]?.[sourceId] || '').trim();
  return {
    ...template,
    id: alias || sourceId,
    sourceId: alias ? sourceId : '',
    sourcePackage: packageName
  };
}

function normalizePortfolioRule(rule){
  if(typeof rule === 'string') return {status:rule, reason:'', replacementId:''};
  if(!rule || typeof rule !== 'object' || Array.isArray(rule)) return {status:'', reason:'', replacementId:''};
  return {
    status: String(rule.status || '').trim(),
    reason: String(rule.reason || '').trim(),
    replacementId: String(rule.replacementId || '').trim()
  };
}

function normalizeOfficeOverride(rule){
  if(!rule || typeof rule !== 'object' || Array.isArray(rule)) return {tags:[], office:null};
  const office = rule.office && typeof rule.office === 'object' && !Array.isArray(rule.office) ? rule.office : null;
  return {
    tags: Array.isArray(rule.tags) ? rule.tags.map(tag => String(tag || '').trim()).filter(Boolean) : [],
    office
  };
}

function emptyPortfolioRegistry(){
  return {defaultStatus:'working', packageDefaults:{}, templates:{}};
}

function emptyOfficeOverrides(){
  return {templates:{}};
}

function emptyIdAliases(){
  return {packages:{}};
}

async function loadTemplateFile(path){
  try{
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch(e){
    console.warn(`Не удалось загрузить шаблоны: ${path}`, e);
    return [];
  }
}

export function filterTemplates(templates, goal, query='', density='all'){
  const q = normalizeSearch(query);
  return templates.filter(t => {
    const goalOk = t.goal === goal || t.goal === 'all';
    const densityOk = density === 'all' || t.density === density;
    const queryOk = !q || matchesSearchQuery(getTemplateSearchText(t), q);
    return goalOk && densityOk && queryOk;
  });
}

function matchesSearchQuery(text, query){
  const haystack = normalizeSearch(text);
  const needle = normalizeSearch(query);
  if(!needle) return true;
  if(haystack.includes(needle)) return true;

  const tokens = needle.split(' ').filter(Boolean);
  if(!tokens.length) return true;

  return tokens.every(token => matchesToken(haystack, token));
}

function matchesToken(text, token){
  if(text.includes(token)) return true;
  if(token.length < 6) return false;

  const softStem = token.slice(0, -1);
  const shortStem = token.slice(0, -2);
  return Boolean(
    (softStem.length >= 5 && text.includes(softStem)) ||
    (shortStem.length >= 5 && text.includes(shortStem))
  );
}

function getTemplateSearchText(template){
  const data = template?.data || {};
  const office = template?.office || {};
  return normalizeSearch([
    template?.id,
    template?.sourceId,
    template?.sourcePackage,
    template?.goal,
    template?.title,
    template?.note,
    ...(template?.tags || []),
    template?.portfolio?.status,
    template?.portfolio?.reason,
    template?.portfolio?.replacementId,
    office.scenario,
    office.level,
    office.risk,
    office.managerNote,
    data.area,
    data.propertyType,
    data.price,
    data.params,
    data.headline,
    data.description,
    data.benefits,
    data.customBlockTitle,
    data.customBlockText,
    data.qrCaption,
    data.contactCta,
    data.tearOffLabel,
    data.brandName,
    data.brandSideText
  ].filter(Boolean).join(' '));
}

function normalizeSearch(value){
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}
