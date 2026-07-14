# Browser smoke через Chrome DevTools Protocol

`tools/run-browser-smoke.mjs` запускает критичный пользовательский сценарий без Playwright и Puppeteer, используя системный Chrome/Chromium и `--remote-debugging-pipe`.

## Почему изменён runner

Старый вариант использовал:

```text
--virtual-time-budget
--dump-dom
```

По мере роста сценария виртуальное время могло перескочить к общему таймеру страницы раньше завершения асинхронной загрузки изображений и helper-модулей. Один и тот же commit иногда падал с `общий timeout smoke-теста`, а повторный job проходил.

## Текущий порядок

1. Запускается локальный HTTP-сервер без keep-alive.
2. Создаётся отдельный профиль Chrome.
3. Runner подключается через CDP pipe.
4. Открывается `tools/browser-smoke.html`.
5. `Runtime.evaluate` опрашивает `#browserSmokeResult`.
6. Проверка завершается только при:
   - `data-status="passed"`;
   - `data-status="failed"`;
   - реальном тайм-ауте CDP runner.
7. Chrome завершается явно, временный профиль удаляется.

## Повторная попытка

Runner допускает максимум две изолированные попытки запуска Chrome.

Повтор используется только при сбое процесса, pipe или инфраструктуры runner. Если harness вернул `failed`, текст ошибки сохраняется и повторная попытка не превращает ошибку интерфейса в успешный результат незаметно: итоговый лог содержит номер попытки и последнюю причину.

## Запрещено

- возвращать `--virtual-time-budget`;
- возвращать `--dump-dom` как источник результата;
- запускать Chrome через `spawnSync` при работающем локальном сервере;
- считать страницу готовой только по событию загрузки;
- удалять `browser-smoke-failure.log` из GitHub Actions.

## Проверка

```bash
npm run validate:ci-config
npm run smoke:browser
```

При падении GitHub Actions загружает artifact `browser-smoke-failure`.
