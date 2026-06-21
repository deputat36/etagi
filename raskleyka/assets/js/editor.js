(function () {
    const blockList = document.getElementById('blockList');
    const preview = document.getElementById('editorPreview');
    const addBlockButton = document.getElementById('addBlock');
    const saveButton = document.getElementById('saveEditorLayout');
    const printButton = document.getElementById('printEditorLayout');
    const blockType = document.getElementById('blockType');

    let blocks = [
        {
            id: Date.now(),
            type: 'title',
            text: 'Продам квартиру',
            x: 14,
            y: 14,
            width: 72,
            fontSize: 30,
            weight: 900,
            color: '#171717'
        },
        {
            id: Date.now() + 1,
            type: 'price',
            text: '1 850 000 ₽',
            x: 14,
            y: 34,
            width: 70,
            fontSize: 26,
            weight: 900,
            color: '#e30613'
        },
        {
            id: Date.now() + 2,
            type: 'text',
            text: 'Уютная квартира в Борисоглебске. Звоните, расскажу подробности и организую показ.',
            x: 14,
            y: 48,
            width: 72,
            fontSize: 16,
            weight: 400,
            color: '#30343b'
        },
        {
            id: Date.now() + 3,
            type: 'contacts',
            text: '8 900 300-64-54\nАлексей Ковтун',
            x: 14,
            y: 82,
            width: 72,
            fontSize: 18,
            weight: 900,
            color: '#171717'
        }
    ];

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getTypeLabel(type) {
        const labels = {
            title: 'Заголовок',
            text: 'Текст',
            price: 'Цена',
            contacts: 'Контакты',
            image: 'Изображение'
        };

        return labels[type] || 'Блок';
    }

    function renderPreview() {
        preview.innerHTML = blocks.map((block) => {
            const content = block.type === 'image'
                ? `<div style="width:100%;height:100%;background:#f1f2f4;display:grid;place-items:center;color:#6b7280;">${escapeHtml(block.text || 'Изображение')}</div>`
                : escapeHtml(block.text).replace(/\n/g, '<br>');

            return `
                <div class="editor-preview-block" style="left:${block.x}%;top:${block.y}%;width:${block.width}%;font-size:${block.fontSize}px;font-weight:${block.weight};color:${block.color};">
                    ${content}
                </div>
            `;
        }).join('');
    }

    function renderList() {
        blockList.innerHTML = blocks.map((block, index) => `
            <div class="block-item" data-id="${block.id}">
                <div class="block-item__head">
                    <span>${index + 1}. ${getTypeLabel(block.type)}</span>
                    <button class="button button--ghost" type="button" data-action="remove">Удалить</button>
                </div>
                <div class="editor-field">
                    <label>Текст</label>
                    <textarea data-field="text">${escapeHtml(block.text)}</textarea>
                </div>
                <div class="block-item__controls">
                    <label class="editor-field">X, %<input type="number" min="0" max="95" data-field="x" value="${block.x}"></label>
                    <label class="editor-field">Y, %<input type="number" min="0" max="95" data-field="y" value="${block.y}"></label>
                    <label class="editor-field">Ширина, %<input type="number" min="10" max="100" data-field="width" value="${block.width}"></label>
                    <label class="editor-field">Шрифт<input type="number" min="8" max="80" data-field="fontSize" value="${block.fontSize}"></label>
                    <label class="editor-field">Жирность<input type="number" min="100" max="900" step="100" data-field="weight" value="${block.weight}"></label>
                    <label class="editor-field">Цвет<input type="color" data-field="color" value="${block.color}"></label>
                </div>
            </div>
        `).join('');
    }

    function render() {
        renderList();
        renderPreview();
    }

    function addBlock() {
        const type = blockType.value;
        blocks.push({
            id: Date.now(),
            type,
            text: type === 'image' ? 'Место для изображения' : 'Новый блок',
            x: 12,
            y: 12 + blocks.length * 9,
            width: 72,
            fontSize: type === 'title' ? 28 : 16,
            weight: type === 'title' || type === 'price' ? 900 : 400,
            color: type === 'price' ? '#e30613' : '#171717'
        });
        render();
    }

    function updateBlock(id, field, value) {
        blocks = blocks.map((block) => {
            if (block.id !== id) {
                return block;
            }

            const numericFields = ['x', 'y', 'width', 'fontSize', 'weight'];
            return {
                ...block,
                [field]: numericFields.includes(field) ? Number(value) : value
            };
        });
        renderPreview();
    }

    function removeBlock(id) {
        blocks = blocks.filter((block) => block.id !== id);
        render();
    }

    function collectPayload() {
        return {
            type: 'editor',
            title: `Редактор листовки ${new Date().toLocaleString('ru-RU')}`,
            settings: {
                orientation: 'portrait',
                size: 'A4'
            },
            blocks
        };
    }

    async function saveLayout() {
        const response = await fetch('save_flyer.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(collectPayload())
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Не удалось сохранить макет');
        }

        return result;
    }

    blockList.addEventListener('input', (event) => {
        const item = event.target.closest('.block-item');
        const field = event.target.dataset.field;
        if (!item || !field) {
            return;
        }

        updateBlock(Number(item.dataset.id), field, event.target.value);
    });

    blockList.addEventListener('click', (event) => {
        if (event.target.dataset.action !== 'remove') {
            return;
        }

        const item = event.target.closest('.block-item');
        removeBlock(Number(item.dataset.id));
    });

    addBlockButton.addEventListener('click', addBlock);
    printButton.addEventListener('click', () => window.print());

    saveButton.addEventListener('click', async () => {
        saveButton.disabled = true;
        saveButton.textContent = 'Сохраняю...';

        try {
            await saveLayout();
            saveButton.textContent = 'Сохранено';
            setTimeout(() => {
                saveButton.textContent = 'Сохранить макет';
            }, 1400);
        } catch (error) {
            alert(error.message);
            saveButton.textContent = 'Сохранить макет';
        } finally {
            saveButton.disabled = false;
        }
    });

    render();
})();
