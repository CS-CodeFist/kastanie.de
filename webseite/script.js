const content = document.getElementById('content');
const navigation = document.getElementById('navigation');
const navigationItems = navigation?.querySelector('.navigation-items');
const contentSource = document.body.dataset.contentSource || 'webseite/data.json';
const sectionButtonLinks = {
    speisekarte: 'speisekarte.html',
    apartments: 'apartments.html',
    email: 'mailto:info@kastanie-moltzow.de'
};
const instagramDemoComments = [
    'Wunderschöne Stimmung. Da bekommt man direkt Lust auf einen gemütlichen Abend bei euch. Wir waren vor einiger Zeit mit Freunden in der Kastanie und erinnern uns noch immer an die entspannte Atmosphäre, die freundliche Begrüßung und das leckere Essen. Besonders schön finden wir, dass man hier nicht das Gefühl hat, schnell wieder weiterziehen zu müssen. Man kann ankommen, sich unterhalten und den Abend einfach genießen. Beim nächsten Ausflug in die Gegend möchten wir unbedingt wieder vorbeischauen und noch mehr von der Karte probieren. Die ländliche Umgebung macht den Besuch zusätzlich besonders angenehm. Nach einem Spaziergang ist es schön, einen Ort zu haben, an dem man zur Ruhe kommt und sich willkommen fühlt. Wir erzählen inzwischen auch anderen gern von euch und wünschen euch weiterhin viele solche gelungenen Abende.',
    'Das sieht richtig einladend aus. Wir freuen uns schon auf unseren nächsten Besuch in Moltzow! Beim letzten Mal haben wir lange zusammengesessen und die gemütliche Stimmung sehr genossen. Es ist genau die Art von Ort, die man gern weiterempfiehlt: unkompliziert, herzlich und mit Liebe zum Detail. Auch unsere Freunde waren begeistert und haben direkt gefragt, wann wir wieder einen gemeinsamen Abend planen. Vielleicht klappt es ja schon bald, denn solche kleinen Auszeiten sollte man sich viel öfter gönnen. Besonders in Erinnerung geblieben sind uns die vielen netten Gespräche und die entspannte Atmosphäre im Raum. Man merkt, dass hier mit Freude gearbeitet wird. Vielen Dank für die Gastfreundschaft und bis hoffentlich ganz bald. Für uns gehört genau diese Mischung aus gutem Essen, Zeit miteinander und einem angenehmen Ambiente zu einem gelungenen Ausflug. Deshalb kommen wir sehr gern wieder und bringen beim nächsten Mal vielleicht noch weitere Freunde mit.',
    'Ein toller Eindruck aus der Kastanie. Die Atmosphäre und die kleinen Details gefallen uns besonders gut. Auf den Bildern wirkt alles so ruhig und einladend, dass man fast das Gefühl hat, schon am Tisch zu sitzen. Wir mögen besonders Orte, an denen gutes Essen, freundlicher Service und eine angenehme Umgebung zusammenkommen. Für einen entspannten Abend zu zweit oder mit der Familie scheint das genau richtig zu sein. Danke für den schönen Einblick, wir behalten die Kastanie für unseren nächsten Besuch in Mecklenburg auf jeden Fall im Kopf. Gerade für Gäste von außerhalb ist es schön, eine so persönliche Empfehlung zu entdecken. Wir planen schon die nächste Tour und werden die Kastanie dann fest einplanen. Macht weiter so, das Konzept wirkt wirklich stimmig. Solche Orte machen einen Aufenthalt in der Region besonders und geben einem das Gefühl, wirklich willkommen zu sein. Wir freuen uns darauf, beim nächsten Besuch noch mehr Zeit bei euch zu verbringen.'
];
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
    feed.className = 'instagram-feed';
    feed.setAttribute('aria-live', 'polite');
    feed.innerHTML = '<div class="instagram-feed-loader" role="status"><span class="instagram-feed-spinner" aria-hidden="true"></span><span>Instagram-Beitraege werden geladen ...</span></div>';
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

function formatInstagramDate(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long' }).format(date);
}

function formatInstagramCount(count) {
    return new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 1 }).format(count || 0);
}

