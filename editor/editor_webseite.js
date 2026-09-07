// Webseiten-Editor Module - basiert auf Speisekarten-Editor
// Verwaltet die Webseiten-Inhalte (Sektionen für Onepage-Scroller)

let webseitenData = { webseite: [] };
let webseitenLoaded = false;
const imagePlaceholderSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const imagePositions = ['links', 'rechts', 'zentriert'];

function normalizeImagePosition(position) {
    return imagePositions.includes(position) ? position : 'zentriert';
}

function showWebseitenSaveDialog(message) {
    alert(message);
}

// Webseiten-Editor initialisieren
function initWebseitenEditor() {
    if (webseitenLoaded) return;
    
    console.log('Initialisiere Webseiten-Editor...');
    loadWebseitenData();
    setupWebseitenEvents();
    loadWebseitenArchives();
    webseitenLoaded = true;
}

// Webseiten-Daten laden
async function loadWebseitenData() {
    try {
        const response = await fetch('webseite/data.json');
        if (response.ok) {
            webseitenData = await response.json();
            webseitenData.webseite.forEach((section) => {
                if (!section.theme || section.theme === 'standard') section.theme = 'cream';
                if (section.type !== 'instagram-feed') section.position = normalizeImagePosition(section.position);
            });
            renderWebseitenEditor();
        } else {
            console.warn('Webseiten-Daten nicht gefunden, verwende Standard-Daten');
            webseitenData = {
                webseite: [
                    {
                        menutitel: "Willkommen",
                        image: "",
                        titel: "Herzlich Willkommen",
                        untertitel: "bei Kastanie Moltzow",
                        text: "Ihr gemütliches Restaurant im Herzen von Moltzow",
                        position: "rechts"
                    }
                ]
            };
            renderWebseitenEditor();
        }
    } catch (error) {
        console.error('Fehler beim Laden der Webseiten-Daten:', error);
    }
}

