import { format } from "date-fns";
import { id } from "date-fns/locale";

export function combineDateAndTimeToSQL(date, time) {
    const [hours, minutes] = time.split(":");
    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));
    date.setSeconds(0);

    // Format ke lokal, bukan UTC
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = "00";

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function formatTanggalIndo(dateString) {
    try {
        const parsedDate = new Date(dateString);
        return format(parsedDate, "d MMMM yyyy", { locale: id });
    } catch (e) {
        return "Tanggal tidak valid";
    }
}

export function getJamMenit(datetimeString) {
    const date = new Date(datetimeString);
    const jam = String(date.getHours()).padStart(2, "0");
    const menit = String(date.getMinutes()).padStart(2, "0");
    return `${jam}:${menit}`;
}

export function getDayName(dateTimeString, locale = "id-ID") {
    const date = new Date(dateTimeString.replace(" ", "T"));
    return date.toLocaleDateString(locale, { weekday: "long" });
}

export function formatToWIB(date) {
    if (!date) return null;

    return new Date(date).toLocaleString("sv-SE", {
        timeZone: "Asia/Jakarta",
        hour12: false,
    });
}

/**
 * OPTIMIZED: Format date with day name in Indonesian
 * Example: "Senin, 16 Oktober 2025"
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date with day name
 */
export function formatDateWithDay(dateString) {
    try {
        const date = new Date(dateString.replace(" ", "T"));
        return format(date, "EEEE, d MMMM yyyy", { locale: id });
    } catch (e) {
        return "Tanggal tidak valid";
    }
}

/**
 * OPTIMIZED: Format date with short day name in Indonesian
 * Example: "Sen, 16 Okt 2025"
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date with short day name
 */
export function formatDateWithShortDay(dateString) {
    try {
        const date = new Date(dateString.replace(" ", "T"));
        return format(date, "EEE, d MMM yyyy", { locale: id });
    } catch (e) {
        return "Tanggal tidak valid";
    }
}

/**
 * OPTIMIZED: Format full datetime with day name
 * Example: "Senin, 16 Oktober 2025 pukul 14:30"
 * @param {string} datetimeString - Datetime string to format
 * @returns {string} Formatted datetime with day name
 */
export function formatFullDateTime(datetimeString) {
    try {
        const date = new Date(datetimeString.replace(" ", "T"));
        return format(date, "EEEE, d MMMM yyyy 'pukul' HH:mm", { locale: id });
    } catch (e) {
        return "Tanggal tidak valid";
    }
}

/**
 * OPTIMIZED: Format compact datetime for mobile
 * Example: "16 Okt 2025, 14:30"
 * @param {string} datetimeString - Datetime string to format
 * @returns {string} Compact formatted datetime
 */
export function formatCompactDateTime(datetimeString) {
    try {
        const date = new Date(datetimeString.replace(" ", "T"));
        return format(date, "d MMM yyyy, HH:mm", { locale: id });
    } catch (e) {
        return "Tanggal tidak valid";
    }
}

/**
 * OPTIMIZED: Get relative time from now (e.g., "2 jam lagi", "3 hari yang lalu")
 * @param {string} datetimeString - Datetime string to calculate from
 * @returns {string} Relative time description
 */
export function getRelativeTime(datetimeString) {
    try {
        const date = new Date(datetimeString.replace(" ", "T"));
        const now = new Date();
        const diffMs = date - now;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (Math.abs(diffMins) < 1) {
            return diffSecs > 0 ? "beberapa detik lagi" : "baru saja";
        }
        if (Math.abs(diffHours) < 1) {
            const mins = Math.abs(diffMins);
            return diffMins > 0 ? `${mins} menit lagi` : `${mins} menit yang lalu`;
        }
        if (Math.abs(diffDays) < 1) {
            const hours = Math.abs(diffHours);
            return diffHours > 0 ? `${hours} jam lagi` : `${hours} jam yang lalu`;
        }

        const days = Math.abs(diffDays);
        return diffDays > 0 ? `${days} hari lagi` : `${days} hari yang lalu`;
    } catch (e) {
        return "Waktu tidak valid";
    }
}
