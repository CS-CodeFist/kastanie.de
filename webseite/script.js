const content = document.getElementById('content');
const navigation = document.getElementById('navigation');
const navigationItems = navigation?.querySelector('.navigation-items');
const contentSource = document.body.dataset.contentSource || 'webseite/data.json';
const sectionButtonLinks = {
    speisekarte: 'speisekarte',
    apartments: 'apartments',
    email: 'mailto:info@kastanie-moltzow.de'
};
const imagePositions = ['links', 'rechts', 'zentriert'];
const showInstagramCommentPreview = true;
const instagramCommentPreview = [
    { username: 'kastanie.gast', text: 'Das sieht wunderbar aus.' },
    { username: 'moltzow.entdeckt', text: 'Wir kommen bald wieder vorbei.' }
];

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

    posts.forEach((post) => {
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

        if (Array.isArray(post.comments) && post.comments.length > 0) {
            const commentList = document.createElement('div');
            commentList.className = 'instagram-comments';

            post.comments.forEach((comment) => {
                if (!comment?.text) return;

                const item = document.createElement('blockquote');
                item.className = 'instagram-comment';

                if (comment.username) {
                    const author = document.createElement('cite');
                    author.textContent = `@${comment.username}`;
                    item.appendChild(author);
                }

                item.append(comment.text);
                commentList.appendChild(item);
            });

            if (commentList.childElementCount > 0) {
                media.appendChild(commentList);

                const commentToggle = document.createElement('button');
                commentToggle.className = 'instagram-comment-toggle';
                commentToggle.type = 'button';
                commentToggle.setAttribute('aria-label', 'Kommentare anzeigen');
                commentToggle.setAttribute('aria-expanded', 'false');
                commentToggle.title = 'Kommentare anzeigen';

                const commentToggleIcon = document.createElement('span');
                commentToggleIcon.className = 'instagram-engagement-icon is-comment';
                commentToggleIcon.setAttribute('aria-hidden', 'true');
                commentToggle.appendChild(commentToggleIcon);

                commentToggle.addEventListener('click', () => {
                    const isOpen = media.classList.toggle('is-comment-open');
                    commentToggle.setAttribute('aria-expanded', String(isOpen));
                    commentToggle.setAttribute('aria-label', isOpen ? 'Kommentare ausblenden' : 'Kommentare anzeigen');
                    commentToggle.title = isOpen ? 'Kommentare ausblenden' : 'Kommentare anzeigen';
                });
                media.appendChild(commentToggle);
            }
        }

        const title = document.createElement('h3');
        title.className = 'instagram-post-title';
        title.textContent = post.caption || 'Instagram-Beitrag';

        const details = document.createElement('div');
        details.className = 'instagram-post-details';

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
        const posts = Array.isArray(payload.data) ? payload.data : [];
        const postsWithPreviewComments = showInstagramCommentPreview
            ? posts.map((post) => (Array.isArray(post.comments) && post.comments.length > 0
                ? post
                : { ...post, comments: instagramCommentPreview }))
            : posts;
        feeds.forEach((feed) => renderInstagramPosts(feed, postsWithPreviewComments));
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
