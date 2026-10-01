function createSectionPageEditor(pageName, pageLabel) {
    const isEvents = pageName === 'veranstaltungen';
    const imagePlaceholderSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    const imagePositions = ['links', 'rechts', 'zentriert'];
    const buttonLinks = [
        ['', 'Kein Link'],
        ['speisekarte', 'Speisekarte'],
        ['veranstaltungen', 'Veranstaltungen'],
        ['email', 'E-Mail'],
        ['telefon', 'Telefon'],
        ['route', 'Route mit Google Maps']
    ];
    let apartmentsData = { webseite: [] };
    let loaded = false;

    function validEventSlot(section) {
        const date = section.date || '';
        const parsed = new Date(`${date}T12:00:00Z`);
        return /^\d{4}-\d{2}-\d{2}$/.test(date) && date.slice(0, 4) !== '0000' &&
            !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date &&
            /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(section.start || '') &&
            /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(section.end || '') && section.start < section.end;
    }

    function compareEvents(left, right) {
        const leftKey = validEventSlot(left) ? `${left.date}T${left.start}` : '9999-99-99';
        const rightKey = validEventSlot(right) ? `${right.date}T${right.start}` : '9999-99-99';
        return leftKey.localeCompare(rightKey);
    }

    function currentBerlinDateTime() {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Berlin',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).formatToParts(new Date());
        const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
        return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
    }

    function isEventExpired(section, now) {
        return validEventSlot(section) && (section.date < now.date || (section.date === now.date && section.end <= now.time));
    }

    function validateEvents() {
        if (!isEvents) return '';
        const ordered = apartmentsData.webseite.map((section, index) => ({ section, number: index + 1 }));
        const invalid = ordered.find(item => !validEventSlot(item.section));
        let message = '';
        if (invalid) {
            message = `Sektion ${invalid.number}: Bitte Datum und Von-/Bis-Zeiten angeben. Bis muss nach Von liegen (am selben Tag).`;
        } else {
            ordered.sort((left, right) => compareEvents(left.section, right.section));
            for (let index = 1; index < ordered.length; index++) {
                const previous = ordered[index - 1];
                const current = ordered[index];
                if (previous.section.date === current.section.date && current.section.start < previous.section.end) {
                    message = `Sektionen ${previous.number} und ${current.number}: Datum und Uhrzeit überschneiden sich.`;
                    break;
                }
            }
        }
        const status = document.getElementById('veranstaltungenScheduleError');
        if (status) {
            status.textContent = message;
            status.hidden = !message;
        }
        return message;
    }

    function sortEvents() {
        apartmentsData.webseite.sort(compareEvents);
        render();
    }

    function renderEventSchedule(section, index) {
        return `<div class="event-schedule">
            <label>Datum<input type="date" data-field="date" value="${openingHoursEscape(section.date || '')}" required></label>
            <div><span class="field-label">Uhrzeit</span>
                <details class="hours-period event-period">
                    <summary>${openingHoursEscape(section.start || '--:--')} bis ${openingHoursEscape(section.end || '--:--')}</summary>
                    <div class="hours-dropdown">
                        <div class="hours-range-labels"><strong>Von</strong><strong>Bis</strong></div>
                        <div class="hours-range-lists">${renderOpeningHoursTime(section.start, 'start', index, false, 'event')}${renderOpeningHoursTime(section.end, 'end', index, false, 'event')}</div>
                        <div class="hours-dropdown-actions"><button type="button" data-event-clear>Leeren</button><button type="button" data-event-done>Fertig</button></div>
                    </div>
                </details>
            </div>
        </div>`;
    }

    function normalizeImagePosition(position) {
        return imagePositions.includes(position) ? position : 'zentriert';
    }

    function updateEventTime(input) {
        const period = input.closest('.event-period');
        const section = apartmentsData.webseite[Number(input.closest('.webseiten-section').dataset.index)];
        const field = input.dataset.eventField;
        const time = input.closest('.hours-time');
        let hour = time.querySelector('[data-time-part="hour"]:checked').value;
        let minute = time.querySelector('[data-time-part="minute"]:checked').value;
        if (input.value) {
            hour ||= field === 'start' ? '09' : '11';
            minute ||= '00';
            if (field === 'start') {
                const minimumEnd = Number(hour) * 60 + Number(minute) + 120;
                if (minimumEnd > 23 * 60 + 45) {
                    setOpeningHoursTimeControls(period, 'start', section.start, true, 'event');
                    alert('Für zwei Stunden bis zum Ende bitte spätestens 21:45 wählen. Zeiten über Mitternacht werden noch nicht unterstützt.');
                    return;
                }
                if (!/^\d{2}:\d{2}$/.test(section.end || '') || Number(section.end.slice(0, 2)) * 60 + Number(section.end.slice(3)) < minimumEnd) {
                    section.end = `${String(Math.floor(minimumEnd / 60)).padStart(2, '0')}:${String(minimumEnd % 60).padStart(2, '0')}`;
                }
            }
        }
        section[field] = hour || minute ? `${hour}:${minute}` : '';
        setOpeningHoursTimeControls(period, 'start', section.start, false, 'event');
        setOpeningHoursTimeControls(period, 'end', section.end, field === 'start' && Boolean(input.value), 'event');
        period.querySelector('summary').textContent = `${section.start || '--:--'} bis ${section.end || '--:--'}`;
        scrollOpeningHoursOption(input);
        validateEvents();
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

    function renderMenuVisibilityPicker(section, index) {
        return `<div class="text-position-picker menu-visibility-picker" role="group" aria-label="Als Menüpunkt anzeigen">
            <span>Als Menüpunkt anzeigen</span>
            ${[[true, 'Ja'], [false, 'Nein']].map(([value, label]) => `
                <label class="menu-visibility-choice"><input type="radio" name="${pageName}-menu-visibility-${index}" data-field="showInMenu" value="${value}" ${section.showInMenu === value ? 'checked' : ''}><span>${label}</span></label>
            `).join('')}
        </div>`;
    }

    function renderSection(section, index, expired = false) {
        if (typeof section.showInMenu !== 'boolean') section.showInMenu = Boolean(section.menutitel);
        const buttonLinkSelect = buttonLinks.map(([value, label]) =>
            `<option value="${value}" ${section.buttonLink === value ? 'selected' : ''}>${label}</option>`
        ).join('');

        return `
            <div class="webseiten-section${section.active === false ? ' is-inactive' : ''}${expired ? ' is-expired' : ''}" data-index="${index}">
                <div class="section-header" style="display: flex; align-items: center;">
                    ${isEvents ? '' : '<button type="button" class="drag-icon" aria-label="Sektion verschieben">☰</button>'}
                    <input type="text" value="${section.menutitel || ''}" placeholder="Menütitel" data-field="menutitel">
                    <button type="button" class="toggle-section" aria-expanded="false" aria-label="Details anzeigen"><span class="toggle-icon" aria-hidden="true">▶</span></button>
                </div>
                <div class="section-details collapsed">
                    ${isEvents ? renderEventSchedule(section, index) : ''}
                    <div class="image-row section-options-row">
                        <div class="section-options-controls">
                            ${renderMenuVisibilityPicker(section, index)}
                            ${renderThemePicker(section.theme)}
                            <div class="text-fields">
                                <label>Titel<input type="text" value="${section.titel || ''}" data-field="titel" placeholder="Haupttitel"></label>
                                <label>Untertitel<input type="text" value="${section.untertitel || ''}" data-field="untertitel" placeholder="Untertitel"></label>
                            </div>
                        </div>
                        ${['openstreetmap', 'apple-map', 'calendar'].includes(section.mediaType)
                            ? `<button type="button" class="image-thumb image-map-choice${section.mediaType === 'calendar' ? ' calendar-choice' : ''}" data-field="image">${section.mediaType === 'calendar' ? 'Kalender' : 'Karte'}</button>`
                            : `<img class="image-thumb ${!section.image ? 'placeholder' : ''}" src="${section.image || imagePlaceholderSrc}" data-field="image">`}
                    </div>
                        <div class="text-fields">
                            <label>Text<textarea rows="6" data-field="text" placeholder="Beschreibungstext...">${section.text || ''}</textarea></label>
                            ${renderTextPositionPicker(section.position)}
                            <label>Button-Beschriftung<input type="text" value="${section.buttonLabel || ''}" data-field="buttonLabel" placeholder="z. B. Jetzt anfragen"></label>
                            <label>Button-Link<select data-field="buttonLink">${buttonLinkSelect}</select></label>
                            ${renderButtonThemePicker(section.buttonTheme || 'primary')}
                            <label>Minimaltext<textarea rows="3" data-field="minimalText" placeholder="Optionaler Hinweis unter dem Button">${openingHoursEscape(section.minimalText || '')}</textarea></label>
                        </div>
                    <div class="button-right">
                        <button type="button" class="toggle-section-visibility">${section.active === false ? 'Sektion einblenden' : 'Sektion ausblenden'}</button>
                        <button type="button" class="delete-section">🗑️ Sektion löschen</button>
                    </div>
                </div>
            </div>`;
    }

    function render() {
        const container = document.getElementById(`${pageName}-editor`);
        if (!container) return;
        if (isEvents) {
            const now = currentBerlinDateTime();
            const sections = apartmentsData.webseite.map((section, index) => ({ section, index, expired: isEventExpired(section, now) }));
            const active = sections.filter(item => !item.expired).sort((left, right) => compareEvents(left.section, right.section));
            const expired = sections.filter(item => item.expired).sort((left, right) => compareEvents(left.section, right.section));
            container.innerHTML = active.map(item => renderSection(item.section, item.index)).join('') +
                (expired.length ? `<div class="expired-events-divider" role="separator"><span>Abgelaufene Veranstaltungen</span></div>${expired.map(item => renderSection(item.section, item.index, true)).join('')}` : '');
        } else {
            container.innerHTML = apartmentsData.webseite.map((section, index) => renderSection(section, index)).join('');
        }
        setupSortable();
        if (isEvents) validateEvents();
    }

    async function loadData() {
        const finishLoading = EditorTabs.beginLoading(pageName);
        try {
            const response = await fetch(`${pageName}/data.json`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            apartmentsData = await response.json();
            if (!Array.isArray(apartmentsData.webseite)) apartmentsData.webseite = [];
        } catch (error) {
            console.error(`${pageLabel}-Daten konnten nicht geladen werden:`, error);
            apartmentsData = { webseite: [] };
        } finally {
            finishLoading();
        }
        normalizeSections();
        render();
    }

    function updateField(input) {
        const index = Number(input.closest('.webseiten-section').dataset.index);
        const value = input.dataset.field === 'showInMenu' ? input.value === 'true' : input.value;
        if (apartmentsData.webseite[index]) apartmentsData.webseite[index][input.dataset.field] = value;
        if (isEvents) validateEvents();
    }

    function toggleVisibility(button) {
        const section = button.closest('.webseiten-section');
        const item = apartmentsData.webseite[Number(section.dataset.index)];
        item.active = item.active === false;
        section.classList.toggle('is-inactive', !item.active);
        button.textContent = item.active ? 'Sektion ausblenden' : 'Sektion einblenden';
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
        EditorImages.openImageOverlay((newSrc, mediaType) => {
            apartmentsData.webseite[index].image = newSrc;
            if (['openstreetmap', 'calendar'].includes(mediaType)) apartmentsData.webseite[index].mediaType = mediaType;
            else delete apartmentsData.webseite[index].mediaType;
            const specialMedia = ['openstreetmap', 'calendar'].includes(mediaType);
            const preview = document.createElement(specialMedia ? 'button' : 'img');
            preview.dataset.field = 'image';
            preview.className = `image-thumb${mediaType === 'calendar' ? ' image-map-choice calendar-choice' : ''}`;
            if (specialMedia) {
                preview.type = 'button';
                if (mediaType === 'openstreetmap') preview.classList.add('image-map-choice');
                preview.textContent = mediaType === 'calendar' ? 'Kalender' : 'Karte';
            } else {
                preview.src = newSrc || imagePlaceholderSrc;
                preview.classList.toggle('placeholder', !newSrc);
            }
            imageThumb.replaceWith(preview);
        }, apartmentsData.webseite[index].image, pageName, true);
    }

    function addSection() {
        apartmentsData.webseite.push({
            ...(isEvents ? { date: '', start: '09:00', end: '11:00' } : {}),
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
        if (isEvents && isCollapsed) details.querySelectorAll('.event-period').forEach(period => { period.open = false; });
        button.setAttribute('aria-expanded', String(!isCollapsed));
        button.setAttribute('aria-label', isCollapsed ? 'Details anzeigen' : 'Details ausblenden');
        button.querySelector('.toggle-icon').style.setProperty('rotate', isCollapsed ? '0deg' : '90deg', 'important');
    }

    function setupSortable() {
        const container = document.getElementById(`${pageName}-editor`);
        if (!container || !window.Sortable) return;
        Sortable.get(container)?.destroy();
        if (isEvents) return;
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
        const select = document.getElementById(`${pageName}ArchivSelect`);
        if (!select) return;
        select.innerHTML = '<option value="__current">Aktueller Stand</option><option value="" disabled>─────────</option>';
        select.disabled = true;
        const finishLoading = EditorTabs.beginLoading(pageName);
        try {
            const response = await fetch('data_handler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=list_${pageName}_archives`
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
            console.error(`${pageLabel}-Archive konnten nicht geladen werden:`, error);
        } finally {
            finishLoading();
        }
    }

    async function loadArchive() {
        const select = document.getElementById(`${pageName}ArchivSelect`);
        if (!select?.value) return;
        if (select.value === '__current') return loadData();
        const finishLoading = EditorTabs.beginLoading(pageName);
        try {
            const response = await fetch('data_handler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=load_${pageName}_archive&archive=${encodeURIComponent(select.value)}`
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            apartmentsData = await response.json();
            normalizeSections();
            render();
            alert(`Archiv "${select.value}" erfolgreich geladen`);
        } catch (error) {
            alert(`Archiv konnte nicht geladen werden: ${error.message}`);
        } finally {
            finishLoading();
        }
    }

    async function save() {
        const scheduleError = validateEvents();
        if (scheduleError) {
            alert(scheduleError);
            return;
        }
        const button = document.getElementById(`save${pageLabel}Btn`);
        const label = button?.textContent;
        try {
            if (button) {
                button.disabled = true;
                button.textContent = 'Wird gespeichert...';
            }
            const response = await fetch('data_handler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: `save_${pageName}`, data: apartmentsData })
            });
            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error('Der Server hat keine gültige Antwort gesendet. Bitte PHP-Fehlerprotokoll prüfen.');
            }
            if (!response.ok || !result.success) throw new Error(result.error || result.message || `HTTP ${response.status}`);
            alert(`${pageLabel}-Daten erfolgreich gespeichert!`);
            await loadArchives();
        } catch (error) {
            console.error(`${pageLabel} konnten nicht gespeichert werden:`, error);
            alert(`Fehler beim Speichern: ${error.message}`);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = label;
            }
        }
    }

    function setupEvents() {
        const container = document.getElementById(`${pageName}-editor`);
        if (!container) return;
        if (isEvents) {
            document.addEventListener('click', event => {
                container.querySelectorAll('.event-period[open]').forEach(period => {
                    if (!period.contains(event.target)) period.open = false;
                });
            });
            container.addEventListener('keydown', event => {
                const period = event.target.closest('.event-period[open]');
                if (event.key === 'Escape' && period) {
                    period.open = false;
                    period.querySelector('summary').focus();
                    event.preventDefault();
                }
            });
        }
        if (isEvents) container.addEventListener('toggle', event => {
            const period = event.target;
            if (!period.matches('.event-period') || !period.open) return;
            const hasTime = [...period.querySelectorAll('input:checked')].some(input => input.value);
            if (!hasTime) {
                setOpeningHoursTimeControls(period, 'start', '09:00', false, 'event');
                updateEventTime(period.querySelector('[data-event-field="start"][data-time-part="hour"]:checked'));
            }
            period.querySelectorAll('input:checked').forEach(input => scrollOpeningHoursOption(input, 'auto'));
        }, true);
        container.addEventListener('input', (event) => {
            if (event.target.matches('[data-field]')) updateField(event.target);
            else if (isEvents && event.target.matches('[data-event-field]')) {
                updateEventTime(event.target);
            }
        });
        container.addEventListener('click', (event) => {
            const themeButton = event.target.closest('[data-section-theme]');
            const buttonTheme = event.target.closest('[data-button-theme]');
            if (isEvents && event.target.closest('[data-event-clear], [data-event-done]')) {
                const period = event.target.closest('.event-period');
                if (event.target.closest('[data-event-clear]')) {
                    const section = apartmentsData.webseite[Number(period.closest('.webseiten-section').dataset.index)];
                    section.start = '';
                    section.end = '';
                    period.querySelectorAll('input').forEach(input => { input.checked = input.value === ''; });
                    period.querySelector('summary').textContent = '--:-- bis --:--';
                    validateEvents();
                }
                period.open = false;
                period.querySelector('summary').focus();
                return;
            }
            if (themeButton) updateTheme(themeButton);
            else if (buttonTheme) updateButtonTheme(buttonTheme);
            else if (event.target.closest('[data-section-position]')) updatePosition(event.target.closest('[data-section-position]'));
            else if (event.target.closest('.toggle-section')) toggleSection(event.target.closest('.toggle-section'));
            else if (event.target.matches('.image-thumb')) selectImage(event.target);
            else if (event.target.matches('.toggle-section-visibility')) toggleVisibility(event.target);
            else if (event.target.matches('.delete-section')) deleteSection(event.target);
        });
        document.getElementById(`add${pageLabel}SectionBtn`)?.addEventListener('click', addSection);
        document.getElementById(`save${pageLabel}Btn`)?.addEventListener('click', save);
        document.getElementById(`${pageName}ArchivSelect`)?.addEventListener('change', loadArchive);
        if (isEvents) document.getElementById('sortVeranstaltungenBtn')?.addEventListener('click', sortEvents);
    }

    async function init() {
        if (loaded) return;
        setupEvents();
        await Promise.all([loadData(), loadArchives()]);
        loaded = true;
    }

    return { init };
}

const ApartmentsEditor = createSectionPageEditor('apartments', 'Apartments');
const VeranstaltungenEditor = createSectionPageEditor('veranstaltungen', 'Veranstaltungen');
window.ApartmentsEditor = ApartmentsEditor;
window.VeranstaltungenEditor = VeranstaltungenEditor;
