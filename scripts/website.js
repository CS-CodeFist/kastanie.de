const content = document.getElementById('content');
const navigation = document.getElementById('navigation');
const navigationItems = navigation?.querySelector('.navigation-items');
const showInstagramCommentPreview = true;
const instagramCommentPreview = [
    { username: 'kastanie.gast', text: 'Das sieht wunderbar aus.' },
    { username: 'moltzow.entdeckt', text: 'Wir kommen bald wieder vorbei.' }
];

let openingHoursRefreshers = [];

function refreshOpeningHours() {
    openingHoursRefreshers.forEach(refresh => refresh());
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshOpeningHours();
});

function setupOpeningHours(element) {
    const config = JSON.parse(element.dataset.openingHours);
    const status = element.querySelector('.hours-status');
    const detail = element.querySelector('.hours-detail');
    const note = element.querySelector('.hours-note');
    const week = element.querySelector('.hours-week');
    const refresh = () => {
        const state = OpeningHours.snapshot(config);
        if (!state) {
            status.textContent = 'Öffnungszeiten derzeit nicht verfügbar';
            detail.textContent = '';
            note.textContent = '';
            week.replaceChildren();
            return;
        }
        status.textContent = state.status;
        status.dataset.open = String(state.open);
        detail.textContent = state.detail;
        note.textContent = state.today.note;
        week.replaceChildren(...state.week.map((day, dayIndex) => {
            const row = document.createElement('div');
            row.className = `hours-day${dayIndex === 0 ? ' is-today' : ''}`;
            const label = document.createElement('dt');
            const name = document.createElement('span');
            name.textContent = dayIndex === 0 ? 'Heute' : OpeningHours.days[day.weekday];
            const date = document.createElement('time');
            date.dateTime = day.date;
            date.textContent = new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })
                .format(new Date(day.date + 'T12:00:00Z'));
            label.append(name, date);
            const hours = document.createElement('dd');
            if (day.closed || day.privateEvent) {
                hours.textContent = OpeningHours.formatPeriods(day);
            } else {
                day.periods.forEach(period => {
                    const timeSlot = document.createElement('div');
                    timeSlot.textContent = OpeningHours.formatPeriods({ ...day, periods: [period] });
                    hours.appendChild(timeSlot);
                });
            }
            if (day.note) {
                const exceptionNote = document.createElement('small');
                exceptionNote.textContent = day.note;
                hours.appendChild(exceptionNote);
            }
            row.append(label, hours);
            return row;
        }));
    };
    refresh();
    openingHoursRefreshers.push(refresh);
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
    feeds.forEach(feed => {
        feed.innerHTML = '<div class="instagram-feed-loader" role="status"><span class="instagram-feed-spinner" aria-hidden="true"></span><span>Instagram-Beitraege werden geladen ...</span></div>';
    });

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
    const links = [...navigationItems.querySelectorAll('a[data-section-link]')];
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

document.querySelectorAll('[data-opening-hours]').forEach(setupOpeningHours);
document.querySelectorAll('[data-location-map]').forEach(host => LocationMap.enhance(host));
if (openingHoursRefreshers.length) setInterval(refreshOpeningHours, 60000);
loadInstagramFeed();
if (navigationItems) setupNavigationHighlighting();
