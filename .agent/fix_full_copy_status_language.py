from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_all(relative_path: str, replacements: list[tuple[str, str]]) -> None:
    path = ROOT / relative_path
    source = path.read_text(encoding='utf-8')
    for old, new in replacements:
        if old not in source:
            raise SystemExit(f'{relative_path}: отсутствует {old}')
        source = source.replace(old, new)
    path.write_text(source, encoding='utf-8')


replace_all('assets/js/spnWorkspaceBackup.js', [
    ('aria-label="Режим восстановления backup"', 'aria-label="Режим восстановления полной копии"'),
    ('setStatus(`Backup скачан: ${backup.entryCount} разделов localStorage.`);', 'setStatus(`Полная копия скачана: ${backup.entryCount} разделов локальных данных.`);'),
    ("setStatus('Backup слишком большой. Максимальный размер — 3 МБ.');", "setStatus('Полная копия слишком большая. Максимальный размер — 3 МБ.');"),
    ("setStatus('Не удалось открыть backup: файл не является корректным JSON.');", "setStatus('Не удалось открыть полную копию: файл не является корректным JSON.');"),
    ('setStatus(`Backup отклонён: ${validation.error}`);', 'setStatus(`Полная копия отклонена: ${validation.error}`);'),
    ('`Удалить ${currentCount} текущих разделов и восстановить ${nextCount} из backup?`', '`Удалить ${currentCount} текущих разделов и восстановить ${nextCount} из полной копии?`'),
    ('`Объединить ${nextCount} разделов backup с ${currentCount} текущими? Совпадающие ключи будут обновлены.`', '`Объединить ${nextCount} разделов полной копии с ${currentCount} текущими? Совпадающие ключи будут обновлены.`'),
    ("setStatus('Восстановление backup отменено.');", "setStatus('Восстановление полной копии отменено.');"),
    ('setStatus(`Backup восстановлен: ${nextCount} разделов. Перезагрузка…`);', 'setStatus(`Полная копия восстановлена: ${nextCount} разделов. Перезагрузка…`);'),
    ("'Ошибка восстановления и отката. Не закрывайте вкладку: исходный backup лучше сохранить отдельно.'", "'Ошибка восстановления и отката. Не закрывайте вкладку: исходную полную копию лучше сохранить отдельно.'"),
    ("return fail('неизвестный тип backup');", "return fail('неизвестный тип полной копии');"),
    ("return fail('backup не содержит данных проекта');", "return fail('полная копия не содержит данных проекта');")
])

path = ROOT / 'tools/validate-workspace-backup.mjs'
source = path.read_text(encoding='utf-8')
anchor = "  'data-save-transfer-section=\"workspace\"'\n]);"
replacement = "  'data-save-transfer-section=\"workspace\"',\n  'Полная копия скачана:',\n  'Полная копия восстановлена:',\n  'Восстановление полной копии отменено.'\n]);"
if source.count(anchor) != 1:
    raise SystemExit(f'tools/validate-workspace-backup.mjs: неверная точка контракта {source.count(anchor)}')
path.write_text(source.replace(anchor, replacement, 1), encoding='utf-8')
