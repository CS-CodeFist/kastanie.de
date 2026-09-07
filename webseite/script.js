const content = document.getElementById('content');
const navigation = document.getElementById('navigation');
const navigationItems = navigation?.querySelector('.navigation-items');
const contentSource = document.body.dataset.contentSource || 'webseite/data.json';
const sectionButtonLinks = {
    speisekarte: 'speisekarte.html',
    apartments: 'apartments.html',
    email: 'mailto:info@kastanie-moltzow.de'
};
const imagePositions = ['links', 'rechts', 'zentriert'];

function normalizeImagePosition(position) {
    return imagePositions.includes(position) ? position : 'zentriert';
}

function createSlug(value, index) {
    const normalized = String(value || `sektion-${index + 1}`)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return normalized || `sektion-${index + 1}`;
}

function createInstagramFeedSection(section, index) {
    const sectionId = createSlug(section.menutitel || section.titel || 'instagram', index);
    const element = document.createElement('section');
    element.id = sectionId;
    element.className = 'instagram-section instagram-feed-section';
    if (section.theme && section.theme !== 'standard') element.classList.add(`theme-${section.theme}`);

    const inner = document.createElement('div');
    inner.className = 'section-inner';

    if (section.titel) {
        const heading = document.createElement('h2');
        heading.textContent = section.titel;
        inner.appendChild(heading);
    }

    const feed = document.createElement('div');
    feed.className = 'elfsight-app-70a90180-a023-41ff-a2bb-c5f756c83729';
    inner.appendChild(feed);
    element.appendChild(inner);

    return { element, sectionId };
}

function createSection(section, index) {
    if (section.type === 'instagram-feed') return createInstagramFeedSection(section, index);

    const sectionId = index === 0 ? 'start' : createSlug(section.menutitel, index);
    const element = document.createElement('section');
    const position = normalizeImagePosition(section.position);
    const hasImage = Boolean(section.image);

    element.id = sectionId;
    const positionClass = position;
    element.className = `content-section position-${positionClass}`;
    if (section.theme && section.theme !== 'standard') element.classList.add(`theme-${section.theme}`);
    if (!hasImage) element.classList.add('no-image');

    const inner = document.createElement('div');
    inner.className = 'section-inner';

    const copy = document.createElement('div');
    copy.className = 'section-copy';

    const heading = document.createElement('h2');
    heading.textContent = section.titel || section.menutitel || 'Kastanie Moltzow';
    copy.appendChild(heading);

    if (section.untertitel) {
        const subtitle = document.createElement('p');
        subtitle.className = 'section-subtitle';
        subtitle.textContent = section.untertitel;
        copy.appendChild(subtitle);
    }

    if (section.text) {
        const text = document.createElement('p');
        text.className = 'section-text';
        text.textContent = section.text;
        copy.appendChild(text);
    }

    const buttonHref = sectionButtonLinks[section.buttonLink];
    if (section.buttonLabel && buttonHref) {
        const button = document.createElement('a');
        button.className = `section-button ${section.buttonTheme === 'secondary' ? 'secondary' : 'primary'}`;
        button.href = buttonHref;
        button.textContent = section.buttonLabel;
        copy.appendChild(button);
    }

    const image = document.createElement('div');
    image.className = 'section-image';
    if (hasImage) {
        image.style.backgroundImage = `url("${section.image.replace(/"/g, '\\"')}")`;
    }

    inner.appendChild(copy);
    if (hasImage) inner.appendChild(image);
    element.appendChild(inner);
    return { element, sectionId };
}

function loadInstagramFeed() {
    if (document.querySelector('script[data-elfsight-platform]')) return;

    const script = document.createElement('script');
    script.src = 'https://apps.elfsight.com/p/platform.js';
    script.defer = true;
    script.dataset.elfsightPlatform = 'true';
    document.body.appendChild(script);
}

function setupNavigationHighlighting() {
    const links = [...navigationItems.querySelectorAll('a[href^="#"]')];
    const sections = [...content.querySelectorAll('section')].filter((section) =>
        links.some((link) => link.hash.slice(1) === section.id)
    );
    if (sections.length === 0 || links.length === 0) return;

    let lastScrollTime = 0;
    let scrollEnabled = true;
    let navigationTimeout;
    let activeSectionId = null;

    function setActiveLink(sectionId) {
        const hasChanged = activeSectionId !== sectionId;
        activeSectionId = sectionId;

        links.forEach((link) => {
            const isActive = link.hash.slice(1) === sectionId;
            link.classList.toggle('active', isActive);
            if (isActive && hasChanged) {
                link.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }
        });
    }

    function setActiveByScroll() {
        const fromTop = window.scrollY + window.innerHeight;
        let currentSectionId = sections[0].id;

        if (window.scrollY > 1) {
            sections.forEach((section) => {
                if (fromTop >= section.offsetTop) currentSectionId = section.id;
            });
        }

        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) {
            currentSectionId = sections[sections.length - 1].id;
        }

        setActiveLink(currentSectionId);
    }

    function finishNavigation() {
        clearTimeout(navigationTimeout);
        scrollEnabled = true;
    }

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetSection = document.getElementById(link.hash.slice(1));
            if (!targetSection) return;

            event.preventDefault();
            scrollEnabled = false;
            setActiveLink(targetSection.id);
            history.pushState(null, '', link.hash);

            const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
            window.scrollTo({ top: Math.max(0, targetSection.offsetTop - headerHeight), behavior: 'smooth' });
            window.addEventListener('scrollend', finishNavigation, { once: true });
            navigationTimeout = setTimeout(finishNavigation, 1500);
        });
    });

    window.addEventListener('scroll', () => {
        if (!scrollEnabled) return;

        if (window.scrollY <= 1) {
            setActiveLink(sections[0].id);
            return;
        }

        const now = Date.now();
        if (now - lastScrollTime < 100) return;
        lastScrollTime = now;
        setActiveByScroll();
    }, { passive: true });

    setActiveByScroll();
}

function renderWebsite(data) {
    const sections = Array.isArray(data.webseite) ? data.webseite : [];
    content.replaceChildren();
    navigationItems.replaceChildren();

    if (sections.length === 0) {
        content.innerHTML = '<div class="load-error">Es sind noch keine Inhalte angelegt.</div>';
        return;
    }

    sections.forEach((section, index) => {
        const { element, sectionId } = createSection(section, index);
        content.appendChild(element);

        if (!section.menutitel) return;

        const link = document.createElement('a');
        link.href = `#${sectionId}`;
        link.textContent = section.menutitel;
        navigationItems.appendChild(link);
    });

    if (sections.some(section => section.type === 'instagram-feed')) loadInstagramFeed();
    setupNavigationHighlighting();
}

async function loadWebsite() {
    try {
        const response = await fetch(`${contentSource}?timestamp=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        renderWebsite(await response.json());
    } catch (error) {
        console.error('Webseiten-Inhalte konnten nicht geladen werden:', error);
        content.innerHTML = '<div class="load-error">Die Inhalte konnten gerade nicht geladen werden.</div>';
    }
}

loadWebsite();
