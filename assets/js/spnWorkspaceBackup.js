const STORAGE_PREFIX = 'etagi-raskleyka-';
const BACKUP_SCHEMA = 'etagi-raskleyka-workspace-backup';
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 3 * 1024 * 1024;
const STYLE_ID = 'spnWorkspaceBackupStyles';

window.addEventListener('DOMContentLoaded', () => {
  const saveCard = document.querySelector('.save-card');
  if(!saveCard || document.getElementById('spnWorkspaceBackup')) return;

  injectStyles();
  saveCard.insertAdjacentHTML('beforeend', renderBackupPanel());
  document.getElementById('exportWorkspaceBackupBtn')?.addEventListener('click', exportWorkspaceBackup);
  document.getElementById('importWorkspaceBackupBtn')?.addEventListener('click', () => document.getElementById('workspaceBackupFile')?.click());
  document.getElementById('workspaceBackupFile')?.addEventListener('change', importWorkspaceBackup);
  updateBackupSummary();
});

function renderBackupPanel(){
  return `<section class="spn-workspace-backup save-transfer-section" id="spnWorkspaceBackup" data-save-transfer-section="workspace">
    <div class="spn-workspace-backup-head">
      <div>
        <b>Полная копия рабочего пространства</b>
        <span>Для переноса всех локальных данных: профиля, макетов, настроек, заданий и истории отчётов.</span>
      </div>
      <strong id="workspaceBackupSummary">—</strong>
    </div>
    <div class="spn-workspace-backup-controls">
      <button type="button" id="exportWorkspaceBackupBtn">Скачать полную копию</button>
      <button type="button" id="importWorkspaceBackupBtn">Восстановить из полной копии</button>
      <select id="workspaceBackupImportMode" aria-label="Режим восстановления полной копии">
        <option value="merge">Объединить с текущими данными</option>
        <option value="replace">Заменить рабочее пространство</option>
      </select>
    </div>
    <input id="workspaceBackupFile" type="file" accept="application/json,.json" hidden>
    <p>Фото не входят в полную копию: генератор намеренно не хранит изображения в localStorage.</p>
  </section>`;
}

function exportWorkspaceBackup(){
  const entries = collectWorkspaceEntries();
  const backup = {
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: readAppVersion(entries),
    entryCount: Object.keys(entries).length,
    entries
  };
  const content = JSON.stringify(backup, null, 2);
  downloadJson(`etagi-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`, content);
  setStatus(`Полная копия скачана: ${backup.entryCount} разделов локальных данных.`);
}

async function importWorkspaceBackup(event){
  const input = event.currentTarget;
  const file = input.files?.[0];
  input.value = '';
  if(!file) return;

  if(file.size > MAX_BACKUP_BYTES){
    setStatus('Полная копия слишком большая. Максимальный размер — 3 МБ.');
    return;
  }

  let parsed;
  try{
    parsed = JSON.parse(await file.text());
  } catch(error){
    setStatus('Не удалось открыть полную копию: файл не является корректным JSON.');
    return;
  }

  const validation = validateBackup(parsed);
  if(!validation.ok){
    setStatus(`Полная копия отклонена: ${validation.error}`);
    return;
  }

  const mode = document.getElementById('workspaceBackupImportMode')?.value === 'replace' ? 'replace' : 'merge';
  const previousEntries = collectWorkspaceEntries();
  const currentCount = Object.keys(previousEntries).length;
  const nextCount = Object.keys(validation.entries).length;
  const action = mode === 'replace'
    ? `Удалить ${currentCount} текущих разделов и восстановить ${nextCount} из полной копии?`
    : `Объединить ${nextCount} разделов полной копии с ${currentCount} текущими? Совпадающие ключи будут обновлены.`;

  if(!window.confirm(`${action}\n\nПосле восстановления страница будет перезагружена.`)){
    setStatus('Восстановление полной копии отменено.');
    return;
  }

  try{
    if(mode === 'replace') removeWorkspaceEntries();
    writeWorkspaceEntries(validation.entries);
    setStatus(`Полная копия восстановлена: ${nextCount} разделов. Перезагрузка…`);
    window.setTimeout(() => window.location.reload(), 120);
  } catch(error){
    const rolledBack = rollbackWorkspace(previousEntries);
    setStatus(rolledBack
      ? 'Восстановление не выполнено. Предыдущие данные возвращены без изменений.'
      : 'Ошибка восстановления и отката. Не закрывайте вкладку: исходную полную копию лучше сохранить отдельно.');
  }
}

