const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');

const php = process.argv[2] || 'php';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kastanie-section-pages-'));
const handler = path.join(root, 'data_handler.php');
const runner = 'register_shutdown_function(function () { fwrite(STDERR, "STATUS:" . (http_response_code() ?: 200)); }); $_POST = json_decode(stream_get_contents(STDIN), true); require $argv[1];';

function request(payload, status = 200) {
    const result = spawnSync(php, ['-r', runner, handler], { input: JSON.stringify(payload), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    assert.equal(Number(result.stderr.match(/STATUS:(\d+)/)?.[1]), status, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
}

try {
    fs.copyFileSync(path.join(__dirname, '..', 'data_handler.php'), handler);
    fs.mkdirSync(path.join(root, 'partials'));
    fs.copyFileSync(path.join(__dirname, '..', 'partials', 'event_schedule.php'), path.join(root, 'partials', 'event_schedule.php'));
    fs.copyFileSync(path.join(__dirname, '..', 'config.json'), path.join(root, 'config.json'));
    const savedPages = {};
    for (const page of ['apartments', 'veranstaltungen']) {
        assert.deepEqual(request({ action: `list_${page}_archives` }), []);
        request({ action: `save_${page}`, data: null }, 400);
        const original = { webseite: [{ menutitel: page, text: 'Original', active: false }] };
        const current = { webseite: [{ menutitel: page, text: 'Updated', active: true }] };
        if (page === 'veranstaltungen') {
            for (const data of [original, current]) Object.assign(data.webseite[0], { date: '2026-09-23', start: '10:00', end: '12:00' });
        }
        assert.equal(request({ action: `save_${page}`, data: original }).success, true);
        assert.equal(request({ action: `save_${page}`, data: current }).success, true);
        assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, page, 'data.json'))), current);
        const archives = request({ action: `list_${page}_archives` });
        assert.equal(archives.length, 1);
        assert.deepEqual(request({ action: `load_${page}_archive`, archive: archives[0] }), original);
        request({ action: `load_${page}_archive`, archive: 'missing.json' }, 404);
        const layouts = request({ action: 'load_layout_config', page });
        assert(layouts.every(layout => layout.aktiv === false));
        layouts[0].aktiv = true;
        assert.equal(request({ action: 'save_layout_config', page, data: JSON.stringify(layouts) }).success, true);
        assert.deepEqual(request({ action: 'load_layout_config', page }), layouts);
        assert.deepEqual(request({ action: 'load_images', library: page }), []);
        const imageDir = path.join(root, `bilder_${page}`);
        fs.mkdirSync(imageDir);
        fs.writeFileSync(path.join(imageDir, 'test.gif'), Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'));
        assert.equal(request({ action: 'load_images', library: page })[0].name, 'test.gif');
        assert.equal(request({ action: 'archive_image', library: page, filename: 'test.gif' }).success, true);
        assert(fs.existsSync(path.join(imageDir, 'archiv', 'test.gif')));
        assert.deepEqual(request({ action: 'load_images', library: page }), []);
        savedPages[page] = fs.readFileSync(path.join(root, page, 'data.json'), 'utf8');
    }
    for (const [page, content] of Object.entries(savedPages)) {
        assert.equal(fs.readFileSync(path.join(root, page, 'data.json'), 'utf8'), content);
    }
    console.log('PASS: separate Apartments/Veranstaltungen data, archives, visibility and season options');
    const slot = (date, start, end, extra = {}) => ({ date, start, end, ...extra });
    const eventsFile = path.join(root, 'veranstaltungen', 'data.json');
    const beforeInvalid = fs.readFileSync(eventsFile, 'utf8');
    const beforeArchives = request({ action: 'list_veranstaltungen_archives' });
    for (const sections of [
        [{}], [slot('2026-02-30', '10:00', '11:00')], [slot('2026-09-23', '12:00', '12:00')],
        [slot('2026-09-23', '23:00', '01:00')], [slot('2026-09-23', '10:00', '24:00')],
        [slot('2026-09-23', '10:00', '12:00'), slot('2026-09-23', '11:00', '13:00')],
        [slot('2026-09-23', '10:00', '15:00'), slot('2026-09-23', '11:00', '12:00', { active: false })],
        [slot('2026-09-23', '10:00', '12:00'), slot('2026-09-23', '10:00', '12:00')]
    ]) {
        request({ action: 'save_veranstaltungen', data: { webseite: sections } }, 400);
        assert.equal(fs.readFileSync(eventsFile, 'utf8'), beforeInvalid);
        assert.deepEqual(request({ action: 'list_veranstaltungen_archives' }), beforeArchives);
    }
    const adjacent = [slot('2026-09-24', '10:00', '12:00'), slot('2026-09-23', '12:00', '13:00'), slot('2026-09-23', '10:00', '12:00')];
    assert.equal(request({ action: 'save_veranstaltungen', data: { webseite: adjacent } }).success, true);
    assert.deepEqual(JSON.parse(fs.readFileSync(eventsFile)).webseite, adjacent);
    assert.equal(request({ action: 'save_veranstaltungen', data: { webseite: [] } }).success, true);
    console.log('PASS: valid dates and intervals, adjacent events allowed, overlaps rejected without data/archive changes');
    const renderRoot = path.join(root, 'render');
    fs.mkdirSync(path.join(renderRoot, 'partials'), { recursive: true });
    const rendererFile = path.join(renderRoot, 'partials', 'website.php');
    fs.copyFileSync(path.join(__dirname, '..', 'partials', 'website.php'), rendererFile);
    fs.copyFileSync(path.join(__dirname, '..', 'partials', 'event_schedule.php'), path.join(renderRoot, 'partials', 'event_schedule.php'));
    for (const page of ['webseite', 'apartments', 'veranstaltungen']) {
        const pageDir = path.join(renderRoot, page);
        fs.mkdirSync(pageDir);
        fs.writeFileSync(path.join(pageDir, 'data.json'), JSON.stringify({ webseite: [
            { menutitel: 'Hidden marker', titel: 'Hidden marker', active: false, showInMenu: true },
            { menutitel: 'Visible marker', titel: 'Visible title', showInMenu: true, buttonLabel: 'Events link', buttonLink: 'veranstaltungen' }
        ] }));
        const rendered = spawnSync(php, ['-r', 'require $argv[1]; $renderer = new WebsiteRenderer($argv[2]); $renderer->navigation(); $renderer->render();', rendererFile, page], { encoding: 'utf8' });
        assert.equal(rendered.status, 0, rendered.stderr);
        assert(!rendered.stdout.includes('Hidden marker'));
        assert(rendered.stdout.includes('Visible title'));
        assert(rendered.stdout.includes('<h1'));
        assert(rendered.stdout.includes(`href="${page === 'webseite' ? '' : page + '/'}#start"`));
        assert(rendered.stdout.includes('href="veranstaltungen/"'));
    }
    console.log('PASS: public renderer sources, hidden sections, headings, section navigation and event links');
    fs.writeFileSync(path.join(renderRoot, 'veranstaltungen', 'data.json'), JSON.stringify({ webseite: [
        { menutitel: 'Later day', date: '2026-09-25', start: '10:00', end: '12:00', showInMenu: true },
        { menutitel: 'Legacy undated', showInMenu: true },
        { menutitel: 'Afternoon', date: '2026-09-24', start: '13:00', end: '14:00', showInMenu: true },
        { menutitel: 'Morning', date: '2026-09-24', start: '10:00', end: '12:00', showInMenu: true }
    ] }));
    const orderedRender = spawnSync(php, ['-r', 'require $argv[1]; $renderer = new WebsiteRenderer("veranstaltungen"); $renderer->navigation(); $renderer->render();', rendererFile], { encoding: 'utf8' });
    assert.equal(orderedRender.status, 0, orderedRender.stderr);
    for (const marker of ['href="veranstaltungen/#start">Morning', '<h1>Morning</h1>', 'datetime="2026-09-24T10:00"', 'Donnerstag 24. September - 10:00 Uhr</time></p><h1>Morning</h1>']) {
        assert(orderedRender.stdout.includes(marker), marker);
    }
    assert(!orderedRender.stdout.includes('datetime="2026-09-24T12:00"'));
    const titles = ['Morning', 'Afternoon', 'Later day', 'Legacy undated'];
    for (let index = 1; index < titles.length; index++) {
        assert(orderedRender.stdout.indexOf(`>${titles[index - 1]}</h`) < orderedRender.stdout.indexOf(`>${titles[index]}</h`));
    }
    console.log('PASS: public event order by date/start, navigation order and visible dates; undated legacy entries last');
    const hoursContext = {};
    vm.createContext(hoursContext);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'opening-hours.js'), 'utf8'), hoursContext);
    const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
    const relativeDate = offset => {
        const date = new Date(today + 'T12:00:00Z');
        date.setUTCDate(date.getUTCDate() + offset);
        return date.toISOString().slice(0, 10);
    };
    const hoursConfig = {
        week: Array.from({ length: 7 }, () => ({ closed: false, periods: [{ start: '08:00', end: '22:00' }] })),
        exceptions: [{ from: relativeDate(-2), to: relativeDate(2), closed: true, privateEvent: true, periods: [], note: 'Manual closure' }]
    };
    const websiteFile = path.join(renderRoot, 'webseite', 'data.json');
    const eventFile = path.join(renderRoot, 'veranstaltungen', 'data.json');
    fs.writeFileSync(websiteFile, JSON.stringify({ webseite: [{ type: 'opening-hours', openingHours: hoursConfig }] }));
    const originalHours = fs.readFileSync(websiteFile, 'utf8');
    const hourEvents = [
        { date: today, start: '18:00', end: '20:00', titel: 'Evening', showInMenu: false },
        { date: today, start: '09:00', end: '11:00', titel: 'Morning <event>' },
        { date: today, start: '13:00', end: '15:00', menutitel: 'Afternoon' },
        { date: today, start: '11:00', end: '12:00', titel: 'Adjacent' },
        { date: today, start: '12:00', end: '13:00', titel: 'Hidden', active: false },
        { date: relativeDate(1), start: '10:00', end: '12:00', titel: 'Next day' },
        { date: relativeDate(3), start: '10:00', end: '12:00', titel: 'Overrides week' },
        { date: today, start: '21:00', end: '20:00', titel: 'Invalid' },
        { titel: 'Undated' }
    ];
    fs.writeFileSync(eventFile, JSON.stringify({ webseite: hourEvents }));
    const hoursRunner = String.raw`require $argv[1]; $renderer = new WebsiteRenderer("webseite"); ob_start(); $renderer->render(); $html = ob_get_clean(); $document = new DOMDocument(); @$document->loadHTML("<?xml encoding=\"UTF-8\">" . $html); $xpath = new DOMXPath($document); $node = $xpath->query("//*[@data-opening-hours]")->item(0); echo json_encode(["html" => $html, "config" => json_decode($node->getAttribute("data-opening-hours"), true), "schema" => $renderer->restaurantSchema()]);`;
    const renderHours = () => {
        const result = spawnSync(php, ['-r', hoursRunner, rendererFile], { encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr + result.stdout);
        return JSON.parse(result.stdout);
    };
    const renderedHours = renderHours();
    const merged = renderedHours.config;
    const eventException = merged.exceptions.find(entry => entry.from === today);
    assert.deepEqual(eventException.periods, [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '15:00' }, { start: '18:00', end: '20:00' }]);
    assert.equal(eventException.note, 'Morning <event> / Adjacent / Afternoon / Evening');
    assert.equal(eventException.closed, false);
    assert.equal(eventException.privateEvent, false);
    assert(renderedHours.html.includes('Morning &lt;event&gt; / Adjacent / Afternoon / Evening'));
    assert(renderedHours.html.includes('<div>09:00–12:00 Uhr</div>'));
    assert(!renderedHours.html.includes('Hidden'));
    assert(!renderedHours.html.includes('Invalid'));
    const snapshotAt = time => hoursContext.OpeningHours.snapshot(merged, new Date(today + 'T' + time + ':00Z'));
    const inside = snapshotAt('08:00');
    const gap = snapshotAt('10:15');
    const after = snapshotAt('19:00');
    assert(inside.open);
    assert.equal(gap.open, false);
    assert.equal(gap.today.note, eventException.note);
    assert.equal(after.open, false);
    assert.equal(inside.week[1].note, 'Next day');
    assert.equal(inside.week[2].privateEvent, true);
    assert.equal(inside.week[3].note, 'Overrides week');
    assert.equal(inside.week[4].periods[0].start, '08:00');
    assert.equal(inside.week[0].periods.length, 3);
    assert(hoursContext.OpeningHours.validate(merged), 'Editor limit stays at two manual periods');
    const special = renderedHours.schema.specialOpeningHoursSpecification;
    assert.deepEqual(special.filter(entry => entry.validFrom === today).map(entry => [entry.opens, entry.closes]), [['09:00', '12:00'], ['13:00', '15:00'], ['18:00', '20:00']]);
    assert(special.some(entry => entry.validFrom === relativeDate(2) && entry.opens === '00:00'));
    assert.equal(fs.readFileSync(websiteFile, 'utf8'), originalHours);
    assert.deepEqual(JSON.parse(fs.readFileSync(eventFile)).webseite, hourEvents);
    for (const invalidSource of ['{broken', JSON.stringify({ webseite: [] })]) {
        fs.writeFileSync(eventFile, invalidSource);
        assert.deepEqual(renderHours().config, hoursConfig);
    }
    fs.unlinkSync(eventFile);
    assert.deepEqual(renderHours().config, hoursConfig);
    console.log('PASS: event exceptions override manual/week times; PHP HTML, browser status and schema agree; source data unchanged');
} finally {
    fs.rmSync(root, { recursive: true, force: true });
}

