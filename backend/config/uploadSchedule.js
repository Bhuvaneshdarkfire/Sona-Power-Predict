// ─── Upload Schedule Configuration ──────────────────────────────
// Defines the allowed model upload windows for the hackathon.
// Each window opens at 12:00 AM IST on the given date and closes at the deadline time.
// Before the first scheduled date, uploads are always open (initial submission period).

const UPLOAD_SCHEDULE = [
    { date: '2026-03-28', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-03-30', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-04-01', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-04-03', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-04-06', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-04-10', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-04-14', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-04-18', deadlineHour: 23, deadlineMinute: 0, label: 'Model Upload Day — Before 11 PM' },
    { date: '2026-04-23', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-04-28', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-05-01', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-05-08', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-05-15', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
    { date: '2026-05-23', deadlineHour: 15, deadlineMinute: 0, label: 'Model Upload Day — Before 3 PM' },
];

// First scheduled upload date — before this date, uploads are always open
const FIRST_UPLOAD_DATE = UPLOAD_SCHEDULE[0].date; // '2026-03-28'

/**
 * Get the current IST time components from a Date object.
 */
function toIST(date) {
    // IST is UTC+5:30
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    return {
        year: ist.getFullYear(),
        month: ist.getMonth() + 1,
        day: ist.getDate(),
        hour: ist.getHours(),
        minute: ist.getMinutes(),
        dateStr: `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`,
    };
}

/**
 * Check if the upload window is currently open.
 * Rules:
 *   1. Before the first scheduled date → always open (initial submission period)
 *   2. On an upload day → open from 12:00 AM until the deadline time
 *   3. Otherwise → closed
 * Returns { open, currentWindow, nextWindow, message, phase }
 */
function isUploadWindowOpen(now = new Date()) {
    const ist = toIST(now);
    const todayStr = ist.dateStr;

    // Phase 1: Before the first scheduled date — always open for initial submissions
    if (todayStr < FIRST_UPLOAD_DATE) {
        return {
            open: true,
            phase: 'initial',
            currentWindow: null,
            nextWindow: UPLOAD_SCHEDULE[0],
            message: `Uploads are open! Submit your initial model before ${formatDate(FIRST_UPLOAD_DATE)}. After that, uploads will only be available on scheduled Model Upload Days.`,
        };
    }

    // Phase 2: On a scheduled upload day — open from 12 AM to deadline
    const todayWindow = UPLOAD_SCHEDULE.find(w => w.date === todayStr);
    if (todayWindow) {
        const deadlineMinutes = todayWindow.deadlineHour * 60 + todayWindow.deadlineMinute;
        const currentMinutes = ist.hour * 60 + ist.minute;

        if (currentMinutes < deadlineMinutes) {
            return {
                open: true,
                phase: 'scheduled',
                currentWindow: todayWindow,
                nextWindow: null,
                message: `Uploads open until ${formatTime(todayWindow.deadlineHour, todayWindow.deadlineMinute)} IST today.`,
            };
        }
    }

    // Phase 3: Closed — find next window
    const nextWindow = UPLOAD_SCHEDULE.find(w => {
        if (w.date > todayStr) return true;
        if (w.date === todayStr) {
            const deadlineMinutes = w.deadlineHour * 60 + w.deadlineMinute;
            const currentMinutes = ist.hour * 60 + ist.minute;
            return currentMinutes < deadlineMinutes;
        }
        return false;
    });

    return {
        open: false,
        phase: 'closed',
        currentWindow: null,
        nextWindow: nextWindow || null,
        message: nextWindow
            ? `Uploads are closed. Next upload window: ${formatDate(nextWindow.date)} (${getDayName(nextWindow.date)}) from 12:00 AM to ${formatTime(nextWindow.deadlineHour, nextWindow.deadlineMinute)} IST.`
            : 'All upload windows have passed.',
    };
}

/**
 * Get the full schedule with computed statuses.
 */
function getSchedule(now = new Date()) {
    const ist = toIST(now);
    const todayStr = ist.dateStr;

    return UPLOAD_SCHEDULE.map(w => {
        let status = 'upcoming';

        if (w.date < todayStr) {
            status = 'past';
        } else if (w.date === todayStr) {
            const deadlineMinutes = w.deadlineHour * 60 + w.deadlineMinute;
            const currentMinutes = ist.hour * 60 + ist.minute;
            status = currentMinutes < deadlineMinutes ? 'active' : 'past';
        }

        return {
            ...w,
            status,
            opensAt: '12:00 AM',
            deadlineFormatted: formatTime(w.deadlineHour, w.deadlineMinute),
            dateFormatted: formatDate(w.date),
            dayName: getDayName(w.date),
        };
    });
}

// ─── Helpers ────────────────────────────────────────────────────

function formatTime(hour, minute) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[m - 1]} ${d}, ${y}`;
}

function getDayName(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
}

module.exports = { UPLOAD_SCHEDULE, isUploadWindowOpen, getSchedule, toIST };
