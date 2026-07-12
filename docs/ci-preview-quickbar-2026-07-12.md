# Контрольный CI панели предпросмотра

Служебный документ для запуска актуального `main`.

Проверяется:

```text
validate → browser-smoke → print-screenshot × 5 → collect-print-screenshots
```

Особое внимание:

- helper подключён только через `spnUiMode.js`;
- кнопка `К печати` не вызывает `window.print()`;
- существующие quality guard и печатные сценарии не изменены.

PR служебный. Код уже находится в `main`.
