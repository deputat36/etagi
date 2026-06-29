const TEMPLATE_FILES = [
  'data/templates.json',
  'data/templates_custom.json',
  'data/templates_sales.json',
  'data/templates_extra.json',
  'data/templates_borisoglebsk.json',
  'data/templates_tellerman_sad.json',
  'data/templates_entrance.json',
  'data/templates_ab_tests.json',
  'data/templates_trust.json'
];

export async function loadTemplates(){
  const loaded = await Promise.all(TEMPLATE_FILES.map(loadTemplateFile));
  const byId = new Map();
  for(const list of loaded){
    for(const item of list){
      if(item?.id) byId.set(item.id, item);
    }
  }
  return [...byId.values()];
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
    const queryOk = !q || getTemplateSearchText(t).includes(q);
    return goalOk && densityOk && queryOk;
  });
}

function getTemplateSearchText(template){
  const data = template?.data || {};
  return normalizeSearch([
    template?.id,
    template?.goal,
    template?.title,
    template?.note,
    ...(template?.tags || []),
    data.area,
    data.propertyType,
    data.price,
    data.params,
    data.headline,
    data.description,
    data.benefits,
    data.customBlockTitle,
    data.customBlockText,
    data.qrCaption
  ].filter(Boolean).join(' '));
}

function normalizeSearch(value){
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}