function renderInstagramPosts(feed, posts) {
    feed.replaceChildren();

    if (posts.length === 0) {
        const status = document.createElement('p');
        status.className = 'instagram-feed-status';
        status.textContent = 'Instagram-Beitraege sind gerade nicht verfuegbar.';
        feed.appendChild(status);
        return;
    }

    posts.forEach((post, index) => {
        const card = document.createElement('article');
        card.className = 'instagram-post-card';

        const link = document.createElement('a');
        link.className = 'instagram-post-link';
        link.href = post.permalink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Beitrag auf Instagram oeffnen');

        const image = document.createElement('img');
        image.src = post.media_type === 'VIDEO' ? post.thumbnail_url || post.media_url : post.media_url;
        image.alt = post.caption ? post.caption.slice(0, 140) : 'Instagram-Beitrag von Kastanie Moltzow';
        image.loading = 'lazy';
        link.appendChild(image);

        const media = document.createElement('div');
        media.className = 'instagram-post';
        media.appendChild(link);

        const demoComment = document.createElement('p');
        demoComment.className = 'instagram-demo-comment';
        demoComment.textContent = instagramDemoComments[index % instagramDemoComments.length];
        media.appendChild(demoComment);

        const commentToggle = document.createElement('button');
        commentToggle.className = 'instagram-comment-toggle';
        commentToggle.type = 'button';
        commentToggle.setAttribute('aria-label', 'Kommentar anzeigen');
        commentToggle.setAttribute('aria-expanded', 'false');
        commentToggle.title = 'Kommentar anzeigen';
        const commentToggleIcon = document.createElement('span');
        commentToggleIcon.className = 'instagram-engagement-icon is-comment';
        commentToggleIcon.setAttribute('aria-hidden', 'true');
        commentToggle.appendChild(commentToggleIcon);
        commentToggle.addEventListener('click', () => {
            const isOpen = media.classList.toggle('is-comment-open');
            commentToggle.setAttribute('aria-expanded', String(isOpen));
            commentToggle.setAttribute('aria-label', isOpen ? 'Kommentar ausblenden' : 'Kommentar anzeigen');
            commentToggle.title = isOpen ? 'Kommentar ausblenden' : 'Kommentar anzeigen';
        });
        media.appendChild(commentToggle);

        const title = document.createElement('h3');
        title.className = 'instagram-post-title';
        title.textContent = post.caption || 'Instagram-Beitrag';

        const details = document.createElement('div');
        details.className = 'instagram-post-details';

        if (post.author_comment?.text) {
            const authorComment = document.createElement('blockquote');
            authorComment.className = 'instagram-author-comment';
            authorComment.textContent = post.author_comment.text;
            details.appendChild(authorComment);
        }

        const metadata = document.createElement('div');
        metadata.className = 'instagram-post-meta';

        const date = document.createElement('time');
        date.dateTime = post.timestamp || '';
        date.textContent = formatInstagramDate(post.timestamp);

        const engagement = document.createElement('div');
        engagement.className = 'instagram-engagement';

        const likes = document.createElement('span');
        likes.className = 'instagram-engagement-item';
        likes.setAttribute('aria-label', `${formatInstagramCount(post.like_count)} Likes`);
        const likeIcon = document.createElement('span');
        likeIcon.className = 'instagram-engagement-icon is-heart';
        likeIcon.setAttribute('aria-hidden', 'true');
        likes.appendChild(likeIcon);
        likes.append(` ${formatInstagramCount(post.like_count)}`);

        const comments = document.createElement('span');
        comments.className = 'instagram-engagement-item';
        comments.setAttribute('aria-label', `${formatInstagramCount(post.comments_count)} Kommentare`);
        const commentIcon = document.createElement('span');
        commentIcon.className = 'instagram-engagement-icon is-comment';
        commentIcon.setAttribute('aria-hidden', 'true');
        comments.appendChild(commentIcon);
        comments.append(` ${formatInstagramCount(post.comments_count)}`);

        engagement.append(likes, comments);
        metadata.append(date, engagement);
        details.appendChild(metadata);

        card.append(title, media, details);
        feed.appendChild(card);
    });
}

async function loadInstagramFeed() {
    const feeds = [...document.querySelectorAll('.instagram-feed')];
    if (feeds.length === 0) return;

    try {
        const response = await fetch('instagram_feed.php?limit=3');
        const payload = response.ok ? await response.json() : { data: [] };
        feeds.forEach((feed) => renderInstagramPosts(feed, Array.isArray(payload.data) ? payload.data : []));
    } catch (error) {
        console.error('Instagram-Beitraege konnten nicht geladen werden:', error);
        feeds.forEach((feed) => renderInstagramPosts(feed, []));
    }
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
