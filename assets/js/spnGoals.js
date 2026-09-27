// Понятный слой рабочих задач СПН поверх технических goal шаблонов.
// Он не меняет templateId, формат сохранения и печатную логику.

export const spnGoals = [
  {
    id: 'seller',
    title: 'Найти продавца',
    description: 'Найти собственников, которые думают о продаже квартиры, дома или участка.',
    goalIds: ['seller'],
    defaultGoal: 'seller',
    scenario: 'owner',
    keywords: ['собственник', 'продажа', 'оценка', 'район', 'дом']
  },
  {
    id: 'buyer',
    title: 'Найти покупателя',
    description: 'Получить обращения людей, которые выбирают и покупают недвижимость.',
    goalIds: ['buyer'],
    defaultGoal: 'buyer',
    scenario: 'buyer',
    keywords: ['покупатель', 'подбор', 'семья', 'бюджет', 'ипотека']
  },
  {
    id: 'object',
    title: 'Продвинуть объект',
    description: 'Рассказать о квартире, доме или новостройке и привести заинтересованных клиентов.',
    goalIds: ['object', 'newbuild'],
    defaultGoal: 'object',
    scenario: 'all',
    keywords: ['объект', 'квартира', 'дом', 'новостройка', 'жк']
  },
  {
    id: 'personal',
    title: 'Рассказать о себе',
    description: 'Познакомить жителей района с СПН и повысить доверие к специалисту.',
    goalIds: ['brand'],
    defaultGoal: 'brand',
    scenario: 'all',
    keywords: ['специалист', 'эксперт', 'район', 'контакты', 'доверие']
  }
];

export function getSpnGoal(goalId){
  return spnGoals.find(goal => goal.id === goalId) || null;
}

export function getSpnGoalForTemplateGoal(templateGoal){
  return spnGoals.find(goal => goal.goalIds.includes(templateGoal)) || null;
}
