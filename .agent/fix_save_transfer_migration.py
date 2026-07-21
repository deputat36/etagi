from pathlib import Path

path = Path('.agent/apply_save_transfer_clarity.py')
source = path.read_text(encoding='utf-8')

for fragment in [
    "    ('неизвестный тип backup', 'неизвестный тип полной копии'),\n",
    "    ('backup не содержит данных проекта', 'полная копия не содержит данных проекта'),\n",
    "    ('исходный backup лучше сохранить отдельно', 'исходную полную копию лучше сохранить отдельно'),\n",
]:
    if source.count(fragment) != 1:
        raise SystemExit(f'Не найден лишний документационный фрагмент: {fragment.strip()}')
    source = source.replace(fragment, '', 1)

anchor = """replace_all('docs/workspace-backup.md', [
"""
insert = '''replace_once(
    'tools/validate-workspace-backup.mjs',
    """requireSnippets(files.guide, sources.guide, [
  '# Backup рабочего пространства',
  'etagi-raskleyka-',
  'Объединить с текущими данными',
  'Заменить рабочее пространство',
  'проверяет',
  'предыдущие данные',
  'Фото не входят в backup',
  'нельзя публиковать'
]);""",
    """requireSnippets(files.guide, sources.guide, [
  '# Полная копия рабочего пространства',
  'etagi-raskleyka-',
  'Объединить с текущими данными',
  'Заменить рабочее пространство',
  'проверяет',
  'предыдущие данные',
  'Фото не входят в полную копию',
  'нельзя публиковать'
]);"""
)

'''
if source.count(anchor) != 1:
    raise SystemExit(f'Не найдена точка вставки контракта документа: {source.count(anchor)}')
source = source.replace(anchor, insert + anchor, 1)

source += '''

replace_once(
    'README.md',
    '- полный backup позволяет перенести и восстановить рабочее пространство;',
    '- полная копия позволяет перенести и восстановить рабочее пространство;'
)

replace_all('tools/validate-readme-quality-docs.mjs', [
    ("'### Backup рабочего пространства'", "'### Полная копия рабочего пространства'"),
    ("'полный backup позволяет перенести и восстановить рабочее пространство'", "'полная копия позволяет перенести и восстановить рабочее пространство'")
])
'''

path.write_text(source, encoding='utf-8')
