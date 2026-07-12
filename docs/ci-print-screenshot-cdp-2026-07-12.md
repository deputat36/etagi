# Контрольный CI CDP-захвата печатных PNG

Служебный документ для запуска актуального `main`.

Ожидаемый маршрут:

```text
validate → browser-smoke → 5 изолированных CDP print-screenshot job → collect-print-screenshots
```

Каждый PNG создаётся только после фактического `data-status="passed"`, полученного через `Runtime.evaluate`, и снимается командой `Page.captureScreenshot`.

PR служебный. Код уже находится в `main`, в diff только этот документ.
