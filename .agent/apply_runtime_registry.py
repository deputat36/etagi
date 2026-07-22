from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    source = file_path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: ожидалось одно совпадение, найдено {count}')
    file_path.write_text(source.replace(old, new, 1), encoding='utf-8')


replace_once(
    'package.json',
    '    "assets:stamp": "node tools/stamp-asset-version.mjs",\n    "release:status":',
    '    "assets:stamp": "node tools/stamp-asset-version.mjs",\n    "runtime:registry": "node tools/build-runtime-module-registry.mjs",\n    "release:status":'
)
replace_once(
    'package.json',
    '    "validate:runtime-architecture": "node tools/validate-runtime-architecture.mjs",\n    "validate:quality-actions":',
    '    "validate:runtime-architecture": "node tools/validate-runtime-architecture.mjs",\n    "validate:runtime-modules": "node tools/validate-runtime-module-registry.mjs",\n    "validate:quality-actions":'
)

replace_once(
    'docs/maintenance-guide.md',
    'npm run validate:runtime-architecture\nnpm run validate:quality-actions',
    'npm run validate:runtime-architecture\nnpm run validate:runtime-modules\nnpm run validate:quality-actions'
)
replace_once(
    'docs/maintenance-guide.md',
    '## Единый asset-version\n',
    '''## Runtime registry модулей\n\nФактические module entrypoints из `index.html` и весь достижимый import graph фиксируются в:\n\n```text\ndata/runtime-modules.json\n```\n\nПосле добавления, удаления или переноса runtime-модуля выполнить:\n\n```bash\nnpm run runtime:registry\nnpm run validate:runtime-modules\n```\n\nValidator требует точного соответствия реестра текущим импортам, существования файлов и согласованности связей `imports / importedBy`. Подробности: `docs/runtime-module-registry.md`.\n\n## Единый asset-version\n'''
)

print('Package scripts и регламент runtime registry обновлены.')
