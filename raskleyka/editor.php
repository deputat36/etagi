<?php
declare(strict_types=1);
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Редактор листовки</title>
    <link rel="stylesheet" href="assets/css/app.css">
</head>
<body>
<main class="workspace">
    <div class="toolbar">
        <div>
            <h2>Редактор листовки</h2>
            <p>Соберите макет вручную: добавляйте блоки, меняйте текст, размер, цвет и расположение.</p>
        </div>
        <div class="toolbar__actions">
            <a class="button" href="index.php">К генератору</a>
            <button class="button" id="saveEditorLayout" type="button">Сохранить макет</button>
            <button class="button button--primary" id="printEditorLayout" type="button">Печать</button>
        </div>
    </div>

    <div class="editor-layout">
        <aside class="panel editor-panel">
            <div class="panel__head">
                <h2>Блоки</h2>
            </div>

            <div class="field-grid">
                <label>
                    Тип блока
                    <select id="blockType">
                        <option value="title">Заголовок</option>
                        <option value="text">Текст</option>
                        <option value="price">Цена</option>
                        <option value="contacts">Контакты</option>
                        <option value="image">Изображение</option>
                    </select>
                </label>
                <label>
                    Действие
                    <button class="button button--primary" id="addBlock" type="button">Добавить</button>
                </label>
            </div>

            <div class="block-list" id="blockList"></div>
        </aside>

        <section class="preview-stage">
            <div class="editor-card" id="editorPreview" aria-label="Предпросмотр листовки"></div>
        </section>
    </div>
</main>

<script src="assets/js/editor.js"></script>
</body>
</html>
