// Слой рекомендаций поверх существующих шаблонов.
// Не меняет templateId, печать и сохранение макетов.

let recommendations = {};

export async function loadTemplateRecommendations(){
  const response = await fetch('./data/template_recommendations.json');
  if(!response.ok) throw new Error('Не удалось загрузить рекомендации шаблонов');

  const data = await response.json();
  recommendations = data.recommendations || {};
  return recommendations;
}

export function getRecommendations(spnGoalId){
  return Array.isArray(recommendations[spnGoalId])
    ? recommendations[spnGoalId]
    : [];
}

export function getRecommendedTemplate(spnGoalId){
  return getRecommendations(spnGoalId)
    .slice()
    .sort((a,b)=>(b.priority || 0) - (a.priority || 0))[0] || null;
}

export function getRecommendationReason(templateId, spnGoalId){
  const item = getRecommendations(spnGoalId)
    .find(entry => entry.templateId === templateId);

  return item?.reason || [];
}
