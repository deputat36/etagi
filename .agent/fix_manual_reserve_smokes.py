from pathlib import Path

for relative_path in ['tools/destructive-snapshot-smoke.html', 'tools/destructive-undo-smoke.html']:
    path = Path(relative_path)
    source = path.read_text(encoding='utf-8')
    old = "textContent.includes('Последний макет сохранён')"
    new = "textContent.includes('Ручной резерв текущего макета сохранён')"
    if source.count(old) != 1:
        raise SystemExit(f'{relative_path}: ожидался один старый статус, найдено {source.count(old)}')
    source = source.replace(old, new, 1)
    source = source.replace("'последний макет не сохранён'", "'ручной резерв не сохранён'", 1)
    path.write_text(source, encoding='utf-8')
