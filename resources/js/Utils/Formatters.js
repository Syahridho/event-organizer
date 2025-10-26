/**
 * Reusable function to format the last seen timestamp.
 * Handles invalid strings, adjusts for time zones, and localizes the output to Indonesian.
 * @param {string | null} timestamp - The raw timestamp string from the backend (e.g., '2025-10-21T16:08:00.000000Z').
 * @param {boolean} isOnline - The user's current online status.
 * @returns {string} The formatted status string in Indonesian.
 */
export const formatLastSeen = (timestamp, isOnline) => {
    // 1. Check Online Status (Fastest Exit)
    if (isOnline) {
        return "Online";
    }

    // Handle null, undefined, or empty timestamps
    if (!timestamp) {
        return "Terakhir dilihat: Tidak diketahui";
    }

    // 2. Safely Parse and Validate Date
    // Using new Date(timestamp) directly handles ISO strings but can return 'Invalid Date'.
    // We try to create a Date object.
    const date = new Date(timestamp);

    // Check if the parsed date is valid (Fixes "Invalid Date" error)
    if (isNaN(date.getTime())) {
        return "Terakhir dilihat: Data rusak";
    }

    // 3. Timezone Adjustment and Indonesian Formatting (Fixes Synchronization)
    // Using Intl.DateTimeFormat is the most performant way to localize.
    const formatter = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Use 24-hour format
        timeZoneName: undefined, // Uses client's local timezone (Critical for synchronization fix)
    });

    const formattedTime = formatter.format(date).replace(",", " pukul");

    return `Terakhir dilihat ${formattedTime}`;
};

/**
 * Format relative time in Indonesian (e.g., "5 menit yang lalu", "baru saja")
 * @param {string | null} timestamp - The raw timestamp string from the backend
 * @returns {string} The formatted relative time in Indonesian, or empty string if invalid
 */
export const formatRelativeTime = (timestamp) => {
    // Graceful fallback for invalid/null/undefined timestamps
    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);

    // Check if the parsed date is valid (graceful fallback)
    if (isNaN(date.getTime())) {
        return ""; // Return empty string for better UX
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Time thresholds in seconds
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    if (diffInSeconds < 30) {
        return "baru saja";
    } else if (diffInSeconds < minute) {
        return `${diffInSeconds} detik yang lalu`;
    } else if (diffInSeconds < hour) {
        const minutes = Math.floor(diffInSeconds / minute);
        return `${minutes} menit yang lalu`;
    } else if (diffInSeconds < day) {
        const hours = Math.floor(diffInSeconds / hour);
        return `${hours} jam yang lalu`;
    } else if (diffInSeconds < week) {
        const days = Math.floor(diffInSeconds / day);
        return `${days} hari yang lalu`;
    } else if (diffInSeconds < month) {
        const weeks = Math.floor(diffInSeconds / week);
        return `${weeks} minggu yang lalu`;
    } else if (diffInSeconds < year) {
        const months = Math.floor(diffInSeconds / month);
        return `${months} bulan yang lalu`;
    } else {
        const years = Math.floor(diffInSeconds / year);
        return `${years} tahun yang lalu`;
    }
};

/**
 * Get user status with relative time for recent activity, absolute time for older activity
 * @param {string | null} timestamp - The raw timestamp string from the backend
 * @param {boolean} isOnline - The user's current online status
 * @returns {string} The formatted status string in Indonesian, or empty string if invalid
 */
export const getUserStatusIndo = (timestamp, isOnline) => {
    // 1. Check Online Status (Fastest Exit)
    if (isOnline) {
        return "Online";
    }

    // Graceful fallback for invalid/null/undefined timestamps
    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);

    // Check if the parsed date is valid (graceful fallback)
    if (isNaN(date.getTime())) {
        return ""; // Return empty string for better UX
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const day = 24 * 60 * 60; // seconds in a day

    // Use relative time for activities within the last 24 hours
    if (diffInSeconds < day) {
        const relativeTime = formatRelativeTime(timestamp);
        return relativeTime ? `Terakhir dilihat ${relativeTime}` : "";
    }

    // Use absolute time for older activities
    return formatLastSeen(timestamp, false);
};

/**
 * Format chat message time in Indonesian
 * @param {string | null} timestamp - The raw timestamp string from the backend
 * @returns {string} The formatted time in Indonesian
 */
export const formatChatTime = (timestamp) => {
    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);

    // Check if the parsed date is valid
    if (isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
        new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() ===
        date.toDateString();

    if (isToday) {
        // Show only time for today's messages
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    } else if (isYesterday) {
        // Show "Kemarin pukul HH:mm" for yesterday's messages
        const time = date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        return `Kemarin pukul ${time}`;
    } else {
        // Show full date for older messages
        const formatter = new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        return formatter.format(date).replace(",", " pukul");
    }
};
