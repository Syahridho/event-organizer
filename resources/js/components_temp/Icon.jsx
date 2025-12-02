/**
 * Optimized Icon Component
 * Pre-loads commonly used icons to avoid loading delay
 * Lazy loads less common icons
 */

import React, { Suspense, lazy } from 'react';

// Pre-load ONLY the most commonly used icons (critical path)
import { 
    IoCart, 
    IoPersonCircle,
    IoTicket 
} from 'react-icons/io5';

import { 
    FaBuilding,
    FaShoppingCart,
    FaMapMarkerAlt 
} from 'react-icons/fa';

import { 
    GiMicrophone 
} from 'react-icons/gi';

import { 
    GrFanOption 
} from 'react-icons/gr';

// Map of pre-loaded icons (no lazy loading needed)
const preloadedIcons = {
    IoCart,
    IoPersonCircle,
    IoTicket,
    FaBuilding,
    FaShoppingCart,
    FaMapMarkerAlt,
    GiMicrophone,
    GrFanOption,
};

// Lazy load the full icon wrapper for less common icons
const LazyIconWrapper = lazy(() => import('./IconWrapper'));

/**
 * Icon Component
 * @param {string} name - Icon name (e.g., "IoCart")
 * @param {string} library - Icon library (e.g., "io5", "fa", "gi")
 * @param {string} className - CSS classes
 * @param {boolean} lazy - Force lazy loading even for preloaded icons
 */
const Icon = ({ name, library, className = '', lazy: forceLazy = false, ...props }) => {
    // Check if icon is preloaded
    const PreloadedIcon = preloadedIcons[name];

    // Use preloaded icon if available and not forcing lazy
    if (PreloadedIcon && !forceLazy) {
        return <PreloadedIcon className={className} {...props} />;
    }

    // Lazy load icon
    return (
        <Suspense fallback={<div className={`${className} animate-pulse bg-gray-200 rounded`} />}>
            <LazyIconWrapper name={name} library={library} className={className} {...props} />
        </Suspense>
    );
};

export default Icon;

// Export individual preloaded icons for direct use if needed
export {
    IoCart,
    IoPersonCircle,
    IoTicket,
    FaBuilding,
    FaShoppingCart,
    FaMapMarkerAlt,
    GiMicrophone,
    GrFanOption,
};
