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

function setupApartmentCalendar(element) {
    const monthHeading = element.querySelector('[data-calendar-month]');
    const daysGrid = element.querySelector('[data-calendar-days]');
    const status = element.querySelector('[data-calendar-status]');
    const section = element.closest('.content-section');
    const updateCalendarContrast = () => {
        const calendarPanel = element.querySelector('.calendar-panel');
        calendarPanel.classList.remove('has-matching-section-background');
        const calendarBackground = getComputedStyle(calendarPanel).backgroundColor;
        const sectionBackground = section ? getComputedStyle(section).backgroundColor : '';
        calendarPanel.classList.toggle('has-matching-section-background', calendarBackground === sectionBackground);
    };
    const unavailable = new Set();
    let statusMessage = 'Belegungsdaten werden geladen ...';
    let rangeEnd = '';
    const previousButton = element.querySelector('[data-calendar-previous]');
    const nextButton = element.querySelector('[data-calendar-next]');
    element.querySelector('.calendar-legend-item.is-available').hidden = true;
    element.querySelector('.calendar-legend-item.is-unavailable').textContent = 'Belegt / geschlossen';
    const nowParts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit'
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
    let month = new Date(Date.UTC(Number(nowParts.year), Number(nowParts.month) - 1, 1));
    const firstMonth = month.getTime();

    function render() {
        const year = month.getUTCFullYear();
        const monthIndex = month.getUTCMonth();
        monthHeading.textContent = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(month);
        const firstWeekday = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;
        const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
        const cells = [];

        for (let index = 0; index < firstWeekday; index++) {
            const empty = document.createElement('span');
            empty.className = 'calendar-day is-outside-month';
            empty.setAttribute('aria-hidden', 'true');
            cells.push(empty);
        }
        for (let day = 1; day <= dayCount; day++) {
            const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const cell = document.createElement('time');
            cell.className = 'calendar-day';
            cell.dateTime = date;
            cell.textContent = String(day);
            cell.setAttribute('role', 'gridcell');
            if (unavailable.has(date)) cell.classList.add('is-unavailable');
            cell.setAttribute('aria-label', `${day}. ${monthHeading.textContent}: ${unavailable.has(date) ? 'Belegt oder geschlossen' : 'Keine Angabe'}`);
            if (date === today) cell.classList.add('is-today');
            cells.push(cell);
        }
        daysGrid.replaceChildren(...cells);
        status.textContent = statusMessage;
        previousButton.disabled = month.getTime() <= firstMonth;
        const nextMonth = new Date(Date.UTC(year, monthIndex + 1, 1)).toISOString().slice(0, 10);
        nextButton.disabled = !rangeEnd || nextMonth >= rangeEnd;
    }

    previousButton.addEventListener('click', () => {
        month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1));
        render();
    });
    nextButton.addEventListener('click', () => {
        month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
        render();
    });
    new MutationObserver(updateCalendarContrast).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
    updateCalendarContrast();
    render();
    fetch(new URL('apartment_calendar.php', document.baseURI), { cache: 'no-store' })
        .then(async response => {
            if (!response.ok) throw new Error('Calendar unavailable');
            const data = await response.json();
            if (!Array.isArray(data.unavailable) || !Number.isFinite(data.updatedAt)
                || !/^\d{4}-\d{2}-\d{2}$/.test(data.rangeEnd)) {
                throw new Error('Invalid calendar data');
            }
            data.unavailable.forEach(date => unavailable.add(date));
            rangeEnd = data.rangeEnd;
            const updated = new Intl.DateTimeFormat('de-DE', {
                timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit',
                year: 'numeric', hour: '2-digit', minute: '2-digit'
            }).format(new Date(data.updatedAt * 1000));
            statusMessage = `Stand: ${updated}`;
            render();
        })
        .catch(() => {
            unavailable.clear();
            rangeEnd = '';
            statusMessage = 'Belegungsdaten derzeit nicht verfügbar.';
            render();
        });
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
            history.pushState(null, '', link.href);

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

const eventRefreshTimes = [...document.querySelectorAll('[data-event-refresh]')]
    .map(section => Number(section.dataset.eventRefresh) * 1000)
    .filter(Number.isFinite);
if (eventRefreshTimes.length) {
    const nextRefresh = Math.min(...eventRefreshTimes);
    const refreshEvents = () => {
        if (Date.now() >= nextRefresh) window.location.reload();
    };
    setInterval(refreshEvents, 1000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshEvents();
    });
    refreshEvents();
}

document.querySelectorAll('[data-opening-hours]').forEach(setupOpeningHours);
document.querySelectorAll('[data-apartment-calendar]').forEach(setupApartmentCalendar);
document.querySelectorAll('[data-location-map]').forEach(host => LocationMap.enhance(host));
if (openingHoursRefreshers.length) setInterval(refreshOpeningHours, 60000);
loadInstagramFeed();
if (navigationItems) setupNavigationHighlighting();
