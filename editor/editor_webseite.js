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
        const response = await fetch('webseite/data.json', { cache: 'no-store' });
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

function renderMenuVisibilityPicker(section, index) {
    return `<div class="text-position-picker menu-visibility-picker" role="group" aria-label="Als Menüpunkt anzeigen">
        <span>Als Menüpunkt anzeigen</span>
        ${[[true, 'Ja'], [false, 'Nein']].map(([value, label]) => `
            <label class="menu-visibility-choice"><input type="radio" name="webseite-menu-visibility-${index}" data-field="showInMenu" value="${value}" ${section.showInMenu === value ? 'checked' : ''}><span>${label}</span></label>
        `).join('')}
    </div>`;
}

// Einzelne Webseiten-Sektion rendern
function renderWebseitenSection(section, index) {
    if (typeof section.showInMenu !== 'boolean') section.showInMenu = Boolean(section.menutitel);
    if (section.type === 'opening-hours') return renderOpeningHoursEditor(section, index);
    if (section.type === 'instagram-feed') {
        return renderInstagramFeedSection(section, index);
    }

    const buttonLinks = [
        ['', 'Kein Link'],
        ['speisekarte', 'Speisekarte'],
        ['apartments', 'Apartments'],
        ['email', 'E-Mail'],
        ['telefon', 'Telefon'],
        ['route', 'Route mit Google Maps']
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
                <div class="image-row section-options-row">
                    <div class="section-options-controls">
                        ${renderMenuVisibilityPicker(section, index)}
                        ${renderThemePicker(section.theme)}
                        <div class="text-fields">
                            <label>Titel<input type="text" value="${section.titel || ''}" data-field="titel" placeholder="Haupttitel" /></label>
                            <label>Untertitel<input type="text" value="${section.untertitel || ''}" data-field="untertitel" placeholder="Untertitel" /></label>
                        </div>
                    </div>
                    ${['openstreetmap', 'apple-map'].includes(section.mediaType)
                        ? '<button type="button" class="image-thumb image-map-choice" data-field="image">Karte</button>'
                        : `<img class="image-thumb ${!section.image ? 'placeholder' : ''}" src="${section.image || imagePlaceholderSrc}" data-field="image" />`}
                </div>
                    <div class="text-fields">
                        <label>Text<textarea rows="6" data-field="text" placeholder="Beschreibungstext...">${section.text || ''}</textarea></label>
                        ${renderTextPositionPicker(section.position)}
                        <label>Button-Beschriftung<input type="text" value="${section.buttonLabel || ''}" data-field="buttonLabel" placeholder="z. B. Zur Speisekarte" /></label>
                        <label>Button-Link
                            <select data-field="buttonLink">
                                ${buttonLinkSelect}
                            </select>
                        </label>
                        ${renderButtonThemePicker(section.buttonTheme || 'primary')}
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
                    ${renderMenuVisibilityPicker(section, index)}
                    ${renderThemePicker(section.theme)}
                    <label>Titel<input type="text" value="${section.titel || ''}" data-field="titel" placeholder="Überschrift" /></label>
                    Der Feed zeigt automatisch die aktuellen Beiträge von kastaniemoltzow.
                </div>
                <div class="button-right">
                    <button type="button" class="delete-section">🗑️ Sektion löschen</button>
                </div>
            </div>
        </div>
    `;
}

function openingHoursEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

let openingHoursControlId = 0;

function renderOpeningHoursTime(value, field, periodIndex, closed) {
    const parts = (value || '').split(':');
    const controls = ['hour', 'minute'].map((part, partIndex) => {
        const values = Array.from({ length: part === 'hour' ? 24 : 4 }, (_, index) =>
            String(part === 'hour' ? index : index * 15).padStart(2, '0'));
        const selected = parts[partIndex] || '';
        if (selected && !values.includes(selected)) values.push(selected);
        const name = `hours-part-${++openingHoursControlId}`;
        return `<div class="hours-list" role="group" aria-label="${field === 'start' ? 'Von' : 'Bis'}: ${part === 'hour' ? 'Stunde' : 'Minute'}">
            ${['', ...values].map(option => `<label class="hours-choice"><input type="radio" name="${name}" value="${openingHoursEscape(option)}" data-hours-field="${field}" data-period="${periodIndex}" data-time-part="${part}" ${option === selected ? 'checked' : ''} ${closed ? 'disabled' : ''}><span>${openingHoursEscape(option) || '--'}</span></label>`).join('')}
        </div>`;
    });
    return `<div class="hours-time">${controls.join('')}</div>`;
}

function renderOpeningHoursDay(day, index, exception = false) {
    const escape = openingHoursEscape;
    const periods = [0, 1].map(periodIndex => {
        const period = day.periods?.[periodIndex] || {};
        return `<details class="hours-period" data-period="${periodIndex}">
            <summary aria-disabled="${day.closed}">${escape(period.start || '--:--')} bis ${escape(period.end || '--:--')}</summary>
            <div class="hours-dropdown">
                <div class="hours-range-labels"><strong>Von</strong><strong>Bis</strong></div>
                <div class="hours-range-lists">${renderOpeningHoursTime(period.start, 'start', periodIndex, day.closed)}${renderOpeningHoursTime(period.end, 'end', periodIndex, day.closed)}</div>
                <div class="hours-dropdown-actions"><button type="button" data-hours-clear>Leeren</button><button type="button" data-hours-done>Fertig</button></div>
            </div>
        </details>`;
    }).join('');
    return `<fieldset class="hours-day-editor" data-hours-day="${index}" data-hours-group="${exception ? 'exceptions' : 'week'}">
        <legend>${exception ? `Ausnahme ${index + 1}` : OpeningHours.days[index]}</legend>
        ${exception ? `<div class="hours-exception-dates"><label>Von<input type="date" data-hours-field="from" value="${escape(day.from)}"></label><label>Bis einschließlich<input type="date" data-hours-field="to" value="${escape(day.to)}"></label></div>
        <label>Anlass<input type="text" data-hours-field="note" value="${escape(day.note)}" placeholder="z. B. Betriebsferien"></label>` : ''}
        <select data-hours-field="status" aria-label="Status">
            <option value="open" ${!day.closed ? 'selected' : ''}>Geöffnet</option>
            <option value="closed" ${day.closed && !day.privateEvent && !day.restDay ? 'selected' : ''}>Geschlossen</option>
            <option value="rest-day" ${day.restDay ? 'selected' : ''}>Ruhetag</option>
            <option value="private-event" ${day.privateEvent ? 'selected' : ''}>Geschlossene Gesellschaft</option>
        </select>
        <div class="hours-periods" style="${day.closed ? 'display: none;' : ''}">${periods}</div>
        ${exception ? '<button type="button" data-hours-remove>Ausnahme löschen</button>' : ''}
    </fieldset>`;
}

function renderOpeningHoursEditor(section, index) {
    const config = section.openingHours || (section.openingHours = OpeningHours.defaults());
    const escape = openingHoursEscape;
    return `<div class="webseiten-section opening-hours-editor" data-index="${index}">
        <div class="section-header">
            <button type="button" class="drag-icon" aria-label="Sektion verschieben">☰</button>
            <input type="text" value="${escape(section.menutitel)}" placeholder="Menütitel" data-field="menutitel">
            <button type="button" class="toggle-section" aria-expanded="false" aria-label="Details anzeigen"><span class="toggle-icon" aria-hidden="true">▶</span></button>
        </div>
        <div class="section-details collapsed">
            <div class="text-fields">
                ${renderMenuVisibilityPicker(section, index)}
                ${renderThemePicker(section.theme)}
                <label>Titel<input type="text" data-field="titel" value="${escape(section.titel)}"></label>
            </div>
            <h3>Wochenzeiten</h3>
            <div class="hours-week-editor">${config.week.map((day, dayIndex) => renderOpeningHoursDay(day, dayIndex)).join('')}</div>
            <h3>Ausnahmen</h3>
            <div class="hours-exceptions">${config.exceptions.map((day, dayIndex) => renderOpeningHoursDay(day, dayIndex, true)).join('')}</div>
            <button type="button" data-hours-add>Ausnahme hinzufügen</button>
            <div class="button-right"><button type="button" class="delete-section">Sektion löschen</button></div>
        </div>
    </div>`;
}

const openingHoursScrollTimers = new WeakMap();

function scrollOpeningHoursOption(option, behavior = 'smooth') {
    const list = option.closest('.hours-list');
    if (!list || !list.clientHeight || !option.closest('.hours-period').open) return;
    clearTimeout(openingHoursScrollTimers.get(list));
    const selected = option.closest('label').getBoundingClientRect();
    const bounds = list.getBoundingClientRect();
    if (behavior === 'smooth' && selected.top >= bounds.top + list.clientTop && selected.bottom <= bounds.top + list.clientTop + list.clientHeight) return;
    const top = list.scrollTop + selected.top - bounds.top - list.clientTop - (list.clientHeight - selected.height) / 2;
    const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : behavior;
    list.scrollTo({
        top,
        behavior: scrollBehavior
    });
    if (scrollBehavior === 'smooth') {
        openingHoursScrollTimers.set(list, setTimeout(() => {
            if (!option.isConnected || !option.checked || !option.closest('.hours-period').open) return;
            const current = option.closest('label').getBoundingClientRect();
            const viewport = list.getBoundingClientRect();
            if (current.top < viewport.top + list.clientTop || current.bottom > viewport.top + list.clientTop + list.clientHeight) {
                scrollOpeningHoursOption(option, 'auto');
            }
        }, 600));
    }
}

function setOpeningHoursTimeControls(container, field, value, revealSelection = false) {
    const parts = (value || '').split(':');
    ['hour', 'minute'].forEach((part, index) => {
        const option = container.querySelector(`input[data-hours-field="${field}"][data-time-part="${part}"][value="${parts[index] || ''}"]`);
        if (option && (!option.checked || revealSelection)) {
            option.checked = true;
            scrollOpeningHoursOption(option);
        }
    });
}

function updateOpeningHoursField(input) {
    const section = input.closest('.webseiten-section');
    const row = input.closest('[data-hours-day]');
    const config = webseitenData.webseite[Number(section.dataset.index)].openingHours;
    const day = config[row.dataset.hoursGroup][Number(row.dataset.hoursDay)];
    const field = input.dataset.hoursField;
    if (field === 'status') {
        day.closed = input.value !== 'open';
        day.privateEvent = input.value === 'private-event';
        day.restDay = input.value === 'rest-day';
        row.querySelector('.hours-periods').style.display = day.closed ? 'none' : '';
        row.querySelectorAll('input[data-period]').forEach(time => { time.disabled = day.closed; });
        row.querySelectorAll('.hours-period').forEach(period => {
            period.querySelector('summary').setAttribute('aria-disabled', String(day.closed));
            if (day.closed) period.open = false;
        });
    } else if (field === 'start' || field === 'end') {
        const periodIndex = Number(input.dataset.period);
        day.periods ||= [];
        day.periods[periodIndex] ||= { start: '', end: '' };
        const previousPeriods = day.periods.map(entry => ({ ...entry }));
        const period = day.periods[periodIndex];
        const container = input.closest('.hours-period');
        const time = input.closest('.hours-time');
        let hour = time.querySelector('[data-time-part="hour"]:checked').value;
        let minute = time.querySelector('[data-time-part="minute"]:checked').value;
        if (field === 'start' && input.value) {
            hour ||= '09';
            minute ||= '00';
            const minimumEnd = Number(hour) * 60 + Number(minute) + 120;
            if (minimumEnd > 23 * 60 + 45) {
                setOpeningHoursTimeControls(container, 'start', period.start);
                showWebseitenSaveDialog('Für zwei Stunden bis zur Schließung bitte spätestens 21:45 wählen. Zeiten über Mitternacht werden noch nicht unterstützt.');
                return;
            }
            setOpeningHoursTimeControls(container, 'start', `${hour}:${minute}`);
            if (!/^\d{2}:\d{2}$/.test(period.end) || Number(period.end.slice(0, 2)) * 60 + Number(period.end.slice(3)) < minimumEnd) {
                period.end = `${String(Math.floor(minimumEnd / 60)).padStart(2, '0')}:${String(minimumEnd % 60).padStart(2, '0')}`;
            }
        }
        period[field] = hour || minute ? `${hour}:${minute}` : '';
        const firstEnd = day.periods[0]?.end;
        const second = day.periods[1];
        if (/^\d{2}:\d{2}$/.test(firstEnd) && /^\d{2}:\d{2}$/.test(second?.start) && second.start <= firstEnd) {
            const firstEndMinutes = Number(firstEnd.slice(0, 2)) * 60 + Number(firstEnd.slice(3));
            const secondStart = (Math.floor(firstEndMinutes / 15) + 1) * 15;
            const secondEnd = secondStart + 120;
            if (secondEnd > 23 * 60 + 45) {
                day.periods = previousPeriods;
                showWebseitenSaveDialog('Nach dem ersten Zeitraum ist kein Platz mehr für einen zweiten mit mindestens zwei Stunden am selben Tag. Bitte zuerst den zweiten Zeitraum leeren oder den ersten früher enden lassen.');
            } else {
                second.start = `${String(Math.floor(secondStart / 60)).padStart(2, '0')}:${String(secondStart % 60).padStart(2, '0')}`;
                if (!/^\d{2}:\d{2}$/.test(second.end) || Number(second.end.slice(0, 2)) * 60 + Number(second.end.slice(3)) < secondEnd) {
                    second.end = `${String(Math.floor(secondEnd / 60)).padStart(2, '0')}:${String(secondEnd % 60).padStart(2, '0')}`;
                }
            }
        }
        row.querySelectorAll('.hours-period').forEach(periodElement => {
            const entry = day.periods[Number(periodElement.dataset.period)];
            if (!entry) return;
            setOpeningHoursTimeControls(periodElement, 'start', entry.start);
            setOpeningHoursTimeControls(periodElement, 'end', entry.end, periodElement === container && field === 'start' && Boolean(input.value));
            periodElement.querySelector('summary').textContent = `${entry.start || '--:--'} bis ${entry.end || '--:--'}`;
        });
    } else {
        day[field] = input.value;
    }
}

function changeOpeningHoursException(button, remove) {
    const section = button.closest('.webseiten-section');
    const config = webseitenData.webseite[Number(section.dataset.index)].openingHours;
    if (remove) config.exceptions.splice(Number(button.closest('[data-hours-day]').dataset.hoursDay), 1);
    else config.exceptions.push({ ...OpeningHours.emptyDay(), from: '', to: '', note: '' });
    section.querySelector('.hours-exceptions').innerHTML = config.exceptions.map((day, index) => renderOpeningHoursDay(day, index, true)).join('');
}

// Event-Handler für Webseiten-Editor
function setupWebseitenEvents() {
    const editorContainer = document.getElementById('webseite-editor');
    if (!editorContainer) return;

    document.addEventListener('click', (event) => {
        editorContainer.querySelectorAll('.hours-period[open]').forEach(period => {
            if (!period.contains(event.target)) period.open = false;
        });
    });
    editorContainer.addEventListener('keydown', (event) => {
        const period = event.target.closest('.hours-period[open]');
        if (event.key === 'Escape' && period) {
            period.open = false;
            period.querySelector('summary').focus();
            event.preventDefault();
        }
    });
    editorContainer.addEventListener('toggle', (event) => {
        const period = event.target;
        if (!period.matches('.hours-period') || !period.open) return;
        const hasTime = [...period.querySelectorAll('input:checked')].some(input => input.value);
        if (!hasTime && period.querySelector('summary').getAttribute('aria-disabled') !== 'true') {
            setOpeningHoursTimeControls(period, 'start', '09:00');
            updateOpeningHoursField(period.querySelector('[data-hours-field="start"][data-time-part="hour"]:checked'));
        }
        period.querySelectorAll('.hours-list').forEach(list => {
            scrollOpeningHoursOption(list.querySelector('input:checked'), 'auto');
        });
    }, true);
    
    // Delegate events für dynamisch erstellte Elemente
    editorContainer.addEventListener('input', (e) => {
        if (e.target.matches('[data-hours-field]')) updateOpeningHoursField(e.target);
        if (e.target.matches('[data-field]')) {
            updateWebseitenField(e.target);
        }
    });
    
    editorContainer.addEventListener('click', (e) => {
        if (e.target.closest('.hours-period summary[aria-disabled="true"]')) {
            e.preventDefault();
            return;
        }
        const hoursAction = e.target.closest('[data-hours-clear], [data-hours-done]');
        if (hoursAction) {
            const period = hoursAction.closest('.hours-period');
            if (hoursAction.hasAttribute('data-hours-clear')) {
                const row = period.closest('[data-hours-day]');
                const section = period.closest('.webseiten-section');
                const config = webseitenData.webseite[Number(section.dataset.index)].openingHours;
                const day = config[row.dataset.hoursGroup][Number(row.dataset.hoursDay)];
                day.periods[Number(period.dataset.period)] = { start: '', end: '' };
                period.querySelectorAll('input[value=""]').forEach(input => { input.checked = true; });
                period.querySelector('summary').textContent = '--:-- bis --:--';
            } else {
                period.open = false;
                period.querySelector('summary').focus();
            }
            return;
        }
        const exceptionButton = e.target.closest('[data-hours-add], [data-hours-remove]');
        if (exceptionButton) {
            changeOpeningHoursException(exceptionButton, exceptionButton.hasAttribute('data-hours-remove'));
            return;
        }
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
            const sectionType = event.target.closest('[data-section-type]')?.dataset.sectionType;
            if (sectionType) {
                try {
                    addWebseitenSection(sectionType);
                    closeWebseitenSectionOverlay();
                } catch (error) {
                    console.error('Sektion konnte nicht hinzugefügt werden:', error);
                    showWebseitenSaveDialog('Sektion konnte nicht hinzugefügt werden: ' + error.message);
                }
            } else if (event.target === sectionOverlay) {
                closeWebseitenSectionOverlay();
            }
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
    const value = field === 'showInMenu' ? input.value === 'true' : input.value;
    
    if (webseitenData.webseite[index]) {
        webseitenData.webseite[index][field] = value;
    }
}

// Bild-Auswahl für Webseiten-Sektion
function handleWebseitenImageClick(imageThumb) {
    const section = imageThumb.closest('.webseiten-section');
    const index = parseInt(section.dataset.index);

    EditorImages.openImageOverlay((newSrc, mediaType) => {
        webseitenData.webseite[index].image = newSrc;
        if (mediaType === 'openstreetmap') webseitenData.webseite[index].mediaType = mediaType;
        else delete webseitenData.webseite[index].mediaType;
        const preview = document.createElement(mediaType === 'openstreetmap' ? 'button' : 'img');
        preview.dataset.field = 'image';
        preview.className = 'image-thumb';
        if (mediaType === 'openstreetmap') {
            preview.type = 'button';
            preview.classList.add('image-map-choice');
            preview.textContent = 'Karte';
        } else {
            preview.src = newSrc || imagePlaceholderSrc;
            preview.classList.toggle('placeholder', !newSrc);
        }
        imageThumb.replaceWith(preview);
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
    if (sectionType === 'opening-hours' && typeof OpeningHours === 'undefined') {
        throw new Error('Die Öffnungszeiten-Funktion wurde nicht geladen. Bitte webseite/opening-hours.js auf dem Server prüfen und den Editor neu laden.');
    }
    const newSection = sectionType === 'opening-hours'
        ? {
            type: 'opening-hours',
            menutitel: 'Öffnungszeiten',
            titel: 'Wir sehen uns in Moltzow.',
            theme: 'moss',
            openingHours: OpeningHours.defaults()
        }
        : sectionType === 'instagram-feed'
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
    for (const section of webseitenData.webseite) {
        if (section.type !== 'opening-hours') continue;
        const error = OpeningHours.validate(section.openingHours);
        if (error) {
            showWebseitenSaveDialog(`${section.menutitel || 'Öffnungszeiten'}: ${error}`);
            return;
        }
    }
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