async function testEditorIsolation() {
    const elements = {};
    const saved = {};
    const images = [];
    const loads = {};
    function element(id) {
        return elements[id] ??= {
            innerHTML: '', textContent: '', disabled: false, listeners: {},
            querySelectorAll: () => [],
            addEventListener(type, listener) { this.listeners[type] = listener; }
        };
    }
    function Sortable(container, options) { container.sortable = options; }
    Sortable.get = () => ({ destroy() {} });
    const context = {
        window: { Sortable }, Sortable, console, alert() {},
        requestAnimationFrame: callback => callback(),
        openingHoursEscape: value => String(value),
        renderOpeningHoursTime: () => '',
        document: { getElementById: element, addEventListener() {} },
        EditorTabs: { beginLoading(page) {
            loads[page] = (loads[page] || 0) + 1;
            return () => { loads[page]--; };
        } },
        EditorImages: { openImageOverlay(callback, src, library) { images.push(library); } },
        fetch: async (url, options) => {
            let data;
            if (!options?.body) {
                data = { webseite: [{ menutitel: url.split('/')[0], image: '', date: '2026-09-24', start: '10:00', end: '12:00' }] };
            } else if (options.body.startsWith('action=list_')) {
                data = [];
            } else {
                const payload = JSON.parse(options.body);
                saved[payload.action] = payload.data;
                data = { success: true };
            }
            return { ok: true, json: async () => data, text: async () => JSON.stringify(data) };
        }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'editor', 'editor_apartments.js'), 'utf8'), context);
    await Promise.all([context.window.ApartmentsEditor.init(), context.window.VeranstaltungenEditor.init()]);
    for (const [page, label] of [['apartments', 'Apartments'], ['veranstaltungen', 'Veranstaltungen']]) {
        assert.equal(loads[page], 0);
        assert(element(`${page}-editor`).innerHTML.includes(`name="${page}-menu-visibility-0"`));
        await element(`add${label}SectionBtn`).listeners.click();
        const container = element(`${page}-editor`);
        container.listeners.input({ target: {
            matches: () => true, dataset: { field: 'menutitel' }, value: `${label} neu`,
            closest: () => ({ dataset: { index: '1' } })
        } });
        if (page === 'veranstaltungen') {
            assert.equal(container.sortable, undefined);
            assert(!container.innerHTML.includes('class="drag-icon"'));
            assert(container.innerHTML.includes('type="date"'));
            assert(container.innerHTML.indexOf('class="section-details collapsed"') < container.innerHTML.indexOf('class="event-schedule"'));
            assert(container.innerHTML.includes('<details class="hours-period event-period">'));
            assert(container.innerHTML.includes('data-event-done'));
            assert(container.innerHTML.includes('09:00 bis 11:00'));
            await element(`save${label}Btn`).listeners.click();
            assert.equal(saved.save_veranstaltungen, undefined);
            for (const [field, value] of Object.entries({ date: '2026-09-23', start: '10:00', end: '12:00' })) {
                container.listeners.input({ target: {
                    matches: () => true, dataset: { field }, value,
                    closest: () => ({ dataset: { index: '1' } })
                } });
            }
            element('sortVeranstaltungenBtn').listeners.click();
        } else {
            container.sortable.onEnd({ oldIndex: 1, newIndex: 0 });
        }
        await element(`save${label}Btn`).listeners.click();
        assert.equal(saved[`save_${page}`].webseite[0].menutitel, `${label} neu`);
        assert.equal(saved[`save_${page}`].webseite[1].menutitel, page);
        const image = { dataset: { index: '0' },
            closest(selector) { return selector === '.webseiten-section' ? this : null; },
            matches: selector => selector === '.image-thumb'
        };
        container.listeners.click({ target: image });
        assert.equal(images.at(-1), page);
        assert.equal(loads[page], 0);
    }
    assert.equal(saved.save_apartments.webseite[0].menutitel, 'Apartments neu');
    console.log('PASS: isolated editor instances, add/edit/reorder/save and matching image libraries');
}

testEditorIsolation().catch(error => {
    console.error(error);
    process.exitCode = 1;
});