// Webseiten-Editor rendern
function renderWebseitenEditor() {
    const editorContainer = document.getElementById('webseite-editor');
    if (!editorContainer) return;
    
    let html = '';
    webseitenData.webseite.forEach((section, index) => {
        html += renderWebseitenSection(section, index);
    });
    
    editorContainer.innerHTML = html;
    setupWebseitenSortable();
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

// Einzelne Webseiten-Sektion rendern
function renderWebseitenSection(section, index) {
    if (section.type === 'instagram-feed') {
        return renderInstagramFeedSection(section, index);
    }

    const buttonLinks = [
        ['', 'Kein Link'],
        ['speisekarte', 'Speisekarte'],
        ['apartments', 'Apartments'],
        ['email', 'E-Mail']
    ];
    const buttonLinkSelect = buttonLinks.map(([value, label]) =>
        `<option value="${value}" ${section.buttonLink === value ? 'selected' : ''}>${label}</option>`
    ).join('');
    
    const totalSections = webseitenData.webseite.length;
    const isFirstOrLast = index === 0 || index === (totalSections - 1);
    
    // Drag-Icon nur anzeigen wenn nicht erste oder letzte Sektion
    const dragIconHtml = isFirstOrLast ? '' : 
        '<button type="button" class="drag-icon" style="margin-left: 0.5em; margin-right: 0; order: 2; align-self: center;">☰</button>';
    
    // Lösch-Button nur anzeigen wenn nicht erste oder letzte Sektion
    const deleteButtonHtml = isFirstOrLast ? '' : 
        '<button type="button" class="delete-section">🗑️ Sektion löschen</button>';
    
    return `
        <div class="webseiten-section" data-index="${index}">
            <div class="section-header" style="display: flex; align-items: center;">
                ${dragIconHtml}
                <input type="text" value="${section.menutitel || ''}" placeholder="Menütitel" data-field="menutitel" />
                <button type="button" class="toggle-section" aria-expanded="false" aria-label="Details anzeigen"><span class="toggle-icon" aria-hidden="true">▶</span></button>
            </div>
            
            <div class="section-details collapsed">
                <div class="image-row">
                    <div class="text-fields">
                        <label>Titel<input type="text" value="${section.titel || ''}" data-field="titel" placeholder="Haupttitel" /></label>
                        <label>Untertitel<input type="text" value="${section.untertitel || ''}" data-field="untertitel" placeholder="Untertitel" /></label>
                        <label>Text<textarea rows="6" data-field="text" placeholder="Beschreibungstext...">${section.text || ''}</textarea></label>
                        ${renderTextPositionPicker(section.position)}
                        ${renderThemePicker(section.theme)}
                        <label>Button-Beschriftung<input type="text" value="${section.buttonLabel || ''}" data-field="buttonLabel" placeholder="z. B. Zur Speisekarte" /></label>
                        <label>Button-Link
                            <select data-field="buttonLink">
                                ${buttonLinkSelect}
                            </select>
                        </label>
                        ${renderButtonThemePicker(section.buttonTheme || 'primary')}
                    </div>
                    <img class="image-thumb ${!section.image ? 'placeholder' : ''}" src="${section.image || imagePlaceholderSrc}" data-field="image" />
                </div>
                <div class="button-right">
                    ${deleteButtonHtml}
                </div>
            </div>
        </div>
    `;
}

function renderInstagramFeedSection(section, index) {
    return `
        <div class="webseiten-section instagram-section-editor" data-index="${index}">
            <div class="section-header" style="display: flex; align-items: center;">
                <button type="button" class="drag-icon" style="margin-left: 0.5em; margin-right: 0; order: 2; align-self: center;">☰</button>
                <input type="text" value="${section.menutitel || ''}" placeholder="Menütitel" data-field="menutitel" />
                <button type="button" class="toggle-section" aria-expanded="false" aria-label="Details anzeigen"><span class="toggle-icon" aria-hidden="true">▶</span></button>
            </div>
            <div class="section-details collapsed">
                <div class="text-fields">
                    <label>Titel<input type="text" value="${section.titel || ''}" data-field="titel" placeholder="Überschrift" /></label>
                    ${renderThemePicker(section.theme)}
                    Der Feed zeigt automatisch die aktuellen Beiträge von kastaniemoltzow.
                </div>
                <div class="button-right">
                    <button type="button" class="delete-section">🗑️ Sektion löschen</button>
                </div>
            </div>
        </div>
    `;
}

// Event-Handler für Webseiten-Editor
function setupWebseitenEvents() {
    const editorContainer = document.getElementById('webseite-editor');
    if (!editorContainer) return;
    
    // Delegate events für dynamisch erstellte Elemente
    editorContainer.addEventListener('input', (e) => {
        if (e.target.matches('[data-field]')) {
            updateWebseitenField(e.target);
        }
    });
    
    editorContainer.addEventListener('click', (e) => {
        const themeButton = e.target.closest('[data-section-theme]');
        if (themeButton) {
            updateWebseitenTheme(themeButton);
        } else if (e.target.closest('[data-button-theme]')) {
            updateWebseitenButtonTheme(e.target.closest('[data-button-theme]'));
        } else if (e.target.closest('[data-section-position]')) {
            updateWebseitenPosition(e.target.closest('[data-section-position]'));
        } else if (e.target.closest('.toggle-section')) {
            toggleWebseitenSection(e.target.closest('.toggle-section'));
        } else if (e.target.matches('.image-thumb')) {
            handleWebseitenImageClick(e.target);
        } else if (e.target.matches('.delete-section')) {
            deleteWebseitenSection(e.target);
        }
    });
    
    // Button-Events
    const addSectionBtn = document.getElementById('addWebseitenSectionBtn');
    if (addSectionBtn) {
        addSectionBtn.addEventListener('click', openWebseitenSectionOverlay);
    }

    const sectionOverlay = document.getElementById('webseitenSectionOverlay');
    if (sectionOverlay) {
        sectionOverlay.addEventListener('click', (event) => {
            const sectionType = event.target.dataset.sectionType;
            if (sectionType) addWebseitenSection(sectionType);
            if (event.target === sectionOverlay || sectionType) closeWebseitenSectionOverlay();
        });
    }

    const closeSectionOverlayBtn = document.getElementById('closeWebseitenSectionOverlayBtn');
    if (closeSectionOverlayBtn) {
        closeSectionOverlayBtn.addEventListener('click', closeWebseitenSectionOverlay);
    }
    
    const saveWebseitenBtn = document.getElementById('saveWebseitenBtn');
    if (saveWebseitenBtn) {
        saveWebseitenBtn.addEventListener('click', saveWebseitenData);
    }
    
    // Archiv-Events
    const archivSelect = document.getElementById('webseitenArchivSelect');
    if (archivSelect) {
        archivSelect.addEventListener('change', loadWebseitenArchive);
    }
}

function updateWebseitenPosition(button) {
    const section = button.closest('.webseiten-section');
    const index = parseInt(section.dataset.index);
    const position = button.dataset.sectionPosition;

    if (!webseitenData.webseite[index]) return;
    webseitenData.webseite[index].position = position;
    section.querySelectorAll('[data-section-position]').forEach((option) => {
        const selected = option === button;
        option.classList.toggle('selected', selected);
        option.setAttribute('aria-pressed', selected);
    });
}

function toggleWebseitenSection(button) {
    const details = button.closest('.webseiten-section').querySelector('.section-details');
    const isCollapsed = details.classList.toggle('collapsed');
    button.setAttribute('aria-expanded', String(!isCollapsed));
    button.setAttribute('aria-label', isCollapsed ? 'Details anzeigen' : 'Details ausblenden');
    button.querySelector('.toggle-icon').style.setProperty('rotate', isCollapsed ? '0deg' : '90deg', 'important');
}

function updateWebseitenButtonTheme(button) {
    const section = button.closest('.webseiten-section');
    const index = parseInt(section.dataset.index);
    const theme = button.dataset.buttonTheme;

    if (!webseitenData.webseite[index]) return;
    webseitenData.webseite[index].buttonTheme = theme;
    section.querySelectorAll('[data-button-theme]').forEach((option) => {
        const selected = option === button;
        option.classList.toggle('selected', selected);
        option.setAttribute('aria-pressed', selected);
    });
}

function updateWebseitenTheme(button) {
    const section = button.closest('.webseiten-section');
    const index = parseInt(section.dataset.index);
    const theme = button.dataset.sectionTheme;

    if (!webseitenData.webseite[index]) return;
    webseitenData.webseite[index].theme = theme;
    section.querySelectorAll('[data-section-theme]').forEach((swatch) => {
        const selected = swatch === button;
        swatch.classList.toggle('selected', selected);
        swatch.setAttribute('aria-pressed', selected);
    });
}

// Feld-Wert aktualisieren
function updateWebseitenField(input) {
    const section = input.closest('.webseiten-section');
    const index = parseInt(section.dataset.index);
    const field = input.dataset.field;
    const value = input.value;
    
    if (webseitenData.webseite[index]) {
        webseitenData.webseite[index][field] = value;
    }
}

// Bild-Auswahl für Webseiten-Sektion
function handleWebseitenImageClick(imageThumb) {
    const section = imageThumb.closest('.webseiten-section');
    const index = parseInt(section.dataset.index);

    EditorImages.openImageOverlay((newSrc) => {
        webseitenData.webseite[index].image = newSrc;
        if (newSrc) {
            imageThumb.src = newSrc;
            imageThumb.classList.remove('placeholder');
        } else {
            imageThumb.src = imagePlaceholderSrc;
            imageThumb.classList.add('placeholder');
        }
    }, webseitenData.webseite[index].image, 'webseite', true);
}

function openWebseitenSectionOverlay() {
    const overlay = document.getElementById('webseitenSectionOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
    document.body.classList.add('overlay-open');
}

function closeWebseitenSectionOverlay() {
    const overlay = document.getElementById('webseitenSectionOverlay');
    if (!overlay) return;

    overlay.classList.remove('show');
    overlay.style.display = 'none';
    document.body.classList.remove('overlay-open');
}

// Neue Sektion hinzufügen
function addWebseitenSection(sectionType) {
    const newSection = sectionType === 'instagram-feed'
        ? {
            type: 'instagram-feed',
            menutitel: 'Instagram',
            titel: 'Aktuelles auf Instagram',
            theme: 'cream'
        }
        : {
            menutitel: "Neue Sektion",
            image: "",
            titel: "",
            untertitel: "",
            text: "",
            position: "rechts",
            theme: "cream",
            buttonLabel: "",
            buttonLink: "",
            buttonTheme: "primary"
        };

    webseitenData.webseite.splice(-1, 0, newSection);
    renderWebseitenEditor();
}

// Sektion löschen
function deleteWebseitenSection(button) {
    const section = button.closest('.webseiten-section');
    const index = parseInt(section.dataset.index);
    
    if (confirm('Sektion wirklich löschen?')) {
        webseitenData.webseite.splice(index, 1);
        renderWebseitenEditor();
    }
}

// Sortierbare Sektionen einrichten
function setupWebseitenSortable() {
    const editorContainer = document.getElementById('webseite-editor');
    if (!editorContainer || !window.Sortable) return;
    
    new Sortable(editorContainer, {
        handle: '.drag-icon',
        animation: 150,
        forceFallback: true,
        
        // Verhindere das Verschieben der ersten und letzten Sektion
        filter: function(evt) {
            const sectionIndex = Array.from(editorContainer.children).indexOf(evt.item);
            const totalSections = webseitenData.webseite.length;
            
            // Erste (Index 0) und letzte Sektion können nicht verschoben werden
            return sectionIndex === 0 || sectionIndex === (totalSections - 1);
        },
        
        // Verhindere das Droppen vor der ersten oder nach der letzten Sektion
        onMove: function(evt) {
            const toIndex = Array.from(editorContainer.children).indexOf(evt.related);
            const totalSections = webseitenData.webseite.length;
            
            // Verhindere Droppen an Position 0 oder an die letzte Position
            if (toIndex <= 0 || toIndex >= (totalSections - 1)) {
                return false;
            }
            
            return true;
        },
        
        onEnd: function(evt) {
            // Array neu sortieren
            const item = webseitenData.webseite.splice(evt.oldIndex, 1)[0];
            webseitenData.webseite.splice(evt.newIndex, 0, item);
            
            renderWebseitenEditor();
        }
    });
}

// Webseiten-Archive laden
async function loadWebseitenArchives() {
    const archivSelect = document.getElementById('webseitenArchivSelect');
    if (!archivSelect) return;
    
    archivSelect.innerHTML = '';
    
    // Aktueller Stand als erste Option
    const currentOption = document.createElement('option');
    currentOption.value = '__current';
    currentOption.textContent = 'Aktueller Stand';
    archivSelect.appendChild(currentOption);
    
    // Trennlinie
    const dividerOption = document.createElement('option');
    dividerOption.value = '';
    dividerOption.textContent = '─────────';
    dividerOption.disabled = true;
    archivSelect.appendChild(dividerOption);
    
    archivSelect.disabled = true;
    
    try {
        const response = await fetch('data_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'action=list_webseiten_archives'
        });
        
        const list = await response.json();
        if (!Array.isArray(list) || list.length === 0) return;
        
        list.forEach(filename => {
            const match = filename.match(/data_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
            let formattedDate;
            if (match) {
                const [, y, m, d, h, min, s] = match;
                formattedDate = `${d}.${m}.${y} – ${h}:${min}`;
            } else {
                formattedDate = filename.replace('.json', '');
            }
            
            const option = document.createElement('option');
            option.value = filename;
            option.textContent = formattedDate;
            archivSelect.appendChild(option);
        });
        
        archivSelect.disabled = false;
    } catch (error) {
        console.error('Fehler beim Laden der Webseiten-Archive:', error);
    }
}

// Webseiten-Archiv laden
async function loadWebseitenArchive() {
    const archivSelect = document.getElementById('webseitenArchivSelect');
    const file = archivSelect?.value;
    if (!file) return;
    
    if (file === '__current') {
        await loadWebseitenData();
        return;
    }
    
    try {
        const response = await fetch('data_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `action=load_webseiten_archive&archive=${encodeURIComponent(file)}`
        });
        
        if (!response.ok) {
            throw new Error('Archiv konnte nicht geladen werden');
        }
        
        const data = await response.json();
        webseitenData = data;
        renderWebseitenEditor();
        
        showWebseitenSaveDialog(`Archiv "${file}" erfolgreich geladen`);
    } catch (error) {
        console.error('Fehler beim Laden des Archivs:', error);
        showWebseitenSaveDialog('Fehler beim Laden des Archivs: ' + error.message);
    }
}

// Webseiten-Daten speichern
async function saveWebseitenData() {
    const saveButton = document.getElementById('saveWebseitenBtn');
    const buttonLabel = saveButton?.textContent;

    try {
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Wird gespeichert...';
        }
        const response = await fetch('data_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'save_webseite',
                data: webseitenData
            })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);

        if (result.success) {
            showWebseitenSaveDialog('Webseiten-Daten erfolgreich gespeichert!');
            // Archive neu laden nach dem Speichern
            await loadWebseitenArchives();
        } else {
            showWebseitenSaveDialog('Fehler beim Speichern: ' + (result.message || 'Unbekannter Fehler'));
        }
    } catch (error) {
        console.error('Speichern fehlgeschlagen:', error);
        showWebseitenSaveDialog('Speichern fehlgeschlagen: ' + error.message);
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = buttonLabel;
        }
    }
}

// Export für andere Module
window.WebseitenEditor = {
    init: initWebseitenEditor,
    load: loadWebseitenData,
    save: saveWebseitenData,
    loadArchives: loadWebseitenArchives,
    getData: () => webseitenData
};
