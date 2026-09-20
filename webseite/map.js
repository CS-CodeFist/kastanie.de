(() => {
    const assetBase = new URL('../vendor/', document.currentScript.src);
    const markerURL = new URL('../bilder/kastanie-logo.png', document.currentScript.src).href;
    const location = [53.631393, 12.569870];
    const activeMaps = new Set();
    let libraryPromise;

    function loadLibrary() {
        if (libraryPromise) return libraryPromise;
        const assets = [];
        function loadAsset(path, stylesheet = false) {
            return new Promise((resolve, reject) => {
                const element = document.createElement(stylesheet ? 'link' : 'script');
                if (stylesheet) {
                    element.rel = 'stylesheet';
                    element.href = new URL(path, assetBase).href;
                } else {
                    element.src = new URL(path, assetBase).href;
                }
                assets.push(element);
                const timer = setTimeout(() => failed(), 12000);
                function failed() {
                    clearTimeout(timer);
                    element.remove();
                    reject(new Error('Kartenbibliothek konnte nicht geladen werden.'));
                }
                element.onload = () => { clearTimeout(timer); resolve(); };
                element.onerror = failed;
                document.head.appendChild(element);
            });
        }
        libraryPromise = Promise.all([
            loadAsset('leaflet/leaflet.css', true),
            loadAsset('maplibre/maplibre-gl.css', true),
            loadAsset('leaflet/leaflet.js')
                .then(() => loadAsset('maplibre/maplibre-gl.js'))
                .then(() => loadAsset('maplibre/leaflet-maplibre-gl.js'))
        ]).then(() => {
            if (!window.L?.maplibreGL) throw new Error('Vektorkarten sind nicht verfuegbar.');
            return window.L;
        }).catch(error => {
            assets.forEach(element => element.remove());
            libraryPromise = null;
            throw error;
        });
        return libraryPromise;
    }

    function create() {
        const host = document.createElement('div');
        host.className = 'section-image section-map-placeholder';
        const preview = document.createElement('div');
        preview.className = 'map-preview';
        preview.setAttribute('role', 'img');
        preview.setAttribute('aria-label', 'Kartenansicht der Umgebung von Kastanie Moltzow');
        const attribution = document.createElement('div');
        attribution.className = 'map-preview-attribution';
        attribution.innerHTML = '<a href="https://openfreemap.org/">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        const previewArea = document.createElement('div');
        previewArea.className = 'map-preview-area';
        previewArea.append(preview, attribution);
        const prompt = document.createElement('div');
        prompt.className = 'map-consent';
        const title = document.createElement('strong');
        title.textContent = 'Kastanie Moltzow';
        const address = document.createElement('p');
        address.textContent = 'Warener Strasse 3, 17194 Moltzow';
        const notice = document.createElement('p');
        notice.textContent = 'Beim Laden stimmen Sie der Uebermittlung Ihrer IP-Adresse und Verbindungsdaten an OpenFreeMap zu.';
        const privacy = document.createElement('a');
        privacy.href = 'datenschutz.php#openstreetmap';
        privacy.textContent = 'Datenschutz';
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        const load = document.createElement('button');
        load.type = 'button';
        load.className = 'section-button primary';
        load.textContent = 'Karte laden';
        const actions = document.createElement('div');
        actions.className = 'map-consent-actions';
        actions.append(load);
        prompt.append(title, address, notice, privacy, status, actions);
        const canvas = document.createElement('div');
        canvas.className = 'section-map-canvas';
        canvas.setAttribute('aria-label', 'Karte: Kastanie Moltzow, Warener Strasse 3');
        canvas.hidden = true;
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'map-close';
        close.textContent = '\u00d7';
        close.title = 'Karte schliessen und Freigabe widerrufen';
        close.setAttribute('aria-label', close.title);
        close.hidden = true;
        host.append(previewArea, prompt, canvas, close);
        let map;
        let resizeObserver;
        let themeObserver;
        let tileTimer;
        let attempt = 0;

        function reset(message = '', focus = false) {
            attempt += 1;
            clearTimeout(tileTimer);
            resizeObserver?.disconnect();
            themeObserver?.disconnect();
            try {
                map?.remove();
            } catch (error) {
                canvas.replaceChildren();
            }
            map = null;
            activeMaps.delete(reset);
            canvas.hidden = true;
            close.hidden = true;
            prompt.hidden = false;
            host.classList.remove('map-active');
            status.textContent = message;
            load.disabled = false;
            load.textContent = message ? 'Erneut laden' : 'Karte laden';
            if (focus) load.focus({ preventScroll: true });
        }

        close.addEventListener('click', () => reset('', true));
        load.addEventListener('click', async () => {
            const currentAttempt = ++attempt;
            activeMaps.add(reset);
            load.disabled = true;
            close.hidden = false;
            status.textContent = 'Karte wird geladen ...';
            try {
                const leaflet = await loadLibrary();
                if (attempt !== currentAttempt || !host.isConnected) return;
                status.textContent = '';
                prompt.hidden = true;
                canvas.hidden = false;
                host.classList.add('map-active');
                map = leaflet.map(canvas, {
                    scrollWheelZoom: false,
                    zoomControl: false,
                    zoomAnimation: false,
                    fadeAnimation: false,
                    minZoom: 1,
                    maxZoom: 19,
                    maxBounds: [[-85, -180], [85, 180]],
                    maxBoundsViscosity: 1
                }).setView(location, 10);
                leaflet.control.zoom({ zoomInTitle: 'Vergroessern', zoomOutTitle: 'Verkleinern' }).addTo(map);
                map.attributionControl.setPrefix(false);
                const styleForTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'positron';
                let currentStyle = styleForTheme();
                const styleURL = style => `https://tiles.openfreemap.org/styles/${style}`;
                const startTimer = () => {
                    clearTimeout(tileTimer);
                    tileTimer = setTimeout(() => {
                        if (currentAttempt !== attempt) return;
                        if (document.hidden) {
                            startTimer();
                            return;
                        }
                        reset('Die Karte konnte nicht geladen werden. Bitte versuchen Sie es erneut.', true);
                    }, 20000);
                };
                startTimer();
                const layer = leaflet.maplibreGL({
                    style: styleURL(currentStyle),
                    attributionControl: {
                        customAttribution: '<a href="https://openfreemap.org/">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    }
                }).addTo(map);
                const vectorMap = layer.getMaplibreMap();
                vectorMap.on('idle', () => clearTimeout(tileTimer));
                vectorMap.on('error', () => {
                    queueMicrotask(() => {
                        if (currentAttempt === attempt) reset('Kartenbilder sind gerade nicht verfuegbar. Bitte versuchen Sie es erneut.', true);
                    });
                });
                themeObserver = new MutationObserver(() => {
                    const nextStyle = styleForTheme();
                    if (currentStyle === nextStyle) return;
                    currentStyle = nextStyle;
                    startTimer();
                    vectorMap.setStyle(styleURL(currentStyle), { diff: false });
                });
                themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
                const popup = document.createElement('div');
                popup.textContent = 'Kastanie Moltzow - Warener Strasse 3';
                leaflet.marker(location, {
                    icon: leaflet.icon({
                        iconUrl: markerURL,
                        iconSize: [56, 56],
                        iconAnchor: [28, 28],
                        popupAnchor: [0, -24]
                    }),
                    title: 'Kastanie Moltzow',
                    alt: 'Standort der Kastanie Moltzow'
                }).addTo(map).bindPopup(popup);
                resizeObserver = new ResizeObserver(() => map?.invalidateSize({ pan: false }));
                resizeObserver.observe(canvas);
                close.focus({ preventScroll: true });
            } catch (error) {
                if (currentAttempt === attempt) reset('Die Karte konnte nicht geladen werden. Bitte versuchen Sie es erneut.', true);
            }
        });
        return host;
    }

    window.LocationMap = {
        create,
        disposeAll: () => [...activeMaps].forEach(reset => reset())
    };
})();