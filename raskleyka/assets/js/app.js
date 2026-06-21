(function () {
    const ads = Array.isArray(window.RASKLEYKA_ADS) ? window.RASKLEYKA_ADS : [];

    const controls = {
        orientation: document.getElementById('pageOrientation'),
        columns: document.getElementById('gridColumns'),
        rows: document.getElementById('gridRows'),
        margin: document.getElementById('pageMargin'),
        gap: document.getElementById('cardGap'),
        fontScale: document.getElementById('fontScale'),
        showPrice: document.getElementById('showPrice'),
        showPhone: document.getElementById('showPhone'),
        showAgent: document.getElementById('showAgent'),
        showCutLine: document.getElementById('showCutLine')
    };

    const sheet = document.getElementById('printSheet');
    const grid = document.getElementById('sheetGrid');
    const adsList = document.getElementById('adsList');
    const selectAllButton = document.getElementById('selectAllAds');
    const saveButton = document.getElementById('saveLayout');
    const printButton = document.getElementById('printPage');

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getSelectedAds() {
        const checkedIds = Array.from(adsList.querySelectorAll('input[type="checkbox"]:checked'))
            .map((input) => Number(input.value));

        return ads.filter((ad) => checkedIds.includes(Number(ad.id)));
    }

    function getSettings() {
        return {
            orientation: controls.orientation.value,
            columns: Math.max(1, Number(controls.columns.value) || 1),
            rows: Math.max(1, Number(controls.rows.value) || 1),
            margin: Math.max(4, Number(controls.margin.value) || 10),
            gap: Math.max(2, Number(controls.gap.value) || 6),
            fontScale: Math.max(80, Number(controls.fontScale.value) || 100),
            showPrice: controls.showPrice.checked,
            showPhone: controls.showPhone.checked,
            showAgent: controls.showAgent.checked,
            showCutLine: controls.showCutLine.checked
        };
    }

    function buildCard(ad, settings) {
        const price = settings.showPrice && ad.price
            ? `<div class="flyer-card__price">${escapeHtml(ad.price)}</div>`
            : '';
        const phone = settings.showPhone && ad.phone
            ? `<div class="flyer-card__phone">${escapeHtml(ad.phone)}</div>`
            : '';
        const agent = settings.showAgent && ad.agent
            ? `<div class="flyer-card__agent">${escapeHtml(ad.agent)}</div>`
            : '';

        return `
            <article class="flyer-card">
                <div class="flyer-card__badge">${escapeHtml(ad.badge || 'Объект')}</div>
                <h3>${escapeHtml(ad.title)}</h3>
                <div class="flyer-card__meta">
                    <span>${escapeHtml(ad.area)}</span>
                    <span>${escapeHtml(ad.floor)}</span>
                </div>
                <p class="flyer-card__address">${escapeHtml(ad.address)}</p>
                <p class="flyer-card__desc">${escapeHtml(ad.description)}</p>
                ${price}
                <footer class="flyer-card__footer">
                    ${phone}
                    ${agent}
                </footer>
            </article>
        `;
    }

    function render() {
        const settings = getSettings();
        const selectedAds = getSelectedAds();
        const capacity = settings.columns * settings.rows;
        const cards = [];

        sheet.classList.toggle('sheet--landscape', settings.orientation === 'landscape');
        sheet.classList.toggle('sheet--portrait', settings.orientation !== 'landscape');
        sheet.classList.toggle('sheet--cut-lines', settings.showCutLine);
        sheet.style.setProperty('--page-margin', `${settings.margin}mm`);
        sheet.style.setProperty('--card-gap', `${settings.gap}mm`);
        sheet.style.setProperty('--font-scale', String(settings.fontScale / 100));
        grid.style.setProperty('--grid-columns', String(settings.columns));
        grid.style.setProperty('--grid-rows', String(settings.rows));

        if (!selectedAds.length) {
            grid.innerHTML = '<div class="empty-state">Выберите хотя бы одно объявление для расклейки</div>';
            return;
        }

        for (let i = 0; i < capacity; i += 1) {
            cards.push(buildCard(selectedAds[i % selectedAds.length], settings));
        }

        grid.innerHTML = cards.join('');
    }

    function setAllAds(checked) {
        adsList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
            input.checked = checked;
        });
        render();
    }

    function collectPayload() {
        return {
            type: 'sheet',
            title: `Макет расклейки ${new Date().toLocaleString('ru-RU')}`,
            settings: getSettings(),
            selected_ads: getSelectedAds().map((ad) => ad.id)
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

    Object.values(controls).forEach((control) => {
        control.addEventListener('input', render);
        control.addEventListener('change', render);
    });

    adsList.addEventListener('change', render);

    selectAllButton.addEventListener('click', () => {
        const checkboxes = Array.from(adsList.querySelectorAll('input[type="checkbox"]'));
        const hasUnchecked = checkboxes.some((input) => !input.checked);
        setAllAds(hasUnchecked);
    });

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
