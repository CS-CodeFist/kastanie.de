function initDarkModeToggle() {
    const toggleButton = document.getElementById('darkModeToggle');
    if (!toggleButton) return;

    let savedMode;
    try {
        savedMode = localStorage.getItem('darkMode');
    } catch (error) {}
    let hasManualMode = savedMode === 'dark' || savedMode === 'light';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentMode = hasManualMode ? savedMode : (systemPrefersDark ? 'dark' : 'light');

    updateDarkMode(currentMode);
    toggleButton.dataset.mode = currentMode;

    toggleButton.addEventListener('click', () => {
        currentMode = currentMode === 'dark' ? 'light' : 'dark';
        hasManualMode = true;
        updateDarkMode(currentMode);
        toggleButton.dataset.mode = currentMode;
        try {
            localStorage.setItem('darkMode', currentMode);
        } catch (error) {}
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (hasManualMode) return;
        currentMode = event.matches ? 'dark' : 'light';
        updateDarkMode(currentMode);
        toggleButton.dataset.mode = currentMode;
    });
}

function updateDarkMode(mode) {
    document.documentElement.dataset.theme = mode;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
        themeColor.content = getComputedStyle(document.documentElement).getPropertyValue('--cream').trim();
    }
}

function makeBrandWordmarkResponsive(logo) {
    const groups = [...logo.children].filter(element => element.localName === 'g');
    if (groups.length !== 2) return;
    const originalViewBox = logo.getAttribute('viewBox');
    const wrappers = groups.map(group => {
        const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.replaceWith(wrapper);
        wrapper.appendChild(group);
        return wrapper;
    });
    const mobileLayout = window.matchMedia('(max-width: 760px)');
    const updateLayout = () => {
        logo.setAttribute('viewBox', mobileLayout.matches ? '0 0 690 140' : originalViewBox);
        wrappers[0].setAttribute('transform', mobileLayout.matches ? 'translate(-150 8)' : 'translate(0 0)');
        wrappers[1].setAttribute('transform', mobileLayout.matches ? 'translate(180 -104)' : 'translate(0 0)');
    };
    logo.classList.add('brand-logo-responsive');
    mobileLayout.addEventListener('change', updateLayout);
    updateLayout();
}

async function initBrandWordmark() {
    const inlineLogo = document.querySelector('.brand-wordmark > svg');
    if (inlineLogo) {
        makeBrandWordmarkResponsive(inlineLogo);
        return;
    }
    const image = document.querySelector('.brand-wordmark img[data-inline-svg]');
    if (!image) return;

    try {
        const response = await fetch(image.src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const logoDocument = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
        const logo = logoDocument.documentElement;
        if (logoDocument.querySelector('parsererror') || logo.localName !== 'svg') {
            throw new Error('Ungültiges Logo-SVG');
        }
        logo.setAttribute('aria-hidden', 'true');
        logo.setAttribute('focusable', 'false');
        logo.querySelectorAll('path, rect').forEach(shape => {
            if (!shape.style.fill.startsWith('url(')) {
                shape.style.fill = 'currentColor';
            }
        });
        const inlineLogo = document.importNode(logo, true);
        makeBrandWordmarkResponsive(inlineLogo);
        image.replaceWith(inlineLogo);
    } catch (error) {
        console.error('Logo-Farbanpassung fehlgeschlagen:', error);
    }
}

document.addEventListener('DOMContentLoaded', initDarkModeToggle);
document.addEventListener('DOMContentLoaded', initBrandWordmark);
