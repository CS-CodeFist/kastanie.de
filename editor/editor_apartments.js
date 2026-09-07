const ApartmentsEditor = (() => {
    const imagePlaceholderSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    const imagePositions = ['links', 'rechts', 'zentriert'];
    const buttonLinks = [
        ['', 'Kein Link'],
        ['speisekarte', 'Speisekarte'],
        ['email', 'E-Mail']
    ];
    let apartmentsData = { webseite: [] };
    let loaded = false;

    function normalizeImagePosition(position) {
        return imagePositions.includes(position) ? position : 'zentriert';
    }

    function normalizeSections() {
        apartmentsData.webseite.forEach((section) => {
            if (!section.theme || section.theme === 'standard') section.theme = 'cream';
            section.position = normalizeImagePosition(section.position);
        });
    }

    function renderThemePicker(theme = 'cream') {
        const themes = [
            ['forest', 'Waldgruen', '#7ea12c', '#291d11', '#53671e', '#fffaf0'],
            ['moss', 'Moosgruen', '#607d22', '#fffaf0', '#3d4e1d', '#fffaf0'],
            ['clay', 'Dunkelbraun', '#291d11', '#dfcb97', '#1e1b17', '#e8d4a6'],
            ['cream', 'Warmbeige', '#dfcb97', '#291d11', '#2d2922', '#dfcb97']
        ];

        return `<div class="section-theme-picker" aria-label="Theme der Sektion">
            <span>Theme</span>
            ${themes.map(([value, label, lightBackground, lightText, darkBackground, darkText]) => `
                <button type="button" class="theme-swatch ${theme === value ? 'selected' : ''}" data-section-theme="${value}" aria-label="${label}" aria-pressed="${theme === value}">
                    <span style="background-color: ${lightBackground};"></span><span style="background-color: ${lightText};"></span>
                    <span style="background-color: ${darkBackground};"></span><span style="background-color: ${darkText};"></span>
                </button>`).join('')}
        </div>`;
    }

    function renderButtonThemePicker(theme = 'primary') {
        return `<div class="button-theme-picker" aria-label="Button-Theme">
            <span>Button-Theme</span>
            <button type="button" class="button-theme-option primary ${theme === 'primary' ? 'selected' : ''}" data-button-theme="primary" aria-label="Primary" aria-pressed="${theme === 'primary'}"><span></span></button>
            <button type="button" class="button-theme-option secondary ${theme === 'secondary' ? 'selected' : ''}" data-button-theme="secondary" aria-label="Secondary" aria-pressed="${theme === 'secondary'}"><span></span></button>
        </div>`;
    }

    function renderTextPositionPicker(position = 'zentriert') {
        return `<div class="text-position-picker" aria-label="Textposition">
            <span>Textposition</span>
            ${imagePositions.map((value) => `
                <button type="button" class="position-swatch ${value} ${position === value ? 'selected' : ''}" data-section-position="${value}" aria-label="Text ${value}" aria-pressed="${position === value}">
                    <span class="position-preview"><i></i><b></b></span>
                </button>`).join('')}
        </div>`;
    }

    function renderSection(section, index) {
        const buttonLinkSelect = buttonLinks.map(([value, label]) =>
            `<option value="${value}" ${section.buttonLink === value ? 'selected' : ''}>${label}</option>`
        ).join('');

        return `
            <div class="webseiten-section" data-index="${index}">
                <div class="section-header" style="display: flex; align-items: center;">
                    <button type="button" class="drag-icon" style="margin-left: 0.5em; margin-right: 0; order: 2; align-self: center;">☰</button>
                    <input type="text" value="${section.menutitel || ''}" placeholder="Menütitel" data-field="menutitel">
                    <button type="button" class="toggle-section" aria-expanded="false" aria-label="Details anzeigen"><span class="toggle-icon" aria-hidden="true">▶</span></button>
                </div>
                <div class="section-details collapsed">
                    <div class="image-row">
                        <div class="text-fields">
                            <label>Titel<input type="text" value="${section.titel || ''}" data-field="titel" placeholder="Haupttitel"></label>
                            <label>Untertitel<input type="text" value="${section.untertitel || ''}" data-field="untertitel" placeholder="Untertitel"></label>
                            <label>Text<textarea rows="6" data-field="text" placeholder="Beschreibungstext...">${section.text || ''}</textarea></label>
                            ${renderTextPositionPicker(section.position)}
                            ${renderThemePicker(section.theme)}
                            <label>Button-Beschriftung<input type="text" value="${section.buttonLabel || ''}" data-field="buttonLabel" placeholder="z. B. Jetzt anfragen"></label>
                            <label>Button-Link<select data-field="buttonLink">${buttonLinkSelect}</select></label>
                            ${renderButtonThemePicker(section.buttonTheme || 'primary')}
                        </div>
                        <img class="image-thumb ${!section.image ? 'placeholder' : ''}" src="${section.image || imagePlaceholderSrc}" data-field="image">
                    </div>
                    <div class="button-right"><button type="button" class="delete-section">🗑️ Sektion löschen</button></div>
                </div>
            </div>`;
    }

    function render() {
        const container = document.getElementById('apartments-editor');
        if (!container) return;
        container.innerHTML = apartmentsData.webseite.map(renderSection).join('');
        setupSortable();
    }

    async function loadData() {
        try {
            const response = await fetch('apartments/data.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            apartmentsData = await response.json();
            if (!Array.isArray(apartmentsData.webseite)) apartmentsData.webseite = [];
        } catch (error) {
            console.error('Apartments-Daten konnten nicht geladen werden:', error);
            apartmentsData = { webseite: [] };
        }
        normalizeSections();
        render();
    }

    function updateField(input) {
        const index = Number(input.closest('.webseiten-section').dataset.index);
        if (apartmentsData.webseite[index]) apartmentsData.webseite[index][input.dataset.field] = input.value;
    }

    function updateTheme(button) {
        const sectionElement = button.closest('.webseiten-section');
        const index = Number(sectionElement.dataset.index);
        apartmentsData.webseite[index].theme = button.dataset.sectionTheme;
        sectionElement.querySelectorAll('[data-section-theme]').forEach((option) => {
            const selected = option === button;
            option.classList.toggle('selected', selected);
            option.setAttribute('aria-pressed', selected);
        });
    }

    function updateButtonTheme(button) {
        const sectionElement = button.closest('.webseiten-section');
        const index = Number(sectionElement.dataset.index);
        apartmentsData.webseite[index].buttonTheme = button.dataset.buttonTheme;
        sectionElement.querySelectorAll('[data-button-theme]').forEach((option) => {
            const selected = option === button;
            option.classList.toggle('selected', selected);
            option.setAttribute('aria-pressed', selected);
        });
    }

    function updatePosition(button) {
        const sectionElement = button.closest('.webseiten-section');
        const index = Number(sectionElement.dataset.index);
        apartmentsData.webseite[index].position = button.dataset.sectionPosition;
        sectionElement.querySelectorAll('[data-section-position]').forEach((option) => {
            const selected = option === button;
            option.classList.toggle('selected', selected);
            option.setAttribute('aria-pressed', selected);
        });
    }

    function selectImage(imageThumb) {
        const index = Number(imageThumb.closest('.webseiten-section').dataset.index);
        EditorImages.openImageOverlay((newSrc) => {
            apartmentsData.webseite[index].image = newSrc;
            imageThumb.src = newSrc || imagePlaceholderSrc;
            imageThumb.classList.toggle('placeholder', !newSrc);
        }, apartmentsData.webseite[index].image, 'apartments', true);
    }

    function addSection() {
        apartmentsData.webseite.push({
            menutitel: 'Neue Sektion',
            image: '',
            titel: '',
            untertitel: '',
            text: '',
            position: 'zentriert',
            theme: 'cream',
            buttonLabel: '',
            buttonLink: '',
            buttonTheme: 'primary'
        });
        render();
    }

    function deleteSection(button) {
        const index = Number(button.closest('.webseiten-section').dataset.index);
        if (confirm('Sektion wirklich löschen?')) {
            apartmentsData.webseite.splice(index, 1);
            render();
        }
    }

    function toggleSection(button) {
        const details = button.closest('.webseiten-section').querySelector('.section-details');
        const isCollapsed = details.classList.toggle('collapsed');
        button.setAttribute('aria-expanded', String(!isCollapsed));
        button.setAttribute('aria-label', isCollapsed ? 'Details anzeigen' : 'Details ausblenden');
        button.querySelector('.toggle-icon').style.setProperty('rotate', isCollapsed ? '0deg' : '90deg', 'important');
    }

    function setupSortable() {
        const container = document.getElementById('apartments-editor');
        if (!container || !window.Sortable) return;
        new Sortable(container, {
            handle: '.drag-icon',
            animation: 150,
            forceFallback: true,
            onEnd(event) {
                const section = apartmentsData.webseite.splice(event.oldIndex, 1)[0];
                apartmentsData.webseite.splice(event.newIndex, 0, section);
                render();
            }
        });
    }

    async function loadArchives() {
        const select = document.getElementById('apartmentsArchivSelect');
        if (!select) return;
        select.innerHTML = '<option value="__current">Aktueller Stand</option><option value="" disabled>─────────</option>';
        select.disabled = true;
        try {
            const response = await fetch('data_handler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=list_apartments_archives'
            });
            const archives = await response.json();
            if (Array.isArray(archives)) {
                archives.forEach((filename) => {
                    const option = document.createElement('option');
                    option.value = filename;
                    option.textContent = filename.replace(/^data_|\.json$/g, '').replace(/_/g, ' – ').replace(/-/g, ':');
                    select.appendChild(option);
                });
                select.disabled = false;
            }
        } catch (error) {
            console.error('Apartments-Archive konnten nicht geladen werden:', error);
        }
    }

    async function loadArchive() {
        const select = document.getElementById('apartmentsArchivSelect');
        if (!select?.value) return;
        if (select.value === '__current') return loadData();
        try {
            const response = await fetch('data_handler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=load_apartments_archive&archive=${encodeURIComponent(select.value)}`
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            apartmentsData = await response.json();
            normalizeSections();
            render();
            alert(`Archiv "${select.value}" erfolgreich geladen`);
        } catch (error) {
            alert(`Archiv konnte nicht geladen werden: ${error.message}`);
        }
    }

    async function save() {
        const button = document.getElementById('saveApartmentsBtn');
        const label = button?.textContent;
        try {
            if (button) {
                button.disabled = true;
                button.textContent = 'Wird gespeichert...';
            }
            const response = await fetch('data_handler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save_apartments', data: apartmentsData })
            });
            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error('Der Server hat keine gültige Antwort gesendet. Bitte PHP-Fehlerprotokoll prüfen.');
            }
            if (!response.ok || !result.success) throw new Error(result.error || result.message || `HTTP ${response.status}`);
            alert('Apartments-Daten erfolgreich gespeichert!');
            await loadArchives();
        } catch (error) {
            console.error('Apartments konnten nicht gespeichert werden:', error);
            alert(`Fehler beim Speichern: ${error.message}`);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = label;
            }
        }
    }

    function setupEvents() {
        const container = document.getElementById('apartments-editor');
        if (!container) return;
        container.addEventListener('input', (event) => {
            if (event.target.matches('[data-field]')) updateField(event.target);
        });
        container.addEventListener('click', (event) => {
            const themeButton = event.target.closest('[data-section-theme]');
            const buttonTheme = event.target.closest('[data-button-theme]');
            if (themeButton) updateTheme(themeButton);
            else if (buttonTheme) updateButtonTheme(buttonTheme);
            else if (event.target.closest('[data-section-position]')) updatePosition(event.target.closest('[data-section-position]'));
            else if (event.target.closest('.toggle-section')) toggleSection(event.target.closest('.toggle-section'));
            else if (event.target.matches('.image-thumb')) selectImage(event.target);
            else if (event.target.matches('.delete-section')) deleteSection(event.target);
        });
        document.getElementById('addApartmentsSectionBtn')?.addEventListener('click', addSection);
        document.getElementById('saveApartmentsBtn')?.addEventListener('click', save);
        document.getElementById('apartmentsArchivSelect')?.addEventListener('change', loadArchive);
    }

    async function init() {
        if (loaded) return;
        setupEvents();
        await Promise.all([loadData(), loadArchives()]);
        loaded = true;
    }

    return { init };
})();

window.ApartmentsEditor = ApartmentsEditor;
