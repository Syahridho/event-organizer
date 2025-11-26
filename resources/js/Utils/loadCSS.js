// Utility to dynamically load CSS
export const loadCSS = (href) => {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`link[href="${href}"]`)) {
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
        document.head.appendChild(link);
    });
};

// Load Leaflet CSS dynamically
export const loadLeafletCSS = () => {
    return loadCSS('/node_modules/leaflet/dist/leaflet.css');
};

// Load Quill CSS dynamically
export const loadQuillCSS = () => {
    return loadCSS('/node_modules/quill/dist/quill.snow.css');
};
