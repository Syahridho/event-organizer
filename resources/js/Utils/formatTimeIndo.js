/**
 * Format timestamp to Indonesian time format
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted Indonesian time string
 */
export function formatTimeIndo(timestamp) {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Less than 1 minute
    if (diffInSeconds < 60) {
        return "baru saja";
    }

    // Less than 1 hour
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} menit yang lalu`;
    }

    // Less than 1 day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} jam yang lalu`;
    }

    // Less than 7 days
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        if (diffInDays === 1) {
            return `kemarin pukul ${date
                .getHours()
                .toString()
                .padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
        }
        return `${diffInDays} hari yang lalu`;
    }

    // More than 7 days, show date
    const options = {
        day: "numeric",
        month: "long",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        hour: "2-digit",
        minute: "2-digit",
    };

    return date.toLocaleDateString("id-ID", options);
}

/**
 * Get user status with Indonesian localization
 * @param {boolean} isOnline - Whether user is online
 * @param {string} lastSeen - Last seen timestamp
 * @returns {string} Formatted status string in Indonesian
 */
export function getUserStatusIndo(isOnline, lastSeen) {
    if (isOnline) {
        return "Online";
    }

    if (lastSeen) {
        return `Terakhir dilihat ${formatTimeIndo(lastSeen)}`;
    }

    return "Terakhir dilihat tidak diketahui";
}
