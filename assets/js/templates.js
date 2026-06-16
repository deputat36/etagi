export async function loadTemplates(){
  const res = await fetch('data/templates.json', {cache:'no-store'});
  if(!res.ok) throw new Error('Не удалось загрузить шаблоны');
  return await res.json();
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
