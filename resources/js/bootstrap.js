/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

import axios from "axios";
window.axios = axios;

// Function to update CSRF token
function updateCsrfToken() {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        window.axios.defaults.headers.common["X-CSRF-TOKEN"] = token.content;
        // Also update XSRF token for cookie-based verification
        const xsrfToken = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (xsrfToken) {
            window.axios.defaults.headers.common["X-XSRF-TOKEN"] =
                decodeURIComponent(xsrfToken[1]);
        }
    } else {
        console.error(
            "CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token"
        );
    }
}

// Initialize CSRF token
updateCsrfToken();

// Update CSRF token before each request
axios.interceptors.request.use(
    (config) => {
        // Refresh CSRF token before each request
        updateCsrfToken();
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => {
        // Update CSRF token after successful response
        updateCsrfToken();
        return response;
    },
    (error) => {
        // Jika error adalah 419 (Session Expired / CSRF Mismatch)
        if (error.response?.status === 419) {
            // Check if the response contains our custom csrf_refresh flag
            if (error.response.data?.csrf_refresh) {
                // Try to refresh the CSRF token without full page reload
                fetch("/csrf-token", {
                    method: "GET",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                    },
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.token) {
                            // Update the meta tag
                            const metaTag = document.head.querySelector(
                                'meta[name="csrf-token"]'
                            );
                            if (metaTag) {
                                metaTag.setAttribute("content", data.token);
                            }
                            // Update axios defaults
                            updateCsrfToken();
                        }
                    })
                    .catch(() => {
                        // If token refresh fails, fall back to page reload
                        console.warn(
                            "Failed to refresh CSRF token, reloading page..."
                        );
                        window.location.reload();
                    });
            } else {
                // For other 419 errors, reload the page
                window.location.reload();
            }
        }

        return Promise.reject(error);
    }
);

window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// Listen for visibility change to refresh token when tab becomes active again
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        updateCsrfToken();
    }
});

// Listen for storage events to sync CSRF tokens across tabs
window.addEventListener("storage", (e) => {
    if (e.key === "csrf_token_refresh") {
        updateCsrfToken();
    }
});

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// Lazy load Echo and Pusher only when needed
let echoInstance = null;

export async function initializeEcho() {
    if (echoInstance) {
        return echoInstance;
    }

    // Dynamically import Echo and Pusher
    const [{ default: Echo }, { default: Pusher }] = await Promise.all([
        import("laravel-echo"),
        import("pusher-js"),
    ]);

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: "pusher",
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? "mt1",
        wsHost: import.meta.env.VITE_PUSHER_HOST
            ? import.meta.env.VITE_PUSHER_HOST
            : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
        wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
        wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? "https") === "https",
        enabledTransports: ["ws", "wss"],
    });

    window.Echo = echoInstance;
    return echoInstance;
}

// Initialize Echo on user interaction or after page load
if (typeof window !== 'undefined') {
    // Defer initialization until page is fully loaded
    window.addEventListener('load', () => {
        // Initialize after a short delay to prioritize critical resources
        setTimeout(() => {
            initializeEcho().catch(console.error);
        }, 2000);
    });
}

