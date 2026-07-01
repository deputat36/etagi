window.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('templateSearch');
  if(!search) return;
  ['input', 'change'].forEach(eventName => {
    search.addEventListener(eventName, () => window.setTimeout(syncOfficeFilterActive, 40));
  });
  document.getElementById('spnOfficeTemplateFilters')?.addEventListener('click', () => {
    window.setTimeout(syncOfficeFilterActive, 80);
  });
  syncOfficeFilterActive();
});

function syncOfficeFilterActive(){
  const search = document.getElementById('templateSearch');
  const cleanSearch = normalize(search?.value);
  document.querySelectorAll('[data-office-query]').forEach(button => {
    const cleanQuery = normalize(button.dataset.officeQuery);
    button.classList.toggle('active', Boolean(cleanSearch && cleanSearch === cleanQuery));
  });
}

function normalize(value){
  return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}
