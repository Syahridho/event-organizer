import "./bootstrap";
import "../css/app.css";

// Lazy load heavy CSS only when needed
// import "leaflet/dist/leaflet.css";
// import "quill/dist/quill.snow.css";

import { createRoot } from "react-dom/client";
import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { Toaster } from "sonner";
import { Provider } from "react-redux";
import { store } from "./Store";
import Initializer from "./hooks/useInitializeTheme";
import OnlineStatusProvider from "./Components/OnlineStatusProvider";

function AppWrapper({ App, props }) {
    return (
        <Provider store={store}>
            <Initializer />
            <OnlineStatusProvider>
                <App {...props} />
            </OnlineStatusProvider>
            <Toaster position="bottom-right" richColors />
        </Provider>
    );
}

const appName = import.meta.env.VITE_APP_NAME || "Eventplanasdasdas";

let root = null;

// Global CSRF token handler
// This ensures all Inertia requests have a fresh CSRF token
router.on("before", (event) => {
    const method = event.detail.visit.method.toUpperCase();

    // Only add CSRF token to POST, PUT, PATCH, DELETE requests
    // DO NOT add to GET requests to prevent token from appearing in URL
    if (method !== "GET" && method !== "HEAD") {
        const token = document.head.querySelector('meta[name="csrf-token"]');

        if (token && event.detail.visit.data) {
            // Add or update the CSRF token in the request data
            if (event.detail.visit.data instanceof FormData) {
                event.detail.visit.data.set("_token", token.content);
            } else if (typeof event.detail.visit.data === "object") {
                event.detail.visit.data._token = token.content;
            }
        }
    }
});

// Handle CSRF errors globally
router.on("error", (event) => {
    const errors = event.detail.errors;
    if (errors && (errors.csrf || errors._token)) {
        // Fetch a fresh CSRF token
        fetch("/csrf-token", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.token) {
                    // Update the meta tag with the new token
                    const metaTag = document.head.querySelector(
                        'meta[name="csrf-token"]'
                    );
                    if (metaTag) {
                        metaTag.setAttribute("content", data.token);
                    }
                }
            })
            .catch((error) => {
                console.error("Failed to refresh CSRF token:", error);
            });
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        if (!root) {
            root = createRoot(el);
        }

        root.render(<AppWrapper App={App} props={props} />);
    },
    progress: true,
});
