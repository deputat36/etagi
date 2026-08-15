import pathlib

# Applied after tools/apply-issue-122.py, before validators.
evidence_path = pathlib.Path('docs/manager-sensitive-template-evidence-3.86.0.md')
evidence = evidence_path.read_text(encoding='utf-8')
evidence = evidence.replace(
    '- Дополнительный блок: Важно — итоговая правовая оценка после проверки специалистом.',
    '- Дополнительный блок: Важно: Итоговая правовая оценка после проверки специалистом.',
    1,
)
evidence = evidence.replace(
    '- Преимущества: скрыты\n- Короткий запасной текст: Продажа или покупка — начнём с разбора задачи.',
    '- Преимущества: —\n- Короткий запасной текст: Продажа или покупка — начнём с разбора задачи.',
    1,
)
evidence_path.write_text(evidence, encoding='utf-8')

validator_path = pathlib.Path('tools/validate-manager-sensitive-review.mjs')
validator = validator_path.read_text(encoding='utf-8')
validator = validator.replace(
    "if(!/профильн\\w*\\s+специалист/.test(text) || !/итогов\\w*\\s+правов/.test(text)) errors.push('trust_service_documents_check: issue #122 требует явного разделения ролей СПН и профильного специалиста');",
    "if(!text.includes('профильн') || !text.includes('специалист') || !text.includes('итоговая правовая')) errors.push('trust_service_documents_check: issue #122 требует явного разделения ролей СПН и профильного специалиста');",
    1,
)
validator = validator.replace(
    "if(!/полностью\\s+замен/.test(note) || !/заглушк\\w*\\s+не\\s+печат/.test(note) || !/менеджер/.test(note)) errors.push('custom_service_consultation: issue #122 требует запрет печати заглушки до полной замены и менеджерской проверки');",
    "if(!note.includes('полностью заменить') || !note.includes('заглушку не печатать') || !note.includes('менеджер')) errors.push('custom_service_consultation: issue #122 требует запрет печати заглушки до полной замены и менеджерской проверки');",
    1,
)
validator_path.write_text(validator, encoding='utf-8')
