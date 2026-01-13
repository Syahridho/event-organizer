import axios from "axios";
window.axios = axios;

function updateCsrfToken() {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        window.axios.defaults.headers.common["X-CSRF-TOKEN"] = token.content;

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

updateCsrfToken();

axios.interceptors.request.use(
    (config) => {
        updateCsrfToken();
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => {
        updateCsrfToken();
        return response;
    },
    (error) => {
        if (error.response?.status === 419) {
            if (error.response.data?.csrf_refresh) {
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
                            const metaTag = document.head.querySelector(
                                'meta[name="csrf-token"]'
                            );
                            if (metaTag) {
                                metaTag.setAttribute("content", data.token);
                            }
                            updateCsrfToken();
                        }
                    })
                    .catch(() => {
                        console.warn(
                            "Failed to refresh CSRF token, reloading page..."
                        );
                        window.location.reload();
                    });
            } else {
                window.location.reload();
            }
        }

        return Promise.reject(error);
    }
);

window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

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
        wsHost: import.meta.env.VITE_PUSHER_HOST ?? "127.0.0.1",
        wsPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,
        wssPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,
        forceTLS: false,
        encrypted: false,
        disableStats: true,
        enabledTransports: ["ws", "wss"],
    });

    window.Echo = echoInstance;
    return echoInstance;
}

// Initialize Echo on user interaction or after page load
if (typeof window !== "undefined") {
    // Defer initialization until page is fully loaded
    window.addEventListener("load", () => {
        // Initialize after a short delay to prioritize critical resources
        setTimeout(() => {
            initializeEcho().catch(console.error);
        }, 2000);
    });
}
