# Контрольный CI CDP smoke без повторения runtime-ошибки

Проверяется актуальный `main`.

Ожидается:

- `SmokeHarnessError` немедленно завершает browser-smoke;
- вторая попытка разрешена только при сбое процесса Chrome или CDP pipe;
- `validate:ci-config` защищает этот контракт;
- validate, browser-smoke и screenshot matrix проходят.

PR служебный. Полезные изменения уже находятся в `main`.