function collectWorkspaceEntries(){
  const entries = {};
  for(let index = 0; index < localStorage.length; index += 1){
    const key = localStorage.key(index);
    if(!key || !key.startsWith(STORAGE_PREFIX)) continue;
    const value = localStorage.getItem(key);
    if(typeof value === 'string') entries[key] = value;
  }
  return entries;
}

function writeWorkspaceEntries(entries){
  for(const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
}

function removeWorkspaceEntries(){
  const keys = [];
  for(let index = 0; index < localStorage.length; index += 1){
    const key = localStorage.key(index);
    if(key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach(key => localStorage.removeItem(key));
}

function rollbackWorkspace(previousEntries){
  try{
    removeWorkspaceEntries();
    writeWorkspaceEntries(previousEntries);
    return true;
  } catch(error){
    return false;
  }
}

function validateBackup(value){
  if(!value || typeof value !== 'object' || Array.isArray(value)) return fail('корень файла должен быть объектом');
  if(value.schema !== BACKUP_SCHEMA) return fail('неизвестный тип полной копии');
  if(Number(value.version) !== BACKUP_VERSION) return fail(`неподдерживаемая версия ${value.version}`);
  if(!value.entries || typeof value.entries !== 'object' || Array.isArray(value.entries)) return fail('нет объекта entries');

  const entries = {};
  for(const [key, item] of Object.entries(value.entries)){
    if(!key.startsWith(STORAGE_PREFIX)) return fail(`недопустимый ключ ${key}`);
    if(typeof item !== 'string') return fail(`значение ${key} должно быть строкой localStorage`);
    entries[key] = item;
  }
  if(!Object.keys(entries).length) return fail('полная копия не содержит данных проекта');
  return {ok:true, entries};
}

function fail(error){
  return {ok:false, error, entries:{}};
}

function readAppVersion(entries){
  try{
    const state = JSON.parse(entries['etagi-raskleyka-state-v1'] || '{}');
    return String(state.version || 'unknown');
  } catch(error){
    return 'unknown';
  }
}

function updateBackupSummary(){
  const summary = document.getElementById('workspaceBackupSummary');
  if(summary) summary.textContent = `${Object.keys(collectWorkspaceEntries()).length} разделов`;
}

function downloadJson(filename, content){
  const blob = new Blob([content], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setStatus(text){
  const status = document.getElementById('statusLine');
  if(status) status.textContent = text;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .save-transfer-intro{margin:0 0 10px;font-size:11.5px;line-height:1.4;color:#475569}.save-transfer-section{margin-top:10px;padding:10px;border:1px solid #dbe3ee;border-radius:14px;background:#f8fafc}.save-transfer-section-head b{display:block;font-size:12px;font-weight:900;color:#1e293b}.save-transfer-section-head span{display:block;margin-top:3px;font-size:10.5px;line-height:1.35;color:#64748b;font-weight:700}.save-transfer-actions{margin-top:8px}.save-transfer-privacy{margin-top:10px}.saved-layout-controls{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.saved-layout-controls select{grid-column:1 / -1}.spn-workspace-backup{border-color:#c7d2fe;background:#eef2ff}
    .spn-workspace-backup-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
    .spn-workspace-backup-head b{display:block;font-size:12px;font-weight:900;color:#312e81}
    .spn-workspace-backup-head span{display:block;margin-top:3px;font-size:10.5px;line-height:1.25;color:#4f46e5;font-weight:700}
    .spn-workspace-backup-head strong{font-size:10px;color:#4338ca;white-space:nowrap}
    .spn-workspace-backup-controls{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
    .spn-workspace-backup-controls select{grid-column:1 / -1;font-size:12px}
    .spn-workspace-backup-controls button{background:#fff;border:1px solid #c7d2fe;color:#3730a3;box-shadow:none}
    .spn-workspace-backup p{margin:7px 0 0;font-size:10px;line-height:1.3;color:#6366f1;font-weight:700}
    @media(max-width:520px){.spn-workspace-backup-controls,.saved-layout-controls{grid-template-columns:1fr}.saved-layout-controls select{grid-column:auto}}
    @media print{.spn-workspace-backup{display:none!important}}
  `;
  document.head.appendChild(style);
}
