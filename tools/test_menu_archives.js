const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');

const php = process.argv[2] || 'php';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kastanie-menu-archives-'));
const handler = path.join(root, 'data_handler.php');
const phpRunner = 'register_shutdown_function(function () { fwrite(STDERR, "STATUS:" . (http_response_code() ?: 200)); }); $_POST = json_decode(stream_get_contents(STDIN), true); require $argv[1];';

function request(payload, expectedStatus = 200) {
    const response = spawnSync(php, ['-r', phpRunner, handler], {
        input: JSON.stringify(payload), encoding: 'utf8'
    });
    assert.equal(response.status, 0, response.stderr || String(response.error));
    assert.equal(Number(response.stderr.match(/STATUS:(\d+)/)?.[1]), expectedStatus, response.stdout + response.stderr);
    return JSON.parse(response.stdout);
}

function save(name, version, create = false, status = 200) {
    const liveFile = path.join(root, 'speisekarte', 'data.json');
    const previousLive = fs.existsSync(liveFile) && fs.statSync(liveFile).isFile() ? fs.readFileSync(liveFile, 'utf8') : null;
    const result = request({ action: 'save_file', filename: name + '.json', create, content: { content: [{ menutitel: version }], filename: 'stale-template.json' } }, status);
    if (status === 200) {
        assert.equal(result.published, true);
        const liveData = JSON.parse(fs.readFileSync(liveFile));
        assert.equal(liveData.content[0].menutitel, version);
        assert.equal(liveData.filename, result.filename);
        assert.equal(Object.keys(liveData)[0], 'filename');
        if (name !== 'data') assert.equal(fs.readFileSync(path.join(root, 'templates', result.filename), 'utf8'), fs.readFileSync(liveFile, 'utf8'));
        if (previousLive !== null) {
            const latestArchive = archives('data').archives[0];
            assert.equal(fs.readFileSync(path.join(root, 'templates', 'archiv', latestArchive), 'utf8'), previousLive);
        }
    } else if (previousLive !== null) {
        assert.equal(fs.readFileSync(liveFile, 'utf8'), previousLive);
    }
    return result;
}

function archives(name, all = true) {
    return request({ action: 'list_archives', template: name, all: all ? '1' : '0' });
}

async function testEditorSelection() {
    const elements = {
        vorlagen: { value: '__current', options: [{ value: '__current' }, { value: '', disabled: true }, { value: 'Speisekarte' }, { value: 'Sommer' }] },
        archivSelect: { innerHTML: '', disabled: false },
        saveTargetSelect: { value: 'data.json', selectedOptions: [{ dataset: {} }] },
        confirmSaveBtn: { disabled: false, textContent: '' }
    };
    const archiveRequests = [];
    const saveRequests = [];
    let fixture;
    let menuDirty = false;
    let activeLoads = 0;
    const context = {
        document: { getElementById: id => elements[id] },
        window: {}, console,
        EditorTabs: { beginLoading(tab) {
            assert.equal(tab, 'speisekarte');
            activeLoads++;
            return () => { activeLoads--; };
        } },
        EditorSPK: {
            markMenuSaved() { menuDirty = false; },
            markMenuDirty() { menuDirty = true; }
        },
        render() {}, alert() {},
        fetch: async (url, options) => {
            if (options) {
                const payload = JSON.parse(options.body);
                saveRequests.push(payload);
                return { ok: true, json: async () => ({ success: true, filename: payload.filename }) };
            }
            return { ok: true, json: async () => fixture };
        }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'editor', 'editor_templates.js'), 'utf8'), context);
    context.loadArchives = async name => archiveRequests.push(name);
    context.loadTemplates = async selected => { elements.vorlagen.value = selected; };
    context.closeSaveOverlay = () => {};
    for (const [filename, expected] of [
        ['Speisekarte.json', 'Speisekarte'], ['sommer.json', 'Sommer'],
        [undefined, '__current'], ['missing.json', '__current'], ['../Speisekarte.json', '__current']
    ]) {
        fixture = { filename, content: [{ menutitel: 'Live content' }] };
        await context.loadSelectedTemplate('__current');
        assert.equal(menuDirty, false);
        assert.equal(activeLoads, 0);
        assert.equal(elements.vorlagen.value, expected);
        assert.equal(archiveRequests.at(-1), expected === '__current' ? 'data' : expected);
        assert.equal(context.window.data.content[0].menutitel, 'Live content');
    }
    fixture = { filename: 'Speisekarte.json', content: [] };
    await context.loadSelectedTemplate('__current');
    await context.confirmSaveJson();
    assert.equal(saveRequests.at(-1).filename, 'Speisekarte.json');
    assert.equal(archiveRequests.at(-1), 'Speisekarte');
    await context.loadSelectedTemplate('Sommer');
    assert.equal(menuDirty, true);
    assert.equal(elements.vorlagen.value, 'Sommer');
    assert.equal(archiveRequests.at(-1), 'Sommer');
    await context.confirmSaveJson();
    assert.equal(menuDirty, false);
    assert.equal(saveRequests.at(-1).filename, 'Sommer.json');
    assert.equal(archiveRequests.at(-1), 'Sommer');
    elements.saveTargetSelect.value = 'Sommer.json';
    await context.confirmSaveJson();
    assert.equal(saveRequests.at(-1).filename, 'Sommer.json');
    assert.equal(context.window.data.filename, 'Sommer.json');
    assert.equal(elements.vorlagen.value, 'Sommer');
    assert.equal(archiveRequests.at(-1), 'Sommer');
    await context.loadSelectedTemplate('Speisekarte');
    assert.equal(menuDirty, true);
    await context.loadSelectedTemplate('__current');
    assert.equal(menuDirty, false);
    console.log('PASS: filename metadata selects matching template and archives; template switches mark dirty, live loads and saves reset dirty state');
}

