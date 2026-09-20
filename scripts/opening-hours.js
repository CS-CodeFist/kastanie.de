(function (root) {
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const emptyDay = () => ({ closed: true, privateEvent: false, restDay: false, periods: [{ start: '', end: '' }, { start: '', end: '' }] });
    const defaults = () => ({ week: days.map(emptyDay), exceptions: [] });
    const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const validDate = value => {
        if (typeof value !== 'string' || !datePattern.test(value)) return false;
        const date = new Date(value + 'T12:00:00Z');
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };
    const shiftDate = (value, offset) => {
        const date = new Date(value + 'T12:00:00Z');
        date.setUTCDate(date.getUTCDate() + offset);
        return date.toISOString().slice(0, 10);
    };
    function validate(config) {
        if (!config || !Array.isArray(config.week) || config.week.length !== 7 || !Array.isArray(config.exceptions)) {
            return 'Bitte die Wochenzeiten vollständig anlegen.';
        }
        for (const [index, day] of [...config.week, ...config.exceptions].entries()) {
            const label = index < 7 ? days[index] : `Ausnahme ${index - 6}`;
            if (!day || typeof day.closed !== 'boolean') return `${label}: Ungültiger Ruhetag.`;
            if (day.privateEvent !== undefined && (typeof day.privateEvent !== 'boolean' || (day.privateEvent && !day.closed))) {
                return `${label}: Eine geschlossene Gesellschaft muss für den öffentlichen Betrieb geschlossen sein.`;
            }
            if (day.restDay !== undefined && (typeof day.restDay !== 'boolean' || (day.restDay && (!day.closed || day.privateEvent)))) {
                return `${label}: Ein Ruhetag muss geschlossen sein und darf keine geschlossene Gesellschaft sein.`;
            }
            if (index >= 7 && (!validDate(day.from) || !validDate(day.to) || day.to < day.from)) {
                return `${label}: Bitte einen gültigen Zeitraum wählen.`;
            }
            if (day.closed) continue;
            if (!Array.isArray(day.periods)) return `${label}: Öffnungszeit fehlt.`;
            if (day.periods.some(period => !period || typeof period.start !== 'string' || typeof period.end !== 'string')) {
                return `${label}: Bitte gültige Zeitfenster angeben.`;
            }
            const periods = day.periods.filter(period => period.start || period.end);
            if (!periods.length || periods.length > 2) return `${label}: Bitte ein oder zwei Zeitfenster angeben.`;
            let previousEnd = -1;
            for (const period of periods) {
                if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(period.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(period.end)) {
                    return `${label}: Beginn und Ende bitte vollständig angeben.`;
                }
                const start = minutes(period.start);
                const end = minutes(period.end);
                if (end <= start) return `${label}: Das Ende muss nach dem Beginn am selben Tag liegen.`;
                if (start < previousEnd) return `${label}: Zeitfenster müssen aufsteigend sein und dürfen sich nicht überschneiden.`;
                previousEnd = end;
            }
        }
        const exceptions = [...config.exceptions].sort((first, second) => first.from.localeCompare(second.from));
        for (let index = 1; index < exceptions.length; index++) {
            if (exceptions[index].from <= exceptions[index - 1].to) return 'Die Zeiträume der Ausnahmen dürfen sich nicht überschneiden.';
        }
        return null;
    }
    function dayFor(config, date) {
        const weekday = (new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7;
        const exception = config.exceptions.find(entry => entry.from <= date && entry.to >= date);
        const day = exception || config.week[weekday];
        return { date, weekday, exception: Boolean(exception), note: exception?.note || '', closed: day.closed, privateEvent: day.privateEvent === true, restDay: day.restDay === true,
            periods: day.closed ? [] : day.periods.filter(period => period.start && period.end) };
    }
    const formatPeriods = day => day.privateEvent ? 'Geschlossene Gesellschaft' : day.restDay ? 'Ruhetag' : day.closed ? 'Geschlossen' : day.periods.map(period => `${period.start}–${period.end}`).join(' / ') + ' Uhr';
    function snapshot(config, now = new Date()) {
        if (validate(config)) return null;
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }).formatToParts(now).map(part => [part.type, part.value]));
        const date = `${parts.year}-${parts.month}-${parts.day}`;
        const currentMinute = Number(parts.hour) * 60 + Number(parts.minute);
        const week = Array.from({ length: 7 }, (_, index) => dayFor(config, shiftDate(date, index)));
        const today = week[0];
        const active = today.periods.find(period => minutes(period.start) <= currentMinute && currentMinute < minutes(period.end));
        const upcoming = today.periods.find(period => minutes(period.start) > currentMinute);
        let status = today.privateEvent ? 'Geschlossene Gesellschaft' : today.restDay ? 'Heute Ruhetag' : today.closed ? 'Heute geschlossen' : 'Zurzeit geschlossen';
        if (active) status = minutes(active.end) - currentMinute <= 30 ? 'Schließt bald' : 'Jetzt geöffnet';
        let detail = active ? `Bis ${active.end} Uhr geöffnet` : upcoming ? `Heute ab ${upcoming.start} Uhr` : '';
        if (!detail) {
            for (let offset = 1; offset <= 366; offset++) {
                const next = dayFor(config, shiftDate(date, offset));
                if (!next.closed && next.periods.length) {
                    const start = next.periods[0].start;
                    detail = `Wieder geöffnet ${days[next.weekday]} ab ${Number(start.slice(0, 2))}:${start.slice(3)} Uhr`;
                    break;
                }
            }
        }
        return { status, detail, open: Boolean(active), today, week };
    }
    root.OpeningHours = { days, defaults, emptyDay, validate, snapshot, formatPeriods };
})(globalThis);