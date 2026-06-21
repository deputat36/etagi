<?php
declare(strict_types=1);

$adsFile = __DIR__ . '/data/ads.json';
$ads = [];

// Временный источник данных. Позже этот блок можно заменить на выборку объявлений из MySQL.
if (is_file($adsFile)) {
    $decoded = json_decode((string) file_get_contents($adsFile), true);
    if (is_array($decoded)) {
        $ads = $decoded;
    }
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Генератор расклейки</title>
    <link rel="stylesheet" href="assets/css/app.css">
</head>
<body>
<div class="app-shell">
    <aside class="sidebar">
        <div class="brand">
            <div>
                <span class="brand__eyebrow">Инструмент</span>
                <h1>Генератор расклейки</h1>
            </div>
            <span class="brand__mark">A4</span>
        </div>

        <section class="panel">
            <h2>Настройки листа</h2>

            <div class="field-grid">
                <label>
                    Ориентация
                    <select id="pageOrientation">
                        <option value="portrait">Книжная</option>
                        <option value="landscape">Альбомная</option>
                    </select>
                </label>

                <label>
                    Колонок
                    <input id="gridColumns" type="number" min="1" max="4" value="2">
                </label>

                <label>
                    Строк
                    <input id="gridRows" type="number" min="1" max="6" value="3">
                </label>

                <label>
                    Отступ, мм
                    <input id="pageMargin" type="number" min="4" max="25" value="10">
                </label>

                <label>
                    Зазор, мм
                    <input id="cardGap" type="number" min="2" max="16" value="6">
                </label>

                <label>
                    Шрифт, %
                    <input id="fontScale" type="number" min="80" max="130" value="100">
                </label>
            </div>

            <div class="switch-list">
                <label><input id="showPrice" type="checkbox" checked> Показывать цену</label>
                <label><input id="showPhone" type="checkbox" checked> Показывать телефон</label>
                <label><input id="showAgent" type="checkbox" checked> Показывать специалиста</label>
                <label><input id="showCutLine" type="checkbox" checked> Линии реза</label>
            </div>
        </section>

        <section class="panel">
            <div class="panel__head">
                <h2>Объявления</h2>
                <button class="button button--ghost" id="selectAllAds" type="button">Выбрать все</button>
            </div>

            <div class="ads-list" id="adsList">
                <?php foreach ($ads as $ad): ?>
                    <label class="ad-option">
                        <input type="checkbox" value="<?= e((string) ($ad['id'] ?? '')) ?>" checked>
                        <span>
                            <strong><?= e((string) ($ad['title'] ?? 'Без названия')) ?></strong>
                            <small><?= e((string) ($ad['address'] ?? '')) ?></small>
                        </span>
                    </label>
                <?php endforeach; ?>
            </div>
        </section>
    </aside>

    <main class="workspace">
        <div class="toolbar">
            <div>
                <h2>Предпросмотр листа</h2>
                <p>Выберите объявления и настройте сетку. Печать идет из этой же области.</p>
            </div>
            <div class="toolbar__actions">
                <a class="button" href="editor.php">Открыть редактор</a>
                <button class="button" id="saveLayout" type="button">Сохранить макет</button>
                <button class="button button--primary" id="printPage" type="button">Печать</button>
            </div>
        </div>

        <div class="preview-stage">
            <section class="sheet sheet--portrait" id="printSheet" aria-label="Лист расклейки">
                <div class="sheet-grid" id="sheetGrid"></div>
            </section>
        </div>
    </main>
</div>

<script>
    window.RASKLEYKA_ADS = <?= json_encode($ads, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;
</script>
<script src="assets/js/app.js"></script>
</body>
</html>
