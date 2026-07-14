# Контрольный CI browser-smoke через CDP

Проверяется актуальный `main` после удаления `--virtual-time-budget` и `--dump-dom` из browser runner.

Ожидается:

- `validate:ci-config` требует `--remote-debugging-pipe` и `Runtime.evaluate`;
- browser-smoke ждёт фактический `data-status=passed`;
- допускается максимум две изолированные попытки запуска Chrome;
- общий validate, browser-smoke и screenshot matrix проходят.

PR служебный. Полезные изменения уже находятся в `main`.
