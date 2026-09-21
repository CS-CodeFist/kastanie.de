(() => {
    const assetBase = new URL('../vendor/', document.currentScript.src);
    const darkStyleURL = new URL('map-dark.json?v=20260920-brown-land', document.currentScript.src).href;
    const lightStyleURL = new URL('map-light.json?v=20260921-coffee-land', document.currentScript.src).href;
    const markerURL = new URL('../bilder/kastanie-logo.png', document.currentScript.src).href;
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

    const initialized = new WeakSet();

    function enhance(host) {
        if (initialized.has(host)) return host;
        initialized.add(host);
        const location = [Number(host.dataset.latitude), Number(host.dataset.longitude)];
        const prompt = host.querySelector('.map-consent');
        const status = prompt.querySelector('[role="status"]');
        const load = prompt.querySelector('button');
        const canvas = host.querySelector('.section-map-canvas');
        const close = host.querySelector('.map-close');
        load.disabled = false;
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
                const styleForTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
                let currentStyle = styleForTheme();
                const styleURL = style => style === 'dark' ? darkStyleURL : lightStyleURL;
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
        enhance
    };
})();