try {
    fs.copyFileSync(path.join(__dirname, '..', 'data_handler.php'), handler);
    fs.mkdirSync(path.join(root, 'speisekarte'));
    fs.mkdirSync(path.join(root, 'templates', 'archiv'), { recursive: true });
    const archiveDir = path.join(root, 'templates', 'archiv');
    save('Sommer', 'original', true);
    save('Sommer_Spezial', 'special-original', true);
    assert.deepEqual(archives('Sommer').archives, []);
    save('Sommer', 'duplicate', true, 409);
    save('SOMMER', 'duplicate', true, 409);
    save('data', 'reserved', true, 409);
    save('../escape', 'invalid', true, 400);
    save('missing', 'invalid-update', false, 404);
    save('Frühlingskarte', 'unicode', true);
    save('FRÜHLINGSKARTE', 'unicode-duplicate', true, 409);
    save('Sommer_Spezial', 'special-updated');
    const expectedVersions = ['original'];
    for (let version = 1; version <= 23; version++) {
        save('Sommer', String(version));
        if (version < 23) expectedVersions.push(String(version));
    }
    const ownArchives = archives('Sommer').archives;
    assert.equal(ownArchives.length, 23);
    assert.equal(new Set(ownArchives).size, 23);
    assert(ownArchives.every(name => /^Sommer_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_\d+\.json$/.test(name)));
    const actualVersions = ownArchives.map(name => JSON.parse(fs.readFileSync(path.join(archiveDir, name))).content[0].menutitel);
    assert.deepEqual(actualVersions, expectedVersions.reverse());
    assert.equal(archives('Sommer_Spezial').archives.length, 1);
    const limited = archives('Sommer', false);
    assert.equal(limited.archives.length, 20);
    assert.equal(limited.hasMore, true);
    assert.equal(archives('Sommer').hasMore, false);
    fs.writeFileSync(path.join(archiveDir, 'Sommer_2020-01-01_12-00-00.json'), '{}');
    fs.writeFileSync(path.join(archiveDir, 'Sommer_2020-01-01_12-00-00_extra.json'), '{}');
    assert.equal(archives('Sommer').archives.at(-1), 'Sommer_2020-01-01_12-00-00.json');
    assert.equal(archives('Sommer').archives.length, 24);
    assert.deepEqual(archives('Som*').archives, []);
    const previousLiveArchives = archives('data').archives.length;
    save('data', 'published');
    save('data', 'published-updated');
    assert.equal(archives('data').archives.length, previousLiveArchives + 2);
    assert.equal(archives('Sommer').archives.length, 24);
    const updated = save('sOmMeR', 'canonical-update');
    assert.equal(updated.filename, 'Sommer.json');
    assert.equal(archives('Sommer').archives.length, 25);
    const liveFile = path.join(root, 'speisekarte', 'data.json');
    const previousTemplate = fs.readFileSync(path.join(root, 'templates', 'Sommer.json'), 'utf8');
    fs.renameSync(liveFile, liveFile + '.backup');
    fs.mkdirSync(liveFile);
    save('Sommer', 'must-not-replace', false, 500);
    assert.equal(fs.readFileSync(path.join(root, 'templates', 'Sommer.json'), 'utf8'), previousTemplate);
    save('New failure', 'must-not-create', true, 500);
    assert.equal(fs.existsSync(path.join(root, 'templates', 'New failure.json')), false);
    assert.equal(fs.readdirSync(path.join(root, 'templates')).some(name => name.startsWith('.save-')), false);
    fs.rmdirSync(liveFile);
    fs.renameSync(liveFile + '.backup', liveFile);
    const handlerSource = fs.readFileSync(handler, 'utf8');
    const commitCall = "if (!rename($file['temp'], $file['target']))";
    assert(handlerSource.includes(commitCall));
    fs.writeFileSync(handler, handlerSource.replace(commitCall, "if ($name === 'data' || !rename($file['temp'], $file['target']))"));
    save('Sommer', 'failed-publication', false, 500);
    assert.equal(fs.readFileSync(path.join(root, 'templates', 'Sommer.json'), 'utf8'), previousTemplate);
    save('New rollback', 'failed-creation', true, 500);
    assert.equal(fs.existsSync(path.join(root, 'templates', 'New rollback.json')), false);
    for (const directory of ['templates', 'speisekarte']) {
        assert.equal(fs.readdirSync(path.join(root, directory)).some(name => name.startsWith('.save-')), false);
    }
    fs.writeFileSync(handler, handlerSource);
    save('Sommer', 'after-rollback');
    console.log('PASS: separate archives, unique timestamps, duplicate names, legacy archives, automatic publication, live backups, preparation failures and rollback');
} finally {
    fs.rmSync(root, { recursive: true, force: true });
}

testEditorSelection().catch(error => {
    console.error(error);
    process.exitCode = 1;
});