from pathlib import Path

# Точная одноразовая миграция списка validate-команд.
path = Path('docs/maintenance-guide.md')
source = path.read_text(encoding='utf-8')
anchor = 'npm run validate:newbie-mode-docs\nnpm run validate:print-screenshots'
replacement = 'npm run validate:newbie-mode-docs\nnpm run validate:newbie-print-simplification\nnpm run validate:print-screenshots'

if replacement in source:
    raise SystemExit('Команда уже добавлена')
if source.count(anchor) != 1:
    raise SystemExit(f'Не найдена точная точка вставки: {source.count(anchor)}')

path.write_text(source.replace(anchor, replacement, 1), encoding='utf-8')
