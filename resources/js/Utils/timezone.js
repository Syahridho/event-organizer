/**
 * Timezone Configuration for Frontend
 * 
 * This file ensures all date/time operations use Asia/Jakarta timezone (WIB)
 * regardless of where the application is hosted.
 */

import moment from 'moment-timezone';
import { setDefaultOptions } from 'date-fns';
import { id } from 'date-fns/locale';

// Set default timezone for moment.js
export const TIMEZONE = 'Asia/Jakarta';

// Configure moment.js to use Asia/Jakarta timezone by default
moment.tz.setDefault(TIMEZONE);

// Configure date-fns to use Indonesian locale by default
setDefaultOptions({ 
    locale: id,
    // Note: date-fns doesn't have built-in timezone support
    // For timezone-aware operations, use date-fns-tz
});

/**
 * Get current date/time in Asia/Jakarta timezone
 * @returns {moment.Moment}
 */
export const now = () => moment.tz(TIMEZONE);

/**
 * Parse date string to Asia/Jakarta timezone
 * @param {string|Date} date 
 * @returns {moment.Moment}
 */
export const parseDate = (date) => moment.tz(date, TIMEZONE);

/**
 * Format date to specific format in Asia/Jakarta timezone
 * @param {string|Date} date 
 * @param {string} format 
 * @returns {string}
 */
export const formatDate = (date, format = 'DD MMMM YYYY HH:mm') => {
    return moment.tz(date, TIMEZONE).format(format);
};

/**
 * Get timezone offset for Asia/Jakarta
 * @returns {string} e.g., "+07:00"
 */
export const getTimezoneOffset = () => {
    return moment.tz(TIMEZONE).format('Z');
};

export default {
    TIMEZONE,
    now,
    parseDate,
    formatDate,
    getTimezoneOffset,
};
