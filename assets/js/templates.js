const TEMPLATE_FILES = [
  'data/templates.json',
  'data/templates_extra.json',
  'data/templates_borisoglebsk.json'
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
  const q = query.trim().toLowerCase();
  return templates.filter(t => {
    const goalOk = t.goal === goal || t.goal === 'all';
    const densityOk = density === 'all' || t.density === density;
    const text = `${t.title} ${t.note} ${t.tags?.join(' ') || ''}`.toLowerCase();
    const queryOk = !q || text.includes(q);
    return goalOk && densityOk && queryOk;
  });
}
